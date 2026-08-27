import "server-only";

import { prisma } from "@/lib/prisma";
import type { ShippingZoneInput } from "@/lib/shipping/shipping-validation";
import { Prisma as PrismaClient } from "@/generated/prisma/client";
const Decimal = PrismaClient.Decimal;

export class ShippingError extends Error {}
export class ShippingZoneNotFoundError extends ShippingError {}

type DbClient = PrismaClient.TransactionClient | typeof prisma;

/**
 * Seeds default Bangladesh shipping zones if database has no active zones.
 */
export async function ensureDefaultShippingZones(db: DbClient = prisma) {
  const count = await db.shippingZone.count();
  if (count > 0) return;

  const seedZones = async (client: DbClient) => {
    // 1. Dhaka City Zone
    await client.shippingZone.create({
      data: {
        name: "Dhaka City",
        countries: "Bangladesh",
        regions: "Dhaka,Dhanmondi,Gulshan,Banani,Uttara,Mirpur,Mohammadpur,Badda,Motijheel",
        priority: 10,
        isActive: true,
        rates: {
          create: [
            {
              name: "Standard Home Delivery",
              method: "STANDARD",
              amount: new Decimal(60),
              freeShippingThreshold: new Decimal(2000), // Free shipping on orders over BDT 2000
              estimatedDeliveryText: "1-2 business days",
              isActive: true,
            },
            {
              name: "Express Same Day Delivery",
              method: "EXPRESS",
              amount: new Decimal(120),
              estimatedDeliveryText: "Same day (if ordered before 12 PM)",
              isActive: true,
            },
          ],
        },
      },
    });

    // 2. Outside Dhaka Zone
    await client.shippingZone.create({
      data: {
        name: "Outside Dhaka",
        countries: "Bangladesh",
        regions: "Chittagong,Rajshahi,Khulna,Barisal,Sylhet,Rangpur,Mymensingh,Comilla,Gazipur,Narayanganj",
        priority: 1,
        isActive: true,
        rates: {
          create: [
            {
              name: "Currier / Courier Delivery",
              method: "COURIER",
              amount: new Decimal(120),
              freeShippingThreshold: new Decimal(3500), // Free shipping on orders over BDT 3500
              estimatedDeliveryText: "3-5 business days",
              isActive: true,
            },
          ],
        },
      },
    });
  };

  if ("$transaction" in db && typeof db.$transaction === "function") {
    await (db as typeof prisma).$transaction(async (tx) => seedZones(tx));
  } else {
    await seedZones(db);
  }
}

export type CalculatedShippingResult = {
  zoneId: string;
  zoneName: string;
  rateId: string;
  rateName: string;
  shippingCost: number;
  estimatedDeliveryText: string | null;
};

export async function calculateShippingCost(
  districtOrCity: string,
  subtotal: number,
  selectedRateId?: string,
  db: DbClient = prisma
): Promise<CalculatedShippingResult> {
  await ensureDefaultShippingZones(db);

  const activeZones = await db.shippingZone.findMany({
    where: { isActive: true },
    orderBy: { priority: "desc" },
    include: {
      rates: {
        where: { isActive: true },
        orderBy: { amount: "asc" },
      },
    },
  });

  if (activeZones.length === 0) {
    throw new ShippingZoneNotFoundError("No active shipping zones configured.");
  }

  const locationLower = (districtOrCity || "").trim().toLowerCase();

  // Find matching zone by region or fallback to default
  let matchedZone = activeZones.find((zone) => {
    if (!zone.regions) return false;
    const regionsList = zone.regions.split(",").map((r) => r.trim().toLowerCase());
    return regionsList.some((r) => locationLower.includes(r) || r.includes(locationLower));
  });

  if (!matchedZone) {
    // Default fallback to lowest priority zone (e.g. Outside Dhaka) or first active
    matchedZone = activeZones[activeZones.length - 1];
  }

  if (matchedZone.rates.length === 0) {
    throw new ShippingZoneNotFoundError(`No shipping rates configured for zone "${matchedZone.name}".`);
  }

  let selectedRate = matchedZone.rates[0];
  if (selectedRateId) {
    const rateMatch = matchedZone.rates.find((r) => r.id === selectedRateId);
    if (rateMatch) selectedRate = rateMatch;
  }

  let fee = Number(selectedRate.amount);

  // Check free shipping threshold
  const threshold = selectedRate.freeShippingThreshold
    ? Number(selectedRate.freeShippingThreshold)
    : null;

  if (threshold !== null && subtotal >= threshold) {
    fee = 0;
  }

  return {
    zoneId: matchedZone.id,
    zoneName: matchedZone.name,
    rateId: selectedRate.id,
    rateName: selectedRate.name,
    shippingCost: fee,
    estimatedDeliveryText: selectedRate.estimatedDeliveryText,
  };
}

export async function createShippingZone(input: ShippingZoneInput) {
  return prisma.shippingZone.create({
    data: {
      name: input.name,
      countries: input.countries || "Bangladesh",
      regions: input.regions || null,
      isActive: input.isActive,
      priority: input.priority,
      rates: {
        create: input.rates.map((rate) => ({
          name: rate.name,
          method: rate.method,
          amount: new Decimal(rate.amount),
          minimumOrderAmount: rate.minimumOrderAmount ? new Decimal(rate.minimumOrderAmount) : null,
          freeShippingThreshold: rate.freeShippingThreshold ? new Decimal(rate.freeShippingThreshold) : null,
          estimatedDeliveryText: rate.estimatedDeliveryText || null,
          isActive: rate.isActive,
        })),
      },
    },
    include: { rates: true },
  });
}

export async function updateShippingZone(id: string, input: ShippingZoneInput) {
  return prisma.$transaction(async (tx) => {
    await tx.shippingRate.deleteMany({ where: { zoneId: id } });

    return tx.shippingZone.update({
      where: { id },
      data: {
        name: input.name,
        countries: input.countries || "Bangladesh",
        regions: input.regions || null,
        isActive: input.isActive,
        priority: input.priority,
        rates: {
          create: input.rates.map((rate) => ({
            name: rate.name,
            method: rate.method,
            amount: new Decimal(rate.amount),
            minimumOrderAmount: rate.minimumOrderAmount ? new Decimal(rate.minimumOrderAmount) : null,
            freeShippingThreshold: rate.freeShippingThreshold ? new Decimal(rate.freeShippingThreshold) : null,
            estimatedDeliveryText: rate.estimatedDeliveryText || null,
            isActive: rate.isActive,
          })),
        },
      },
      include: { rates: true },
    });
  });
}
