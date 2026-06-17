<div align="center">
  <img src="public/banner.jpg" alt="S.A.V.O.R.I Banner" width="100%" />

  <br />
  <br />

  # ✦ S.A.V.O.R.I
  **Smart Automated Voice & Optical Receipt Intelligence**

  <p align="center">
    Sistem manajemen transaksi dan pengeluaran cerdas berbasis AI generasi berikutnya. Dirancang untuk otomatisasi ekstraksi data struk serta pelacakan keuangan real-time menggunakan kombinasi Vision Language Models (VLM) dan Speech-to-Text (STT) mutakhir.
  </p>

  <br />

  <!-- Badges -->
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.2.9-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
  <br />
  <img src="https://img.shields.io/badge/Qwen_2.5_VL-AI_Vision-blue?style=for-the-badge" alt="Qwen 2.5 VL" />
  <img src="https://img.shields.io/badge/Llama_3.3_70B-AI_Reasoning-purple?style=for-the-badge" alt="Llama 3" />
  <img src="https://img.shields.io/badge/Groq_Whisper-Voice_to_Text-red?style=for-the-badge" alt="Groq Whisper" />
</div>

<hr />

## ✨ Fitur Utama (Core Features)

### 🎙️ 1. Voice-to-Data Intelligence (Pesan Suara)
Tidak punya waktu untuk mengetik? Cukup tekan tombol *Mic* dan ucapkan transaksi Anda (contoh: *"Makan siang di Solaria abis 120 ribu bayar pake QRIS"*). 
Sistem akan menggunakan **Groq Whisper Large V3** untuk mentranskripsi suara Anda secara kilat (< 1 detik), lalu **Llama 3.3 70B** akan mengekstraknya menjadi data JSON terstruktur yang langsung masuk ke *database*!

### 📸 2. Vision OCR Extractor (Pemindai Struk)
Unggah foto struk belanja atau gunakan kamera langsung. Model VLM **Qwen 2.5 VL 72B** akan membaca secara cerdas nama vendor, tanggal, daftar item belanja (nama, *qty*, harga), hingga total harga dengan tingkat akurasi luar biasa.

### 🗄️ 3. Smart Database Management
Manajemen *database* transaksi bergaya *spreadsheet* modern. 
- Filter pencarian kompleks (Kategori, Rentang Tanggal, Sumber Input, Cabang).
- *Sorting* cerdas yang menempatkan data terbaru (*created_at*) selalu di atas.
- *Pagination* responsif.
- Fitur *Export* ke CSV.

### 🎨 4. Premium & Elegant UI/UX
Dibangun menggunakan desain sistem *Radix-Nova* dan *Tailwind CSS v4*, menghasilkan *interface* yang mewah, mulus, dan responsif (mendukung *Glassmorphism* dan animasi interaktif).

---

## 🛠️ Arsitektur & Teknologi (Tech Stack)

| Kategori | Teknologi | Penjelasan |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | *Server Actions* & *React Server Components*. |
| **Styling** | Tailwind CSS v4 & Shadcn/UI | Sistem desain modern dengan variabel CSS *custom*. |
| **Database** | PostgreSQL (via Supabase) | Penyimpanan data relasional skala penuh. |
| **Authentication** | Supabase Auth (@supabase/ssr) | Autentikasi aman berbasis sesi (*Session-based*). |
| **Vision AI** | Qwen 2.5 VL 72B Instruct | Membaca struk gambar (*Optical Character Recognition*). |
| **Voice/Text AI** | Groq (Whisper + Llama 3.3) | Transkripsi suara & penalaran logika JSON super cepat. |

---

## 🚀 Cara Menjalankan Proyek (Getting Started)

### 1. Kebutuhan Sistem (Prerequisites)
Pastikan Anda telah menginstal:
- Node.js (v18+)
- npm / yarn / pnpm
- Akun Supabase (untuk Database & Auth)
- API Keys dari OpenRouter (untuk Qwen) & Groq (untuk Llama/Whisper).

### 2. Instalasi
```bash
# 1. Clone repositori ini
git clone https://github.com/MuhammadAnbiya/S.A.V.O.R.I.git

# 2. Masuk ke dalam direktori proyek
cd S.A.V.O.R.I

# 3. Instal dependensi
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env.local` di *root* proyek Anda, dan sesuaikan nilai-nilainya:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=ey...
SUPABASE_SERVICE_ROLE_KEY=ey...

# AI Configuration (Vision & Voice)
QWEN_API_KEY=sk-or-v1-xxx...
QWEN_BASE_URL=https://openrouter.ai/api/v1
QWEN_MODEL_NAME=qwen/qwen-2.5-vl-72b-instruct

GROQ_API_KEY=gsk_xxx...
```

### 4. Menjalankan Server Pengembangan (Dev Server)
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di *browser* Anda untuk melihat hasil akhirnya.

---

## 📂 Struktur Folder Penting

- `app/` - Direktori utama Next.js App Router (Halaman & API Routes).
- `app/api/scanner/voice` - *Endpoint* pemroses *Voice-to-Data* (Groq).
- `app/api/scanner/extract` - *Endpoint* pemroses foto struk (Qwen).
- `components/receipt/` - Komponen khusus pemindai struk & penangkap suara (*VoiceUploader*).
- `components/crud/` - Komponen tabel *database*, *sidebar filter*, dan aksi data.
- `lib/` - Fungsi-fungsi *helper* & integrasi AI klien.
- `supabase_schema.sql` - Skema asli tabel SQL untuk diimpor ke Supabase.

---

<div align="center">
  <p>Dibuat dengan ❤️ untuk merevolusi pencatatan keuangan manual.</p>
</div>