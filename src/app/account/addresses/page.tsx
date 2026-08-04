import { AccountPageHeader } from "@/components/account/account-header";
import { AddressManager } from "@/components/account/address-manager";
import { requireUser } from "@/lib/auth/guards";
import { getAccountUserContext } from "@/lib/auth/user-context";
import { prisma } from "@/lib/prisma";

export default async function SavedAddressesPage() {
  const session = await requireUser("/account/addresses");
  const userContext = await getAccountUserContext(session);

  let addresses: Array<{
    id: string;
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    area: string | null;
    city: string;
    district: string;
    isDefault: boolean;
  }> = [];

  if (userContext) {
    try {
      const addressRecords = await prisma.address.findMany({
        where: { userId: userContext.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });

      addresses = addressRecords.map((a) => ({
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
    } catch (error) {
      console.error("[SavedAddressesPage] Failed to fetch saved addresses:", error);
    }
  }

  return (
    <div className="space-y-6">
      <AccountPageHeader
        title="Saved addresses"
        subtitle="Save home, office, or gift delivery locations for a faster checkout."
      />
      <AddressManager initialAddresses={addresses} />
    </div>
  );
}
