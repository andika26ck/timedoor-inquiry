import { NextResponse } from "next/server"
import { importInquiries, type ImportRowInput } from "../../../../lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const body = await req.json()
  const branch: string = body?.branch
  const rows: ImportRowInput[] = body?.rows ?? []
  if (!branch) return NextResponse.json({ ok: false, error: "Branch is required" }, { status: 400 })
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ ok: false, error: "No rows to import" }, { status: 400 })
  }
  const result = await importInquiries(branch, rows)
  return NextResponse.json({ ok: true, ...result })
}
