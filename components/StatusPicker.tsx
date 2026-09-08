"use client"
import * as React from "react"
import { stages } from "../lib/data"
import { getReasons, getReason } from "../lib/statusConfig"
import type { StageKey } from "../lib/types"
import { IconCheck, IconX, IconAlert } from "./Icons"

export default function StatusPicker({
  currentStage,
  currentReason,
  onClose,
  onApply,
}: {
  currentStage: StageKey
  currentReason?: string | null
  onClose: () => void
  onApply: (stage: StageKey, reason: string | null, note: string) => void
}) {
  const [stage, setStage] = React.useState<StageKey>(currentStage)
  const [reason, setReason] = React.useState<string | null>(currentReason ?? null)
  const [note, setNote] = React.useState("")
  const [search, setSearch] = React.useState("")

  const stageObj = stages.find((s) => s.key === stage)
  const needsReason = stageObj?.requiresReason ?? false
  const reasonList = getReasons(stage)
  const reasonObj = getReason(stage, reason)
  const needsNote = reasonObj?.requiresNote ?? false

  const filtered = stages.filter((s) =>
    s.label.toLowerCase().includes(search.toLowerCase())
  )

  const canApply =
    (!needsReason || !!reason) && (!needsNote || note.trim().length > 0)

  function pickStage(next: StageKey) {
    setStage(next)
    const s = stages.find((x) => x.key === next)
    if (s?.autoReason) setReason(s.autoReason)
    else setReason(null)
  }

  return (
    <div className="overlay center" onClick={onClose}>
      <div className="picker" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <span>Update Status</span>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>
        <div className="picker-body">
          <input
            className="search"
            placeholder="Search status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="field-caption">Stage</div>
          <div className="stage-list">
            {filtered.map((s) => (
              <button
                key={s.key}
                className={"stage-row" + (stage === s.key ? " selected" : "")}
                style={stage === s.key ? { color: s.color } : undefined}
                onClick={() => pickStage(s.key)}
              >
                <span className="dot" style={{ background: s.color }} />
                <span className="st-name">{s.label}</span>
                {stage === s.key ? (
                  <IconCheck size={16} className="st-check" />
                ) : (
                  <span className="st-desc">{s.description}</span>
                )}
              </button>
            ))}
          </div>

          {needsReason && (
            <div className="reason-panel">
              <div className="field-caption">
                Reason <span style={{ color: "#ef4444" }}>*</span>
              </div>
              {reasonList.map((r) => (
                <button
                  key={r.code}
                  className={"reason-row" + (reason === r.code ? " selected" : "")}
                  onClick={() => setReason(r.code)}
                >
                  <span className="code-badge">{r.code}</span>
                  <span>{r.label}</span>
                  {reason === r.code ? (
                    <IconCheck size={16} className="r-check" />
                  ) : null}
                </button>
              ))}
              {needsNote && (
                <>
                  <textarea
                    className="note-input"
                    placeholder="Please explain (required for this reason)..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="reason-required-note">
                    <IconAlert size={14} /> A note is required for this reason.
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="picker-foot">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!canApply}
            onClick={() => onApply(stage, reason, note)}
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  )
}
