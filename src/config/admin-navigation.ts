export const adminNavigation = [
  "Plants",
  "Categories",
  "Orders",
  "Customers",
  "Inventory",
  "Coupons",
  "Blogs",
  "Reviews",
  "Media",
  "Settings",
].map((label) => ({ label, href: `/admin/${label.toLowerCase()}` }));
