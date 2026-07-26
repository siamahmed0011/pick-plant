import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { AddressManager } from "@/components/account/address-manager";

export default async function SavedAddressesPage() {
  const session = await requireUser("/account/addresses");

  const addressRecords = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  const addresses = addressRecords.map((a) => ({
    id: a.id,
    recipientName: a.recipientName,
    phone: a.phone,
    addressLine1: a.addressLine1,
    addressLine2: a.addressLine2,
    area: a.area,
    city: a.city,
    district: a.district,
    isDefault: a.isDefault,
  }));

  return <AddressManager initialAddresses={addresses} />;
}
