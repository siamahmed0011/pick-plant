/**
 * GA4 / GTM Analytics Utilities for Pick Plant
 */

export type AddToCartItemInput = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
};

export type GA4AddToCartPayload = {
  event: "add_to_cart";
  ecommerce: {
    currency: "BDT";
    value: number;
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity: number;
      item_category?: string;
    }>;
  };
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Pushes a GA4-compliant `add_to_cart` event to `window.dataLayer`.
 * Safe for Next.js SSR.
 */
export function trackAddToCart(item: AddToCartItemInput): void {
  if (typeof window === "undefined") return;

  const numericPrice = Number(item.price);
  const numericQuantity = Number(item.quantity);

  if (isNaN(numericPrice) || numericPrice <= 0 || isNaN(numericQuantity) || numericQuantity <= 0) {
    return;
  }

  const value = Number((numericPrice * numericQuantity).toFixed(2));

  window.dataLayer = window.dataLayer || [];
  // Clear the previous ecommerce object to prevent parameter contamination (GA4 best practice)
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: "add_to_cart",
    ecommerce: {
      currency: "BDT",
      value,
      items: [
        {
          item_id: String(item.id),
          item_name: item.name,
          price: numericPrice,
          quantity: numericQuantity,
          ...(item.category ? { item_category: item.category } : {}),
        },
      ],
    },
  });
}
