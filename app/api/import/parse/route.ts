import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import {
  validateHeaders,
  validateRows,
  parseCsv,
  countRows,
  TEMPLATE_COLUMNS,
} from "../../../../lib/importValidation"
import { getPhoneKeys } from "../../../../lib/db"
import optionsData from "../../../../data/options.json"
import type { Options, ParseResult } from "../../../../lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const options = optionsData as Options

function cellToString(v: unknown): string {
  if (v == null) return ""
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).trim()
}

function readSpreadsheet(buf: Buffer, name: string): { headers: string[]; rows: Record<string, string>[] } {
  const isCsv = /\.csv$/i.test(name)
  if (isCsv) return parseCsv(buf.toString("utf8"))
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", blankrows: false })
  if (aoa.length === 0) return { headers: [], rows: [] }
  const headers = (aoa[0] as unknown[]).map((h) => cellToString(h))
  const rows = aoa.slice(1).map((r) => {
    const arr = r as unknown[]
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => (obj[h] = cellToString(arr[i])))
    return obj
  })
  return { headers, rows }
}

export async function POST(req: Request) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: "Expected multipart form-data" }, { status: 400 })
  }
  const file = form.get("file")
  if (!file || typeof file === "string") {
    return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 })
  }
  const fileName = (file as File).name || "upload"
  const buf = Buffer.from(await (file as File).arrayBuffer())

  let parsed: { headers: string[]; rows: Record<string, string>[] }
  try {
    parsed = readSpreadsheet(buf, fileName)
  } catch {
    return NextResponse.json({
      ok: false,
      templateError: "Could not read this file. Please upload a .xlsx or .csv file based on the template.",
      header: { ok: false, missing: [...TEMPLATE_COLUMNS], extra: [] },
      rows: [],
      counts: { total: 0, ok: 0, warn: 0, err: 0 },
      fileName,
    } satisfies ParseResult)
  }

  const header = validateHeaders(parsed.headers)
  if (!header.ok) {
    const parts: string[] = []
    if (header.missing.length) parts.push(`Missing columns: ${header.missing.join(", ")}`)
    if (header.extra.length) parts.push(`Unexpected columns: ${header.extra.join(", ")}`)
    const result: ParseResult = {
      ok: false,
      templateError:
        "This file does not match the inquiry template. " +
        parts.join(". ") +
        ". Download the template and try again.",
      header,
      rows: [],
      counts: { total: 0, ok: 0, warn: 0, err: 0 },
      fileName,
    }
    return NextResponse.json(result)
  }

  const existingPhones = new Set(await getPhoneKeys())
  const rows = validateRows(parsed.rows, {
    existingPhones,
    sources: options.sources,
    countries: options.countries,
  })
  const result: ParseResult = {
    ok: true,
    header,
    rows,
    counts: countRows(rows),
    fileName,
  }
  return NextResponse.json(result)
}
