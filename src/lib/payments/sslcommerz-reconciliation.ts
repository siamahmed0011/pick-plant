import "server-only";

import { Prisma } from "@/generated/prisma/client";
import {
  PaymentProvider,
  PaymentStatus,
  TransactionStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  fingerprintSSLCommerzValue,
  getSSLCommerzConfiguration,
  normalizeSSLCommerzValidationResponse,
  sslCommerzBDTAmountsEqual,
  SSLCommerzProofError,
  validateSSLCommerzPayment,
} from "@/lib/payments/providers/sslcommerz";
import {
  confirmOrderPaymentWithinReservation,
  orderReservationIsUnavailable,
} from "@/lib/orders/payment-release-fence";

export type SSLCommerzNotificationSource = "callback" | "ipn";

export type SSLCommerzReconciliationResult = {
  outcome:
    | "verified"
    | "already_verified"
    | "duplicate"
    | "manual_review"
    | "reservation_unavailable";
  paymentConfirmed: boolean;
  orderNumber: string;
};

export type SSLCommerzLocalPaymentFacts = {
  orderNumber: string;
  orderProvider: string | null;
  orderAmount: Prisma.Decimal | number | string;
  orderCurrency: string;
  transactionProvider: PaymentProvider;
  transactionReference: string | null;
  transactionAmount: Prisma.Decimal | number | string;
  transactionCurrency: string;
};

function payloadString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getSubmittedSSLCommerzStatus(
  payload: Record<string, unknown>,
) {
  return payloadString(payload, "status")?.toUpperCase() ?? "";
}

export function isSubmittedSSLCommerzFailure(
  payload: Record<string, unknown>,
) {
  return new Set(["FAILED", "CANCELLED", "CANCELED", "CANCEL"]).has(
    getSubmittedSSLCommerzStatus(payload),
  );
}

export async function readSSLCommerzRequestPayload(request: Request) {
  if (request.method === "GET") {
    return Object.fromEntries(new URL(request.url).searchParams.entries());
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(await request.text()).entries());
  }

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const payload: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") payload[key] = value;
    }

    return payload;
  }

  if (contentType.includes("application/json")) {
    const value = (await request.json()) as unknown;

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new SSLCommerzProofError(
        "SSLCommerz notification payload is invalid.",
      );
    }

    return value as Record<string, unknown>;
  }

  throw new SSLCommerzProofError(
    "Unsupported SSLCommerz notification content type.",
  );
}

function assertValidatedProviderData(
  submittedValidationId: string,
  validation: ReturnType<typeof normalizeSSLCommerzValidationResponse>,
  configuredStoreId: string,
) {
  if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
    throw new SSLCommerzProofError(
      "SSLCommerz did not validate the payment.",
    );
  }
  if (
    !validation.validationId ||
    validation.validationId !== submittedValidationId
  ) {
    throw new SSLCommerzProofError(
      "SSLCommerz validation ID mismatch.",
    );
  }
  if (!validation.transactionId || !validation.bankTransactionId) {
    throw new SSLCommerzProofError(
      "SSLCommerz transaction references are missing.",
    );
  }
  if (!validation.amount || validation.currency !== "BDT") {
    throw new SSLCommerzProofError(
      "SSLCommerz amount or currency is invalid.",
    );
  }
  if (
    validation.storeId !== null &&
    validation.storeId !== configuredStoreId
  ) {
    throw new SSLCommerzProofError("SSLCommerz store ID mismatch.");
  }
}

export function decideSSLCommerzReconciliation(
  submittedValidationId: string,
  validation: ReturnType<typeof normalizeSSLCommerzValidationResponse>,
  configuredStoreId: string,
  local: SSLCommerzLocalPaymentFacts,
) {
  assertValidatedProviderData(
    submittedValidationId,
    validation,
    configuredStoreId,
  );

  if (
    local.transactionProvider !== PaymentProvider.SSLCOMMERZ ||
    local.orderProvider !== PaymentProvider.SSLCOMMERZ
  ) {
    throw new SSLCommerzProofError(
      "SSLCommerz payment provider mismatch.",
    );
  }
  if (
    !local.transactionReference ||
    local.transactionReference !== validation.transactionId
  ) {
    throw new SSLCommerzProofError(
      "SSLCommerz merchant transaction reference mismatch.",
    );
  }
  if (
    validation.orderNumber !== null &&
    validation.orderNumber !== local.orderNumber
  ) {
    throw new SSLCommerzProofError("SSLCommerz order number mismatch.");
  }
  if (
    local.transactionCurrency.trim().toUpperCase() !== "BDT" ||
    local.orderCurrency.trim().toUpperCase() !== "BDT" ||
    !sslCommerzBDTAmountsEqual(
      local.transactionAmount,
      local.orderAmount,
    ) ||
    !sslCommerzBDTAmountsEqual(
      local.transactionAmount,
      validation.amount,
    )
  ) {
    throw new SSLCommerzProofError(
      "SSLCommerz payment amount or currency mismatch.",
    );
  }

  return validation.riskLevel === 0 ? "verify" : "manual_review";
}

function sanitizedValidationMetadata(
  validation: ReturnType<typeof normalizeSSLCommerzValidationResponse>,
  source: SSLCommerzNotificationSource,
) {
  return JSON.stringify({
    validationIdHash: fingerprintSSLCommerzValue(
      validation.validationId,
      64,
    ),
    validationStatus: validation.status,
    bankTransactionId: validation.bankTransactionId,
    merchantTransactionReference: validation.transactionId,
    amount: validation.amount,
    currency: validation.currency,
    orderNumber: validation.orderNumber,
    riskLevel: validation.riskLevel,
    source,
  });
}

function eventIdForValidation(validationId: string) {
  return `validation:${fingerprintSSLCommerzValue(validationId, 64)}`;
}

async function duplicateResult(eventId: string) {
  const existingEvent = await prisma.processedPaymentEvent.findUnique({
    where: {
      provider_eventId: {
        provider: PaymentProvider.SSLCOMMERZ,
        eventId,
      },
    },
    include: {
      paymentTransaction: {
        include: { order: true },
      },
    },
  });

  if (!existingEvent) return null;

  return {
    outcome: "duplicate",
    paymentConfirmed:
      existingEvent.paymentTransaction.status === TransactionStatus.VERIFIED &&
      existingEvent.paymentTransaction.order.paymentStatus ===
        PaymentStatus.PAID,
    orderNumber: existingEvent.paymentTransaction.order.orderNumber,
  } satisfies SSLCommerzReconciliationResult;
}

export async function reconcileSSLCommerzPayment(
  payload: Record<string, unknown>,
  source: SSLCommerzNotificationSource,
): Promise<SSLCommerzReconciliationResult> {
  const submittedValidationId = payloadString(payload, "val_id");

  if (!submittedValidationId) {
    throw new SSLCommerzProofError(
      "SSLCommerz validation ID is required.",
    );
  }

  const configuration = getSSLCommerzConfiguration();
  const validation = await validateSSLCommerzPayment(
    submittedValidationId,
    configuration,
  );

  assertValidatedProviderData(
    submittedValidationId,
    validation,
    configuration.storeId,
  );

  const eventId = eventIdForValidation(validation.validationId);
  const eventType =
    validation.riskLevel === 0
      ? "sslcommerz.payment.validated"
      : "sslcommerz.payment.risk_review";

  try {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.paymentTransaction.findUnique({
        where: { transactionId: validation.transactionId },
        include: { order: true },
      });

      if (!payment) {
        throw new SSLCommerzProofError(
          "SSLCommerz transaction is not associated with this store.",
        );
      }
      const decision = decideSSLCommerzReconciliation(
        submittedValidationId,
        validation,
        configuration.storeId,
        {
          orderNumber: payment.order.orderNumber,
          orderProvider: payment.order.paymentProvider,
          orderAmount: payment.order.grandTotal,
          orderCurrency: payment.order.currency,
          transactionProvider: payment.provider,
          transactionReference: payment.transactionId,
          transactionAmount: payment.amount,
          transactionCurrency: payment.currency,
        },
      );

      const existingEvent = await tx.processedPaymentEvent.findUnique({
        where: {
          provider_eventId: {
            provider: PaymentProvider.SSLCOMMERZ,
            eventId,
          },
        },
        select: { id: true },
      });

      if (existingEvent) {
        return {
          outcome: "duplicate",
          paymentConfirmed:
            payment.status === TransactionStatus.VERIFIED &&
            payment.order.paymentStatus === PaymentStatus.PAID,
          orderNumber: payment.order.orderNumber,
        };
      }

      await tx.processedPaymentEvent.create({
        data: {
          provider: PaymentProvider.SSLCOMMERZ,
          eventId,
          paymentTransactionId: payment.id,
          eventType,
        },
      });

      const metadata = sanitizedValidationMetadata(validation, source);

      if (
        payment.status === TransactionStatus.VERIFIED &&
        payment.order.paymentStatus === PaymentStatus.PAID
      ) {
        return {
          outcome: "already_verified",
          paymentConfirmed: true,
          orderNumber: payment.order.orderNumber,
        };
      }

      if (orderReservationIsUnavailable(payment.order)) {
        return {
          outcome: "reservation_unavailable",
          paymentConfirmed: false,
          orderNumber: payment.order.orderNumber,
        };
      }

      if (decision === "manual_review") {
        if (
          payment.status !== TransactionStatus.VERIFIED &&
          payment.status !== TransactionStatus.REFUNDED &&
          payment.order.paymentStatus !== PaymentStatus.PAID
        ) {
          await tx.paymentTransaction.update({
            where: { id: payment.id },
            data: {
              status: TransactionStatus.PENDING,
              providerReference: validation.bankTransactionId,
              failureReason:
                "SSLCommerz payment requires manual review due to provider risk assessment.",
              rawMetadataJson: metadata,
              failedAt: null,
            },
          });
        }

        return {
          outcome: "manual_review",
          paymentConfirmed:
            payment.status === TransactionStatus.VERIFIED &&
            payment.order.paymentStatus === PaymentStatus.PAID,
          orderNumber: payment.order.orderNumber,
        };
      }

      if (payment.status === TransactionStatus.REFUNDED) {
        return {
          outcome: "reservation_unavailable",
          paymentConfirmed: false,
          orderNumber: payment.order.orderNumber,
        };
      }

      const paidUpdate = await confirmOrderPaymentWithinReservation(tx, {
        orderId: payment.orderId,
        provider: PaymentProvider.SSLCOMMERZ,
        paymentReference: validation.bankTransactionId,
      });

      if (paidUpdate.count !== 1) {
        const currentPayment = await tx.paymentTransaction.findUnique({
          where: { id: payment.id },
          include: { order: true },
        });

        if (
          currentPayment?.status === TransactionStatus.VERIFIED &&
          currentPayment.order.paymentStatus === PaymentStatus.PAID
        ) {
          return {
            outcome: "already_verified",
            paymentConfirmed: true,
            orderNumber: currentPayment.order.orderNumber,
          };
        }

        return {
          outcome: "reservation_unavailable",
          paymentConfirmed: false,
          orderNumber: payment.order.orderNumber,
        };
      }

      await tx.paymentTransaction.updateMany({
        where: {
          id: payment.id,
          status: { not: TransactionStatus.VERIFIED },
        },
        data: {
          status: TransactionStatus.VERIFIED,
          providerReference: validation.bankTransactionId,
          verifiedAt: new Date(),
          failedAt: null,
          failureReason: null,
          rawMetadataJson: metadata,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: payment.order.status,
          paymentStatus: PaymentStatus.PAID,
          note: "SSLCommerz payment verified through the validation API.",
        },
      });

      return {
        outcome: "verified",
        paymentConfirmed: true,
        orderNumber: payment.order.orderNumber,
      };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const duplicate = await duplicateResult(eventId);
      if (duplicate) return duplicate;
    }

    throw error;
  }
}
