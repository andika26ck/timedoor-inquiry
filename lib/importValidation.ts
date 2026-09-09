import type { ImportRow, HeaderCheck, RowStatus, CountryOption, FieldIssue } from "./types"

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

// Maps a template column header to the internal field key used for per-cell
// error highlighting in the preview grid.
export const COLUMN_TO_FIELD: Record<string, string> = {
  "Student Name": "student",
  "Parent Name": "parent",
  Source: "source",
  Country: "country",
  "Phone Code": "phone",
  "Phone Number": "phone",
  "Inquiry Date": "date",
  "Social Media Username": "socialMedia",
  "Contact Note": "contactNote",
}

export function templateCsv(): string {
  return TEMPLATE_COLUMNS.join(",") + "\n"
}

function norm(s: string): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ")
}

// Compare uploaded headers against the template. Missing required columns
// are reported so the UI can flag them; unknown extra columns are reported
// but never fatal. Nothing here blocks the import on its own — the parse
// route decides how to surface this to the admin.
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
    // Per-field issues let the UI highlight the exact cell that is wrong.
    const fieldIssues: Record<string, FieldIssue> = {}
    const flag = (field: string, level: "err" | "warn", msg: string) => {
      const cur = fieldIssues[field]
      // errors win over warnings; otherwise keep the first message for a field
      if (!cur || (cur.level === "warn" && level === "err")) {
        fieldIssues[field] = { level, msg }
      }
    }

    const studentName = pick(raw, "Student Name")
    const parentName = pick(raw, "Parent Name")
    const source = pick(raw, "Source")
    let country = pick(raw, "Country")
    let phoneCode = pick(raw, "Phone Code")
    const phoneNumber = pick(raw, "Phone Number")
    const socialMedia = pick(raw, "Social Media Username")
    const contactNote = pick(raw, "Contact Note")
    let inquiryDate = pick(raw, "Inquiry Date")

    if (!studentName) flag("student", "err", "Student name is required")
    if (!parentName) flag("parent", "err", "Parent name is required")

    if (!source) flag("source", "err", "Source is required")
    else if (!sourceSet.has(norm(source)))
      flag("source", "warn", `Unknown source "${source}" — will be saved as typed`)

    if (!country) {
      flag("country", "err", "Country is required")
    } else {
      const match = countryByName.get(norm(country))
      if (!match) {
        flag("country", "err", `Unknown country "${country}" — not in the allowed list`)
      } else {
        country = match.name
        if (!phoneCode) phoneCode = match.phoneCode
      }
    }

    if (!phoneNumber) {
      flag("phone", "err", "Phone number is required")
    } else if (digitsOnly(phoneNumber).length < 6) {
      flag("phone", "err", "Phone number looks too short (min 6 digits)")
    } else {
      const key = phoneKey(phoneCode, phoneNumber)
      if (ctx.existingPhones.has(key)) {
        flag("phone", "err", "This phone already exists in the database")
      } else if (seenInFile.has(key)) {
        flag("phone", "err", `Duplicate of row ${seenInFile.get(key)! + 2} in this file`)
      } else {
        seenInFile.set(key, index)
      }
    }

    if (!inquiryDate) {
      flag("date", "warn", "Inquiry date is empty")
    } else if (!isValidDate(inquiryDate)) {
      const d = new Date(inquiryDate)
      if (!isNaN(d.getTime())) {
        inquiryDate = d.toISOString().slice(0, 10)
        flag("date", "warn", "Date reformatted to YYYY-MM-DD")
      } else {
        flag("date", "err", "Invalid date — use format YYYY-MM-DD")
      }
    }

    const levels = Object.values(fieldIssues).map((f) => f.level)
    const rowStatus: RowStatus = levels.includes("err")
      ? "err"
      : levels.length
      ? "warn"
      : "ok"
    const issues = Object.values(fieldIssues).map((f) => f.msg)

    return {
      id: "imp-" + (index + 1),
      sourceRow: index + 2, // +1 header row, +1 for 1-based spreadsheet numbering
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
      fieldIssues,
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
