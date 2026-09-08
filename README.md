# Timedoor Academy — Inquiry (Redesign Mockup)

Redesign menu **Inquiry** untuk CMS Timedoor Academy. Dibuat dengan **Next.js (App Router) + TypeScript**, data **static disimpan di JSON** (tanpa backend/DB). Fokusnya: bikin input inquiry jadi nyaman (nggak perlu lari ke spreadsheet), plus alur **import dengan preview sebelum save** dan **status model** yang lengkap.

> Ini prototype UI/UX. Semua data ada di folder `data/*.json` dan hanya hidup di memори browser (state React). Refresh = balik ke data awal.

---

## Cara menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000 — otomatis redirect ke halaman Inquiry.

Script lain:

```bash
npm run build   # production build
npm run start   # jalankan hasil build
npm run lint    # next lint
```

Butuh Node.js 18+.

---

## Fitur utama

### 1. Quick Add (inline di tabel)
- Tombol **Quick Add** memunculkan baris input langsung di dalam tabel (row paling atas, di-highlight hijau).
- Isi field, tekan **Enter** untuk simpan, **Esc** untuk batal.
- Cocok buat admin yang mau input cepat banyak data — nggak perlu buka form panjang.

### 2. New Inquiry (form drawer lengkap)
- Tombol **New Inquiry** membuka drawer dari kanan dengan form bagian per bagian: Basic Info, Source & Contact, Timing, Optional.
- Validasi field wajib + cek nomor telepon.

### 3. Nomor telepon unik
- Nomor telepon adalah identitas utama customer, jadi **tidak boleh duplikat**.
- Kalau nomor sudah ada, muncul **warning merah** (di quick add row & di form drawer) dan tombol simpan dinonaktifkan.
- Pembandingan dinormalisasi: kode negara + digit saja, leading zero diabaikan (`081...` == `81...`).

### 4. Import dengan Preview & Edit
Wizard 4 langkah: **Download Template → Upload File → Preview & Edit → Confirm Import**.
- Preview menampilkan tiap baris dengan status: **Ready / Warning / Error**.
- Cell bisa **diedit langsung** di preview sebelum di-save.
- Filter chip: All / Warnings / Errors.
- Checkbox buat pilih baris; baris error default tidak tercentang.
- **Partial import** — cuma import baris yang dipilih ("Import N selected").
- Bisa download error report.

### 5. Status model (8 stage + 15 reason code)
Status bukan cuma Pending/In Progress/Decline, tapi dipetakan jadi **8 stage** dengan **reason code**:

| Stage | Warna | Reason |
|---|---|---|
| New | Biru | — |
| In Progress | Indigo | — |
| Waiting | Amber | otomatis `B` (diskusi sama keluarga) |
| Registered | Hijau | otomatis `A` (menang — daftar trial) |
| No Response | Abu | wajib pilih (C1–C5) |
| Issue | Oранye | wajib pilih (D1–D4) |
| Disqualified | Merah | wajib pilih (E1–E2) |
| Others | Slate | wajib pilih (F1–F2) |

- Ganti status lewat **Status Picker** (search + pilih stage + pilih reason kalau perlu).
- Reason `F2` (Explain others) wajib isi catatan.

### 6. History / audit trail
- Tiap perubahan status kesimpan: dari → ke, reason, siapa yang ubah, kapan, dan catatan.
- Lihat di **Detail drawer** → Status History (timeline, terbaru di atas).

---

## Struktur folder

```
timedoor-inquiry/
├── app/
│   ├── globals.css        # semua styling (plain CSS, tanpa Tailwind)
│   ├── layout.tsx         # app shell: Sidebar + Topbar
│   └── page.tsx           # halaman Inquiry
├── components/
│   ├── Icons.tsx          # kumpulan ikon inline SVG
│   ├── Sidebar.tsx        # navigasi kiri
│   ├── Topbar.tsx         # header atas
│   ├── StatusChip.tsx     # chip status berwarna
│   ├── InquiryTable.tsx   # tabel utama
│   ├── QuickAddRow.tsx    # baris input cepat inline
│   ├── RowActionsMenu.tsx # menu titik-tiga
│   ├── StatusPicker.tsx   # modal ganti status
│   ├── NewInquiryDrawer.tsx # form lengkap
│   ├── DetailDrawer.tsx   # detail + history
│   ├── ImportModal.tsx    # wizard import
│   └── InquiryApp.tsx     # state & orchestration (client component)
├── data/
│   ├── inquiries.json     # 15 data inquiry contoh
│   ├── statuses.json      # definisi 8 stage + reason code
│   ├── options.json       # branch, source, country
│   └── import-sample.json # data contoh buat demo import
├── lib/
│   ├── types.ts           # TypeScript types
│   ├── data.ts            # loader JSON
│   ├── statusConfig.ts    # helper status/reason/warna
│   ├── phone.ts           # normalisasi & validasi telepon
│   └── format.ts          # format tanggal
├── package.json
├── tsconfig.json
└── next.config.mjs
```

---

## Catatan teknis
- **Tanpa Tailwind** — styling murni CSS di `app/globals.css` (pakai CSS variables buat token warna).
- **Data static** — semua dari `data/*.json`. Perubahan (tambah, ganti status, hapus) hanya di React state, reset saat refresh. Gampang nanti disambungin ke API asli tinggal ganti `lib/data.ts` + handler di `InquiryApp.tsx`.
- Field wajib: Branch, Student Name, Parent Name, Source, Country, Phone Code, Phone Number, Inquiry Date. Opsional: Social Media Username, Contact Note.
