import { NextResponse } from "next/server"
import { listInquiries, createInquiry } from "../../../lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const inquiries = await listInquiries()
  return NextResponse.json({ inquiries })
}

export async function POST(req: Request) {
  const body = await req.json()
  const required = ["branch", "studentName", "parentName", "source", "country", "phoneCode", "phoneNumber", "inquiryDate"]
  for (const f of required) {
    if (!body?.[f]) return NextResponse.json({ ok: false, error: `Missing field: ${f}` }, { status: 400 })
  }
  const result = await createInquiry({
    branch: body.branch,
    studentName: body.studentName,
    parentName: body.parentName,
    source: body.source,
    country: body.country,
    phoneCode: body.phoneCode,
    phoneNumber: body.phoneNumber,
    socialMedia: body.socialMedia ?? "",
    contactNote: body.contactNote ?? "",
    inquiryDate: body.inquiryDate,
  })
  if (!result.ok) return NextResponse.json(result, { status: 409 })
  return NextResponse.json(result, { status: 201 })
}
