import { stages, reasons } from "./data"
import type { Stage, StageKey, Reason } from "./types"

export function getStage(key: StageKey): Stage | undefined {
  return stages.find((s) => s.key === key)
}

export function getReasons(key: StageKey): Reason[] {
  return reasons[key] ?? []
}

export function getReason(key: StageKey, code?: string | null): Reason | undefined {
  if (!code) return undefined
  return getReasons(key).find((r) => r.code === code)
}

export function stageColor(key: StageKey): string {
  return getStage(key)?.color ?? "#94A3B8"
}

export function stageLabel(key: StageKey): string {
  return getStage(key)?.label ?? key
}

export function stageRequiresReason(key: StageKey): boolean {
  return getStage(key)?.requiresReason ?? false
}

// Flat lookup: reason code -> { stage, label }
export const allReasons: Record<string, { stage: StageKey; label: string }> = (() => {
  const map: Record<string, { stage: StageKey; label: string }> = {}
  for (const key of Object.keys(reasons)) {
    for (const r of reasons[key]) {
      map[r.code] = { stage: key as StageKey, label: r.label }
    }
  }
  return map
})()

// Convert hex + alpha (0-1) to rgba string for tints/borders.
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "")
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
