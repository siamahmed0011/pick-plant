-- Preserve PaymentTransaction.idempotencyKey for payment-attempt/request idempotency.
ALTER TABLE "payment_transactions"
ADD COLUMN "attempt_number" INTEGER NOT NULL DEFAULT 0;

-- Record processed provider webhook events independently from payment attempts.
CREATE TABLE "processed_payment_events" (
    "id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "event_id" TEXT NOT NULL,
    "payment_transaction_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_payment_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "processed_payment_events_provider_event_id_key"
ON "processed_payment_events"("provider", "event_id");

CREATE INDEX "processed_payment_events_payment_transaction_id_processed_at_idx"
ON "processed_payment_events"("payment_transaction_id", "processed_at");

ALTER TABLE "processed_payment_events"
ADD CONSTRAINT "processed_payment_events_payment_transaction_id_fkey"
FOREIGN KEY ("payment_transaction_id")
REFERENCES "payment_transactions"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
