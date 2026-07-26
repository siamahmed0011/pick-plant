import "server-only";

import { prisma } from "@/lib/prisma";
import { ensureDefaultShippingZones } from "@/lib/shipping/shipping-service";

export async function getAdminShippingZonesList() {
  await ensureDefaultShippingZones();

  const zones = await prisma.shippingZone.findMany({
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      rates: {
        orderBy: { amount: "asc" },
      },
    },
  });

  return zones.map((z) => ({
    ...z,
    rates: z.rates.map((r) => ({
      ...r,
      amount: Number(r.amount),
      minimumOrderAmount: r.minimumOrderAmount ? Number(r.minimumOrderAmount) : null,
      freeShippingThreshold: r.freeShippingThreshold ? Number(r.freeShippingThreshold) : null,
    })),
  }));
}

export async function getShippingZoneDetails(id: string) {
  const zone = await prisma.shippingZone.findUnique({
    where: { id },
    include: {
      rates: true,
    },
  });

  if (!zone) return null;

  return {
    ...zone,
    rates: zone.rates.map((r) => ({
      ...r,
      amount: Number(r.amount),
      minimumOrderAmount: r.minimumOrderAmount ? Number(r.minimumOrderAmount) : null,
      freeShippingThreshold: r.freeShippingThreshold ? Number(r.freeShippingThreshold) : null,
    })),
  };
}
