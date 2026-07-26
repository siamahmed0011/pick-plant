import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ items: [] });
    }

    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { orderBy: { position: "asc" }, take: 1 },
          },
        },
      },
    });

    const items = wishlistItems.map((item) => {
      const p = item.product;
      const primaryImage = p.images[0]?.secureUrl || p.images[0]?.url || "/images/placeholders/plant.svg";
      return {
        id: p.id,
        name: p.name,
        bengaliName: p.bengaliName || p.name,
        slug: p.slug,
        scientificName: p.shortDescription || undefined,
        regularPrice: Number(p.price),
        salePrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
        shortDescription: p.shortDescription || "",
        stock: p.stockQuantity,
        image: primaryImage,
        category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : undefined,
        lightRequirement: p.lightRequirement || "Indirect light",
        wateringFrequency: p.waterRequirement || "Water as needed",
        difficulty: p.difficulty || "Easy",
        petFriendly: false,
        featured: p.isFeatured,
        published: p.status === "ACTIVE",
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/wishlist error:", error);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ added: false });
    } else {
      await prisma.wishlist.create({
        data: {
          userId: session.user.id,
          productId,
        },
      });
      return NextResponse.json({ added: true });
    }
  } catch (error) {
    console.error("POST /api/wishlist error:", error);
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.wishlist.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/wishlist error:", error);
    return NextResponse.json({ error: "Failed to clear wishlist" }, { status: 500 });
  }
}
