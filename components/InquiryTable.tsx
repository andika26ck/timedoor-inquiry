"use client"
import * as React from "react"
import type { Inquiry, Options } from "../lib/types"
import StatusChip from "./StatusChip"
import QuickAddRow, { type Draft } from "./QuickAddRow"
import RowActionsMenu from "./RowActionsMenu"
import { formatDate } from "../lib/format"
import { IconDots, IconPlus } from "./Icons"

const COLUMNS = [
  "Branch Name",
  "Student Name",
  "Parent Name",
  "Source",
  "Country",
  "Phone Code",
  "Phone Number",
  "Inquiry Date",
  "Social Media",
  "Contact Note",
  "Status",
  "Action",
]

export default function InquiryTable({
  inquiries,
  options,
  showQuickAdd,
  existingPhones,
  openMenuId,
  onToggleMenu,
  onOpenDetail,
  onEdit,
  onChangeStatus,
  onRegister,
  onDelete,
  onQuickSave,
  onQuickCancel,
}: {
  inquiries: Inquiry[]
  options: Options
  showQuickAdd: boolean
  existingPhones: string[]
  openMenuId: string | null
  onToggleMenu: (id: string) => void
  onOpenDetail: (inq: Inquiry) => void
  onEdit: (inq: Inquiry) => void
  onChangeStatus: (inq: Inquiry) => void
  onRegister: (inq: Inquiry) => void
  onDelete: (inq: Inquiry) => void
  onQuickSave: (draft: Draft) => void
  onQuickCancel: () => void
}) {
  const flagOf = (country: string) =>
    options.countries.find((c) => c.name === country)?.flag ?? ""

  return (
    <div className="table-card">
      <div className="qa-hint">
        <span className="plus">
          <IconPlus size={14} strokeWidth={2.6} />
        </span>
        <span>
          Quick add is right in the table — fill the highlighted row, then press
          <kbd style={{ margin: "0 4px" }}>Enter</kbd> to save. Need every field? Use
          <b style={{ color: "#15803d" }}> + New Inquiry</b> for the full form.
        </span>
      </div>
      <div className="table-scroll">
        <table className="inq">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c} className={c === "Action" ? "td-action" : undefined}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showQuickAdd && (
              <QuickAddRow
                options={options}
                existingPhones={existingPhones}
                onSave={onQuickSave}
                onCancel={onQuickCancel}
              />
            )}
            {inquiries.map((inq) => (
              <tr key={inq.id}>
                <td>{inq.branch}</td>
                <td>
                  <a
                    className="cell-strong"
                    style={{ cursor: "pointer", color: "#15803d" }}
                    onClick={() => onOpenDetail(inq)}
                  >
                    {inq.studentName}
                  </a>
                </td>
                <td>{inq.parentName}</td>
                <td>{inq.source}</td>
                <td>
                  <span className="flag">{flagOf(inq.country)}</span>
                  {inq.country}
                </td>
                <td>{inq.phoneCode}</td>
                <td>{inq.phoneNumber}</td>
                <td>{formatDate(inq.inquiryDate)}</td>
                <td className={inq.socialMedia ? undefined : "cell-muted"}>
                  {inq.socialMedia || "\u2014"}
                </td>
                <td className={inq.contactNote ? undefined : "cell-muted"}>
                  {inq.contactNote || "\u2014"}
                </td>
                <td>
                  <StatusChip
                    stage={inq.stage}
                    reasonCode={inq.reasonCode}
                    clickable
                    showCaret
                    onClick={() => onChangeStatus(inq)}
                  />
                </td>
                <td className="td-action">
                  <button
                    className="iconbtn dots"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleMenu(inq.id)
                    }}
                    aria-label="Row actions"
                  >
                    <IconDots size={18} />
                  </button>
                  {openMenuId === inq.id && (
                    <RowActionsMenu
                      onView={() => onOpenDetail(inq)}
                      onEdit={() => onEdit(inq)}
                      onChangeStatus={() => onChangeStatus(inq)}
                      onRegister={() => onRegister(inq)}
                      onDelete={() => onDelete(inq)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
