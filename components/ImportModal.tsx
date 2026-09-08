"use client"
import * as React from "react"
import type { ImportRow, RowStatus, Options } from "../lib/types"
import { formatDate } from "../lib/format"
import {
  IconX,
  IconCheck,
  IconAlert,
  IconInfo,
  IconDownload,
  IconUpload,
  IconFile,
} from "./Icons"

const STEPS = ["Download Template", "Upload File", "Preview & Edit", "Confirm Import"]

function RowStat({ status }: { status: RowStatus }) {
  if (status === "ok")
    return (
      <span className="rowstat ok">
        <IconCheck size={14} /> Ready
      </span>
    )
  if (status === "warn")
    return (
      <span className="rowstat warn">
        <IconInfo size={14} /> Warning
      </span>
    )
  return (
    <span className="rowstat err">
      <IconAlert size={14} /> Error
    </span>
  )
}

export default function ImportModal({
  rows,
  options,
  onClose,
  onImport,
}: {
  rows: ImportRow[]
  options: Options
  onClose: () => void
  onImport: (rows: ImportRow[]) => void
}) {
  const [filter, setFilter] = React.useState<"all" | "warn" | "err">("all")
  const [selected, setSelected] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const r of rows) init[r.id] = r.rowStatus !== "err"
    return init
  })

  const counts = {
    total: rows.length,
    ok: rows.filter((r) => r.rowStatus === "ok").length,
    warn: rows.filter((r) => r.rowStatus === "warn").length,
    err: rows.filter((r) => r.rowStatus === "err").length,
  }

  const visible = rows.filter((r) => {
    if (filter === "all") return true
    return r.rowStatus === filter
  })

  const selectedCount = rows.filter((r) => selected[r.id]).length

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }))
  }

  return (
    <div className="overlay center" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Import Inquiries</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>

        <div className="stepper">
          {STEPS.map((label, i) => {
            const state = i < 2 ? "done" : i === 2 ? "active" : ""
            return (
              <React.Fragment key={label}>
                <div className={"step " + state}>
                  <span className="num">{state === "done" ? "\u2713" : i + 1}</span>
                  {label}
                </div>
                {i < STEPS.length - 1 && <span className="step-sep" />}
              </React.Fragment>
            )
          })}
        </div>

        <div className="summary-bar">
          <span className="summary-total">
            <IconFile size={15} /> data-inquiry.xlsx · {counts.total} rows
          </span>
          <span className="pill-count">
            <span className="dotc" style={{ background: "#22c55e" }} /> {counts.ok} ready
          </span>
          <span className="pill-count">
            <span className="dotc" style={{ background: "#f59e0b" }} /> {counts.warn} warnings
          </span>
          <span className="pill-count">
            <span className="dotc" style={{ background: "#ef4444" }} /> {counts.err} errors
          </span>
          <div className="filter-chips">
            <button className={"fchip" + (filter === "all" ? " active" : "")} onClick={() => setFilter("all")}>
              All
            </button>
            <button className={"fchip" + (filter === "warn" ? " active" : "")} onClick={() => setFilter("warn")}>
              Warnings
            </button>
            <button className={"fchip" + (filter === "err" ? " active" : "")} onClick={() => setFilter("err")}>
              Errors
            </button>
          </div>
        </div>

        <div className="modal-body">
          <table className="preview">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Status</th>
                <th>Student Name</th>
                <th>Parent Name</th>
                <th>Source</th>
                <th>Country</th>
                <th>Phone</th>
                <th>Inquiry Date</th>
                <th>Issue</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className={r.rowStatus === "err" ? "row-err" : r.rowStatus === "warn" ? "row-warn" : ""}>
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={!!selected[r.id]}
                      onChange={() => toggle(r.id)}
                    />
                  </td>
                  <td><RowStat status={r.rowStatus} /></td>
                  <td>
                    <input
                      className={"cell-input" + (r.rowStatus === "err" && !r.studentName ? " editing" : "")}
                      defaultValue={r.studentName}
                      placeholder={!r.studentName ? "Required" : ""}
                    />
                  </td>
                  <td><input className="cell-input" defaultValue={r.parentName} /></td>
                  <td><input className="cell-input" defaultValue={r.source} /></td>
                  <td><input className="cell-input" defaultValue={r.country} /></td>
                  <td>
                    <input
                      className={"cell-input" + (r.issue.toLowerCase().includes("phone") ? " editing" : "")}
                      defaultValue={r.phoneCode + " " + r.phoneNumber}
                    />
                  </td>
                  <td>
                    <input
                      className={"cell-input" + (!r.inquiryDate ? " editing" : "")}
                      defaultValue={r.inquiryDate}
                      placeholder={!r.inquiryDate ? "YYYY-MM-DD" : ""}
                    />
                  </td>
                  <td>
                    <span className={"issue-text " + r.rowStatus}>
                      {r.issue || "\u2014"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost left">
            <IconDownload size={16} /> Download error report
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={selectedCount === 0}
            onClick={() => onImport(rows.filter((r) => selected[r.id]))}
          >
            <IconUpload size={16} /> Import {selectedCount} selected
          </button>
        </div>
      </div>
    </div>
  )
}
