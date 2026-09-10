"use client"
import * as React from "react"
import type { Options, Inquiry } from "../lib/types"
import { normalizePhone, isValidPhone } from "../lib/phone"
import StatusChip from "./StatusChip"
import { IconX, IconAlert } from "./Icons"

type Form = {
  branch: string
  studentName: string
  parentName: string
  source: string
  country: string
  phoneCode: string
  phoneNumber: string
  inquiryDate: string
  socialMedia: string
  contactNote: string
}

export default function NewInquiryDrawer({
  options,
  existingPhones,
  onClose,
  onSave,
  onViewExisting,
  initialForm,
  initialTouched,
  mode = "create",
  ignorePhoneKey,
}: {
  options: Options
  existingPhones: string[]
  onClose: () => void
  onSave: (form: Form) => void
  onViewExisting?: () => void
  initialForm?: Partial<Form>
  initialTouched?: boolean
  mode?: "create" | "edit"
  // Normalized phone key of the record being edited, so it doesn't clash with itself.
  ignorePhoneKey?: string
}) {
  const isEdit = mode === "edit"
  const c0 = options.countries[0]
  const [form, setForm] = React.useState<Form>({
    branch: options.branches[0] ?? "",
    studentName: "",
    parentName: "",
    source: "",
    country: c0?.name ?? "",
    phoneCode: c0?.phoneCode ?? "",
    phoneNumber: "",
    inquiryDate: "",
    socialMedia: "",
    contactNote: "",
    ...initialForm,
  })
  const [touched, setTouched] = React.useState<Record<string, boolean>>(
    initialTouched
      ? { studentName: true, parentName: true, source: true, phoneNumber: true, inquiryDate: true }
      : {}
  )

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }
  function touch(key: string) {
    setTouched((t) => ({ ...t, [key]: true }))
  }
  function onCountry(name: string) {
    const c = options.countries.find((x) => x.name === name)
    setForm((f) => ({ ...f, country: name, phoneCode: c?.phoneCode ?? f.phoneCode }))
  }

  const dup =
    form.phoneNumber.trim().length > 0 &&
    normalizePhone(form.phoneCode, form.phoneNumber) !== ignorePhoneKey &&
    existingPhones.includes(normalizePhone(form.phoneCode, form.phoneNumber))
  const phoneInvalid = form.phoneNumber.trim().length > 0 && !isValidPhone(form.phoneNumber)

  const errors: Record<string, string> = {}
  if (!form.studentName.trim()) errors.studentName = "Student name is required"
  if (!form.parentName.trim()) errors.parentName = "Parent name is required"
  if (!form.source) errors.source = "Source is required"
  if (!form.phoneNumber.trim()) errors.phoneNumber = "Phone number is required"
  else if (phoneInvalid) errors.phoneNumber = "Phone number looks invalid"
  else if (dup) errors.phoneNumber = "This phone number already exists"
  if (!form.inquiryDate) errors.inquiryDate = "Inquiry date is required"

  const valid = Object.keys(errors).length === 0

  function submit() {
    if (!valid) {
      setTouched({
        studentName: true,
        parentName: true,
        source: true,
        phoneNumber: true,
        inquiryDate: true,
      })
      return
    }
    onSave(form)
  }

  const showErr = (k: string) => touched[k] && errors[k]

  return (
    <div className="overlay right" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="drawer-title">{isEdit ? "Edit Inquiry" : "New Inquiry"}</div>
            <div className="drawer-sub">{isEdit ? "Update this lead’s details" : "Add a lead to HQ Training"}</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="section-label">Basic Info</div>
          <div className="field">
            <label>Branch <span className="req">*</span></label>
            <select className="control" value={form.branch} onChange={(e) => set("branch", e.target.value)}>
              {options.branches.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className={"field" + (showErr("studentName") ? " error" : "")}>
            <label>Student Name <span className="req">*</span></label>
            <input
              className="control"
              value={form.studentName}
              onChange={(e) => set("studentName", e.target.value)}
              onBlur={() => touch("studentName")}
              placeholder="e.g. Adhwa"
            />
            {showErr("studentName") && (
              <div className="err-msg"><IconAlert size={13} /> {errors.studentName}</div>
            )}
          </div>
          <div className={"field" + (showErr("parentName") ? " error" : "")}>
            <label>Parent Name <span className="req">*</span></label>
            <input
              className="control"
              value={form.parentName}
              onChange={(e) => set("parentName", e.target.value)}
              onBlur={() => touch("parentName")}
              placeholder="e.g. Tammy"
            />
            {showErr("parentName") && (
              <div className="err-msg"><IconAlert size={13} /> {errors.parentName}</div>
            )}
          </div>

          <div className="section-label">Source &amp; Contact</div>
          <div className={"field" + (showErr("source") ? " error" : "")}>
            <label>Source <span className="req">*</span></label>
            <select
              className="control"
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              onBlur={() => touch("source")}
            >
              <option value="">Select source...</option>
              {options.sources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {showErr("source") && (
              <div className="err-msg"><IconAlert size={13} /> {errors.source}</div>
            )}
          </div>
          <div className="field">
            <label>Country <span className="req">*</span></label>
            <select className="control" value={form.country} onChange={(e) => onCountry(e.target.value)}>
              {options.countries.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.flag} {c.name} ({c.phoneCode})
                </option>
              ))}
            </select>
          </div>
          <div className={"field" + (showErr("phoneNumber") ? " error" : "")}>
            <label>Phone Number <span className="req">*</span></label>
            <div className="grid-2">
              <input className="control" value={form.phoneCode} readOnly aria-label="Phone code" />
              <input
                className="control"
                value={form.phoneNumber}
                onChange={(e) => set("phoneNumber", e.target.value)}
                onBlur={() => touch("phoneNumber")}
                placeholder="81213694239"
                inputMode="numeric"
              />
            </div>
            {showErr("phoneNumber") ? (
              <div className="err-msg">
                <IconAlert size={13} /> {errors.phoneNumber}
                {dup && onViewExisting && (
                  <span className="err-link" onClick={onViewExisting}>
                    View existing
                  </span>
                )}
              </div>
            ) : (
              <div className="hint">Phone number is the unique key — duplicates are blocked.</div>
            )}
          </div>

          <div className="section-label">Timing</div>
          <div className={"field" + (showErr("inquiryDate") ? " error" : "")}>
            <label>Inquiry Date <span className="req">*</span></label>
            <input
              className="control"
              type="date"
              value={form.inquiryDate}
              onChange={(e) => set("inquiryDate", e.target.value)}
              onBlur={() => touch("inquiryDate")}
            />
            {showErr("inquiryDate") && (
              <div className="err-msg"><IconAlert size={13} /> {errors.inquiryDate}</div>
            )}
          </div>

          <div className="section-label">Optional</div>
          <div className="field">
            <label>Social Media Username</label>
            <input
              className="control"
              value={form.socialMedia}
              onChange={(e) => set("socialMedia", e.target.value)}
              placeholder="@username"
            />
          </div>
          <div className="field">
            <label>Contact Note</label>
            <textarea
              className="control"
              value={form.contactNote}
              onChange={(e) => set("contactNote", e.target.value)}
              placeholder="Anything useful for follow-up..."
            />
          </div>

          {!isEdit && (
            <div className="field">
              <label>Initial Status</label>
              <div><StatusChip stage="new" /></div>
              <div className="hint">New inquiries always start as “New”.</div>
            </div>
          )}
        </div>

        <div className="drawer-foot">
          <span className="foot-hint">
            <span className="req">*</span> Required
          </span>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={!valid}>
            {isEdit ? "Save Changes" : "Save Inquiry"}
          </button>
        </div>
      </div>
    </div>
  )
}

export type { Form as NewInquiryForm }
