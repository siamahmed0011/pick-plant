-- Store Cloudinary metadata while retaining url for legacy image compatibility.
ALTER TABLE "product_images"
ADD COLUMN "public_id" TEXT,
ADD COLUMN "secure_url" TEXT,
ADD COLUMN "width" INTEGER,
ADD COLUMN "height" INTEGER,
ADD COLUMN "format" TEXT,
ADD COLUMN "bytes" INTEGER;
