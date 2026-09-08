"use client"
import * as React from "react"
import type { Options } from "../lib/types"
import { normalizePhone } from "../lib/phone"
import StatusChip from "./StatusChip"
import { IconCheck, IconX, IconAlert } from "./Icons"

type Draft = {
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

function emptyDraft(options: Options): Draft {
  const c = options.countries[0]
  return {
    branch: options.branches[0] ?? "",
    studentName: "",
    parentName: "",
    source: "",
    country: c?.name ?? "",
    phoneCode: c?.phoneCode ?? "",
    phoneNumber: "",
    inquiryDate: "",
    socialMedia: "",
    contactNote: "",
  }
}

export default function QuickAddRow({
  options,
  existingPhones,
  initialDraft,
  onSave,
  onCancel,
}: {
  options: Options
  existingPhones: string[]
  initialDraft?: Partial<Draft>
  onSave: (draft: Draft) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = React.useState<Draft>({
    ...emptyDraft(options),
    ...initialDraft,
  })

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function onCountry(name: string) {
    const c = options.countries.find((x) => x.name === name)
    setDraft((d) => ({ ...d, country: name, phoneCode: c?.phoneCode ?? d.phoneCode }))
  }

  const dup =
    draft.phoneNumber.trim().length > 0 &&
    existingPhones.includes(normalizePhone(draft.phoneCode, draft.phoneNumber))

  const requiredOk = Boolean(
    draft.branch &&
      draft.studentName.trim() &&
      draft.parentName.trim() &&
      draft.source &&
      draft.country &&
      draft.phoneCode &&
      draft.phoneNumber.trim() &&
      draft.inquiryDate &&
      !dup
  )

  function submit() {
    if (!requiredOk) return
    onSave(draft)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") submit()
    if (e.key === "Escape") onCancel()
  }

  const flag = options.countries.find((c) => c.name === draft.country)?.flag ?? ""

  return (
    <tr className="quick-add" onKeyDown={onKeyDown}>
      <td>
        <select className="qa-select" value={draft.branch} onChange={(e) => set("branch", e.target.value)}>
          {options.branches.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </td>
      <td>
        <input
          className="qa-input"
          placeholder="Student name *"
          value={draft.studentName}
          onChange={(e) => set("studentName", e.target.value)}
        />
      </td>
      <td>
        <input
          className="qa-input"
          placeholder="Parent name *"
          value={draft.parentName}
          onChange={(e) => set("parentName", e.target.value)}
        />
      </td>
      <td>
        <select className="qa-select" value={draft.source} onChange={(e) => set("source", e.target.value)}>
          <option value="">Source *</option>
          {options.sources.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </td>
      <td>
        <select className="qa-select" value={draft.country} onChange={(e) => onCountry(e.target.value)}>
          {options.countries.map((c) => (
            <option key={c.name} value={c.name}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </td>
      <td>
        <span className="cell-strong">
          <span className="flag">{flag}</span>
          {draft.phoneCode}
        </span>
      </td>
      <td>
        <div className="qa-phone-wrap">
          <input
            className="qa-input"
            placeholder="Phone *"
            value={draft.phoneNumber}
            onChange={(e) => set("phoneNumber", e.target.value)}
            style={dup ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239,68,68,.14)" } : undefined}
          />
          {dup && (
            <div className="dup-warn">
              <IconAlert size={16} />
              <span>This phone number already exists for another inquiry.</span>
            </div>
          )}
        </div>
      </td>
      <td>
        <input
          className="qa-input"
          type="date"
          value={draft.inquiryDate}
          onChange={(e) => set("inquiryDate", e.target.value)}
        />
      </td>
      <td>
        <input
          className="qa-input"
          placeholder="—"
          value={draft.socialMedia}
          onChange={(e) => set("socialMedia", e.target.value)}
        />
      </td>
      <td>
        <input
          className="qa-input"
          placeholder="—"
          value={draft.contactNote}
          onChange={(e) => set("contactNote", e.target.value)}
        />
      </td>
      <td>
        <StatusChip stage="new" />
      </td>
      <td className="td-action">
        <div className="qa-actions">
          <button className="iconbtn ok" onClick={submit} disabled={!requiredOk} aria-label="Save" title="Save (Enter)">
            <IconCheck size={17} />
          </button>
          <button className="iconbtn" onClick={onCancel} aria-label="Cancel" title="Cancel (Esc)">
            <IconX size={17} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export type { Draft }
