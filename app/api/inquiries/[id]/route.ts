import { NextResponse } from "next/server"
import { updateStatus, updateInquiry, deleteInquiry } from "../../../../lib/db"
import type { StageKey } from "../../../../lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()

  // Full-details edit (from the Edit Inquiry drawer). Distinguished by mode.
  if (body?.mode === "edit") {
    const result = await updateInquiry(params.id, {
      branch: body.branch,
      studentName: body.studentName ?? "",
      parentName: body.parentName ?? "",
      source: body.source ?? "",
      country: body.country ?? "",
      phoneCode: body.phoneCode ?? "",
      phoneNumber: body.phoneNumber ?? "",
      socialMedia: body.socialMedia ?? "",
      contactNote: body.contactNote ?? "",
      inquiryDate: body.inquiryDate ?? "",
    })
    if (!result.ok) {
      return NextResponse.json(result, { status: result.error === "Inquiry not found" ? 404 : 400 })
    }
    return NextResponse.json(result)
  }

  if (!body?.stage) {
    return NextResponse.json({ ok: false, error: "Missing stage" }, { status: 400 })
  }
  const result = await updateStatus(
    params.id,
    body.stage as StageKey,
    body.reasonCode ?? null,
    body.note ?? "",
    body.by ?? "Andika"
  )
  if (!result.ok) return NextResponse.json(result, { status: 404 })
  return NextResponse.json(result)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const result = await deleteInquiry(params.id)
  return NextResponse.json(result)
}
