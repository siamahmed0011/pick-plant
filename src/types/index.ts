export interface Category {
  id: string;
  name: string;
  bengaliName: string;
  slug: string;
  description: string;
  image: string;
  active: boolean;
}
export interface Product {
  id: string;
  name: string;
  bengaliName: string;
  slug: string;
  scientificName: string;
  shortDescription: string;
  regularPrice: number;
  salePrice?: number;
  stock: number;
  image: string;
  galleryImages?: string[];
  category: Category;
  lightRequirement: string;
  wateringFrequency: string;
  difficulty: "Easy" | "Medium" | "Hard";
  petFriendly: boolean;
  featured: boolean;
  published: boolean;
  indoorOutdoor?: "Indoor" | "Outdoor" | "Both";
  plantSize?: string;
  potSize?: string;
  temperature?: string;
  humidity?: string;
}
export interface NavigationItem {
  label: string;
  href: string;
  description?: string;
  children?: NavigationItem[];
}
export interface Order {
  id: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  total: number;
  createdAt: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
}
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  publishedAt: string;
}
export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}
export interface Testimonial {
  id: string;
  name: string;
  quote: string;
  location: string;
}
export interface ComboOffer {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  offerPrice: number;
  itemCount: number;
  image: string;
}
export interface Accessory {
  id: string;
  name: string;
  bengaliName: string;
  description: string;
  price: number;
  image: string;
  categorySlug: string;
}
export type { Category as CategoryType, Product as ProductType };
