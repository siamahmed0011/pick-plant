import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { PaymentProvider, TransactionStatus } from "@/generated/prisma/enums";
import type {
  PaymentProviderAdapter,
  PaymentInitiateOptions,
  PaymentInitiateResult,
  PaymentVerificationResult,
} from "@/lib/payments/payment-provider";

const SSL_COMMERZ_REQUEST_TIMEOUT_MS = 10_000;

const SSL_COMMERZ_ENDPOINTS = {
  sandbox: {
    initiation: "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    validation:
      "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php",
    sessionQuery:
      "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php",
  },
  production: {
    initiation: "https://securepay.sslcommerz.com/gwprocess/v4/api.php",
    validation:
      "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php",
    sessionQuery:
      "https://securepay.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php",
  },
} as const;

export type SSLCommerzConfiguration = {
  storeId: string;
  storePassword: string;
  isSandbox: boolean;
  initiationUrl: string;
  validationUrl: string;
  sessionQueryUrl: string;
};

export type SSLCommerzValidation = {
  status: string;
  transactionId: string;
  validationId: string;
  bankTransactionId: string;
  amount: string;
  currency: string;
  storeId: string | null;
  orderNumber: string | null;
  riskLevel: number | null;
  apiConnected: boolean;
};

export type SSLCommerzSessionQuery = {
  status: string;
  sessionKey: string;
  transactionId: string;
};

export type SSLCommerzMerchantTransactionQuery = {
  statuses: string[];
};

export class SSLCommerzConfigurationError extends Error {}
export class SSLCommerzProofError extends Error {}

export class SSLCommerzProviderUnavailableError extends Error {
  constructor(
    message: string,
    readonly httpStatus: 502 | 503 = 502,
  ) {
    super(message);
  }
}

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseSSLCommerzEnvironment(
  environment: Record<string, string | undefined>,
): SSLCommerzConfiguration {
  const storeId = nonEmptyString(environment.SSLCOMMERZ_STORE_ID);
  const storePassword = nonEmptyString(environment.SSLCOMMERZ_STORE_PASSWORD);
  const sandboxValue = nonEmptyString(environment.SSLCOMMERZ_IS_SANDBOX);

  if (!storeId || !storePassword) {
    throw new SSLCommerzConfigurationError(
      "SSLCommerz credentials are not configured.",
    );
  }
  if (sandboxValue !== "true" && sandboxValue !== "false") {
    throw new SSLCommerzConfigurationError(
      "SSLCOMMERZ_IS_SANDBOX must be true or false.",
    );
  }

  const isSandbox = sandboxValue === "true";
  const endpoints = isSandbox
    ? SSL_COMMERZ_ENDPOINTS.sandbox
    : SSL_COMMERZ_ENDPOINTS.production;

  return {
    storeId,
    storePassword,
    isSandbox,
    initiationUrl: endpoints.initiation,
    validationUrl: endpoints.validation,
    sessionQueryUrl: endpoints.sessionQuery,
  };
}

export function getSSLCommerzConfiguration() {
  return parseSSLCommerzEnvironment(process.env);
}

const canonicalBDTAmountPattern =
  /^(?:0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/;

export function parseCanonicalSSLCommerzBDTAmount(amount: unknown) {
  if (
    typeof amount !== "string" ||
    !canonicalBDTAmountPattern.test(amount)
  ) {
    throw new SSLCommerzProofError("Invalid SSLCommerz payment amount.");
  }

  const decimal = new Prisma.Decimal(amount);

  if (!decimal.isFinite() || decimal.isNegative()) {
    throw new SSLCommerzProofError("Invalid SSLCommerz payment amount.");
  }

  return decimal;
}

export function formatSSLCommerzBDTAmount(amount: unknown) {
  const decimal =
    typeof amount === "string"
      ? parseCanonicalSSLCommerzBDTAmount(amount)
      : Prisma.Decimal.isDecimal(amount)
        ? amount
        : null;

  if (
    !decimal ||
    !decimal.isFinite() ||
    decimal.isNegative() ||
    decimal.decimalPlaces() > 2
  ) {
    throw new SSLCommerzProofError("Invalid SSLCommerz payment amount.");
  }

  return decimal.toFixed(2);
}

export function sslCommerzBDTAmountsEqual(
  left: unknown,
  right: unknown,
) {
  return (
    formatSSLCommerzBDTAmount(left) === formatSSLCommerzBDTAmount(right)
  );
}

export function normalizeSSLCommerzValidationResponse(
  value: unknown,
): SSLCommerzValidation {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SSLCommerzProviderUnavailableError(
      "SSLCommerz returned an invalid validation response.",
    );
  }

  const response = value as Record<string, unknown>;
  const status = nonEmptyString(response.status)?.toUpperCase() ?? "";
  const amountValue = nonEmptyString(response.amount);
  const riskValue =
    typeof response.risk_level === "number" &&
    Number.isSafeInteger(response.risk_level)
      ? response.risk_level.toString()
      : nonEmptyString(response.risk_level);
  const apiConnect = nonEmptyString(response.APIConnect);

  return {
    status,
    transactionId: nonEmptyString(response.tran_id) ?? "",
    validationId: nonEmptyString(response.val_id) ?? "",
    bankTransactionId: nonEmptyString(response.bank_tran_id) ?? "",
    amount: amountValue ?? "",
    currency: nonEmptyString(response.currency)?.toUpperCase() ?? "",
    storeId: nonEmptyString(response.store_id),
    orderNumber: nonEmptyString(response.value_a),
    riskLevel:
      riskValue !== null && /^[0-9]+$/.test(riskValue)
        ? Number.parseInt(riskValue, 10)
        : null,
    apiConnected: apiConnect === null || apiConnect.toUpperCase() === "DONE",
  };
}

export function fingerprintSSLCommerzValue(value: string, length = 12) {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

export function createSSLCommerzMerchantTransactionReference() {
  return `SC-${randomBytes(14).toString("hex").slice(0, 27)}`;
}

export function sanitizedSSLCommerzErrorContext(
  error: unknown,
  context: Record<string, string>,
) {
  let errorCategory = "unexpected";

  if (error instanceof SSLCommerzConfigurationError) {
    errorCategory = "configuration";
  } else if (error instanceof SSLCommerzProofError) {
    errorCategory = "invalid_proof";
  } else if (error instanceof SSLCommerzProviderUnavailableError) {
    errorCategory =
      error.httpStatus === 503 ? "provider_timeout" : "provider_failure";
  } else if (error instanceof Error) {
    errorCategory = error.name;
  }

  return { ...context, errorCategory };
}

function createTimeoutSignal() {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    SSL_COMMERZ_REQUEST_TIMEOUT_MS,
  );

  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

async function parseProviderJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new SSLCommerzProviderUnavailableError(
      "SSLCommerz returned an unreadable response.",
    );
  }
}

export async function validateSSLCommerzPayment(
  validationId: string,
  configuration = getSSLCommerzConfiguration(),
) {
  const normalizedValidationId = nonEmptyString(validationId);

  if (!normalizedValidationId) {
    throw new SSLCommerzProofError("SSLCommerz validation ID is required.");
  }
  if (normalizedValidationId.length > 50) {
    throw new SSLCommerzProofError("SSLCommerz validation ID is invalid.");
  }

  const url = new URL(configuration.validationUrl);
  url.searchParams.set("val_id", normalizedValidationId);
  url.searchParams.set("store_id", configuration.storeId);
  url.searchParams.set("store_passwd", configuration.storePassword);
  url.searchParams.set("format", "json");

  const timeout = createTimeoutSignal();

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: timeout.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new SSLCommerzProviderUnavailableError(
        "SSLCommerz validation API was unavailable.",
      );
    }

    const validation = normalizeSSLCommerzValidationResponse(
      await parseProviderJson(response),
    );

    if (!validation.apiConnected) {
      throw new SSLCommerzProviderUnavailableError(
        "SSLCommerz validation API did not confirm connectivity.",
      );
    }

    return validation;
  } catch (error) {
    if (
      error instanceof SSLCommerzProviderUnavailableError ||
      error instanceof SSLCommerzProofError
    ) {
      throw error;
    }

    throw new SSLCommerzProviderUnavailableError(
      isAbortError(error)
        ? "SSLCommerz validation API timed out."
        : "SSLCommerz validation API request failed.",
      isAbortError(error) ? 503 : 502,
    );
  } finally {
    timeout.clear();
  }
}

export async function querySSLCommerzSession(
  sessionKey: string,
  configuration = getSSLCommerzConfiguration(),
): Promise<SSLCommerzSessionQuery> {
  const normalizedSessionKey = nonEmptyString(sessionKey);

  if (!normalizedSessionKey || normalizedSessionKey.length > 50) {
    throw new SSLCommerzProofError("SSLCommerz session key is invalid.");
  }

  const url = new URL(configuration.sessionQueryUrl);
  url.searchParams.set("sessionkey", normalizedSessionKey);
  url.searchParams.set("store_id", configuration.storeId);
  url.searchParams.set("store_passwd", configuration.storePassword);
  url.searchParams.set("format", "json");

  const timeout = createTimeoutSignal();

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: timeout.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new SSLCommerzProviderUnavailableError(
        "SSLCommerz session query API was unavailable.",
      );
    }

    const value = await parseProviderJson(response);

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new SSLCommerzProviderUnavailableError(
        "SSLCommerz returned an invalid session response.",
      );
    }

    const data = value as Record<string, unknown>;
    const apiConnect = nonEmptyString(data.APIConnect);
    const status = nonEmptyString(data.status)?.toUpperCase() ?? "";
    const returnedSessionKey = nonEmptyString(data.sessionkey) ?? "";
    const transactionId = nonEmptyString(data.tran_id) ?? "";
    const isDefinitiveFailedSession = new Set([
      "FAILED",
      "CANCELLED",
      "CANCELED",
      "INVALID_TRANSACTION",
    ]).has(status);

    if (
      (apiConnect && apiConnect.toUpperCase() !== "DONE") ||
      !status ||
      (returnedSessionKey &&
        returnedSessionKey !== normalizedSessionKey) ||
      (!isDefinitiveFailedSession &&
        (!returnedSessionKey || !transactionId))
    ) {
      throw new SSLCommerzProviderUnavailableError(
        "SSLCommerz session status could not be confirmed.",
      );
    }

    return {
      status,
      sessionKey: returnedSessionKey || normalizedSessionKey,
      transactionId,
    };
  } catch (error) {
    if (
      error instanceof SSLCommerzProviderUnavailableError ||
      error instanceof SSLCommerzProofError
    ) {
      throw error;
    }

    throw new SSLCommerzProviderUnavailableError(
      isAbortError(error)
        ? "SSLCommerz session query API timed out."
        : "SSLCommerz session query API request failed.",
      isAbortError(error) ? 503 : 502,
    );
  } finally {
    timeout.clear();
  }
}

export async function querySSLCommerzMerchantTransaction(
  transactionReference: string,
  configuration = getSSLCommerzConfiguration(),
): Promise<SSLCommerzMerchantTransactionQuery> {
  const normalizedReference = nonEmptyString(transactionReference);

  if (!normalizedReference || normalizedReference.length > 30) {
    throw new SSLCommerzProofError(
      "SSLCommerz merchant transaction reference is invalid.",
    );
  }

  const url = new URL(configuration.sessionQueryUrl);
  url.searchParams.set("tran_id", normalizedReference);
  url.searchParams.set("store_id", configuration.storeId);
  url.searchParams.set("store_passwd", configuration.storePassword);
  url.searchParams.set("format", "json");

  const timeout = createTimeoutSignal();

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: timeout.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new SSLCommerzProviderUnavailableError(
        "SSLCommerz merchant transaction query API was unavailable.",
      );
    }

    const value = await parseProviderJson(response);

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new SSLCommerzProviderUnavailableError(
        "SSLCommerz returned an invalid merchant transaction response.",
      );
    }

    const data = value as Record<string, unknown>;
    const apiConnect = nonEmptyString(data.APIConnect);
    const elements = Array.isArray(data.element) ? data.element : [];
    const countValue =
      typeof data.no_of_trans_found === "number" &&
      Number.isSafeInteger(data.no_of_trans_found)
        ? data.no_of_trans_found
        : typeof data.no_of_trans_found === "string" &&
            /^[0-9]+$/.test(data.no_of_trans_found)
          ? Number.parseInt(data.no_of_trans_found, 10)
          : null;

    if (
      (apiConnect && apiConnect.toUpperCase() !== "DONE") ||
      countValue === null
    ) {
      throw new SSLCommerzProviderUnavailableError(
        "SSLCommerz merchant transaction status could not be confirmed.",
      );
    }

    const statuses = elements.flatMap((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return [];
      }

      const transaction = entry as Record<string, unknown>;
      const returnedReference = nonEmptyString(transaction.tran_id);
      const status = nonEmptyString(transaction.status)?.toUpperCase();

      if (returnedReference && returnedReference !== normalizedReference) {
        throw new SSLCommerzProofError(
          "SSLCommerz merchant transaction query mismatch.",
        );
      }

      return status ? [status] : [];
    });

    if (countValue > 0 && statuses.length === 0) {
      throw new SSLCommerzProviderUnavailableError(
        "SSLCommerz merchant transaction records were incomplete.",
      );
    }

    return { statuses };
  } catch (error) {
    if (
      error instanceof SSLCommerzProviderUnavailableError ||
      error instanceof SSLCommerzProofError
    ) {
      throw error;
    }

    throw new SSLCommerzProviderUnavailableError(
      isAbortError(error)
        ? "SSLCommerz merchant transaction query API timed out."
        : "SSLCommerz merchant transaction query API request failed.",
      isAbortError(error) ? 503 : 502,
    );
  } finally {
    timeout.clear();
  }
}

function safeGatewayUrl(value: unknown) {
  const rawUrl = nonEmptyString(value);

  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
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

export class SSLCommerzProvider implements PaymentProviderAdapter {
  provider = PaymentProvider.SSLCOMMERZ;

  isEnabled(): boolean {
    try {
      getSSLCommerzConfiguration();
      return true;
    } catch {
      return false;
    }
  }

  async initiatePayment(options: PaymentInitiateOptions): Promise<PaymentInitiateResult> {
    const configuration = getSSLCommerzConfiguration();
    const currency = options.currency.trim().toUpperCase();
    const transactionReference =
      nonEmptyString(options.transactionReference) ?? options.orderNumber;

    if (currency !== "BDT") {
      throw new SSLCommerzProofError(
        "SSLCommerz supports only BDT in this store.",
      );
    }
    if (!transactionReference) {
      throw new SSLCommerzProofError(
        "SSLCommerz merchant transaction reference is required.",
      );
    }

    const callbackUrl =
      options.returnUrl ||
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/sslcommerz/callback`;
    const ipnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/sslcommerz/webhook`;
    const formData = new URLSearchParams({
      store_id: configuration.storeId,
      store_passwd: configuration.storePassword,
      total_amount: formatSSLCommerzBDTAmount(options.amount),
      currency,
      tran_id: transactionReference,
      success_url: callbackUrl,
      fail_url: callbackUrl,
      cancel_url: callbackUrl,
      ipn_url: ipnUrl,
      value_a: options.orderNumber,
      cus_name: options.customerName,
      cus_email: options.customerEmail,
      cus_phone: options.customerPhone,
      shipping_method: "NO",
      product_name: `Order #${options.orderNumber}`,
      product_category: "Plants",
      product_profile: "physical-goods",
    });
    const timeout = createTimeoutSignal();

    try {
      const response = await fetch(configuration.initiationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
        cache: "no-store",
        signal: timeout.signal,
      });

      if (!response.ok) {
        throw new SSLCommerzProviderUnavailableError(
          "SSLCommerz initiation API was unavailable.",
        );
      }

      const rawData = await parseProviderJson(response);
      const data =
        rawData && typeof rawData === "object" && !Array.isArray(rawData)
          ? (rawData as Record<string, unknown>)
          : {};
      const status = nonEmptyString(data.status)?.toUpperCase();
      const redirectUrl = safeGatewayUrl(data.GatewayPageURL);
      const sessionKey = nonEmptyString(data.sessionkey);

      if (status !== "SUCCESS" || !redirectUrl || !sessionKey) {
        throw new SSLCommerzProviderUnavailableError(
          "SSLCommerz did not create a payment session.",
        );
      }

      return {
        success: true,
        redirectUrl,
        transactionId: transactionReference,
        providerReference: sessionKey ?? undefined,
        rawMetadataJson: JSON.stringify({
          merchantTransactionReference: transactionReference,
          sessionCreated: true,
        }),
      };
    } catch (error) {
      if (
        error instanceof SSLCommerzConfigurationError ||
        error instanceof SSLCommerzProofError ||
        error instanceof SSLCommerzProviderUnavailableError
      ) {
        throw error;
      }

      throw new SSLCommerzProviderUnavailableError(
        isAbortError(error)
          ? "SSLCommerz initiation API timed out."
          : "SSLCommerz initiation API request failed.",
        isAbortError(error) ? 503 : 502,
      );
    } finally {
      timeout.clear();
    }
  }

  async verifyPayment(payload: Record<string, unknown>): Promise<PaymentVerificationResult> {
    const validationId = nonEmptyString(payload.val_id);

    if (!validationId) {
      throw new SSLCommerzProofError(
        "SSLCommerz validation ID is required.",
      );
    }

    const validation = await validateSSLCommerzPayment(validationId);
    const isValid =
      (validation.status === "VALID" ||
        validation.status === "VALIDATED") &&
      validation.validationId === validationId &&
      validation.riskLevel === 0;

    return {
      success: isValid,
      status: isValid
        ? TransactionStatus.VERIFIED
        : TransactionStatus.PENDING,
      providerReference: validation.bankTransactionId || undefined,
      failureReason: isValid
        ? undefined
        : "SSLCommerz payment requires verification or manual review.",
      rawMetadataJson: JSON.stringify({
        validationIdHash: fingerprintSSLCommerzValue(
          validation.validationId,
          64,
        ),
        validationStatus: validation.status,
        riskLevel: validation.riskLevel,
      }),
    };
  }
}

export const sslCommerzProvider = new SSLCommerzProvider();
