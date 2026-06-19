<div align="center">
  <img src="banner.jpg" alt="S.A.V.O.R.I Banner" width="100%" />

  <br />
  <br />

  # ✦ S.A.V.O.R.I
  **Smart Analytics & Vision Optimization for Restaurant Intelligence**

  <p align="center">
    Sistem manajemen transaksi dan pengeluaran cerdas berbasis AI generasi berikutnya. Dirancang untuk otomatisasi ekstraksi data struk serta pelacakan keuangan real-time menggunakan kombinasi Vision Language Models (VLM), Speech-to-Text (STT), dan ML Forecasting mutakhir.
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

## 📖 Deskripsi Singkat Proyek
**S.A.V.O.R.I** (Smart Analytics & Vision Optimization for Restaurant Intelligence) adalah aplikasi berbasis web yang merevolusi cara bisnis (terutama restoran dan retail) dalam mencatat pengeluaran dan menganalisis tren pendapatan. 

Aplikasi ini menggunakan teknologi AI tingkat lanjut untuk menyederhanakan *data entry*:
- **Pemindai Struk Otomatis (Vision)**: Pengguna dapat memfoto atau mengunggah beberapa struk sekaligus (Batch Processing), dan AI Qwen 2.5 VL akan mengekstrak detail transaksi secara akurat.
- **Pencatatan Berbasis Suara (Voice)**: Pengguna cukup berbicara untuk mencatat pengeluaran ("Beli bahan baku daging 500 ribu"), dan AI Groq Whisper akan mengubahnya menjadi data terstruktur.
- **Prediksi Cerdas (Forecasting)**: Menggunakan model Machine Learning kustom (XGBoost) yang berjalan di *microservice* Python untuk memprediksi tren pendapatan di masa depan.

---

## 🛠️ Tautan Model AI / ML & Notebook
Proyek ini menggunakan model **XGBoost** untuk fitur prediksi pendapatan (Forecasting). Seluruh proses pelatihan (*training*), evaluasi model, dan *data preprocessing* terdapat di dalam file Jupyter Notebook yang disertakan.

- **Notebook Pelatihan (Source Code AI)**: Anda dapat melihat dan menjalankan file `Model_Timeseries.ipynb` yang berada di *root* direktori (atau buka menggunakan Google Colab / Jupyter).
- **File Model Pre-trained (.pkl)**: Model hasil *training* telah diunggah ke Google Drive.

🔗 **[Tautan Download Model XGBoost (.pkl) di Google Drive](https://drive.google.com/drive/folders/1dnweuhweCJoxlpFygEU23-cms1-SQBQ3?usp=sharing)**

> **Catatan untuk Tim Penilai**: Folder Google Drive di atas berisi file model ML dan telah diatur akses "*Viewer*" untuk akun **pijak@student.devacademy.id**.

---

## ⚙️ Petunjuk Setup Environment

### 1. Kebutuhan Sistem (Prerequisites)
Pastikan Anda telah menginstal:
- **Node.js** (v18+)
- **Python** (v3.9+)
- **npm** atau **yarn**
- Akun **Supabase** (untuk Database & Autentikasi)
- API Keys dari **OpenRouter** (untuk Qwen), **Groq** (untuk Llama/Whisper), dan **Gemini** (sebagai *fallback*).

### 2. Instalasi Dependensi
Jalankan perintah berikut di terminal:

```bash
# 1. Clone repositori ini
git clone https://github.com/MuhammadAnbiya/S.A.V.O.R.I.git

# 2. Masuk ke dalam direktori proyek
cd S.A.V.O.R.I

# 3. Instal dependensi Node.js (Frontend & Backend Next.js)
npm install

# 4. Instal dependensi Python (Microservice Forecasting)
cd services/forecasting
pip install -r requirements.txt
cd ../..
```

### 3. Konfigurasi Environment Variables (`.env`)
Gunakan template `.env.example` yang telah disediakan untuk membuat file konfigurasi Anda:

1. Duplikasi file `.env.example` dan ubah namanya menjadi `.env.local`
2. Buka `.env.local` dan isi dengan kredensial Anda yang sebenarnya:
   - **Supabase**: Dapatkan URL dan Key dari Dashboard Supabase Anda.
   - **API Keys**: Masukkan key dari Groq, Gemini, dan OpenRouter.
   - **Database**: Jika menggunakan database baru, pastikan skema sudah disesuaikan menggunakan file `supabase_schema.sql` yang tersedia.

*(Ingat: Jangan pernah men-commit file `.env.local` ke repositori publik!)*

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi S.A.V.O.R.I terdiri dari dua layanan utama yang harus dijalankan secara bersamaan:

### Langkah 1: Jalankan Microservice Python (AI Forecasting)
Microservice ini menggunakan **FastAPI** untuk menyajikan model ML XGBoost.
Buka terminal pertama, lalu arahkan ke folder *forecasting*:

```bash
cd services/forecasting
uvicorn main:app --port 8000 --reload
```
*(Server AI akan berjalan di `http://127.0.0.1:8000`)*

### Langkah 2: Jalankan Server Utama Next.js
Buka jendela terminal baru di *root* direktori proyek, lalu jalankan:

```bash
npm run dev
```

### Langkah 3: Akses Aplikasi
Buka web browser pilihan Anda dan kunjungi:
👉 **[http://localhost:3000](http://localhost:3000)**

Anda siap untuk menggunakan S.A.V.O.R.I!

---

## 📂 Struktur Repositori
- `app/` : Direktori utama Next.js (Frontend Pages & API Routes).
- `components/` : Komponen UI React (*Scanner*, *Voice Uploader*, Tabel).
- `lib/` : Fungsi utilitas dan konfigurasi SDK AI.
- `services/forecasting/` : **Microservice ML Python** berisi model XGBoost dan FastAPI.
- `.env.example` : Template environment variables.
- `supabase_schema.sql` : Skema database lengkap untuk setup tabel Supabase.

---

<div align="center">
  <p>Dibuat dengan ❤️ untuk merevolusi efisiensi operasional F&B dan Retail.</p>
</div>