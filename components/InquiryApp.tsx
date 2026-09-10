"use client"
import * as React from "react"
import type { Inquiry, StageKey } from "../lib/types"
import { options, stages } from "../lib/data"
import { normalizePhone } from "../lib/phone"
import {
  fetchInquiries,
  createInquiryApi,
  updateStatusApi,
  updateInquiryApi,
  deleteInquiryApi,
} from "../lib/apiClient"
import InquiryTable from "./InquiryTable"
import StatusPicker from "./StatusPicker"
import NewInquiryDrawer, { type NewInquiryForm } from "./NewInquiryDrawer"
import DetailDrawer from "./DetailDrawer"
import ImportModal from "./ImportModal"
import { type Draft } from "./QuickAddRow"
import { IconPlus, IconUpload } from "./Icons"

export default function InquiryApp() {
  const [list, setList] = React.useState<Inquiry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [toast, setToast] = React.useState<string | null>(null)

  const [showQuickAdd, setShowQuickAdd] = React.useState(false)
  const [quickKey, setQuickKey] = React.useState(0)
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)
  const [pickerFor, setPickerFor] = React.useState<Inquiry | null>(null)
  const [detailFor, setDetailFor] = React.useState<Inquiry | null>(null)
  const [editFor, setEditFor] = React.useState<Inquiry | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)

  const [search, setSearch] = React.useState("")
  const [fStatus, setFStatus] = React.useState("")
  const [fSource, setFSource] = React.useState("")
  const [fCountry, setFCountry] = React.useState("")

  const refresh = React.useCallback(async () => {
    const data = await fetchInquiries()
    setList(data)
  }, [])

  React.useEffect(() => {
    refresh()
      .catch(() => setToast("Failed to load inquiries"))
      .finally(() => setLoading(false))
  }, [refresh])

  React.useEffect(() => {
    if (!openMenuId) return
    const handler = () => setOpenMenuId(null)
    window.addEventListener("click", handler)
    return () => window.removeEventListener("click", handler)
  }, [openMenuId])

  React.useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

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
        i.studentName + " " + i.parentName + " " + i.phoneNumber + " " + (i.socialMedia ?? "")
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

  async function onQuickSave(d: Draft) {
    const res = await createInquiryApi({
      branch: d.branch,
      studentName: d.studentName,
      parentName: d.parentName,
      source: d.source,
      country: d.country,
      phoneCode: d.phoneCode,
      phoneNumber: d.phoneNumber,
      socialMedia: d.socialMedia,
      contactNote: d.contactNote,
      inquiryDate: d.inquiryDate,
    })
    if (!res.ok) {
      setToast(res.error || "Could not save inquiry")
      return
    }
    if (res.inquiry) setList((l) => [res.inquiry!, ...l])
    setQuickKey((k) => k + 1) // reset the quick-add row for "add another"
  }

  async function onDrawerSave(f: NewInquiryForm) {
    const res = await createInquiryApi({
      branch: f.branch,
      studentName: f.studentName,
      parentName: f.parentName,
      source: f.source,
      country: f.country,
      phoneCode: f.phoneCode,
      phoneNumber: f.phoneNumber,
      socialMedia: f.socialMedia,
      contactNote: f.contactNote,
      inquiryDate: f.inquiryDate,
    })
    if (!res.ok) {
      setToast(res.error || "Could not save inquiry")
      return
    }
    if (res.inquiry) setList((l) => [res.inquiry!, ...l])
    setDrawerOpen(false)
  }

  async function onEditSave(f: NewInquiryForm) {
    if (!editFor) return
    const res = await updateInquiryApi(editFor.id, {
      branch: f.branch,
      studentName: f.studentName,
      parentName: f.parentName,
      source: f.source,
      country: f.country,
      phoneCode: f.phoneCode,
      phoneNumber: f.phoneNumber,
      socialMedia: f.socialMedia,
      contactNote: f.contactNote,
      inquiryDate: f.inquiryDate,
    })
    if (!res.ok) {
      setToast(res.error || "Could not update inquiry")
      return
    }
    if (res.inquiry) {
      const updated = res.inquiry
      setList((l) => l.map((i) => (i.id === updated.id ? updated : i)))
    }
    setEditFor(null)
    setToast("Inquiry updated")
  }

  async function applyStatus(target: Inquiry, stage: StageKey, reason: string | null, note: string) {
    const res = await updateStatusApi(target.id, stage, reason, note)
    if (res.ok && res.inquiry) {
      const updated = res.inquiry
      setList((l) => l.map((i) => (i.id === updated.id ? updated : i)))
      setDetailFor((d) => (d && d.id === updated.id ? updated : d))
    } else {
      setToast(res.error || "Could not update status")
    }
    setPickerFor(null)
  }

  async function onRegister(inq: Inquiry) {
    setOpenMenuId(null)
    await applyStatus(inq, "registered", "A", "Marked as registered")
  }

  async function onDelete(inq: Inquiry) {
    setOpenMenuId(null)
    setList((l) => l.filter((i) => i.id !== inq.id))
    try {
      await deleteInquiryApi(inq.id)
    } catch {
      setToast("Could not delete \u2014 reloading")
      refresh()
    }
  }

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">Inquiry</h1>
          <div className="page-sub">
            {loading ? "Loading…" : `${filtered.length} of ${list.length} inquiries`} · HQ Training
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
          setEditFor(inq)
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

      {editFor && (
        <NewInquiryDrawer
          options={options}
          existingPhones={existingPhones}
          mode="edit"
          ignorePhoneKey={normalizePhone(editFor.phoneCode, editFor.phoneNumber)}
          initialForm={{
            branch: editFor.branch,
            studentName: editFor.studentName,
            parentName: editFor.parentName,
            source: editFor.source,
            country: editFor.country,
            phoneCode: editFor.phoneCode,
            phoneNumber: editFor.phoneNumber,
            inquiryDate: editFor.inquiryDate,
            socialMedia: editFor.socialMedia,
            contactNote: editFor.contactNote,
          }}
          onClose={() => setEditFor(null)}
          onSave={onEditSave}
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
          options={options}
          existingPhones={existingPhones}
          onClose={() => setImportOpen(false)}
          onImported={() => {
            refresh()
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
