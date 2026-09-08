import inquiriesData from "../data/inquiries.json"
import statusesData from "../data/statuses.json"
import optionsData from "../data/options.json"
import importSampleData from "../data/import-sample.json"
import type { Inquiry, Stage, Reason, StageKey, Options, ImportRow } from "./types"

export const inquiries = inquiriesData as Inquiry[]
export const stages = statusesData.stages as Stage[]
export const reasons = statusesData.reasons as Record<string, Reason[]>
export const options = optionsData as Options
export const importSample = importSampleData as ImportRow[]

export type { Inquiry, Stage, Reason, StageKey, Options, ImportRow }
