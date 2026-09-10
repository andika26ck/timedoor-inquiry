import path from "path"
import fs from "fs"
import initSqlJs, { type Database } from "sql.js"
import type { Inquiry, HistoryEntry, StageKey } from "./types"
import { normalizePhone } from "./phone"
import seedData from "../data/inquiries.json"

// ---------------------------------------------------------------------------
// Simple embedded SQLite database using sql.js (pure WebAssembly — no native
// build step, so `npm install` never fails). The whole DB lives in one file:
//   data/inquiry.db
// On first run it is created and seeded from data/inquiries.json. Delete that
// file to reset back to the seed data.
// ---------------------------------------------------------------------------

const DB_PATH = path.join(process.cwd(), "data", "inquiry.db")
const WASM_DIR = path.join(process.cwd(), "node_modules", "sql.js", "dist")

type Store = { db: Database }
// Keep a single instance across Next.js dev hot-reloads.
const globalStore = globalThis as unknown as { __inquiryDb__?: Promise<Store> }

const SCHEMA = `
CREATE TABLE IF NOT EXISTS inquiries (
  id          TEXT PRIMARY KEY,
  branch      TEXT NOT NULL,
  studentName TEXT NOT NULL,
  parentName  TEXT NOT NULL,
  source      TEXT,
  country     TEXT,
  phoneCode   TEXT,
  phoneNumber TEXT,
  phoneKey    TEXT UNIQUE,
  socialMedia TEXT,
  contactNote TEXT,
  inquiryDate TEXT,
  stage       TEXT NOT NULL,
  reasonCode  TEXT,
  createdAt   TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS history (
  hid        INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiryId  TEXT NOT NULL,
  fromStage  TEXT,
  toStage    TEXT NOT NULL,
  reasonCode TEXT,
  actor      TEXT,
  at         TEXT NOT NULL,
  note       TEXT
);
`

function persist(db: Database) {
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

async function create(): Promise<Store> {
  const SQL = await initSqlJs({ locateFile: (f: string) => path.join(WASM_DIR, f) })
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  let db: Database
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH))
    db.run(SCHEMA)
  } else {
    db = new SQL.Database()
    db.run(SCHEMA)
    seed(db)
    persist(db)
  }
  return { db }
}

function getStore(): Promise<Store> {
  if (!globalStore.__inquiryDb__) globalStore.__inquiryDb__ = create()
  return globalStore.__inquiryDb__
}

// ---- low level helpers ----------------------------------------------------
function all(db: Database, sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql)
  stmt.bind(params as never)
  const rows: Record<string, unknown>[] = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function seed(db: Database) {
  const rows = seedData as unknown as Inquiry[]
  for (const r of rows) {
    db.run(
      `INSERT INTO inquiries (id,branch,studentName,parentName,source,country,phoneCode,phoneNumber,phoneKey,socialMedia,contactNote,inquiryDate,stage,reasonCode,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        r.id, r.branch, r.studentName, r.parentName, r.source ?? "", r.country ?? "",
        r.phoneCode ?? "", r.phoneNumber ?? "", normalizePhone(r.phoneCode ?? "", r.phoneNumber ?? ""),
        r.socialMedia ?? "", r.contactNote ?? "", r.inquiryDate ?? "", r.stage,
        r.reasonCode ?? null, r.history?.[0]?.at ?? new Date().toISOString(),
      ] as never
    )
    for (const h of r.history ?? []) {
      db.run(
        `INSERT INTO history (inquiryId,fromStage,toStage,reasonCode,actor,at,note) VALUES (?,?,?,?,?,?,?)`,
        [r.id, h.from ?? null, h.to, h.reasonCode ?? null, h.by ?? "System", h.at, h.note ?? ""] as never
      )
    }
  }
}

function historyFor(db: Database, id: string): HistoryEntry[] {
  return all(
    db,
    `SELECT fromStage,toStage,reasonCode,actor,at,note FROM history WHERE inquiryId=? ORDER BY hid ASC`,
    [id]
  ).map((h) => ({
    from: (h.fromStage as StageKey) ?? null,
    to: h.toStage as StageKey,
    reasonCode: (h.reasonCode as string) ?? null,
    by: (h.actor as string) ?? "",
    at: h.at as string,
    note: (h.note as string) ?? "",
  }))
}

function rowToInquiry(db: Database, r: Record<string, unknown>): Inquiry {
  return {
    id: r.id as string,
    branch: r.branch as string,
    studentName: r.studentName as string,
    parentName: r.parentName as string,
    source: r.source as string,
    country: r.country as string,
    phoneCode: r.phoneCode as string,
    phoneNumber: r.phoneNumber as string,
    socialMedia: (r.socialMedia as string) ?? "",
    contactNote: (r.contactNote as string) ?? "",
    inquiryDate: r.inquiryDate as string,
    stage: r.stage as StageKey,
    reasonCode: (r.reasonCode as string) ?? null,
    history: historyFor(db, r.id as string),
  }
}

// ---- public API -----------------------------------------------------------
export interface NewInquiryInput {
  branch: string
  studentName: string
  parentName: string
  source: string
  country: string
  phoneCode: string
  phoneNumber: string
  socialMedia?: string
  contactNote?: string
  inquiryDate: string
}

function genId(): string {
  return "inq-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export async function listInquiries(): Promise<Inquiry[]> {
  const { db } = await getStore()
  const rows = all(db, `SELECT * FROM inquiries ORDER BY createdAt DESC, id DESC`)
  return rows.map((r) => rowToInquiry(db, r))
}

export async function getPhoneKeys(): Promise<string[]> {
  const { db } = await getStore()
  return all(db, `SELECT phoneKey FROM inquiries`).map((r) => r.phoneKey as string)
}

export async function phoneKeyExists(key: string): Promise<boolean> {
  const { db } = await getStore()
  return all(db, `SELECT 1 FROM inquiries WHERE phoneKey=? LIMIT 1`, [key]).length > 0
}

export async function createInquiry(
  input: NewInquiryInput,
  by = "Andika"
): Promise<{ ok: boolean; inquiry?: Inquiry; error?: string }> {
  const { db } = await getStore()
  const key = normalizePhone(input.phoneCode, input.phoneNumber)
  if (all(db, `SELECT 1 FROM inquiries WHERE phoneKey=? LIMIT 1`, [key]).length > 0) {
    return { ok: false, error: "Phone number already exists" }
  }
  const id = genId()
  const at = new Date().toISOString()
  db.run(
    `INSERT INTO inquiries (id,branch,studentName,parentName,source,country,phoneCode,phoneNumber,phoneKey,socialMedia,contactNote,inquiryDate,stage,reasonCode,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, input.branch, input.studentName, input.parentName, input.source, input.country,
      input.phoneCode, input.phoneNumber, key, input.socialMedia ?? "", input.contactNote ?? "",
      input.inquiryDate, "new", null, at,
    ] as never
  )
  db.run(
    `INSERT INTO history (inquiryId,fromStage,toStage,reasonCode,actor,at,note) VALUES (?,?,?,?,?,?,?)`,
    [id, null, "new", null, by, at, "Created"] as never
  )
  persist(db)
  const row = all(db, `SELECT * FROM inquiries WHERE id=?`, [id])[0]
  return { ok: true, inquiry: rowToInquiry(db, row) }
}

export async function updateStatus(
  id: string,
  stage: StageKey,
  reasonCode: string | null,
  note: string,
  by = "Andika"
): Promise<{ ok: boolean; inquiry?: Inquiry; error?: string }> {
  const { db } = await getStore()
  const current = all(db, `SELECT stage FROM inquiries WHERE id=?`, [id])[0]
  if (!current) return { ok: false, error: "Inquiry not found" }
  const from = current.stage as StageKey
  const at = new Date().toISOString()
  db.run(`UPDATE inquiries SET stage=?, reasonCode=? WHERE id=?`, [stage, reasonCode, id] as never)
  db.run(
    `INSERT INTO history (inquiryId,fromStage,toStage,reasonCode,actor,at,note) VALUES (?,?,?,?,?,?,?)`,
    [id, from, stage, reasonCode, by, at, note ?? ""] as never
  )
  persist(db)
  const row = all(db, `SELECT * FROM inquiries WHERE id=?`, [id])[0]
  return { ok: true, inquiry: rowToInquiry(db, row) }
}

export interface EditInquiryInput {
  branch?: string
  studentName: string
  parentName: string
  source: string
  country: string
  phoneCode: string
  phoneNumber: string
  socialMedia?: string
  contactNote?: string
  inquiryDate: string
}

// Full-details edit (does NOT change stage/reasonCode). Phone stays unique, but
// the record is allowed to keep its own phone number.
export async function updateInquiry(
  id: string,
  input: EditInquiryInput
): Promise<{ ok: boolean; inquiry?: Inquiry; error?: string }> {
  const { db } = await getStore()
  const current = all(db, `SELECT * FROM inquiries WHERE id=?`, [id])[0]
  if (!current) return { ok: false, error: "Inquiry not found" }
  const key = normalizePhone(input.phoneCode, input.phoneNumber)
  const clash = all(db, `SELECT 1 FROM inquiries WHERE phoneKey=? AND id<>? LIMIT 1`, [key, id])
  if (clash.length > 0) return { ok: false, error: "Phone number already exists" }
  db.run(
    `UPDATE inquiries SET branch=?, studentName=?, parentName=?, source=?, country=?, phoneCode=?, phoneNumber=?, phoneKey=?, socialMedia=?, contactNote=?, inquiryDate=? WHERE id=?`,
    [
      input.branch ?? (current.branch as string), input.studentName, input.parentName, input.source,
      input.country, input.phoneCode, input.phoneNumber, key, input.socialMedia ?? "",
      input.contactNote ?? "", input.inquiryDate, id,
    ] as never
  )
  persist(db)
  const row = all(db, `SELECT * FROM inquiries WHERE id=?`, [id])[0]
  return { ok: true, inquiry: rowToInquiry(db, row) }
}

export async function deleteInquiry(id: string): Promise<{ ok: boolean }> {
  const { db } = await getStore()
  db.run(`DELETE FROM history WHERE inquiryId=?`, [id] as never)
  db.run(`DELETE FROM inquiries WHERE id=?`, [id] as never)
  persist(db)
  return { ok: true }
}

export interface ImportRowInput {
  studentName: string
  parentName: string
  source: string
  country: string
  phoneCode: string
  phoneNumber: string
  socialMedia?: string
  contactNote?: string
  inquiryDate: string
}

export async function importInquiries(
  branch: string,
  rows: ImportRowInput[],
  by = "System"
): Promise<{ imported: number; skipped: { studentName: string; reason: string }[] }> {
  const { db } = await getStore()
  let imported = 0
  const skipped: { studentName: string; reason: string }[] = []
  for (const r of rows) {
    const key = normalizePhone(r.phoneCode, r.phoneNumber)
    if (all(db, `SELECT 1 FROM inquiries WHERE phoneKey=? LIMIT 1`, [key]).length > 0) {
      skipped.push({ studentName: r.studentName, reason: "Phone already exists" })
      continue
    }
    const id = genId()
    const at = new Date().toISOString()
    db.run(
      `INSERT INTO inquiries (id,branch,studentName,parentName,source,country,phoneCode,phoneNumber,phoneKey,socialMedia,contactNote,inquiryDate,stage,reasonCode,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, branch, r.studentName, r.parentName, r.source, r.country, r.phoneCode, r.phoneNumber,
        key, r.socialMedia ?? "", r.contactNote ?? "", r.inquiryDate, "new", null, at,
      ] as never
    )
    db.run(
      `INSERT INTO history (inquiryId,fromStage,toStage,reasonCode,actor,at,note) VALUES (?,?,?,?,?,?,?)`,
      [id, null, "new", null, by, at, "Imported from spreadsheet"] as never
    )
    imported++
  }
  persist(db)
  return { imported, skipped }
}
