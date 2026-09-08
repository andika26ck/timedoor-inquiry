const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export function formatDate(iso: string): string {
  if (!iso) return "\u2014"
  const datePart = iso.split("T")[0]
  const [y, m, d] = datePart.split("-").map((n) => parseInt(n, 10))
  if (!y || !m || !d) return iso
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`
}

export function formatDateTime(iso: string): string {
  if (!iso) return "\u2014"
  const [datePart, timeRest] = iso.split("T")
  const date = formatDate(datePart)
  if (!timeRest) return date
  const hhmm = timeRest.slice(0, 5)
  return `${date}, ${hhmm}`
}
