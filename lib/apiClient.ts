import type { Inquiry, StageKey, ParseResult, ImportRow } from "./types"
import type { NewInquiryInput } from "./db"

async function jsonOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok && data?.ok !== true) {
    throw new Error(data?.error || `Request failed (${res.status})`)
  }
  return data
}

export async function fetchInquiries(): Promise<Inquiry[]> {
  const res = await fetch("/api/inquiries", { cache: "no-store" })
  const data = await jsonOrThrow(res)
  return data.inquiries as Inquiry[]
}

export async function createInquiryApi(
  input: NewInquiryInput
): Promise<{ ok: boolean; inquiry?: Inquiry; error?: string }> {
  const res = await fetch("/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  return res.json()
}

export async function updateStatusApi(
  id: string,
  stage: StageKey,
  reasonCode: string | null,
  note: string
): Promise<{ ok: boolean; inquiry?: Inquiry; error?: string }> {
  const res = await fetch(`/api/inquiries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage, reasonCode, note }),
  })
  return res.json()
}

export async function deleteInquiryApi(id: string): Promise<void> {
  await fetch(`/api/inquiries/${id}`, { method: "DELETE" })
}

export async function parseImportApi(file: File, branch: string): Promise<ParseResult> {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("branch", branch)
  const res = await fetch("/api/import/parse", { method: "POST", body: fd })
  return res.json()
}

export async function importInquiriesApi(
  branch: string,
  rows: ImportRow[]
): Promise<{ ok: boolean; imported: number; skipped: { studentName: string; reason: string }[] }> {
  const payload = rows.map((r) => ({
    studentName: r.studentName,
    parentName: r.parentName,
    source: r.source,
    country: r.country,
    phoneCode: r.phoneCode,
    phoneNumber: r.phoneNumber,
    socialMedia: r.socialMedia,
    contactNote: r.contactNote,
    inquiryDate: r.inquiryDate,
  }))
  const res = await fetch("/api/inquiries/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branch, rows: payload }),
  })
  return res.json()
}
