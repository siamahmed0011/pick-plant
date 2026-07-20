-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'RETURNED';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'UNPAID';

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_shipping_address_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_billing_address_id_fkey";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT,
ADD COLUMN IF NOT EXISTS "customer_email" TEXT,
ADD COLUMN IF NOT EXISTS "customer_name" TEXT,
ADD COLUMN IF NOT EXISTS "customer_phone" TEXT,
ADD COLUMN IF NOT EXISTS "payment_method" TEXT,
ADD COLUMN IF NOT EXISTS "shipping_address_line_1" TEXT,
ADD COLUMN IF NOT EXISTS "shipping_address_line_2" TEXT,
ADD COLUMN IF NOT EXISTS "shipping_area" TEXT,
ADD COLUMN IF NOT EXISTS "shipping_city" TEXT,
ADD COLUMN IF NOT EXISTS "shipping_district" TEXT,
ADD COLUMN IF NOT EXISTS "shipping_postal_code" TEXT,
ALTER COLUMN "shipping_address_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "product_image_url" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "order_status_histories" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "payment_status" "PaymentStatus",
    "note" TEXT,
    "performed_by_id" UUID,
    "performed_by_name" TEXT,
    "performed_by_role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "order_status_histories_order_id_created_at_idx" ON "order_status_histories"("order_id", "created_at");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_fkey" FOREIGN KEY ("shipping_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_fkey" FOREIGN KEY ("billing_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_histories" ADD CONSTRAINT "order_status_histories_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_histories" ADD CONSTRAINT "order_status_histories_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
