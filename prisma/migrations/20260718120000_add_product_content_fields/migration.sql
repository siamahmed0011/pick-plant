-- Add optional merchandising and plant-care fields required by product creation.
-- Every column is nullable so existing products remain valid.
ALTER TABLE "products"
ADD COLUMN "plant_size" TEXT,
ADD COLUMN "indoor_outdoor" TEXT,
ADD COLUMN "difficulty" TEXT,
ADD COLUMN "light_requirement" TEXT,
ADD COLUMN "water_requirement" TEXT,
ADD COLUMN "seo_title" TEXT,
ADD COLUMN "seo_description" TEXT;
