# CLAUDE.md — SAVORI Platform
### Smart Analytics for Volume, Operations, and Receipt Integration
**Tim PJK-GM098 | Juni 2026 | v3.0 FINAL**

---

## TENTANG FILE INI

File ini adalah panduan utama bagi AI coder (Claude Code atau sejenisnya) untuk memahami arsitektur, konvensi, aturan, dan batasan implementasi platform **SAVORI**. Baca seluruh file ini sebelum menulis satu baris kode pun.

---

## ⚠️ WAJIB DIBACA SEBELUM MENULIS KODE APAPUN

Sebelum mengerjakan task apapun yang menyentuh UI, komponen, 
halaman, atau styling, baca dua file ini terlebih dahulu:

1. `CLAUDE.md` (file ini) — arsitektur, API, database, aturan coding
2. `DESIGN.md` — sistem desain, warna, tipografi, komponen, spacing

Kedua file ini adalah single source of truth yang tidak boleh 
dilanggar. Jika ada konflik antara keduanya, DESIGN.md menang 
untuk keputusan visual, CLAUDE.md menang untuk keputusan teknis.

---

## 1. RINGKASAN PROYEK

SAVORI adalah platform **Business Intelligence berbasis web** yang dirancang khusus untuk pemilik usaha Food & Beverage (restoran, kafe, warung makan). Platform ini menggabungkan tiga kapabilitas utama:

1. **Dashboard BI real-time** — visualisasi KPI, revenue chart, analisis produk & cabang
2. **Receipt Management** — scan/upload struk pembelian bahan baku dengan AI extraction
3. **Sales Forecasting** — prediksi penjualan 7-30 hari ke depan dengan model ML kustom
4. **Talk to Data** — Q&A berbasis AI untuk query data tanpa SQL knowledge

**Target User**: Pemilik FnB yang ingin keputusan bisnis berbasis data, bukan spreadsheet manual.

---

## 2. TECH STACK

```
Framework       : Next.js 14+ (App Router, React Server Components, TypeScript)
Styling         : Tailwind CSS + shadcn/ui + Lucide Icons
Charts          : Recharts (primary), Chart.js (secondary/fallback)
Database        : Supabase (PostgreSQL)
Caching         : Redis
File Storage    : Supabase Storage (S3-compatible)
AI / Vision     : Google Gemini Flash 2.5 API (model: "gemini-2.0-flash")
ML Models       : Custom-trained in Google Colab (Prophet / scikit-learn), inference in Next.js
Auth            : better-auth (multi-role)
State Mgmt      : Zustand
Deployment      : Vercel (frontend + API) + Supabase (backend)
```

> ⚠️ **Jangan ganti library tanpa alasan kuat.** Stack ini sudah diputuskan final. Jangan usulkan Next.js Pages Router, jangan ganti better-auth dengan NextAuth, jangan ganti Recharts dengan Victory atau Nivo.

---

## 3. STRUKTUR FOLDER

Ikuti struktur ini secara ketat. Jangan buat folder baru tanpa kebutuhan yang jelas.

```
savori/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── logout/route.ts
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Dashboard layout (sidebar + header)
│   │   ├── overview/page.tsx           # Module 1: Dashboard BI
│   │   ├── database/page.tsx           # Module 2: CRUD Receipt Management
│   │   ├── input-data/
│   │   │   ├── scanner/page.tsx
│   │   │   ├── upload/page.tsx
│   │   │   └── manual/page.tsx
│   │   └── settings/page.tsx
│   │
│   ├── api/
│   │   ├── auth/[...auth]/route.ts
│   │   ├── analytics/
│   │   │   ├── kpi-summary/route.ts
│   │   │   ├── monthly-revenue/route.ts
│   │   │   ├── daily-revenue/route.ts
│   │   │   └── product-analysis/route.ts
│   │   ├── transactions/
│   │   │   ├── route.ts                # GET (list), POST (create)
│   │   │   ├── [id]/route.ts           # GET, PATCH, DELETE
│   │   │   └── bulk/route.ts
│   │   ├── scanner/extract/route.ts
│   │   ├── talk-to-data/query/route.ts
│   │   ├── ml/forecast/route.ts
│   │   └── audit/logs/route.ts
│   │
│   ├── error.tsx
│   ├── layout.tsx
│   └── not-found.tsx
│
├── components/
│   ├── dashboard/
│   │   ├── KPICardGrid.tsx
│   │   ├── MonthlyRevenueChart.tsx
│   │   ├── DailyRevenueChart.tsx
│   │   ├── WeeklyRevenueChart.tsx
│   │   ├── HourlyRevenueChart.tsx
│   │   ├── ProductAnalysisPanel.tsx
│   │   ├── MultiChannelAnalysis.tsx
│   │   ├── TopOutletRanking.tsx
│   │   ├── HeatmapPerforma.tsx
│   │   └── GlobalFilterBar.tsx
│   ├── receipt/
│   │   ├── CameraScanner.tsx
│   │   ├── FileUploader.tsx
│   │   ├── ManualInputForm.tsx
│   │   └── ExtractionResult.tsx
│   ├── crud/
│   │   ├── TransactionTable.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── BulkActions.tsx
│   │   └── EditModal.tsx
│   ├── chat/
│   │   ├── TalkToDataPanel.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChartRenderer.tsx
│   │   └── QuickPrompts.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── RoleGuard.tsx
│   ├── ui/                             # shadcn/ui base components
│   │   ├── Button.tsx, Card.tsx, Table.tsx, Modal.tsx
│   │   ├── Dropdown.tsx, Input.tsx, Select.tsx
│   │   ├── DatePicker.tsx, Badge.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── Footer.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useTransactions.ts
│   ├── useAnalytics.ts
│   ├── useForecast.ts
│   └── useTalkToData.ts
│
├── lib/
│   ├── supabase.ts
│   ├── gemini.ts
│   ├── better-auth-config.ts
│   ├── db-schema.ts
│   ├── utils.ts
│   └── constants.ts
│
├── stores/
│   ├── authStore.ts
│   ├── filterStore.ts
│   ├── transactionStore.ts
│   └── forecastStore.ts
│
├── models/
│   ├── sales_forecast_model.pkl
│   ├── forecast_weights.json
│   └── model_loader.py
│
├── public/logos/, icons/, images/
├── styles/globals.css
├── .env.local                          # TIDAK masuk git
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. DATABASE SCHEMA (Supabase PostgreSQL)

### 4.1 Tabel Utama

```sql
-- Users (managed by better-auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'admin',  -- 'super_admin' | 'admin' | 'viewer'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Branches (Cabang)
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors / Suppliers
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (Struk / Nota)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  vendor_id UUID REFERENCES vendors(id),
  transaction_type VARCHAR(50) NOT NULL,     -- 'expense' | 'sale'
  transaction_date TIMESTAMPTZ NOT NULL,
  total_amount NUMERIC(15, 2) NOT NULL,
  source VARCHAR(50) NOT NULL,               -- 'camera' | 'upload' | 'manual'
  receipt_image_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,                    -- soft delete
  ocr_confidence_score FLOAT,
  category VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE
);

-- Transaction Line Items
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity NUMERIC(10, 3),
  unit VARCHAR(50),
  unit_price NUMERIC(15, 2),
  subtotal NUMERIC(15, 2),
  confidence_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Sales (sumber data Dashboard BI)
CREATE TABLE daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  sale_date DATE NOT NULL,
  gross_sales NUMERIC(15, 2),
  net_sales NUMERIC(15, 2),
  cost_of_production NUMERIC(15, 2),
  total_transactions INT,
  avg_transaction_value NUMERIC(15, 2),
  refund_amount NUMERIC(15, 2),
  void_amount NUMERIC(15, 2),
  dine_in_sales NUMERIC(15, 2),
  takeaway_sales NUMERIC(15, 2),
  online_sales NUMERIC(15, 2),
  grabfood_sales NUMERIC(15, 2),
  gofood_sales NUMERIC(15, 2),
  shopee_food_sales NUMERIC(15, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, branch_id, sale_date)
);

-- Product Sales (Analytics)
CREATE TABLE product_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  sale_date DATE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity_sold INT,
  revenue NUMERIC(15, 2),
  cost NUMERIC(15, 2),
  profit_margin NUMERIC(5, 2)
);

-- Forecasts
CREATE TABLE forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  forecast_date DATE NOT NULL,
  predicted_revenue NUMERIC(15, 2),
  confidence_lower NUMERIC(15, 2),
  confidence_upper NUMERIC(15, 2),
  model_version VARCHAR(50),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Targets
CREATE TABLE targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  target_month DATE,
  revenue_target NUMERIC(15, 2),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Trail
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  table_name VARCHAR(100),
  record_id UUID,
  action VARCHAR(50),                        -- 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'
  old_values JSONB,
  new_values JSONB,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);
```

### 4.2 Indexes Wajib

```sql
CREATE INDEX idx_transactions_user_branch_date
  ON transactions(user_id, branch_id, transaction_date);

CREATE INDEX idx_daily_sales_user_branch_date
  ON daily_sales(user_id, branch_id, sale_date);

CREATE INDEX idx_audit_logs_user_table_date
  ON audit_logs(user_id, table_name, performed_at);
```

### 4.3 Aturan Query

- **Semua query wajib filter `user_id`** agar data tidak bocor antar user
- **Soft delete**: Filter `WHERE deleted_at IS NULL` di semua read query
- **Transactions**: Selalu JOIN ke `transaction_items` saat perlu detail item
- **Talk to Data SQL**: Hanya boleh `SELECT`. Dilarang keras `INSERT/UPDATE/DELETE`

---

## 5. AUTHENTICATION & ROLES

### 5.1 Konfigurasi better-auth

```typescript
// lib/better-auth-config.ts
import { betterAuth } from "better-auth";
import { supabaseAdapter } from "better-auth/adapters/supabase";

export const auth = betterAuth({
  database: supabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }),
  emailAndPassword: { enabled: true },
  callbackURL: "/dashboard/overview",
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
});
```

### 5.2 Roles & Permissions

| Permission | super_admin | admin | viewer |
|---|:---:|:---:|:---:|
| Akses semua cabang | ✅ | ❌ (hanya assigned) | ❌ |
| Soft delete | ✅ | ✅ | ❌ |
| Hard delete | ✅ | ❌ | ❌ |
| Export data | ✅ | ✅ | ❌ |
| Akses Settings | ✅ | ❌ | ❌ |
| Restore soft-deleted | ✅ | ❌ | ❌ |

### 5.3 Middleware Route Guard

```typescript
// middleware.ts
import { getSession } from "@/lib/better-auth";

export async function middleware(req: NextRequest) {
  const session = await getSession();

  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (!session) return redirect("/login");
  }

  if (req.nextUrl.pathname.startsWith("/dashboard/settings")) {
    const role = session?.user.role;
    if (role !== "admin" && role !== "super_admin") {
      return redirect("/dashboard/overview");
    }
  }
}
```

---

## 6. API RESPONSE FORMAT (WAJIB DIIKUTI DI SEMUA ENDPOINT)

Semua API route harus mengembalikan format berikut **tanpa terkecuali**:

```typescript
// Success
{
  "status": "success",
  "data": { ... },
  "metadata": {
    "timestamp": "2026-06-14T14:30:00Z",
    "page": 1,          // untuk pagination
    "total": 100,
    "limit": 25
  }
}

// Error
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",   // snake_case ALL CAPS
    "message": "Human readable message",
    "details": { ... }            // optional, untuk field-level errors
  }
}
```

**Kode error standar yang harus digunakan:**

| Code | Kondisi |
|---|---|
| `VALIDATION_ERROR` | Input tidak valid |
| `UNAUTHORIZED` | Tidak ada session |
| `FORBIDDEN` | Role tidak cukup |
| `NOT_FOUND` | Record tidak ditemukan |
| `EXTRACTION_FAILED` | Gemini gagal ekstrak struk |
| `QUERY_FAILED` | Talk to Data SQL error |
| `STORAGE_ERROR` | Supabase Storage gagal |
| `INTERNAL_ERROR` | Kesalahan server umum |

---

## 7. FITUR & MODUL

### 7.1 Module 1: Dashboard BI (`/dashboard/overview`)

**GlobalFilterBar** — sticky bar di bawah header:
- Multi-select branch dropdown + "Semua Cabang"
- Date range: Today | Yesterday | This Week | This Month | Custom
- Tombol "Terapkan Filter" → semua widget refresh serentak
- State disimpan di `filterStore` (Zustand)

**KPI Cards** (2 baris):

| Baris | Card | Konten |
|---|---|---|
| Penjualan | Rata-rata per Transaksi | Primary + count + delta vs prior |
| Penjualan | Penjualan Bersih | Primary + count + items + delta |
| Anomali | Total Refunds | Amount + count + delta |
| Anomali | Total Void | Amount + % of total + delta |

- Status badge: Green (on-target) / Yellow (warning) / Red (below)
- Klik kartu → drill-down modal dengan detail transaksi

**4 Revenue Charts:**

| Panel | Komponen | Chart Type | Series Khusus |
|---|---|---|---|
| Bulanan | `<MonthlyRevenueChart />` | ComposedChart (Bar+Line) | Actual + Prev Year + Target |
| Harian | `<DailyRevenueChart />` | AreaChart | Actual + Prev Period + Target + **Forecast (dashed)** |
| Mingguan | `<WeeklyRevenueChart />` | BarChart per hari | Dengan weekly average line |
| Per Jam | `<HourlyRevenueChart />` | BarChart horizontal | Peak hours warna berbeda |

**Product Analysis:**
- Tabel Top 10 produk (volume + revenue %)
- Tabel Bottom 10 produk (badge "Perlu Perhatian" jika >20% decline)
- Donut chart BCG Matrix: Star / Question Mark / Plowhorse / Dog

**Channel & Outlet:**
- Pie chart: Dine-in / Take Away / Online
- Online breakdown: GrabFood / GoFood / Shopee Food
- Top Outlet Ranking table dengan badge 🥇🥈🥉

**Multi-Branch Heatmap:**
- Grid: Baris = Cabang, Kolom = Hari/Minggu
- Intensitas warna = performa relatif terhadap rata-rata

**Talk to Data (floating panel):**
- Quick prompts: [Ringkasan Penjualan] [Top Produk] [Analisis Cabang] [Prediksi]
- Inline chart rendering via `<ChartRenderer />`

---

### 7.2 Module 2: Receipt Management

#### Input Data Gateway (`/dashboard/input-data`)

**Tab 1 — Scan Kamera** (`CameraScanner.tsx`):
- Live video feed dari device camera
- Auto-detect gambar tajam & centered
- Auto-capture setelah 2 detik steady, atau tombol manual [Scan]
- POST ke `/api/scanner/extract` (base64 + mimetype)
- Tampilkan `<ExtractionResult />` dengan confidence per field
- Field confidence < 80% → highlight merah, wajib verifikasi manual

**Tab 2 — Upload File** (`FileUploader.tsx`):
- Drag-and-drop zone
- Support: JPG, JPEG, PNG, PDF (max 20 file per batch, max 20 halaman PDF)
- Progress bar per file + queue processing
- Setiap file → Gemini extraction → form konfirmasi → save

**Tab 3 — Input Manual** (`ManualInputForm.tsx`):
- Fields: Jenis Transaksi, Vendor (autocomplete), Tanggal, Cabang
- Dynamic items table: Item Name, Qty, Unit, Unit Price, Subtotal (auto-calc)
- Total auto-kalkulasi dari items (bisa di-override)
- Duplicate detection warning
- Validasi sebelum save

#### CRUD Table (`/dashboard/database`)

Layout:
- **Kiri**: Filter sidebar (Date, Vendor, Kategori, Cabang, Sumber)
- **Tengah**: Transaction table
- **Kanan**: Talk to Data panel (toggleable)

Kolom tabel: No | Tanggal | Vendor | Kategori | Cabang | Items | Total | Aksi (👁 ✏️ 🗑️)

Operasi CRUD:
- **CREATE**: Via tab input-data
- **READ**: Pagination 25/50/100, full-text search, sort by date/vendor/total
- **UPDATE**: Modal edit dengan form yang sama seperti input manual + audit log
- **DELETE**: Soft delete (`deleted_at = NOW()`), bisa restore dalam 30 hari (admin only)

---

### 7.3 AI: Receipt Extraction via Gemini Flash 2.5

**Endpoint**: `POST /api/scanner/extract`

Prompt wajib yang harus dikirim ke Gemini:
```
Extract all information from this receipt/invoice image and return ONLY valid JSON 
with this exact structure (no markdown, no extra text):
{
  "vendor_name": {"value": "string", "confidence": 0.0-1.0},
  "transaction_date": {"value": "YYYY-MM-DD", "confidence": 0.0-1.0},
  "items": [
    {
      "name": {"value": "string", "confidence": 0.0-1.0},
      "quantity": {"value": number, "confidence": 0.0-1.0},
      "unit": {"value": "string", "confidence": 0.0-1.0},
      "unit_price": {"value": number, "confidence": 0.0-1.0},
      "subtotal": {"value": number, "confidence": 0.0-1.0}
    }
  ],
  "total_amount": {"value": number, "confidence": 0.0-1.0}
}
For Indonesian receipts, handle formats like: Rp 15.000, 15,000, 15000.
For dates, try to infer the year if not present (likely current year).
```

Response Gemini mungkin dibungkus markdown → selalu strip ````json` sebelum JSON.parse.

---

### 7.4 AI: Talk to Data via Text-to-SQL

**Endpoint**: `POST /api/talk-to-data/query`

Payload: `{ userMessage, branchIds[], dateRange{start, end}, conversationHistory[] }`

Rules SQL yang harus dimasukkan ke system prompt:
1. Hanya `SELECT` query (never INSERT/UPDATE/DELETE)
2. Wajib filter `branch_id IN (user's branches)`
3. Wajib filter date range
4. Respond dalam bahasa yang sama dengan user (Bahasa Indonesia / English)
5. Return JSON: `{ "sql": "...", "chart_type": "table|bar|line|pie|text", "explanation": "..." }`

Schema yang dikirim ke Gemini (simplified):
```
Tables:
- transactions (id, branch_id, vendor_id, transaction_date, total_amount, source, transaction_type)
- transaction_items (id, transaction_id, item_name, category, quantity, unit_price, subtotal)
- daily_sales (id, branch_id, sale_date, net_sales, total_transactions, dine_in_sales, takeaway_sales, online_sales)
- branches (id, name, city, province)
- vendors (id, name, category)
```

Chart rendering di frontend via `<ChartRenderer />` yang switch berdasarkan `chart_type`.

---

### 7.5 ML: Sales Forecasting (Model 1)

**Endpoint**: `GET /api/ml/forecast?branch_id=UUID&days=7`

Model:
- Dilatih di Google Colab dengan Prophet atau scikit-learn ARIMA/SARIMA
- Input: Daily transaction history (minimum 90 hari), hari, hari libur
- Output: `{ date, predicted_revenue, confidence_lower, confidence_upper }[]`
- File model: `models/sales_forecast_model.pkl` + `forecast_weights.json`

Response format:
```json
{
  "status": "success",
  "data": [
    {
      "date": "2026-06-15",
      "predicted_revenue": 450000000,
      "confidence_lower": 420000000,
      "confidence_upper": 480000000
    }
  ],
  "metadata": {
    "model_version": "v1.0",
    "training_date": "2026-06-01",
    "data_points_used": 120
  }
}
```

Tampil di Dashboard:
- Panel 2 (Daily Revenue Chart): Overlay garis forecast (gray dashed)
- Confidence interval: Shaded band abu-abu terang

---

## 8. STATE MANAGEMENT (ZUSTAND)

### filterStore.ts
```typescript
interface FilterState {
  branches: string[];
  dateRange: {
    start: Date;
    end: Date;
    preset: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';
  };
  lastUpdated: Date;
  setFilter: (branches: string[], dateRange: DateRange) => void;
  resetFilter: () => void;
}
```

### authStore.ts
- Simpan user session, role, assigned branches

### transactionStore.ts
- Optimistic updates untuk CRUD operations

### forecastStore.ts
- Cache hasil forecast agar tidak re-fetch setiap render

---

## 9. DESIGN SYSTEM

Seluruh design system ada di file `DESIGN.md` di root project.
Baca file tersebut sepenuhnya sebelum membuat atau memodifikasi
komponen UI apapun.

Ringkasan cepat (detail lengkap di DESIGN.md):
- Primary: #1A3C5E | Accent: #E8863A | Success: #27AE60 | Danger: #E74C3C
- Background: #F4F6F9 | Card: #FFFFFF | Border: #D5D8DC
- Font: Arial | Monospace untuk angka: Courier New
- Semua spacing, radius, shadow — ikuti token di DESIGN.md

### Color Palette

```css
:root {
  --primary: #1A3C5E;           /* Dark Blue — nav, primary buttons */
  --primary-light: #2E5C8F;
  --accent: #E8863A;            /* Orange — CTA, highlights */
  --success: #27AE60;           /* Green — positive delta, on-target */
  --warning: #F39C12;           /* Yellow — warning status */
  --danger: #E74C3C;            /* Red — negative delta, low confidence */
  --ai-purple: #6C3483;         /* Purple — AI/Talk to Data features */

  --bg-main: #F4F6F9;           /* Light gray background */
  --bg-card: #FFFFFF;
  --text-primary: #1C2833;
  --text-secondary: #5D6D7E;
  --border: #D5D8DC;
}
```

### Typography
- Font: Arial (heading bold, body regular)
- H1: 32px | H2: 28px | H3: 24px | Body: 16px | Secondary: 14px
- Monospace (Courier New) untuk nilai angka, kode

### Chart Colors
- Actual data: `--primary` (#1A3C5E)
- Previous period: gray/lighter opacity
- Target line: `--accent` (#E8863A) dashed
- Forecast line: gray dashed
- Positive/above target: `--success`
- Negative/below target: `--danger`

### Loading States
- Semua widget dashboard wajib tampilkan skeleton saat loading
- Skeleton animation (pulse) bukan spinner untuk chart besar
- Skeleton pada empty state: "Data tidak tersedia. Upload data bisnis Anda untuk memulai."

---

## 10. ENVIRONMENT VARIABLES

Buat file `.env.local` (JANGAN commit ke git):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Better Auth
BETTER_AUTH_SECRET=your-random-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Gemini API
GEMINI_API_KEY=AIzaSyxxxxx

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

Untuk production di Vercel, set semua env vars di Vercel dashboard, ganti URL ke production domain.

---

## 11. QUICK START

```bash
# 1. Buat project
npx create-next-app@latest savori --typescript --tailwind --eslint --app
cd savori

# 2. Install dependencies utama
npm install recharts @supabase/supabase-js better-auth @google/generative-ai zustand lucide-react

# 3. Install shadcn/ui
npx shadcn@latest init

# 4. Supabase CLI (opsional, untuk local dev)
npm install -D supabase

# 5. Buat .env.local dan isi sesuai template di atas

# 6. Jalankan dev server
npm run dev
# Buka: http://localhost:3000/login

# 7. Build production
npm run build && npm run start

# 8. Deploy ke Vercel
npx vercel
```

---

## 12. PHASED DEVELOPMENT (URUTAN PRIORITAS)

Ikuti urutan ini. Jangan loncat fase.

**Phase 1 — Foundation (Week 1-2)**
- Project setup (Next.js App Router + TypeScript + Tailwind)
- Database setup + schema migration di Supabase
- better-auth integration + login/register pages
- shadcn/ui base components
- Zustand stores (filterStore, authStore)
- GlobalFilterBar component

**Phase 2 — Input Pipeline & CRUD (Week 3-4)**
- Camera Scanner + Gemini Flash 2.5 extraction
- File Uploader (batch, PDF support)
- Manual input form
- CRUD table dengan filter, search, edit, soft delete
- Audit trail logging

**Phase 3 — Dashboard BI (Week 5-6)**
- KPI Summary Cards + API `/api/analytics/kpi-summary`
- 4 Revenue charts (Monthly, Daily, Weekly, Hourly)
- Product Analysis panel
- Channel & Outlet Analysis
- Multi-branch ranking + heatmap

**Phase 4 — AI & ML (Week 7-8)**
- Sales Forecasting Model (load dari Colab, inference endpoint)
- Overlay forecast di Daily Revenue Chart
- Talk to Data backend (Text-to-SQL + Gemini)
- Talk to Data chat UI + ChartRenderer

**Phase 5 — Polish & Deployment (Week 9-10)**
- Mobile responsiveness
- Error handling + toast notifications
- Loading skeletons
- Performance optimization
- Testing (unit + integration)
- Deploy ke Vercel

---

## 13. FITUR YANG DIHAPUS — JANGAN DIIMPLEMENTASI

Berikut fitur dari versi sebelumnya yang **sudah dihapus dari scope** di v3.0. Jangan buat komponen, route, atau logika untuk fitur-fitur ini:

- ❌ **Modul Stok / Inventaris** — dihapus total
- ❌ **Live Orders** — dihapus dari KPI cards
- ❌ **Promo Tracker** — dihapus dari channel analysis
- ❌ **Export & Laporan** (PDF/Excel report generator) — dihapus
- ❌ **Model 2: Anomaly Detection** — dihapus
- ❌ **Model 3: Menu Intelligence** — dihapus
- ❌ **Model 4: Smart Stock Alert** — dihapus

> Jika ada fitur yang terasa "missing" tapi tidak ada di PRD, kemungkinan besar memang sudah dihapus. Tanyakan ke PM sebelum mengimplementasi.

---

## 14. ATURAN CODING

### TypeScript
- Selalu definisikan tipe, hindari `any`
- Gunakan `interface` untuk object shapes, `type` untuk union types
- Gunakan Pydantic-style validation di semua API route

### Komponen React
- Semua komponen di `components/` harus functional component
- Gunakan React Server Components (RSC) untuk data fetching di Server, Client Components hanya untuk interaktivitas
- Jangan pakai `useEffect` untuk data fetching — gunakan RSC atau React Query/SWR

### API Routes
- Selalu wrap dalam try/catch
- Selalu validasi session di setiap protected route
- Selalu filter berdasarkan `user_id` dari session (bukan dari request body)
- Selalu gunakan format response standar (Section 6)
- Log error dengan `console.error` sebelum return error response

### Keamanan
- Jangan trust `user_id` dari client/request body — ambil dari session
- SQL untuk Talk to Data: Validasi bahwa hanya `SELECT` yang lolos
- Strip markdown wrapper dari respons Gemini sebelum JSON.parse
- Jangan expose `SUPABASE_SERVICE_ROLE_KEY` ke client

### Performance
- Gunakan React.memo untuk komponen chart yang expensive
- Implement pagination untuk semua list (default 25 per halaman)
- Cache hasil forecast di Zustand agar tidak re-fetch terus
- Gunakan `loading.tsx` di setiap route untuk streaming skeletons

---

## 15. SUCCESS METRICS (TARGET PERFORMA)

| Metric | Target |
|---|---|
| Dashboard load time | < 2 detik di koneksi 4G |
| Sales forecast MAPE | < 15% pada test set |
| Receipt scan → save | < 30 detik end-to-end |
| Platform uptime | 99.5% |
| User NPS | > 50 |

---

## RINGKASAN CEPAT UNTUK AI CODER

> **Kamu sedang membangun SAVORI**: Platform BI untuk pemilik FnB Indonesia.
>
> **Stack**: Next.js 14 App Router + TypeScript + Tailwind + Supabase + better-auth + Gemini Flash 2.5 + Recharts + Zustand
>
> **2 modul utama**: (1) Dashboard BI dengan 4 chart + KPI cards + product/channel/branch analysis, (2) Receipt Management dengan camera scan, upload batch, manual input + CRUD table + Talk to Data
>
> **AI features**: Gemini Flash 2.5 untuk OCR struk + Text-to-SQL. Model Prophet/ARIMA dari Colab untuk sales forecast.
>
> **Jangan implementasi**: Stok, Live Orders, Promo, Export laporan, Model 2/3/4.
>
> **Format API wajib**: `{ status: "success"|"error", data: {}, metadata: {} }`
>
> **Data isolation**: Semua query wajib filter `user_id` dari session, bukan dari request body.
>
> **Ikuti fase development** — jangan loncat ke AI sebelum CRUD selesai.

---

**Document Version**: CLAUDE.md v1.0 (derived from PRD v3.0 FINAL)
**Tim**: PJK-GM098
**Last Updated**: Juni 2026
