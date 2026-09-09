export type StageKey =
  | "new"
  | "in_progress"
  | "waiting"
  | "registered"
  | "no_response"
  | "issue"
  | "disqualified"
  | "others"

export interface Reason {
  code: string
  label: string
  requiresNote?: boolean
}

export interface Stage {
  key: StageKey
  label: string
  code?: string | null
  color: string
  requiresReason: boolean
  active?: boolean
  won?: boolean
  autoReason?: string
  description?: string
}

export interface HistoryEntry {
  from: StageKey | null
  to: StageKey
  reasonCode?: string | null
  by: string
  at: string
  note?: string
}

export interface Inquiry {
  id: string
  branch: string
  studentName: string
  parentName: string
  source: string
  country: string
  phoneCode: string
  phoneNumber: string
  inquiryDate: string
  socialMedia?: string
  contactNote?: string
  stage: StageKey
  reasonCode?: string | null
  history: HistoryEntry[]
}

export interface CountryOption {
  name: string
  phoneCode: string
  iso: string
  flag: string
}

export interface Options {
  branches: string[]
  sources: string[]
  countries: CountryOption[]
}

export type RowStatus = "ok" | "warn" | "err"

export interface FieldIssue {
  level: "err" | "warn"
  msg: string
}

export interface ImportRow {
  id: string
  sourceRow: number // row number as it appears in the uploaded spreadsheet
  studentName: string
  parentName: string
  source: string
  country: string
  phoneCode: string
  phoneNumber: string
  socialMedia: string
  contactNote: string
  inquiryDate: string
  rowStatus: RowStatus
  issue: string
  issues: string[]
  // Per-cell issues keyed by field: student, parent, source, country, phone, date
  fieldIssues: Record<string, FieldIssue>
}

export interface HeaderCheck {
  ok: boolean
  missing: string[]
  extra: string[]
}

export interface ParseResult {
  ok: boolean
  templateError?: string
  header: HeaderCheck
  rows: ImportRow[]
  counts: { total: number; ok: number; warn: number; err: number }
  fileName: string
}
