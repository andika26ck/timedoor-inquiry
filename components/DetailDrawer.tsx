"use client"
import * as React from "react"
import type { Inquiry } from "../lib/types"
import StatusChip from "./StatusChip"
import { getStage, allReasons, stageLabel } from "../lib/statusConfig"
import { formatDate, formatDateTime } from "../lib/format"
import { IconX, IconSwap, IconChevronRight } from "./Icons"

export default function DetailDrawer({
  inquiry,
  onClose,
  onChangeStatus,
}: {
  inquiry: Inquiry
  onClose: () => void
  onChangeStatus: (inq: Inquiry) => void
}) {
  const history = [...inquiry.history].reverse()

  return (
    <div className="overlay right" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <h2 className="detail-name">{inquiry.studentName}</h2>
            <div className="detail-topchip">
              <StatusChip stage={inquiry.stage} reasonCode={inquiry.reasonCode} />
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>
        <div className="drawer-body">
          <div className="detail-summary">
            <div className="sum-item">
              <div className="k">Parent</div>
              <div className="v">{inquiry.parentName}</div>
            </div>
            <div className="sum-item">
              <div className="k">Branch</div>
              <div className="v">{inquiry.branch}</div>
            </div>
            <div className="sum-item">
              <div className="k">Phone</div>
              <div className="v">
                {inquiry.phoneCode} {inquiry.phoneNumber}
              </div>
            </div>
            <div className="sum-item">
              <div className="k">Source</div>
              <div className="v">{inquiry.source}</div>
            </div>
            <div className="sum-item">
              <div className="k">Country</div>
              <div className="v">{inquiry.country}</div>
            </div>
            <div className="sum-item">
              <div className="k">Inquiry Date</div>
              <div className="v">{formatDate(inquiry.inquiryDate)}</div>
            </div>
            <div className="sum-item">
              <div className="k">Social Media</div>
              <div className="v">{inquiry.socialMedia || "\u2014"}</div>
            </div>
            <div className="sum-item">
              <div className="k">Contact Note</div>
              <div className="v">{inquiry.contactNote || "\u2014"}</div>
            </div>
          </div>

          <div className="section-label">Status History</div>
          <div className="timeline">
            {history.map((h, i) => {
              const toStage = getStage(h.to)
              const color = toStage?.color ?? "#94a3b8"
              const reasonLabel = h.reasonCode ? allReasons[h.reasonCode]?.label : null
              return (
                <div className="tl-item" key={i}>
                  <span className="tl-dot" style={{ background: color }} />
                  <div className="tl-time">{formatDateTime(h.at)}</div>
                  <div className="tl-title">
                    <span className="tl-transition">
                      {h.from ? stageLabel(h.from) : "Created"}
                      <IconChevronRight size={13} className="arrow" />
                    </span>
                    <StatusChip stage={h.to} reasonCode={h.reasonCode} />
                  </div>
                  {reasonLabel && (
                    <div className="tl-by">
                      {h.reasonCode} · {reasonLabel}
                    </div>
                  )}
                  <div className="tl-by">by {h.by}</div>
                  {h.note ? <div className="tl-note">“{h.note}”</div> : null}
                </div>
              )
            })}
          </div>
        </div>
        <div className="drawer-foot">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={() => onChangeStatus(inquiry)}>
            <IconSwap size={16} /> Change Status
          </button>
        </div>
      </div>
    </div>
  )
}
