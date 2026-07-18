export function getSafeCallbackUrl(value: unknown, fallback = "/account") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//"))
    return fallback;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}
