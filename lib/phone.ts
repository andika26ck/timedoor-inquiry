// Normalize a phone number for duplicate detection: digits only, drop
// leading zeros so "081..." and "81..." are treated the same.
export function normalizePhone(code: string, number: string): string {
  const digits = (number || "").replace(/\D/g, "").replace(/^0+/, "")
  const cc = (code || "").replace(/\D/g, "")
  return cc + "|" + digits
}

export function isValidPhone(number: string): boolean {
  const digits = (number || "").replace(/\D/g, "")
  return digits.length >= 6
}
