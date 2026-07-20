import { randomBytes } from "crypto";

/**
 * Generates a unique, readable order number.
 * Format: PP-YYYYMMDD-HEX6 (e.g. PP-20260720-8A2F3D)
 */
export function generateOrderNumber(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hex = randomBytes(3).toString("hex").toUpperCase();
  return `PP-${year}${month}${day}-${hex}`;
}
