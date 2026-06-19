# S.A.V.O.R.I - Project Progress Tracking

Dokumen ini berfungsi sebagai pelacak status terkini (*single source of truth*) dari seluruh *codebase* S.A.V.O.R.I. Dokumen ini dirancang agar AI Agent dapat langsung memahami konteks proyek, fitur apa saja yang sudah stabil, arsitektur yang digunakan, dan apa target selanjutnya.

---

## 🏗️ Tech Stack & Architecture
- **Framework**: Next.js 16.2.9 (App Router, Turbopack) + React 19.2.4
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`, di-load via `app/globals.css`)
- **UI Components**: shadcn/ui (radix-nova style, menggunakan `shadcn/tailwind.css`)
- **Database**: Supabase PostgreSQL (Schema dapat dilihat di `supabase_schema.sql`)
- **Authentication**: Supabase Auth via `@supabase/ssr` (Bukan better-auth)
- **Middleware**: `proxy.ts` (Digunakan sebagai custom middleware pengganti `middleware.ts` bawaan)

---

## ✅ Fitur Selesai & Stabil (Completed)

### 1. Authentication & Onboarding
- [x] Desain halaman Login & Register.
- [x] Autentikasi dasar menggunakan Supabase.
- [x] Integrasi OAuth (Google Login/Signup).
- [x] *Callback handler* untuk manajemen sesi Supabase.

### 2. Modul "Input Data" (Ingesti Transaksi & Pengeluaran)
- [x] **File Uploader**: Unggah dokumen struk (Gambar/PDF/CSV).
- [x] **Kamera Scanner**: Ekstraksi struk via OCR langsung dari kamera perangkat (diolah via `lib/gemini.ts`).
- [x] **Voice Input**: Perekam suara untuk *input* biaya operasional yang di-transkrip oleh AI.
- [x] **Manual Input Form**: Formulir manual untuk cadangan.
- [x] Fitur berjalan dengan lancar dan stabil untuk memproses *expense* (pengeluaran).

### 3. Modul "Database" (Manajemen Data Pengeluaran/Pemasukan)
- [x] Tabel riwayat transaksi interaktif.
- [x] Filter transaksi dinamis via `FilterSidebar` (Tanggal, Tipe, Status, dll).
- [x] Fitur **Talk to Data AI** (CFO Assistant) versi pengeluaran struk: AI dapat diajak berinteraksi terkait data struk yang sudah masuk.

---

## 🚧 Status Saat Ini (Current State)

**19 Juni 2026: Revert Ekstensif (Rollback)**
- Seluruh eksperimen pada fitur **Super Dashboard** (termasuk deteksi CSV lanjutan, perubahan API analitik dengan filter rentang waktu, dan perombakan antarmuka visualisasi yang memusingkan) **TELAH DIHAPUS**.
- *Codebase* di-reset sepenuhnya ke versi di mana fitur **Input Struk** dan **Database Struk** berjalan dengan stabil. (Commit: `27cfe18`)
- **Kondisi Dashboard (Overview)**: Saat ini sebagian besar *chart* di dashboard utama (Overview) masih menggunakan fungsi bawaan (*dummy data* / *hardcoded mock values*) dan komponen analitik lama belum terintegrasi secara dinamis dengan Supabase.

---

## 🎯 Target Selanjutnya (Next Phase Roadmap)

Fokus utama berikutnya adalah merancang fitur **Super Dashboard** ulang dari awal dengan pendekatan yang jauh lebih sederhana, bersih, dan fungsional.

### Sasaran Utama Super Dashboard Baru:
1. **Penyederhanaan UI**: Hapus *widget-widget* analisis yang terlalu rumit (*Heatmap*, *Multi-Channel Analysis*, dll).
2. **Import CSV (Bulk Upload)**: Fitur sederhana untuk *upload* laporan kasir/POS (file `.csv` dengan puluhan ribu baris) dengan sistem proteksi *error* (seperti mendeteksi baris Excel yang dihapus menggunakan *Clear Contents* agar tidak menjadi *ghost data* bernilai Rp 0).
3. **Visualisasi Nyata (Real Data)**: Menampilkan data `.csv` yang di-*upload* ke dalam bagan/grafik yang bersih (misalnya *Total Pemasukan & Pengeluaran*).
4. **Talk to Data (POS Edition)**: Menyediakan kolom *chat* AI di mana pengguna bisa menanyakan rangkuman penjualan dari data yang telah di-*import* tersebut.

---

## ⚠️ Aturan Penting untuk AI Agent
Jika AI Agent membaca dokumen ini untuk melanjutkan pengembangan:
- **JANGAN** menggunakan *Tailwind v3 style* (seperti merubah `styles/global.css` atau mencoba menambahkan plugin usang). Kita menggunakan **Tailwind v4**.
- **JANGAN** membuat schema *database* halusinasi yang tidak ada di `supabase_schema.sql` (Contoh tabel yang *tidak ada*: `branches`, `vendors`, `daily_sales`, `forecasts`). Skema tabel utama kita murni terpusat pada `transactions` (yang memiliki kolom *branch*, *vendor_name*, dll sebagai teks biasa) dan `transaction_items`.
- **JANGAN** gunakan `better-auth`. Kita murni menggunakan Supabase Auth.
- Fokuslah pada **kesederhanaan**. Pengguna ingin fungsi dasar berjalan sempurna dibanding fungsi kompleks yang rawan *bug*.
