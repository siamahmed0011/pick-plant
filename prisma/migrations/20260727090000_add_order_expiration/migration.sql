ALTER TABLE "orders"
ADD COLUMN "expires_at" TIMESTAMP(3),
ADD COLUMN "expiration_retry_at" TIMESTAMP(3),
ADD COLUMN "reservation_released_at" TIMESTAMP(3);

-- Historical cancelled orders are intentionally left unclaimed. Existing
-- data cannot prove that both inventory and coupon usage were restored, so a
-- future reconciliation can still identify and repair inconsistent records.

-- Backfill the explicit reservation deadline only for online-payment orders.
-- Migration-time timestamps give active legacy orders a fresh grace period.
-- COD and manual-payment orders intentionally keep their existing lifecycle.
UPDATE "orders"
SET "expires_at" = CURRENT_TIMESTAMP + INTERVAL '30 minutes',
    "expiration_retry_at" = CURRENT_TIMESTAMP + INTERVAL '30 minutes'
WHERE "expires_at" IS NULL
  AND "status" = 'PENDING'
  AND "payment_status" IN ('PENDING', 'UNPAID', 'FAILED')
  AND "payment_provider" IN ('STRIPE', 'SSLCOMMERZ');

CREATE INDEX "orders_expiration_cleanup_idx"
ON "orders"(
  "status",
  "payment_provider",
  "payment_status",
  "reservation_released_at",
  "expiration_retry_at",
  "expires_at"
);
