import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  PaymentProvider,
  PaymentStatus,
  TransactionStatus,
} from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { getPaymentAdapter } from "@/lib/payments/payment-service";
import {
  isMissingStripeResource,
  retrieveStripeCheckoutSession,
  sanitizedStripeErrorContext,
  StripeVerificationError,
} from "@/lib/payments/providers/stripe";
import {
  formatSSLCommerzBDTAmount,
  getSSLCommerzConfiguration,
  querySSLCommerzMerchantTransaction,
  querySSLCommerzSession,
  sanitizedSSLCommerzErrorContext,
  sslCommerzBDTAmountsEqual,
  createSSLCommerzMerchantTransactionReference,
  SSLCommerzConfigurationError,
  SSLCommerzProofError,
  SSLCommerzProviderUnavailableError,
} from "@/lib/payments/providers/sslcommerz";
import { evaluatePaymentInitiationEligibility } from "@/lib/orders/payment-initiation-eligibility";
import { verifiedPaymentRedirectUrl } from "@/lib/payments/payment-redirect-url";

type StripeOrder = {
  id: string;
  orderNumber: string;
  grandTotal: Prisma.Decimal;
  currency: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  paymentStatus: string;
};

type SSLCommerzOrder = StripeOrder & {
  paymentProvider: string | null;
};

const SSL_COMMERZ_CREATION_LEASE_MS = 60_000;
const SSL_COMMERZ_ACTIVE_SESSION_MS = 30 * 60_000;
const SSL_COMMERZ_ATTEMPT_METADATA_KIND = "sslcommerz-attempt-v1";

type SSLCommerzCreatingMetadata = {
  kind: typeof SSL_COMMERZ_ATTEMPT_METADATA_KIND;
  state: "CREATING";
  attemptId: string;
  merchantTransactionReference: string;
  leaseExpiresAt: string;
};

type SSLCommerzActiveMetadata = {
  kind: typeof SSL_COMMERZ_ATTEMPT_METADATA_KIND;
  state: "ACTIVE";
  attemptId: string;
  merchantTransactionReference: string;
  checkoutUrl: string;
  sessionCreatedAt: string;
  expiresAt: string;
};

type SSLCommerzAttemptMetadata =
  | SSLCommerzCreatingMetadata
  | SSLCommerzActiveMetadata;

function safeStoredSSLCommerzCheckoutUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return null;

  try {
    const url = new URL(value);
    const isSSLCommerzHost =
      url.hostname === "sslcommerz.com" ||
      url.hostname.endsWith(".sslcommerz.com");

    return url.protocol === "https:" && isSSLCommerzHost
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function validFutureOrPastTimestamp(value: unknown) {
  if (typeof value !== "string" || value.length > 40) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function parseSSLCommerzAttemptMetadata(
  value: string | null,
): SSLCommerzAttemptMetadata | null {
  if (!value || value.length > 4096) return null;

  try {
    const metadata = JSON.parse(value) as Record<string, unknown>;

    if (
      metadata.kind !== SSL_COMMERZ_ATTEMPT_METADATA_KIND ||
      typeof metadata.attemptId !== "string" ||
      metadata.attemptId.length > 36 ||
      typeof metadata.merchantTransactionReference !== "string" ||
      metadata.merchantTransactionReference.length > 30
    ) {
      return null;
    }

    if (metadata.state === "CREATING") {
      if (validFutureOrPastTimestamp(metadata.leaseExpiresAt) === null) {
        return null;
      }

      return metadata as SSLCommerzCreatingMetadata;
    }

    if (metadata.state === "ACTIVE") {
      const checkoutUrl = safeStoredSSLCommerzCheckoutUrl(
        metadata.checkoutUrl,
      );

      if (
        !checkoutUrl ||
        validFutureOrPastTimestamp(metadata.sessionCreatedAt) === null ||
        validFutureOrPastTimestamp(metadata.expiresAt) === null
      ) {
        return null;
      }

      return {
        ...(metadata as SSLCommerzActiveMetadata),
        checkoutUrl,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function creatingSSLCommerzMetadata(
  attemptId: string,
  transactionReference: string,
  now: Date,
): SSLCommerzCreatingMetadata {
  return {
    kind: SSL_COMMERZ_ATTEMPT_METADATA_KIND,
    state: "CREATING",
    attemptId,
    merchantTransactionReference: transactionReference,
    leaseExpiresAt: new Date(
      now.getTime() + SSL_COMMERZ_CREATION_LEASE_MS,
    ).toISOString(),
  };
}

function activeSSLCommerzMetadata(
  attemptId: string,
  transactionReference: string,
  checkoutUrl: string,
  now: Date,
): SSLCommerzActiveMetadata {
  return {
    kind: SSL_COMMERZ_ATTEMPT_METADATA_KIND,
    state: "ACTIVE",
    attemptId,
    merchantTransactionReference: transactionReference,
    checkoutUrl,
    sessionCreatedAt: now.toISOString(),
    expiresAt: new Date(
      now.getTime() + SSL_COMMERZ_ACTIVE_SESSION_MS,
    ).toISOString(),
  };
}

async function prepareStripeAttempt(orderId: string, remainingRetries = 2) {
  const payment = await prisma.paymentTransaction.findFirst({
    where: { orderId, provider: PaymentProvider.STRIPE },
  });

  if (!payment) {
    return { error: "missing_transaction" } as const;
  }
  if (payment.status === TransactionStatus.VERIFIED) {
    return { error: "already_verified" } as const;
  }

  if (payment.transactionId?.startsWith("cs_")) {
    try {
      const session = await retrieveStripeCheckoutSession(payment.transactionId);
      const redirectUrl = verifiedPaymentRedirectUrl(
        session.url,
        PaymentProvider.STRIPE,
      );
      const isActive =
        session.mode === "payment" &&
        session.status === "open" &&
        session.expires_at * 1000 > Date.now() &&
        redirectUrl !== null;

      if (isActive) {
        return {
          paymentTransactionId: payment.id,
          idempotencyKey: payment.idempotencyKey,
          existingSession: {
            id: session.id,
            url: redirectUrl,
          },
        } as const;
      }

      if (
        session.mode === "payment" &&
        session.status === "complete" &&
        session.payment_status === "paid"
      ) {
        return { error: "already_completed" } as const;
      }
    } catch (error) {
      const isInvalidLocalSession = error instanceof StripeVerificationError;

      if (!isMissingStripeResource(error) && !isInvalidLocalSession) {
        console.error(
          "Stripe Checkout Session retrieval failed.",
          sanitizedStripeErrorContext(error, {
            orderId,
          }),
        );
        return { error: "stripe_unavailable" } as const;
      }
    }
  }

  const reusableAttemptKey =
    !payment.transactionId?.startsWith("cs_") &&
    payment.idempotencyKey?.startsWith(`checkout:${orderId}:`)
      ? payment.idempotencyKey
      : null;

  if (reusableAttemptKey) {
    return {
      paymentTransactionId: payment.id,
      idempotencyKey: reusableAttemptKey,
      existingSession: null,
    } as const;
  }

  const attemptId = randomUUID();
  const idempotencyKey = `checkout:${orderId}:${attemptId}`;
  const claimed = await prisma.paymentTransaction.updateMany({
    where: {
      id: payment.id,
      attemptNumber: payment.attemptNumber,
      transactionId: payment.transactionId,
      idempotencyKey: payment.idempotencyKey,
      status: { not: TransactionStatus.VERIFIED },
    },
    data: {
      attemptNumber: { increment: 1 },
      idempotencyKey,
      transactionId: null,
      providerReference: null,
      status: TransactionStatus.INITIATED,
      failureReason: null,
      failedAt: null,
    },
  });

  if (claimed.count !== 1) {
    if (remainingRetries > 0) {
      return prepareStripeAttempt(orderId, remainingRetries - 1);
    }
    return { error: "attempt_conflict" } as const;
  }

  return {
    paymentTransactionId: payment.id,
    idempotencyKey,
    existingSession: null,
  } as const;
}

async function initiateStripePayment(order: StripeOrder, rawProvider: string) {
  if (order.paymentStatus === PaymentStatus.PAID) {
    return NextResponse.json(
      { error: "This order is already paid." },
      { status: 409 },
    );
  }

  const adapter = getPaymentAdapter(PaymentProvider.STRIPE);

  if (!adapter.isEnabled()) {
    return NextResponse.json(
      { error: "Stripe payment is temporarily unavailable." },
      { status: 503 },
    );
  }

  const attempt = await prepareStripeAttempt(order.id);

  if ("error" in attempt) {
    const status = attempt.error === "stripe_unavailable" ? 503 : 409;
    return NextResponse.json(
      { error: "Stripe payment attempt is not available." },
      { status },
    );
  }

  if (attempt.existingSession?.url) {
    return NextResponse.json({
      success: true,
      redirectUrl: attempt.existingSession.url,
      transactionId: attempt.existingSession.id,
      reused: true,
    });
  }

  if (!attempt.idempotencyKey) {
    return NextResponse.json(
      { error: "Stripe payment attempt could not be prepared." },
      { status: 409 },
    );
  }

  const result = await adapter.initiatePayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: Number(order.grandTotal),
    currency: order.currency,
    customerName: order.customerName || "Customer",
    customerEmail: order.customerEmail || "customer@example.com",
    customerPhone: order.customerPhone || "N/A",
    returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/${rawProvider.toLowerCase()}/callback`,
    idempotencyKey: attempt.idempotencyKey,
  });

  if (!result.success || !result.transactionId || !result.redirectUrl) {
    return NextResponse.json(
      { error: "Stripe Checkout Session could not be created." },
      { status: 502 },
    );
  }

  const updated = await prisma.paymentTransaction.updateMany({
    where: {
      id: attempt.paymentTransactionId,
      provider: PaymentProvider.STRIPE,
      idempotencyKey: attempt.idempotencyKey,
      status: { not: TransactionStatus.VERIFIED },
    },
    data: {
      transactionId: result.transactionId,
    },
  });

  if (updated.count !== 1) {
    return NextResponse.json(
      { error: "Stripe payment attempt could not be finalized." },
      { status: 409 },
    );
  }

  return NextResponse.json(result);
}

type PreparedSSLCommerzAttempt =
  | {
      kind: "claimed";
      paymentTransactionId: string;
      transactionReference: string;
      idempotencyKey: string;
      attemptId: string;
    }
  | {
      kind: "active";
      paymentTransactionId: string;
      transactionReference: string;
      sessionKey: string;
      checkoutUrl: string;
    }
  | {
      kind: "expired";
      paymentTransactionId: string;
      transactionReference: string;
      sessionKey: string;
    }
  | {
      kind: "uncertain";
      paymentTransactionId: string;
      transactionReference: string;
    }
  | { kind: "in_progress" }
  | { kind: "terminal" }
  | { kind: "missing" };

class SSLCommerzAttemptConflictError extends Error {}

async function prepareSSLCommerzAttempt(
  orderId: string,
  rolloverPaymentTransactionId: string | null = null,
  remainingRetries = 2,
): Promise<PreparedSSLCommerzAttempt> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          select: {
            paymentStatus: true,
            paymentProvider: true,
          },
        });

        if (!order) return { kind: "missing" } as const;
        if (
          order.paymentStatus === PaymentStatus.PAID ||
          order.paymentProvider !== PaymentProvider.SSLCOMMERZ
        ) {
          return { kind: "terminal" } as const;
        }

        const latest = await tx.paymentTransaction.findFirst({
          where: {
            orderId,
            provider: PaymentProvider.SSLCOMMERZ,
          },
          orderBy: [{ attemptNumber: "desc" }, { createdAt: "desc" }],
        });

        if (!latest) return { kind: "missing" } as const;
        if (
          latest.status === TransactionStatus.VERIFIED ||
          latest.status === TransactionStatus.REFUNDED
        ) {
          return { kind: "terminal" } as const;
        }

        const now = new Date();
        const metadata = parseSSLCommerzAttemptMetadata(
          latest.rawMetadataJson,
        );

        if (
          metadata?.state === "ACTIVE" &&
          latest.status === TransactionStatus.PENDING &&
          latest.transactionId &&
          latest.providerReference
        ) {
          const expiresAt = Date.parse(metadata.expiresAt);

          if (
            expiresAt > now.getTime() &&
            rolloverPaymentTransactionId !== latest.id
          ) {
            return {
              kind: "active",
              paymentTransactionId: latest.id,
              transactionReference: latest.transactionId,
              sessionKey: latest.providerReference,
              checkoutUrl: metadata.checkoutUrl,
            } as const;
          }

          if (rolloverPaymentTransactionId !== latest.id) {
            return {
              kind: "expired",
              paymentTransactionId: latest.id,
              transactionReference: latest.transactionId,
              sessionKey: latest.providerReference,
            } as const;
          }
        }

        if (
          metadata?.state === "CREATING" &&
          latest.status === TransactionStatus.INITIATED
        ) {
          if (Date.parse(metadata.leaseExpiresAt) > now.getTime()) {
            return { kind: "in_progress" } as const;
          }
          if (rolloverPaymentTransactionId !== latest.id) {
            return {
              kind: "uncertain",
              paymentTransactionId: latest.id,
              transactionReference:
                latest.transactionId ??
                metadata.merchantTransactionReference,
            } as const;
          }
        }

        const attemptId = randomUUID();
        const transactionReference =
          createSSLCommerzMerchantTransactionReference();
        const idempotencyKey = `sslcommerz:${orderId}:${attemptId}`;
        const creatingMetadata = JSON.stringify(
          creatingSSLCommerzMetadata(
            attemptId,
            transactionReference,
            now,
          ),
        );
        const canClaimInitialTransaction =
          latest.attemptNumber === 0 &&
          latest.rawMetadataJson === null &&
          latest.status === TransactionStatus.INITIATED;

        if (canClaimInitialTransaction) {
          const claimed = await tx.paymentTransaction.updateMany({
            where: {
              id: latest.id,
              provider: PaymentProvider.SSLCOMMERZ,
              status: TransactionStatus.INITIATED,
              attemptNumber: 0,
              rawMetadataJson: null,
            },
            data: {
              transactionId: transactionReference,
              idempotencyKey,
              attemptNumber: 1,
              initiatedAt: now,
              providerReference: null,
              failureReason: null,
              failedAt: null,
              rawMetadataJson: creatingMetadata,
            },
          });

          if (claimed.count !== 1) {
            throw new SSLCommerzAttemptConflictError();
          }

          return {
            kind: "claimed",
            paymentTransactionId: latest.id,
            transactionReference,
            idempotencyKey,
            attemptId,
          } as const;
        }

        await tx.paymentTransaction.updateMany({
          where: {
            id: latest.id,
            status: {
              in: [
                TransactionStatus.INITIATED,
                TransactionStatus.PENDING,
                TransactionStatus.FAILED,
              ],
            },
          },
          data: {
            status: TransactionStatus.FAILED,
            failedAt: now,
            failureReason:
              "SSLCommerz payment attempt was superseded by a new attempt.",
          },
        });

        const nextAttemptNumber = Math.max(1, latest.attemptNumber + 1);
        const created = await tx.paymentTransaction.create({
          data: {
            orderId,
            provider: PaymentProvider.SSLCOMMERZ,
            method: latest.method,
            status: TransactionStatus.INITIATED,
            amount: latest.amount,
            currency: latest.currency,
            transactionId: transactionReference,
            idempotencyKey,
            attemptNumber: nextAttemptNumber,
            rawMetadataJson: creatingMetadata,
            initiatedAt: now,
          },
        });

        return {
          kind: "claimed",
          paymentTransactionId: created.id,
          transactionReference,
          idempotencyKey,
          attemptId,
        } as const;
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    const retryableConflict =
      error instanceof SSLCommerzAttemptConflictError ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034"));

    if (retryableConflict && remainingRetries > 0) {
      return prepareSSLCommerzAttempt(
        orderId,
        rolloverPaymentTransactionId,
        remainingRetries - 1,
      );
    }

    throw error;
  }
}

async function markSSLCommerzAttemptFailed(
  attempt: Extract<PreparedSSLCommerzAttempt, { kind: "claimed" }>,
) {
  await prisma.paymentTransaction.updateMany({
    where: {
      id: attempt.paymentTransactionId,
      provider: PaymentProvider.SSLCOMMERZ,
      idempotencyKey: attempt.idempotencyKey,
      status: TransactionStatus.INITIATED,
    },
    data: {
      status: TransactionStatus.FAILED,
      failedAt: new Date(),
      failureReason: "SSLCommerz payment session creation failed.",
      rawMetadataJson: JSON.stringify({
        kind: SSL_COMMERZ_ATTEMPT_METADATA_KIND,
        state: "FAILED",
        attemptId: attempt.attemptId,
        merchantTransactionReference: attempt.transactionReference,
      }),
    },
  });
}

async function markSSLCommerzAttemptUncertain(
  attempt: Extract<PreparedSSLCommerzAttempt, { kind: "claimed" }>,
) {
  await prisma.paymentTransaction.updateMany({
    where: {
      id: attempt.paymentTransactionId,
      provider: PaymentProvider.SSLCOMMERZ,
      idempotencyKey: attempt.idempotencyKey,
      status: TransactionStatus.INITIATED,
    },
    data: {
      failureReason:
        "SSLCommerz payment session creation requires provider status confirmation.",
      rawMetadataJson: JSON.stringify({
        kind: SSL_COMMERZ_ATTEMPT_METADATA_KIND,
        state: "CREATING",
        attemptId: attempt.attemptId,
        merchantTransactionReference: attempt.transactionReference,
        leaseExpiresAt: new Date().toISOString(),
      }),
    },
  });
}

async function initiateSSLCommerzPayment(
  order: SSLCommerzOrder,
  rawProvider: string,
) {
  getSSLCommerzConfiguration();

  if (order.paymentStatus === PaymentStatus.PAID) {
    return NextResponse.json(
      { error: "This order is already paid." },
      { status: 409 },
    );
  }
  if (order.paymentProvider !== PaymentProvider.SSLCOMMERZ) {
    return NextResponse.json(
      { error: "This order was not created for SSLCommerz payment." },
      { status: 400 },
    );
  }
  if (order.currency.trim().toUpperCase() !== "BDT") {
    return NextResponse.json(
      { error: "SSLCommerz supports only BDT payments." },
      { status: 400 },
    );
  }

  let attempt = await prepareSSLCommerzAttempt(order.id);

  if (attempt.kind === "uncertain") {
    const merchantQuery = await querySSLCommerzMerchantTransaction(
      attempt.transactionReference,
    );
    const hasLiveOrPaidTransaction = merchantQuery.statuses.some((status) =>
      new Set(["PENDING", "VALID", "VALIDATED"]).has(status),
    );
    const hasOnlyRetryableResults = merchantQuery.statuses.every((status) =>
      new Set([
        "FAILED",
        "CANCELLED",
        "CANCELED",
        "INVALID_TRANSACTION",
      ]).has(status),
    );

    if (hasLiveOrPaidTransaction) {
      return NextResponse.json(
        { error: "SSLCommerz payment confirmation is already in progress." },
        { status: 409 },
      );
    }
    if (!hasOnlyRetryableResults) {
      throw new SSLCommerzProviderUnavailableError(
        "SSLCommerz merchant transaction status is not eligible for retry.",
      );
    }

    attempt = await prepareSSLCommerzAttempt(
      order.id,
      attempt.paymentTransactionId,
    );
  }

  if (attempt.kind === "active" || attempt.kind === "expired") {
    const session = await querySSLCommerzSession(attempt.sessionKey);

    if (
      session.transactionId &&
      session.transactionId !== attempt.transactionReference
    ) {
      throw new SSLCommerzProofError(
        "SSLCommerz session transaction reference mismatch.",
      );
    }
    if (session.status === "VALID" || session.status === "VALIDATED") {
      if (!session.transactionId) {
        throw new SSLCommerzProviderUnavailableError(
          "SSLCommerz paid session reference is missing.",
        );
      }
      return NextResponse.json(
        { error: "SSLCommerz payment confirmation is already in progress." },
        { status: 409 },
      );
    }

    if (attempt.kind === "active" && session.status === "PENDING") {
      if (!session.transactionId) {
        throw new SSLCommerzProviderUnavailableError(
          "SSLCommerz pending session reference is missing.",
        );
      }
      return NextResponse.json({
        success: true,
        redirectUrl: attempt.checkoutUrl,
        transactionId: attempt.transactionReference,
        reused: true,
      });
    }
    if (attempt.kind === "expired" && session.status === "PENDING") {
      return NextResponse.json(
        { error: "The previous SSLCommerz payment session is still pending." },
        { status: 409 },
      );
    }

    if (
      !new Set([
        "FAILED",
        "CANCELLED",
        "CANCELED",
        "INVALID_TRANSACTION",
      ]).has(session.status)
    ) {
      throw new SSLCommerzProviderUnavailableError(
        "SSLCommerz session status is not eligible for retry.",
      );
    }

    attempt = await prepareSSLCommerzAttempt(
      order.id,
      attempt.paymentTransactionId,
    );
  }

  if (attempt.kind === "active") {
    return NextResponse.json({
      success: true,
      redirectUrl: attempt.checkoutUrl,
      transactionId: attempt.transactionReference,
      reused: true,
    });
  }
  if (attempt.kind === "in_progress") {
    return NextResponse.json(
      { error: "SSLCommerz payment session creation is already in progress." },
      { status: 409 },
    );
  }
  if (attempt.kind === "terminal") {
    return NextResponse.json(
      { error: "SSLCommerz payment cannot be initiated in its current state." },
      { status: 409 },
    );
  }
  if (
    attempt.kind === "missing" ||
    attempt.kind === "expired" ||
    attempt.kind === "uncertain"
  ) {
    return NextResponse.json(
      { error: "SSLCommerz payment transaction is not available." },
      { status: 409 },
    );
  }

  const payment = await prisma.paymentTransaction.findUnique({
    where: { id: attempt.paymentTransactionId },
  });

  if (
    !payment ||
    payment.currency.trim().toUpperCase() !== "BDT" ||
    !sslCommerzBDTAmountsEqual(payment.amount, order.grandTotal)
  ) {
    await markSSLCommerzAttemptFailed(attempt);
    return NextResponse.json(
      { error: "SSLCommerz payment details do not match this order." },
      { status: 409 },
    );
  }

  const adapter = getPaymentAdapter(PaymentProvider.SSLCOMMERZ);
  let result;

  try {
    result = await adapter.initiatePayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      transactionReference: attempt.transactionReference,
      amount: formatSSLCommerzBDTAmount(order.grandTotal),
      currency: "BDT",
      customerName: order.customerName || "Customer",
      customerEmail: order.customerEmail || "customer@example.com",
      customerPhone: order.customerPhone || "N/A",
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/${rawProvider.toLowerCase()}/callback`,
    });
  } catch (error) {
    await markSSLCommerzAttemptUncertain(attempt);
    throw error;
  }

  if (
    !result.success ||
    !result.redirectUrl ||
    !result.transactionId ||
    !result.providerReference ||
    result.transactionId !== attempt.transactionReference
  ) {
    await markSSLCommerzAttemptUncertain(attempt);
    return NextResponse.json(
      { error: "SSLCommerz payment session could not be created." },
      { status: 502 },
    );
  }

  const now = new Date();
  const updated = await prisma.paymentTransaction.updateMany({
    where: {
      id: attempt.paymentTransactionId,
      provider: PaymentProvider.SSLCOMMERZ,
      transactionId: attempt.transactionReference,
      idempotencyKey: attempt.idempotencyKey,
      status: TransactionStatus.INITIATED,
    },
    data: {
      status: TransactionStatus.PENDING,
      providerReference: result.providerReference,
      rawMetadataJson: JSON.stringify(
        activeSSLCommerzMetadata(
          attempt.attemptId,
          attempt.transactionReference,
          result.redirectUrl,
          now,
        ),
      ),
      failureReason: null,
      failedAt: null,
    },
  });

  if (updated.count !== 1) {
    return NextResponse.json(
      { error: "SSLCommerz payment session could not be finalized." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    success: true,
    redirectUrl: result.redirectUrl,
    transactionId: result.transactionId,
    reused: false,
  });
}

import { checkPaymentInitiateRateLimit } from "@/lib/rate-limit/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  let isStripeRequest = false;
  let isSSLCommerzRequest = false;
  let requestedOrderId = "unknown";

  try {
    const session = await auth();
    const { provider: rawProvider } = await params;
    const providerEnum = rawProvider.toUpperCase() as PaymentProvider;
    isStripeRequest = providerEnum === PaymentProvider.STRIPE;
    isSSLCommerzRequest = providerEnum === PaymentProvider.SSLCOMMERZ;

    const body = await request.clone().json().catch(() => ({}));
    const { orderId } = body;
    requestedOrderId =
      typeof orderId === "string" && orderId ? orderId : "unknown";

    const rateLimitKey = requestedOrderId !== "unknown" ? requestedOrderId : (session?.user?.id || "anonymous");
    const rateLimit = await checkPaymentInitiateRateLimit(request.headers, rateLimitKey);

    if (rateLimit.status === "unavailable") {
      return NextResponse.json(
        { error: "Security verification is temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    if (rateLimit.status === "limited") {
      return NextResponse.json(
        { error: `Too many payment initiation attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.` },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      providerEnum === PaymentProvider.STRIPE &&
      order.paymentProvider !== PaymentProvider.STRIPE
    ) {
      return NextResponse.json(
        { error: "This order was not created for Stripe payment." },
        { status: 400 },
      );
    }

    // Ownership check: if order belongs to a user, verify session
    if (order.userId && session?.user?.id !== order.userId && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access to order" }, { status: 403 });
    }

    if (isStripeRequest || isSSLCommerzRequest) {
      if (order.paymentProvider !== providerEnum) {
        return NextResponse.json(
          { error: "This payment method is not available for the order." },
          { status: 400 },
        );
      }

      const eligibility = evaluatePaymentInitiationEligibility(order);
      if (!eligibility.eligible) {
        return NextResponse.json(
          {
            error:
              eligibility.reason === "expired_or_expiring"
                ? "The payment reservation has expired or is too close to expiry."
                : "Payment cannot be started for this order.",
            code: "PAYMENT_NOT_ELIGIBLE",
          },
          { status: 409 },
        );
      }
      if (eligibility.provider !== providerEnum) {
        return NextResponse.json(
          {
            error: "Payment cannot be started for this order.",
            code: "PAYMENT_NOT_ELIGIBLE",
          },
          { status: 409 },
        );
      }
    }

    if (providerEnum === PaymentProvider.STRIPE) {
      return initiateStripePayment(order, rawProvider);
    }
    if (providerEnum === PaymentProvider.SSLCOMMERZ) {
      return initiateSSLCommerzPayment(order, rawProvider);
    }

    const adapter = getPaymentAdapter(providerEnum);
    if (!adapter.isEnabled()) {
      return NextResponse.json(
        { error: `${providerEnum} online payment gateway is disabled or missing configuration credentials.` },
        { status: 400 }
      );
    }

    const result = await adapter.initiatePayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.grandTotal),
      currency: order.currency,
      customerName: order.customerName || "Customer",
      customerEmail: order.customerEmail || "customer@example.com",
      customerPhone: order.customerPhone || "N/A",
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/${rawProvider.toLowerCase()}/callback`,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (isStripeRequest) {
      console.error(
        "Stripe payment initiation failed.",
        sanitizedStripeErrorContext(error, { route: "payment-initiation" }),
      );
      return NextResponse.json(
        { error: "Stripe payment initiation failed." },
        { status: 500 },
      );
    }

    if (isSSLCommerzRequest) {
      console.error(
        "SSLCommerz payment initiation failed.",
        sanitizedSSLCommerzErrorContext(error, {
          route: "sslcommerz-initiation",
          orderId: requestedOrderId,
        }),
      );

      if (error instanceof SSLCommerzConfigurationError) {
        return NextResponse.json(
          { error: "SSLCommerz payment is temporarily unavailable." },
          { status: 503 },
        );
      }
      if (error instanceof SSLCommerzProviderUnavailableError) {
        return NextResponse.json(
          { error: "SSLCommerz payment service is temporarily unavailable." },
          { status: error.httpStatus },
        );
      }
      if (error instanceof SSLCommerzProofError) {
        return NextResponse.json(
          { error: "SSLCommerz payment details are invalid." },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: "SSLCommerz payment initiation failed." },
        { status: 500 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to initiate payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
