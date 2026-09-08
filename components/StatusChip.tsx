import * as React from "react"
import { getStage } from "../lib/statusConfig"
import { withAlpha } from "../lib/statusConfig"
import type { StageKey } from "../lib/types"
import { IconChevronDown } from "./Icons"

export default function StatusChip({
  stage,
  reasonCode,
  clickable,
  showCaret,
  onClick,
}: {
  stage: StageKey
  reasonCode?: string | null
  clickable?: boolean
  showCaret?: boolean
  onClick?: () => void
}) {
  const s = getStage(stage)
  const color = s?.color ?? "#94a3b8"
  const code = reasonCode ?? s?.code ?? null
  return (
    <span
      className={"chip" + (clickable ? " clickable" : "")}
      style={{
        color: color,
        background: withAlpha(color, 0.12),
        borderColor: withAlpha(color, 0.3),
      }}
      onClick={onClick}
      role={clickable ? "button" : undefined}
    >
      <span className="chip-dot" style={{ background: color }} />
      <span>{s?.label ?? stage}</span>
      {code ? <span className="chip-code">· {code}</span> : null}
      {showCaret ? <IconChevronDown size={13} strokeWidth={2.5} /> : null}
    </span>
  )
}
