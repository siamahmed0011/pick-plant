import {
  Boxes,
  LayoutDashboard,
  PackageSearch,
  Settings,
  ShoppingBag,
  Star,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavigationItem = {
  label: string;
  href: string;
  Icon: LucideIcon;
};

export const adminNavigation: AdminNavigationItem[] = [
  { label: "Dashboard", href: "/admin", Icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", Icon: PackageSearch },
  { label: "Categories", href: "/admin/categories", Icon: Tags },
  { label: "Orders", href: "/admin/orders", Icon: ShoppingBag },
  { label: "Customers", href: "/admin/customers", Icon: Users },
  { label: "Reviews", href: "/admin/reviews", Icon: Star },
  { label: "Inventory", href: "/admin/inventory", Icon: Boxes },
  { label: "Settings", href: "/admin/settings", Icon: Settings },
];

export function isAdminNavigationActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveAdminNavigation(pathname: string) {
  return adminNavigation.find((item) => isAdminNavigationActive(pathname, item.href));
}
