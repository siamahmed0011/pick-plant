import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudinary, CLOUDINARY_PRODUCT_FOLDER, CLOUDINARY_TEMP_FOLDER } from "@/lib/cloudinary";
import { productIdSchema } from "@/lib/admin/product-validation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({ productId: productIdSchema.optional() });

export async function POST(request: Request) {
  await requireAdmin("/admin/products");

  try {
    const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ message: "The upload request is invalid." }, { status: 400 });
    }

    const productId = parsed.data.productId;
    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
      if (!product) return NextResponse.json({ message: "This product no longer exists." }, { status: 404 });
    }

    const { client, cloudName, apiKey } = getCloudinary();
    const uploadId = randomUUID();
    const folder = productId ? `${CLOUDINARY_PRODUCT_FOLDER}/${productId}` : `${CLOUDINARY_TEMP_FOLDER}/${uploadId}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = client.utils.api_sign_request({ folder, timestamp }, process.env.CLOUDINARY_API_SECRET!);

    return NextResponse.json({ signature, timestamp, folder, uploadId, cloudName, apiKey });
  } catch (error) {
    console.error("Cloudinary signature generation failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ message: "Image upload is temporarily unavailable." }, { status: 503 });
  }
}
