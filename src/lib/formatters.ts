const bnNumber = new Intl.NumberFormat("bn-BD");
export const formatCurrency = (value: number) => `৳ ${bnNumber.format(value)}`;
export const formatNumber = (value: number) => bnNumber.format(value);
export const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("bn-BD", { dateStyle: "long" }).format(new Date(value));
