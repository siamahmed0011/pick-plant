"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  hasSafePaymentWindow,
  PAYMENT_INITIATION_MIN_REMAINING_MS,
  type OnlinePaymentProvider,
} from "@/lib/orders/payment-initiation-eligibility";
import { requestOnlinePaymentRedirect } from "@/lib/payments/client-payment-initiation";

type Props = {
  orderId: string;
  provider: OnlinePaymentProvider;
  expiresAt: string;
  label?: string;
  className?: string;
  onRedirectReady?: () => void | Promise<void>;
};

export function PaymentRetryButton({
  orderId,
  provider,
  expiresAt,
  label = "Retry payment",
  className,
  onRedirectReady,
}: Props) {
  const requestInFlight = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [eligibilityClock, setEligibilityClock] = useState(() => Date.now());
  const [eligibilityRevoked, setEligibilityRevoked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEligible =
    !eligibilityRevoked &&
    hasSafePaymentWindow(expiresAt, new Date(eligibilityClock));

  useEffect(() => {
    const disableAt =
      Date.parse(expiresAt) -
      PAYMENT_INITIATION_MIN_REMAINING_MS -
      Date.now();

    if (!Number.isFinite(disableAt) || disableAt <= 0) return;

    const timeout = window.setTimeout(
      () => setEligibilityClock(Date.now()),
      Math.min(disableAt, 2_147_483_647),
    );
    return () => window.clearTimeout(timeout);
  }, [expiresAt]);

  const handlePayment = async () => {
    if (requestInFlight.current || !isEligible) return;
    requestInFlight.current = true;
    setIsLoading(true);
    setError(null);

    const result = await requestOnlinePaymentRedirect(orderId, provider);

    if (result.success) {
      await onRedirectReady?.();
      window.location.assign(result.redirectUrl);
      return;
    }

    if (result.unavailable) setEligibilityRevoked(true);
    setError(
      result.unavailable
        ? "Payment can no longer be started for this order."
        : "Payment could not be started. Please try again safely.",
    );
    requestInFlight.current = false;
    setIsLoading(false);
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant="primary"
        onClick={handlePayment}
        disabled={isLoading || !isEligible}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Connecting securely...
          </>
        ) : (
          <>
            <CreditCard className="size-4" /> {label}
          </>
        )}
      </Button>
      {!isEligible && !error && (
        <p className="mt-2 text-xs text-amber-700">
          This payment reservation is no longer eligible for retry.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
