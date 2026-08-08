export type MobileBankingChannelId = "bKash" | "Nagad" | "Rocket" | "Bank Transfer";

export type PaymentChannelConfig = {
  id: MobileBankingChannelId;
  name: string;
  type: "mobile" | "bank";
  wording: "Send Money";
  number: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  instructions: string[];
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
    routingNumber: string;
  };
};

export const PAYMENT_CHANNELS: Record<MobileBankingChannelId, PaymentChannelConfig> = {
  bKash: {
    id: "bKash",
    name: "bKash",
    type: "mobile",
    wording: "Send Money",
    number: process.env.NEXT_PUBLIC_BKASH_PERSONAL_NUMBER || "01700000000",
    badgeBg: "bg-[#e2136e]/10 text-[#e2136e]",
    badgeText: "#e2136e",
    accentColor: "#e2136e",
    instructions: [
      "Open your bKash app.",
      "Choose 'Send Money'.",
      "Enter the personal number shown above.",
      "Enter the exact payable amount.",
      "Complete the transaction.",
      "Copy the successful Transaction ID.",
      "Paste the Transaction ID below.",
    ],
  },
  Nagad: {
    id: "Nagad",
    name: "Nagad",
    type: "mobile",
    wording: "Send Money",
    number: process.env.NEXT_PUBLIC_NAGAD_PERSONAL_NUMBER || "01700000000",
    badgeBg: "bg-[#f7941d]/10 text-[#f7941d]",
    badgeText: "#f7941d",
    accentColor: "#f7941d",
    instructions: [
      "Open your Nagad app.",
      "Choose 'Send Money'.",
      "Enter the personal number shown above.",
      "Enter the exact payable amount.",
      "Complete the transaction.",
      "Copy the successful Transaction ID.",
      "Paste the Transaction ID below.",
    ],
  },
  Rocket: {
    id: "Rocket",
    name: "Rocket",
    type: "mobile",
    wording: "Send Money",
    number: process.env.NEXT_PUBLIC_ROCKET_PERSONAL_NUMBER || "01700000000",
    badgeBg: "bg-[#8c3494]/10 text-[#8c3494]",
    badgeText: "#8c3494",
    accentColor: "#8c3494",
    instructions: [
      "Open your Rocket app.",
      "Choose 'Send Money'.",
      "Enter the personal number shown above.",
      "Enter the exact payable amount.",
      "Complete the transaction.",
      "Copy the successful Transaction ID.",
      "Paste the Transaction ID below.",
    ],
  },
  "Bank Transfer": {
    id: "Bank Transfer",
    name: "Bank Transfer",
    type: "bank",
    wording: "Send Money",
    number: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "2050392010001",
    badgeBg: "bg-[#1E5A3A]/10 text-[#1E5A3A]",
    badgeText: "#1E5A3A",
    accentColor: "#1E5A3A",
    instructions: [
      "Transfer funds using Internet Banking, app, or bank branch.",
      "Enter the bank account details shown above.",
      "Use your Name or Phone number as payment reference.",
      "Copy or note down the Bank Deposit / Transfer Reference.",
      "Paste the Reference Number below.",
    ],
    bankDetails: {
      bankName: process.env.NEXT_PUBLIC_BANK_NAME || "Brac Bank PLC",
      accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "Pick Plant BD Ltd.",
      accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "2050392010001",
      branch: process.env.NEXT_PUBLIC_BANK_BRANCH || "Banani Branch, Dhaka",
      routingNumber: process.env.NEXT_PUBLIC_BANK_ROUTING || "060260481",
    },
  },
};
