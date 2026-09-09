"use client"
import * as React from "react"
import type { ImportRow, RowStatus, Options, ParseResult } from "../lib/types"
import { validateRows, countRows, templateCsv, TEMPLATE_COLUMNS } from "../lib/importValidation"
import { parseImportApi, importInquiriesApi } from "../lib/apiClient"
import {
  IconX,
  IconCheck,
  IconAlert,
  IconInfo,
  IconDownload,
  IconUpload,
  IconFile,
} from "./Icons"

const STEPS = ["Download Template", "Select Branch", "Upload File", "Preview & Edit"]

type Raw = Record<string, string>

function toRaw(r: ImportRow): Raw {
  return {
    "Student Name": r.studentName,
    "Parent Name": r.parentName,
    Source: r.source,
    "Phone Code": r.phoneCode,
    "Phone Number": r.phoneNumber,
    "Social Media Username": r.socialMedia,
    "Inquiry Date": r.inquiryDate,
    Country: r.country,
    "Contact Note": r.contactNote,
  }
}

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
  options,
  existingPhones,
  onClose,
  onImported,
  // QA-only props to render a specific step statically
  initialStep,
  initialParse,
  initialBranch,
}: {
  options: Options
  existingPhones: string[]
  onClose: () => void
  onImported: (result: { imported: number; skipped: { studentName: string; reason: string }[] }) => void
  initialStep?: number
  initialParse?: ParseResult
  initialBranch?: string
}) {
  const [step, setStep] = React.useState(initialStep ?? 0)
  const [branch, setBranch] = React.useState(initialBranch ?? options.branches[0] ?? "")
  const [fileName, setFileName] = React.useState(initialParse?.fileName ?? "")
  const [parsing, setParsing] = React.useState(false)
  const [templateError, setTemplateError] = React.useState<string | null>(
    initialParse && !initialParse.ok ? initialParse.templateError ?? "Invalid template" : null
  )
  const [rawRows, setRawRows] = React.useState<Raw[]>(
    initialParse?.ok ? initialParse.rows.map(toRaw) : []
  )
  const [selected, setSelected] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    if (initialParse?.ok) for (const r of initialParse.rows) init[r.id] = r.rowStatus !== "err"
    return init
  })
  const [filter, setFilter] = React.useState<"all" | "warn" | "err">("all")
  const [dragging, setDragging] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const [result, setResult] = React.useState<{ imported: number; skipped: { studentName: string; reason: string }[] } | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const existingSet = React.useMemo(() => new Set(existingPhones), [existingPhones])

  // Live re-validation whenever rows are edited.
  const rows: ImportRow[] = React.useMemo(
    () =>
      validateRows(rawRows, {
        existingPhones: existingSet,
        sources: options.sources,
        countries: options.countries,
      }),
    [rawRows, existingSet, options]
  )

  React.useEffect(() => {
    // default-select every row that is not an error
    setSelected((prev) => {
      const next: Record<string, boolean> = {}
      for (const r of rows) next[r.id] = prev[r.id] ?? r.rowStatus !== "err"
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawRows.length])

  const counts = countRows(rows)
  const visible = rows.filter((r) => (filter === "all" ? true : r.rowStatus === filter))
  const selectedCount = rows.filter((r) => selected[r.id] && r.rowStatus !== "err").length

  function downloadTemplate() {
    if (typeof document === "undefined") return
    const blob = new Blob([templateCsv()], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "inquiry-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFile(file: File) {
    setFileName(file.name)
    setParsing(true)
    setTemplateError(null)
    try {
      const res = await parseImportApi(file, branch)
      if (!res.ok) {
        setTemplateError(res.templateError ?? "This file does not match the template.")
        setRawRows([])
        return
      }
      setRawRows(res.rows.map(toRaw))
      setStep(3)
    } catch (e) {
      setTemplateError("Failed to read the file. Please try again.")
    } finally {
      setParsing(false)
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  function editCell(id: string, col: string, value: string) {
    const idx = rows.findIndex((r) => r.id === id)
    if (idx < 0) return
    setRawRows((prev) => {
      const next = prev.slice()
      next[idx] = { ...next[idx], [col]: value }
      return next
    })
  }

  async function doImport() {
    const toImport = rows.filter((r) => selected[r.id] && r.rowStatus !== "err")
    if (toImport.length === 0) return
    setImporting(true)
    try {
      const res = await importInquiriesApi(branch, toImport)
      setResult({ imported: res.imported, skipped: res.skipped })
      onImported({ imported: res.imported, skipped: res.skipped })
    } finally {
      setImporting(false)
    }
  }

  const stepState = (i: number) => (i < step ? "done" : i === step ? "active" : "")

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
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className={"step " + stepState(i)}>
                <span className="num">{i < step ? "\u2713" : i + 1}</span>
                {label}
              </div>
              {i < STEPS.length - 1 && <span className="step-sep" />}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1 - Download Template */}
        {step === 0 && (
          <div className="wizard-body">
            <div className="tmpl-card">
              <div className="tmpl-head">
                <IconFile size={20} />
                <div>
                  <div className="tmpl-title">Download the inquiry template</div>
                  <div className="tmpl-sub">
                    Fill your data in this exact format, then upload it in step 3.
                  </div>
                </div>
                <button className="btn btn-outline" onClick={downloadTemplate}>
                  <IconDownload size={16} /> Download Template
                </button>
              </div>
              <div className="tmpl-cols">
                {TEMPLATE_COLUMNS.map((c) => (
                  <span key={c} className="tmpl-col">
                    {c}
                  </span>
                ))}
              </div>
              <div className="tmpl-note">
                Branch is chosen in the next step, so it is not a column in the file.
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 - Select Branch */}
        {step === 1 && (
          <div className="wizard-body">
            <label className="field-label">Select branch for this import</label>
            <select
              className="select branch-select"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            >
              {options.branches.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            <div className="tmpl-note">All rows in this file will be imported into this branch.</div>
          </div>
        )}

        {/* STEP 3 - Upload File */}
        {step === 2 && (
          <div className="wizard-body">
            <div
              className={"dropzone" + (dragging ? " drag" : "")}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: "none" }}
                onChange={onInputChange}
              />
              <div className="drop-ico">
                <IconUpload size={26} />
              </div>
              {parsing ? (
                <div className="drop-hint">Reading {fileName}…</div>
              ) : (
                <>
                  <div className="drop-hint">Tap here or drag a file filled with inquiry data</div>
                  <div className="drop-sub">Accepted: .xlsx or .csv (based on the template)</div>
                </>
              )}
              {fileName && !parsing && <div className="file-chip"><IconFile size={13} /> {fileName}</div>}
            </div>

            {templateError && (
              <div className="template-error">
                <div className="template-error-title">
                  <IconAlert size={16} /> File does not match the template
                </div>
                <div className="template-error-body">{templateError}</div>
                <button className="btn btn-ghost sm" onClick={() => setStep(0)}>
                  <IconDownload size={14} /> Go to template
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4 - Preview & Edit */}
        {step === 3 && !result && (
          <>
            <div className="summary-bar">
              <span className="summary-total">
                <IconFile size={15} /> {fileName || "upload"} · {counts.total} rows · {branch}
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
                {(["all", "warn", "err"] as const).map((f) => (
                  <button
                    key={f}
                    className={"fchip" + (filter === f ? " active" : "")}
                    onClick={() => setFilter(f)}
                  >
                    {f === "all" ? "All" : f === "warn" ? "Warnings" : "Errors"}
                  </button>
                ))}
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
                  {visible.map((r) => {
                    const bad = (kw: string) => r.rowStatus === "err" && r.issue.toLowerCase().includes(kw)
                    return (
                      <tr key={r.id} className={r.rowStatus === "err" ? "row-err" : r.rowStatus === "warn" ? "row-warn" : ""}>
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={!!selected[r.id] && r.rowStatus !== "err"}
                            disabled={r.rowStatus === "err"}
                            onChange={() => setSelected((s) => ({ ...s, [r.id]: !s[r.id] }))}
                          />
                        </td>
                        <td><RowStat status={r.rowStatus} /></td>
                        <td>
                          <input
                            className={"cell-input" + (bad("name") ? " editing" : "")}
                            value={r.studentName}
                            placeholder={!r.studentName ? "Required" : ""}
                            onChange={(e) => editCell(r.id, "Student Name", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="cell-input"
                            value={r.parentName}
                            onChange={(e) => editCell(r.id, "Parent Name", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="cell-input"
                            value={r.source}
                            onChange={(e) => editCell(r.id, "Source", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className={"cell-input" + (bad("country") ? " editing" : "")}
                            value={r.country}
                            onChange={(e) => editCell(r.id, "Country", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className={"cell-input" + (bad("phone") ? " editing" : "")}
                            value={r.phoneCode + " " + r.phoneNumber}
                            onChange={(e) => {
                              const v = e.target.value.trim()
                              const m = v.match(/^(\+?\d+)\s+(.*)$/)
                              if (m) {
                                editCell(r.id, "Phone Code", m[1])
                                editCell(r.id, "Phone Number", m[2])
                              } else {
                                editCell(r.id, "Phone Number", v)
                              }
                            }}
                          />
                        </td>
                        <td>
                          <input
                            className={"cell-input" + (bad("date") ? " editing" : !r.inquiryDate ? " editing" : "")}
                            value={r.inquiryDate}
                            placeholder={!r.inquiryDate ? "YYYY-MM-DD" : ""}
                            onChange={(e) => editCell(r.id, "Inquiry Date", e.target.value)}
                          />
                        </td>
                        <td>
                          <span className={"issue-text " + r.rowStatus}>{r.issue || "\u2014"}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Result summary */}
        {result && (
          <div className="wizard-body">
            <div className="import-done">
              <div className="import-done-ico"><IconCheck size={26} /></div>
              <div className="tmpl-title">Imported {result.imported} inquiries into {branch}</div>
              {result.skipped.length > 0 && (
                <div className="template-error" style={{ marginTop: 12 }}>
                  <div className="template-error-title">
                    <IconAlert size={16} /> {result.skipped.length} skipped
                  </div>
                  <ul className="skip-list">
                    {result.skipped.map((s, i) => (
                      <li key={i}>{s.studentName || "(no name)"} — {s.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="modal-foot">
          {result ? (
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          ) : (
            <>
              {step === 3 && (
                <button className="btn btn-ghost left">
                  <IconDownload size={16} /> Download error report
                </button>
              )}
              {step > 0 && step < 3 && (
                <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>Back</button>
              )}
              {step === 3 && (
                <button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
              )}
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              {step === 0 && (
                <button className="btn btn-primary" onClick={() => setStep(1)}>Next</button>
              )}
              {step === 1 && (
                <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!branch}>Next</button>
              )}
              {step === 3 && (
                <button className="btn btn-primary" disabled={selectedCount === 0 || importing} onClick={doImport}>
                  <IconUpload size={16} /> {importing ? "Importing\u2026" : `Import ${selectedCount} selected`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
