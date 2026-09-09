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

// A blocking error is returned only when we genuinely cannot show a useful
// preview: the file is unreadable, empty, has no data rows, or shares no
// columns at all with the template. Any file that we CAN map to the template
// (even partially) is allowed through to the preview so the admin can see
// exactly which rows/cells are wrong.
function blocking(fileName: string, message: string, missing: string[]): ParseResult {
  return {
    ok: false,
    templateError: message,
    header: { ok: false, missing, extra: [] },
    rows: [],
    counts: { total: 0, ok: 0, warn: 0, err: 0 },
    fileName,
  }
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
    return NextResponse.json(
      blocking(
        fileName,
        "Could not read this file. Please upload a .xlsx or .csv file based on the template.",
        [...TEMPLATE_COLUMNS]
      )
    )
  }

  const header = validateHeaders(parsed.headers)

  // Nothing recognizable at all — almost certainly the wrong file.
  if (header.missing.length === TEMPLATE_COLUMNS.length) {
    return NextResponse.json(
      blocking(
        fileName,
        "This file doesn't look like the inquiry template — none of the expected columns were found. Make sure the first row contains the column headers, then try again.",
        header.missing
      )
    )
  }

  // Headers are recognizable but there are no data rows to review.
  if (parsed.rows.length === 0) {
    return NextResponse.json(
      blocking(
        fileName,
        "This file has the header row but no data rows underneath. Add at least one inquiry below the headers and upload again.",
        header.missing
      )
    )
  }

  // From here we ALWAYS return a preview, even if some columns are missing or
  // extra. Missing columns simply surface as per-cell errors the admin can fix
  // inline, and `header.missing` / `header.extra` are shown as a banner.
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
