# Timedoor Academy — Inquiry CMS (redesign prototype)

Redesign / mockup of the **Inquiry** menu so admins can add and import inquiries
comfortably inside the app instead of juggling spreadsheets. Built with **Next.js
(App Router)** + **TypeScript**, now backed by a **real (simple) SQLite database**
and a **step-by-step import wizard** with template validation.

> Focus is the Inquiry page only — no other menus are implemented.

---

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

First run creates a local database at `data/inquiry.db` and seeds it from
`data/inquiries.json` (15 sample rows). To wipe and re-seed:

```bash
npm run db:reset   # deletes data/inquiry.db; next run re-seeds
```

---

## What's new in this version

### 1. Real database (not just JSON)
- Uses **sql.js** (SQLite compiled to WebAssembly). Pure JS/WASM, so
  `npm install` never needs a native build toolchain — works the same on
  Windows, macOS, and Linux.
- Data is stored on disk in `data/inquiry.db` and persists across restarts.
- Two tables:
  - `inquiries` — one row per inquiry. `phoneKey` is **UNIQUE**, so duplicate
    phone numbers are rejected at the database level.
  - `history` — the status change log for each inquiry (from → to, reason,
    actor, timestamp).
- All reads/writes go through API routes; the UI never touches the DB directly.

### 2. Step-by-step import wizard (no more jump-to-preview)
The **Import** button opens a 4-step wizard, like a real CMS:

1. **Download Template** — grab the exact `.csv` template (column order shown).
2. **Select Branch** — choose the branch all rows will be imported into
   (branch is *not* a column in the file).
3. **Upload File** — drop or pick a `.xlsx` / `.csv` file. The file's header is
   checked against the template **before** anything else:
   - If it doesn't match, a red error box lists the **missing** and
     **unexpected** columns and you stay on this step.
   - If it matches, it advances to preview.
4. **Preview & Edit** — every row is validated and **editable inline**. Fix
   errors right in the table and watch them clear live. Error rows can't be
   selected; only valid rows are imported.

### 3. Spreadsheet parsing + validation
- `.xlsx` is parsed with **SheetJS (xlsx)**; `.csv` with a small built-in parser.
- Per-row checks: required fields, valid phone, duplicate phone (both within the
  file and against existing DB records), known source, matched country, and date
  format (auto-reformatted to `YYYY-MM-DD` when possible).

---

## How to test the "wrong template" error
1. Click **Import → Next → Next** to reach **Upload File**.
2. Upload any spreadsheet whose headers don't match the template — e.g. a file
   with columns `Name, Phone, Notes`.
3. You'll see: *"File does not match the template"* with the exact missing and
   unexpected columns listed. Download the template, fix the headers, re-upload.

To test row-level errors, upload a file that matches the template but contains
bad rows (empty name, phone like `abcd`, a phone that already exists, an unknown
source, or a malformed date). Those rows show up flagged in **Preview & Edit**.

---

## Template columns (exact order)
```
Student Name, Parent Name, Source, Phone Code, Phone Number,
Social Media Username, Inquiry Date, Country, Contact Note
```
Required: Student Name, Parent Name, Source, Phone Number, Country, Inquiry Date.
Optional: Social Media Username, Contact Note. Branch is chosen in the wizard.

---

## Project structure
```
app/
  api/
    inquiries/route.ts          GET list · POST create
    inquiries/[id]/route.ts     PATCH status · DELETE
    inquiries/import/route.ts   POST bulk import validated rows
    import/parse/route.ts       POST spreadsheet → validate header + rows
  globals.css                   all styling (design tokens + wizard styles)
  layout.tsx, page.tsx
components/
  InquiryApp.tsx                page state, talks to the API
  InquiryTable.tsx, QuickAddRow.tsx
  NewInquiryDrawer.tsx, DetailDrawer.tsx
  StatusPicker.tsx              15 statuses grouped into 8 stages + reasons
  ImportModal.tsx               the step-by-step import wizard
  Sidebar.tsx, Topbar.tsx, Icons.tsx
lib/
  db.ts                         sql.js database layer (schema, seed, CRUD)
  apiClient.ts                  typed fetch helpers used by the UI
  importValidation.ts           template + row validation (framework-free)
  phone.ts, types.ts, data.ts
data/
  inquiries.json                seed data
  options.json, statuses.json   branches / sources / countries / statuses
  inquiry.db                    generated at runtime (git-ignored)
```

## API routes
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/inquiries` | list all inquiries |
| POST | `/api/inquiries` | create one (rejects duplicate phone) |
| PATCH | `/api/inquiries/:id` | change status + append history |
| DELETE | `/api/inquiries/:id` | delete one |
| POST | `/api/import/parse` | upload a file → header check + validated rows |
| POST | `/api/inquiries/import` | commit the selected valid rows |

## Dependencies
- `next`, `react`, `react-dom`
- `sql.js` — WebAssembly SQLite (the database)
- `xlsx` (SheetJS) — spreadsheet parsing

## Notes
- This is a UI/UX prototype; there is no auth. The branch shown in the topbar is
  static.
- `data/inquiry.db` is git-ignored so the repo stays clean; it's recreated and
  seeded automatically on first run.
