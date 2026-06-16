# SAVORI

SAVORI adalah sistem manajemen transaksi dan pengeluaran cerdas berbasis AI yang dirancang untuk otomatisasi ekstraksi data struk serta pelacakan keuangan yang akurat. Proyek ini mengintegrasikan pengenalan gambar (LLM) dengan sistem manajemen basis data untuk memberikan wawasan keuangan yang *actionable*.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Shadcn/UI
- **Database**: PostgreSQL (Supabase)
- **Auth**: Better-Auth
- **AI Integration**: Google Gemini API
- **Deployment**: Vercel

## Fitur Utama
* **Input Pipeline**: Ekstraksi data otomatis dari foto/PDF struk menggunakan Gemini Vision.
* **Database Management**: CRUD transaksi yang terintegrasi dengan audit log.
* **Multi-Input**: Mendukung input kamera, unggah file, dan *manual entry*.
* **Dashboard**: Wawasan statistik transaksi dengan antarmuka yang bersih dan modern.