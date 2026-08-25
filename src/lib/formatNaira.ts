/**
 * Formats a minor-unit (kobo) amount as a Nigerian Naira display string.
 * All money in this app is stored as whole kobo — never pass a float here.
 */
export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: kobo % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(kobo / 100);
}
