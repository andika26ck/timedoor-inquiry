import type { ImportRow, HeaderCheck, RowStatus, CountryOption } from "./types"

// The exact columns the upload template must contain (order-independent).
// Branch is chosen in the wizard, not in the file — same as the real CMS.
export const TEMPLATE_COLUMNS = [
  "Student Name",
  "Parent Name",
  "Source",
  "Phone Code",
  "Phone Number",
  "Social Media Username",
  "Inquiry Date",
  "Country",
  "Contact Note",
] as const

export function templateCsv(): string {
  return TEMPLATE_COLUMNS.join(",") + "\n"
}

function norm(s: string): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ")
}

// Compare uploaded headers against the template. Missing required columns
// make the file invalid; unknown extra columns are reported but not fatal.
export function validateHeaders(headers: string[]): HeaderCheck {
  const have = new Set(headers.map(norm))
  const want = TEMPLATE_COLUMNS.map(norm)
  const missing = TEMPLATE_COLUMNS.filter((c, i) => !have.has(want[i]))
  const wantSet = new Set(want)
  const extra = headers.filter((h) => h.trim() !== "" && !wantSet.has(norm(h)))
  return { ok: missing.length === 0, missing, extra }
}

// Minimal, dependency-free CSV parser (handles quoted fields and commas).
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const lines: string[][] = []
  let field = ""
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      row.push(field)
      field = ""
    } else if (ch === "\n") {
      row.push(field)
      lines.push(row)
      row = []
      field = ""
    } else {
      field += ch
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    lines.push(row)
  }
  const nonEmpty = lines.filter((r) => r.some((c) => c.trim() !== ""))
  if (nonEmpty.length === 0) return { headers: [], rows: [] }
  const headers = nonEmpty[0].map((h) => h.trim())
  const rows = nonEmpty.slice(1).map((r) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? "").trim()
    })
    return obj
  })
  return { headers, rows }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false
  const d = new Date(s + "T00:00:00")
  return !isNaN(d.getTime())
}

function digitsOnly(s: string): string {
  return (s || "").replace(/\D/g, "")
}

function phoneKey(code: string, number: string): string {
  return digitsOnly(code) + "|" + digitsOnly(number).replace(/^0+/, "")
}

export interface ValidateCtx {
  existingPhones: Set<string> // phone keys already in the database
  sources: string[]
  countries: CountryOption[]
}

function pick(row: Record<string, string>, col: string): string {
  // tolerant lookup by normalized header name
  if (row[col] != null) return String(row[col]).trim()
  const target = norm(col)
  for (const k of Object.keys(row)) {
    if (norm(k) === target) return String(row[k]).trim()
  }
  return ""
}

export function validateRows(
  rawRows: Record<string, string>[],
  ctx: ValidateCtx
): ImportRow[] {
  const sourceSet = new Set(ctx.sources.map(norm))
  const countryByName = new Map(ctx.countries.map((c) => [norm(c.name), c]))
  const seenInFile = new Map<string, number>()

  return rawRows.map((raw, index) => {
    const errors: string[] = []
    const warns: string[] = []

    const studentName = pick(raw, "Student Name")
    const parentName = pick(raw, "Parent Name")
    const source = pick(raw, "Source")
    let country = pick(raw, "Country")
    let phoneCode = pick(raw, "Phone Code")
    const phoneNumber = pick(raw, "Phone Number")
    const socialMedia = pick(raw, "Social Media Username")
    const contactNote = pick(raw, "Contact Note")
    let inquiryDate = pick(raw, "Inquiry Date")

    if (!studentName) errors.push("Student name required")
    if (!parentName) errors.push("Parent name required")

    if (!source) errors.push("Source required")
    else if (!sourceSet.has(norm(source))) warns.push(`Unknown source "${source}"`)

    if (!country) {
      errors.push("Country required")
    } else {
      const match = countryByName.get(norm(country))
      if (!match) {
        errors.push(`Unknown country "${country}"`)
      } else {
        country = match.name
        if (!phoneCode) phoneCode = match.phoneCode
      }
    }

    if (!phoneNumber) {
      errors.push("Phone number required")
    } else if (digitsOnly(phoneNumber).length < 6) {
      errors.push("Phone number invalid")
    } else {
      const key = phoneKey(phoneCode, phoneNumber)
      if (ctx.existingPhones.has(key)) {
        errors.push("Phone already exists")
      } else if (seenInFile.has(key)) {
        errors.push(`Duplicate phone (row ${seenInFile.get(key)! + 1} in file)`)
      } else {
        seenInFile.set(key, index)
      }
    }

    if (!inquiryDate) {
      warns.push("Inquiry date empty")
    } else if (!isValidDate(inquiryDate)) {
      const d = new Date(inquiryDate)
      if (!isNaN(d.getTime())) {
        inquiryDate = d.toISOString().slice(0, 10)
        warns.push("Date reformatted to YYYY-MM-DD")
      } else {
        errors.push("Invalid date format (use YYYY-MM-DD)")
      }
    }

    const rowStatus: RowStatus = errors.length ? "err" : warns.length ? "warn" : "ok"
    const issues = [...errors, ...warns]

    return {
      id: "imp-" + (index + 1),
      studentName,
      parentName,
      source,
      country,
      phoneCode,
      phoneNumber,
      socialMedia,
      contactNote,
      inquiryDate,
      rowStatus,
      issue: issues.join("; "),
      issues,
    }
  })
}

export function countRows(rows: ImportRow[]) {
  return {
    total: rows.length,
    ok: rows.filter((r) => r.rowStatus === "ok").length,
    warn: rows.filter((r) => r.rowStatus === "warn").length,
    err: rows.filter((r) => r.rowStatus === "err").length,
  }
}
