# S.A.V.O.R.I - Project Master Context

## 1. Konsep Utama & Visi Produk
**S.A.V.O.R.I (Smart Analytics & Vision-Oriented Restaurant Intelligence)** adalah platform *Business Intelligence* (BI) bertenaga AI yang dirancang khusus untuk pemilik usaha F&B skala menengah ke bawah (UMKM, Kafe, Resto). 

Masalah utama yang diselesaikan: Pemilik F&B memiliki banyak data mentah (struk belanja bahan baku dari *supplier*, dan ekspor penjualan CSV dari GoFood/RunchisePOS), tetapi tidak memiliki analis data untuk membacanya.

**Solusi S.A.V.O.R.I:**
Platform ini bertindak sebagai "Buku Besar & Analis Bisnis Otomatis". Data bersifat *persistent* (tersimpan di database). 
Alih-alih menjadi sekadar alat "Generate Report" sekali pakai, S.A.V.O.R.I adalah **Dashboard Hidup (Real-time to DB)**. Setiap kali *user* menginput data baru (via scan kamera struk bahan baku atau upload CSV penjualan), *Dashboard* langsung bereaksi (*real-time update*) menampilkan metrik terkini.

## 2. Arsitektur AI (Local-First & Privacy)
Meninggalkan ketergantungan API pihak ketiga (Gemini) yang membatasi privasi data bisnis.
1. **Vision OCR (Ekstraksi Struk):** Menggunakan `LLaVA` via **Ollama**. Mampu membaca gambar struk dan mengubahnya menjadi JSON terstruktur (Vendor, Total, Item).
2. **Talk-to-Data (Chat Analyst):** Menggunakan `llama3.2:1b` via **Ollama**. Berfungsi sebagai asisten pintar untuk membalas pertanyaan "Berapa total pengeluaran ke vendor A?" menggunakan konteks data dari database.
3. **Forecasting (Prediksi):** Menggunakan model kustom `model_xgb.pkl` (XGBoost) yang dijalankan melalui Microservice Python (FastAPI).

## 3. Fitur Utama & Alur Pengguna (User Flow)
1. **Database & Input Data (The Feeder):**
   - User memindai struk belanja fisik (Kamera) -> AI mengekstrak -> Disimpan ke DB sebagai 'Pengeluaran' (Expense).
   - User mengunggah CSV penjualan bulanan -> Disimpan ke DB sebagai 'Pemasukan' (Revenue).
   - Semua data ini berkumpul di tabel `transactions`.
2. **Dashboard Overview (The Brain):**
   - **Anti-Pattern:** TIDAK ADA *Skeleton Loading* permanen.
   - Jika Database kosong: Munculkan **Empty State** yang cantik ("Belum ada data. Silakan input struk atau CSV").
   - Jika ada data: Langsung *render chart* secara cepat. Data di *dashboard* selalu mencerminkan isi database saat ini (Real-time terhadap Database).
3. **Talk-to-Data (The Assistant):**
   - *Floating button* yang selalu ada. User bisa meminta saran, visualisasi, atau analisis mendalam dari data yang sudah terkumpul.

## 4. Tech Stack
- **Frontend & Backend API:** Next.js 16.2.9 (App Router) + React 19 + Tailwind CSS v4.
- **Database:** Supabase (PostgreSQL) - Tabel utama: `transactions`.
- **LLM Provider:** Ollama (localhost:11434) menggunakan adapter `lib/llm-provider.ts`.
- **Forecasting Microservice:** Python 3.11 + FastAPI + XGBoost (localhost:8000).

## 5. Panduan UI/UX (Aesthetic over Generic)
- **Tema:** Warm & Humanist (Warna Krim/Beige dengan aksen Coral/Navy).
- **Tipografi:** Serif untuk Heading (Kesan Premium/Elegan), Sans-serif untuk Data (Kejelasan).
- **Responsivitas:** Wajib sempurna di HP (*Mobile-First* untuk fitur kamera/input) dan optimal di Desktop (untuk Dashboard kompleks).
- **Loading State:** Gunakan transisi halus atau *skeleton* maksimal 1 detik saat *fetching*. Jika tidak ada data, WAJIB gunakan grafis *Empty State* yang mengajak user menekan tombol "Input Data", BUKAN *skeleton* kosong yang terkesan aplikasi rusak/macet.
