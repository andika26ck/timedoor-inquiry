"use client"
import * as React from "react"
import type { ImportRow, RowStatus, Options, ParseResult, HeaderCheck, FieldIssue } from "../lib/types"
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

function csvCell(v: string): string {
  const s = v ?? ""
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
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

// IMPORTANT: defined at module scope (NOT inside ImportModal). If this lived
// inside the component it would get a new identity on every render, causing
// React to remount each <input>/<select> on every keystroke — which is exactly
// what made typing lose focus after one character. Keeping it here fixes that.
function CellWrap({ fi, children }: { fi?: FieldIssue; children: React.ReactNode }) {
  return (
    <div className="cell-wrap">
      {children}
      {fi && <div className={"cell-msg " + fi.level}>{fi.msg}</div>}
    </div>
  )
}

const ISO = /^\d{4}-\d{2}-\d{2}$/
const issueOf = (r: ImportRow, field: string): FieldIssue | undefined => r.fieldIssues?.[field]
const ctrlClass = (base: string, fi?: FieldIssue) =>
  base + (fi ? (fi.level === "err" ? " cell-bad-err" : " cell-bad-warn") : "")

export default function ImportModal({
  options,
  existingPhones,
  onClose,
  onImported,
  // QA-only props to render a specific state statically
  initialPhase,
  initialParse,
  initialBranch,
}: {
  options: Options
  existingPhones: string[]
  onClose: () => void
  onImported: (result: { imported: number; skipped: { studentName: string; reason: string }[] }) => void
  initialPhase?: "form" | "preview"
  initialParse?: ParseResult
  initialBranch?: string
}) {
  const [phase, setPhase] = React.useState<"form" | "preview">(
    initialPhase ?? (initialParse?.ok ? "preview" : "form")
  )
  const [branch, setBranch] = React.useState(initialBranch ?? options.branches[0] ?? "")
  const [fileName, setFileName] = React.useState(initialParse?.fileName ?? "")
  const [parsing, setParsing] = React.useState(false)
  const [templateError, setTemplateError] = React.useState<string | null>(
    initialParse && !initialParse.ok ? initialParse.templateError ?? "Invalid template" : null
  )
  const [headerInfo, setHeaderInfo] = React.useState<HeaderCheck | null>(initialParse?.header ?? null)
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

  // Live re-validation whenever rows are edited. Row identity (id + sourceRow)
  // is preserved so per-cell errors update as the admin fixes them inline.
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
  const hasIssues = counts.err > 0 || counts.warn > 0

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

  // Export a CSV listing every problem row with its spreadsheet row number and
  // the exact issue per row — so the admin can find and fix it in their file.
  function downloadErrorReport() {
    if (typeof document === "undefined") return
    const bad = rows.filter((r) => r.rowStatus !== "ok")
    if (bad.length === 0) return
    const head = ["Spreadsheet Row", ...TEMPLATE_COLUMNS, "Problems"]
    const lines = [head.map(csvCell).join(",")]
    for (const r of bad) {
      const raw = toRaw(r)
      const cells = [
        String(r.sourceRow),
        ...TEMPLATE_COLUMNS.map((c) => csvCell(raw[c] ?? "")),
        csvCell(r.issues.join(" | ")),
      ]
      lines.push(cells.join(","))
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "inquiry-import-errors.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFile(file: File) {
    setFileName(file.name)
    setParsing(true)
    setTemplateError(null)
    try {
      const res = await parseImportApi(file, branch)
      setHeaderInfo(res.header ?? null)
      if (!res.ok) {
        setTemplateError(res.templateError ?? "This file could not be read.")
        setRawRows([])
        return
      }
      setRawRows(res.rows.map(toRaw))
      setPhase("preview")
    } catch (e) {
      setTemplateError("Failed to read the file. Please try again.")
    } finally {
      setParsing(false)
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    // allow re-selecting the same file name after a failed attempt
    e.target.value = ""
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

  // Changing Country also fills the matching phone code, just like Quick Add.
  function editCountry(id: string, name: string) {
    const idx = rows.findIndex((r) => r.id === id)
    if (idx < 0) return
    const c = options.countries.find((x) => x.name === name)
    setRawRows((prev) => {
      const next = prev.slice()
      next[idx] = { ...next[idx], Country: name, ...(c ? { "Phone Code": c.phoneCode } : {}) }
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

  return (
    <div className="overlay center" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Import Inquiries</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>

        {/* ---------- FORM (single screen, no wizard) ---------- */}
        {phase === "form" && !result && (
          <div className="upload-form">
            <div className="up-step">
              <span className="up-num">1</span>
              <div className="up-main">
                <div className="up-row">
                  <div>
                    <div className="up-label">Download Form Inquiry Template</div>
                    <div className="up-sub">Fill your data in this exact format, then upload it below.</div>
                  </div>
                  <button className="btn btn-outline" onClick={downloadTemplate}>
                    <IconDownload size={16} /> Download Template
                  </button>
                </div>
                <div className="tmpl-cols">
                  {TEMPLATE_COLUMNS.map((c) => (
                    <span key={c} className="tmpl-col">{c}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="up-step">
              <span className="up-num">2</span>
              <div className="up-main">
                <div className="up-label">Select Branch</div>
                <select
                  className="select branch-select"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                >
                  {options.branches.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
                <div className="up-sub">All rows in this file will be imported into this branch.</div>
              </div>
            </div>

            <div className="up-step">
              <span className="up-num">3</span>
              <div className="up-main">
                <div className="up-label">Upload Inquiry Data</div>
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
                  {fileName && !parsing && (
                    <div className="file-chip"><IconFile size={13} /> {fileName}</div>
                  )}
                </div>

                {templateError && (
                  <div className="template-error">
                    <div className="template-error-title">
                      <IconAlert size={16} /> This file can’t be previewed yet
                    </div>
                    <div className="template-error-body">{templateError}</div>
                    {headerInfo && (headerInfo.missing.length > 0 || headerInfo.extra.length > 0) && (
                      <div className="template-error-body">
                        {headerInfo.missing.length > 0 && (
                          <div>Missing columns: <b>{headerInfo.missing.join(", ")}</b></div>
                        )}
                        {headerInfo.extra.length > 0 && (
                          <div>Unexpected columns: <b>{headerInfo.extra.join(", ")}</b></div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------- PREVIEW ---------- */}
        {phase === "preview" && !result && (
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
              {headerInfo && (headerInfo.missing.length > 0 || headerInfo.extra.length > 0) && (
                <div className="header-notice">
                  <IconInfo size={15} />
                  <div>
                    {headerInfo.missing.length > 0 && (
                      <span>
                        Template columns not found in your file:{" "}
                        <b>{headerInfo.missing.join(", ")}</b>. Those cells show as errors below — fill them in or fix your header row.{" "}
                      </span>
                    )}
                    {headerInfo.extra.length > 0 && (
                      <span>
                        Extra columns ignored: <b>{headerInfo.extra.join(", ")}</b>.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {counts.err > 0 && (
                <div className="fix-hint">
                  <IconAlert size={14} /> {counts.err} row(s) have errors and are excluded from import. Edit the highlighted cells to fix them — rows turn green when ready. The <b>Row</b> column matches the row number in your spreadsheet.
                </div>
              )}

              <table className="preview">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th style={{ width: 54 }}>Row</th>
                    <th>Status</th>
                    <th>Student Name</th>
                    <th>Parent Name</th>
                    <th>Source</th>
                    <th>Country</th>
                    <th>Phone</th>
                    <th>Inquiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const fStudent = issueOf(r, "student")
                    const fParent = issueOf(r, "parent")
                    const fSource = issueOf(r, "source")
                    const fCountry = issueOf(r, "country")
                    const fPhone = issueOf(r, "phone")
                    const fDate = issueOf(r, "date")
                    const knownSource = options.sources.includes(r.source)
                    const knownCountry = options.countries.some((c) => c.name === r.country)
                    return (
                      <tr
                        key={r.id}
                        className={r.rowStatus === "err" ? "row-err" : r.rowStatus === "warn" ? "row-warn" : ""}
                      >
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={!!selected[r.id] && r.rowStatus !== "err"}
                            disabled={r.rowStatus === "err"}
                            onChange={() => setSelected((s) => ({ ...s, [r.id]: !s[r.id] }))}
                          />
                        </td>
                        <td><span className="row-num">{r.sourceRow}</span></td>
                        <td><RowStat status={r.rowStatus} /></td>
                        <td>
                          <CellWrap fi={fStudent}>
                            <input className={ctrlClass("cell-input", fStudent)} value={r.studentName}
                              placeholder={!r.studentName ? "Required" : ""} title={fStudent?.msg}
                              onChange={(e) => editCell(r.id, "Student Name", e.target.value)} />
                          </CellWrap>
                        </td>
                        <td>
                          <CellWrap fi={fParent}>
                            <input className={ctrlClass("cell-input", fParent)} value={r.parentName}
                              placeholder={!r.parentName ? "Required" : ""} title={fParent?.msg}
                              onChange={(e) => editCell(r.id, "Parent Name", e.target.value)} />
                          </CellWrap>
                        </td>
                        <td>
                          <CellWrap fi={fSource}>
                            <select className={ctrlClass("cell-input cell-select", fSource)} value={r.source}
                              title={fSource?.msg}
                              onChange={(e) => editCell(r.id, "Source", e.target.value)}>
                              <option value="">Select source…</option>
                              {!knownSource && r.source && (
                                <option value={r.source}>{r.source} (as typed)</option>
                              )}
                              {options.sources.map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </CellWrap>
                        </td>
                        <td>
                          <CellWrap fi={fCountry}>
                            <select className={ctrlClass("cell-input cell-select", fCountry)} value={r.country}
                              title={fCountry?.msg}
                              onChange={(e) => editCountry(r.id, e.target.value)}>
                              <option value="">Select country…</option>
                              {!knownCountry && r.country && (
                                <option value={r.country}>{r.country} (unknown)</option>
                              )}
                              {options.countries.map((c) => (
                                <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                              ))}
                            </select>
                          </CellWrap>
                        </td>
                        <td>
                          <CellWrap fi={fPhone}>
                            <input className={ctrlClass("cell-input", fPhone)}
                              value={(r.phoneCode + " " + r.phoneNumber).trim()}
                              placeholder={!r.phoneNumber ? "+62 812..." : ""} title={fPhone?.msg}
                              onChange={(e) => {
                                const val = e.target.value.trim()
                                const m = val.match(/^(\+?\d+)\s+(.*)$/)
                                if (m) {
                                  editCell(r.id, "Phone Code", m[1])
                                  editCell(r.id, "Phone Number", m[2])
                                } else {
                                  editCell(r.id, "Phone Number", val)
                                }
                              }} />
                          </CellWrap>
                        </td>
                        <td>
                          <CellWrap fi={fDate}>
                            <input type="date" className={ctrlClass("cell-input cell-date", fDate)}
                              value={ISO.test(r.inquiryDate) ? r.inquiryDate : ""}
                              title={fDate?.msg}
                              onChange={(e) => editCell(r.id, "Inquiry Date", e.target.value)} />
                          </CellWrap>
                        </td>
                      </tr>
                    )
                  })}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={9} className="preview-empty">No rows match this filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ---------- RESULT ---------- */}
        {result && (
          <div className="upload-form">
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

        {/* ---------- FOOTER ---------- */}
        <div className="modal-foot">
          {result ? (
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          ) : phase === "preview" ? (
            <>
              <button className="btn btn-ghost left" onClick={downloadErrorReport} disabled={!hasIssues}>
                <IconDownload size={16} /> Download error report
              </button>
              <button className="btn btn-ghost" onClick={() => setPhase("form")}>Back</button>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" disabled={selectedCount === 0 || importing} onClick={doImport}>
                <IconUpload size={16} /> {importing ? "Importing\u2026" : `Import ${selectedCount} selected`}
              </button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  )
}
