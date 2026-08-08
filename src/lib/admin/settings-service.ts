import "server-only";

export type StoreSettings = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  storeAddress: string;
  announcementText: string;
  dhakaShippingFee: number;
  outsideDhakaShippingFee: number;
  freeShippingThreshold: number;
  codEnabled: boolean;
  maintenanceMode: boolean;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
};

// Safe server-side store configuration cache
let inMemoryStoreSettings: StoreSettings = {
  storeName: "Pick Plant",
  supportEmail: "support@pickplant.com",
  supportPhone: "+880 1700-000000",
  storeAddress: "House 42, Road 11, Block D, Banani, Dhaka-1213, Bangladesh",
  announcementText: "Thoughtfully grown indoor and outdoor plants delivered across Bangladesh · Free shipping on Dhaka orders over ৳2,000",
  dhakaShippingFee: 60,
  outsideDhakaShippingFee: 120,
  freeShippingThreshold: 2000,
  codEnabled: true,
  maintenanceMode: false,
  facebookUrl: "https://facebook.com/pickplant.bd",
  instagramUrl: "https://instagram.com/pickplant.bd",
  youtubeUrl: "https://youtube.com/@pickplant",
};

export async function getStoreSettings(): Promise<StoreSettings> {
  return { ...inMemoryStoreSettings };
}

export async function updateStoreSettings(newSettings: Partial<StoreSettings>): Promise<StoreSettings> {
  inMemoryStoreSettings = {
    ...inMemoryStoreSettings,
    ...newSettings,
  };
  return { ...inMemoryStoreSettings };
}
