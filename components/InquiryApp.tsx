"use client"
import * as React from "react"
import type { Inquiry, StageKey } from "../lib/types"
import { inquiries as seedInquiries, options, importSample, stages } from "../lib/data"
import { normalizePhone } from "../lib/phone"
import InquiryTable from "./InquiryTable"
import StatusPicker from "./StatusPicker"
import NewInquiryDrawer, { type NewInquiryForm } from "./NewInquiryDrawer"
import DetailDrawer from "./DetailDrawer"
import ImportModal from "./ImportModal"
import { type Draft } from "./QuickAddRow"
import { IconPlus, IconUpload, IconSearch } from "./Icons"

function nowIso() {
  return new Date().toISOString()
}

export default function InquiryApp() {
  const [list, setList] = React.useState<Inquiry[]>(seedInquiries)
  const [showQuickAdd, setShowQuickAdd] = React.useState(false)
  const [quickKey, setQuickKey] = React.useState(0)
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)
  const [pickerFor, setPickerFor] = React.useState<Inquiry | null>(null)
  const [detailFor, setDetailFor] = React.useState<Inquiry | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)

  const [search, setSearch] = React.useState("")
  const [fStatus, setFStatus] = React.useState("")
  const [fSource, setFSource] = React.useState("")
  const [fCountry, setFCountry] = React.useState("")

  React.useEffect(() => {
    if (!openMenuId) return
    const handler = () => setOpenMenuId(null)
    window.addEventListener("click", handler)
    return () => window.removeEventListener("click", handler)
  }, [openMenuId])

  const existingPhones = React.useMemo(
    () => list.map((i) => normalizePhone(i.phoneCode, i.phoneNumber)),
    [list]
  )

  const filtered = list.filter((i) => {
    if (fStatus && i.stage !== fStatus) return false
    if (fSource && i.source !== fSource) return false
    if (fCountry && i.country !== fCountry) return false
    if (search) {
      const q = search.toLowerCase()
      const hay = (
        i.studentName +
        " " +
        i.parentName +
        " " +
        i.phoneNumber +
        " " +
        i.socialMedia
      ).toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  function resetFilters() {
    setSearch("")
    setFStatus("")
    setFSource("")
    setFCountry("")
  }

  function makeInquiry(d: Draft | NewInquiryForm): Inquiry {
    return {
      id: "inq-" + Math.random().toString(36).slice(2, 8),
      branch: d.branch,
      studentName: d.studentName,
      parentName: d.parentName,
      source: d.source,
      country: d.country,
      phoneCode: d.phoneCode,
      phoneNumber: d.phoneNumber,
      inquiryDate: d.inquiryDate,
      socialMedia: d.socialMedia,
      contactNote: d.contactNote,
      stage: "new",
      reasonCode: null,
      history: [
        { from: null, to: "new", reasonCode: null, by: "Andika", at: nowIso(), note: "Created" },
      ],
    }
  }

  function onQuickSave(d: Draft) {
    setList((l) => [makeInquiry(d), ...l])
    setQuickKey((k) => k + 1) // reset the quick-add row for "add another"
  }

  function onDrawerSave(f: NewInquiryForm) {
    setList((l) => [makeInquiry(f), ...l])
    setDrawerOpen(false)
  }

  function applyStatus(target: Inquiry, stage: StageKey, reason: string | null, note: string) {
    setList((l) =>
      l.map((i) =>
        i.id === target.id
          ? {
              ...i,
              stage,
              reasonCode: reason,
              history: [
                ...i.history,
                { from: i.stage, to: stage, reasonCode: reason, by: "Andika", at: nowIso(), note },
              ],
            }
          : i
      )
    )
    setPickerFor(null)
    setDetailFor((d) => (d && d.id === target.id ? { ...d, stage, reasonCode: reason } : d))
  }

  function onRegister(inq: Inquiry) {
    setOpenMenuId(null)
    applyStatus(inq, "registered", "A", "Marked as registered")
  }

  function onDelete(inq: Inquiry) {
    setOpenMenuId(null)
    setList((l) => l.filter((i) => i.id !== inq.id))
  }

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">Inquiry</h1>
          <div className="page-sub">
            {filtered.length} of {list.length} inquiries · HQ Training
          </div>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={() => setImportOpen(true)}>
            <IconUpload size={17} /> Import
          </button>
          <button
            className="btn btn-outline"
            onClick={() => {
              setShowQuickAdd((s) => !s)
              setQuickKey((k) => k + 1)
            }}
          >
            <IconPlus size={17} /> Quick Add
          </button>
          <button className="btn btn-primary" onClick={() => setDrawerOpen(true)}>
            <IconPlus size={17} /> New Inquiry
          </button>
        </div>
      </div>

      <div className="filters">
        <input
          className="input input-search"
          placeholder="Search name, phone, social..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select select-sort" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">All Status</option>
          {stages.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <select className="select select-sort" value={fSource} onChange={(e) => setFSource(e.target.value)}>
          <option value="">All Sources</option>
          {options.sources.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="select select-country" value={fCountry} onChange={(e) => setFCountry(e.target.value)}>
          <option value="">All Countries</option>
          {options.countries.map((c) => (
            <option key={c.name} value={c.name}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
        <span className="reset-link" onClick={resetFilters}>
          Reset
        </span>
      </div>

      <InquiryTable
        key={quickKey}
        inquiries={filtered}
        options={options}
        showQuickAdd={showQuickAdd}
        existingPhones={existingPhones}
        openMenuId={openMenuId}
        onToggleMenu={(id) => setOpenMenuId((cur) => (cur === id ? null : id))}
        onOpenDetail={(inq) => {
          setOpenMenuId(null)
          setDetailFor(inq)
        }}
        onEdit={(inq) => {
          setOpenMenuId(null)
          setDetailFor(inq)
        }}
        onChangeStatus={(inq) => {
          setOpenMenuId(null)
          setPickerFor(inq)
        }}
        onRegister={onRegister}
        onDelete={onDelete}
        onQuickSave={onQuickSave}
        onQuickCancel={() => setShowQuickAdd(false)}
      />

      {pickerFor && (
        <StatusPicker
          currentStage={pickerFor.stage}
          currentReason={pickerFor.reasonCode}
          onClose={() => setPickerFor(null)}
          onApply={(stage, reason, note) => applyStatus(pickerFor, stage, reason, note)}
        />
      )}

      {drawerOpen && (
        <NewInquiryDrawer
          options={options}
          existingPhones={existingPhones}
          onClose={() => setDrawerOpen(false)}
          onSave={onDrawerSave}
        />
      )}

      {detailFor && (
        <DetailDrawer
          inquiry={detailFor}
          onClose={() => setDetailFor(null)}
          onChangeStatus={(inq) => {
            setDetailFor(null)
            setPickerFor(inq)
          }}
        />
      )}

      {importOpen && (
        <ImportModal
          rows={importSample}
          options={options}
          onClose={() => setImportOpen(false)}
          onImport={() => setImportOpen(false)}
        />
      )}
    </div>
  )
}
