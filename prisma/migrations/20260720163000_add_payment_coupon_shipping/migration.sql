-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('CASH_ON_DELIVERY', 'MANUAL', 'SSLCOMMERZ', 'STRIPE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('INITIATED', 'PENDING', 'VERIFIED', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "applied_coupon_id" UUID,
ADD COLUMN IF NOT EXISTS "coupon_code" TEXT,
ADD COLUMN IF NOT EXISTS "coupon_discount_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "estimated_delivery_text" TEXT,
ADD COLUMN IF NOT EXISTS "shipping_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "shipping_method_name" TEXT,
ADD COLUMN IF NOT EXISTS "shipping_zone_name" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "payment_transactions" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "method" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'INITIATED',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
    "transaction_id" TEXT,
    "provider_reference" TEXT,
    "idempotency_key" TEXT,
    "failure_reason" TEXT,
    "raw_metadata_json" TEXT,
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "coupons" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "minimum_order_amount" DECIMAL(12,2),
    "maximum_discount_amount" DECIMAL(12,2),
    "usage_limit" INTEGER,
    "usage_limit_per_customer" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "applies_to_all_products" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "coupon_products" (
    "id" UUID NOT NULL,
    "coupon_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "coupon_categories" (
    "id" UUID NOT NULL,
    "coupon_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "coupon_redemptions" (
    "id" UUID NOT NULL,
    "coupon_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "user_id" UUID,
    "customer_email" TEXT NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "shipping_zones" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "countries" TEXT NOT NULL DEFAULT 'Bangladesh',
    "regions" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "shipping_rates" (
    "id" UUID NOT NULL,
    "zone_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "minimum_order_amount" DECIMAL(12,2),
    "free_shipping_threshold" DECIMAL(12,2),
    "estimated_delivery_text" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payment_transactions_transaction_id_key" ON "payment_transactions"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payment_transactions_idempotency_key_key" ON "payment_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_transactions_order_id_created_at_idx" ON "payment_transactions"("order_id", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_transactions_provider_status_idx" ON "payment_transactions"("provider", "status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coupons_is_active_starts_at_expires_at_idx" ON "coupons"("is_active", "starts_at", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_products_coupon_id_product_id_key" ON "coupon_products"("coupon_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_categories_coupon_id_category_id_key" ON "coupon_categories"("coupon_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_redemptions_order_id_key" ON "coupon_redemptions"("order_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coupon_redemptions_coupon_id_redeemed_at_idx" ON "coupon_redemptions"("coupon_id", "redeemed_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coupon_redemptions_user_id_coupon_id_idx" ON "coupon_redemptions"("user_id", "coupon_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipping_zones_is_active_priority_idx" ON "shipping_zones"("is_active", "priority");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipping_rates_zone_id_is_active_idx" ON "shipping_rates"("zone_id", "is_active");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_applied_coupon_id_fkey" FOREIGN KEY ("applied_coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_products" ADD CONSTRAINT "coupon_products_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_products" ADD CONSTRAINT "coupon_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_categories" ADD CONSTRAINT "coupon_categories_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_categories" ADD CONSTRAINT "coupon_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "shipping_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
