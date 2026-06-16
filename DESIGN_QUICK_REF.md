# DESIGN Quick Reference — SAVORI
## (Ringkasan dari DESIGN.md — baca DESIGN.md untuk detail lengkap)

### Warna Utama
| Token | Hex | Tailwind Class | Digunakan untuk |
|---|---|---|---|
| primary | #1A3C5E | `bg-primary` | Sidebar, tombol utama |
| accent | #E8863A | `bg-accent` | CTA, highlight |
| success | #27AE60 | `text-success` | Delta positif, on-target |
| danger | #E74C3C | `text-danger` | Delta negatif, error |
| bg-main | #F4F6F9 | `bg-bg-main` | Background halaman |
| bg-card | #FFFFFF | `bg-bg-card` | Card, panel |

### Tipografi
| Elemen | Size | Weight | Class |
|---|---|---|---|
| H1 | 32px | Bold | `text-3xl font-bold` |
| H2 | 28px | Bold | `text-2xl font-bold` |
| Body | 16px | Regular | `text-base` |
| Secondary | 14px | Regular | `text-sm text-text-secondary` |
| Angka/KPI | - | Mono | `font-mono` |

### Komponen Wajib (Pattern)
- **Card**: `bg-bg-card rounded-lg border border-border shadow-sm p-6`
- **Button Primary**: `bg-primary text-white hover:bg-primary-light`
- **Button Accent**: `bg-accent text-white hover:opacity-90`
- **Badge Success**: `bg-success/10 text-success text-xs px-2 py-1 rounded-full`
- **Badge Danger**: `bg-danger/10 text-danger text-xs px-2 py-1 rounded-full`

### Chart Colors (Recharts)
- Actual data: `#1A3C5E`
- Previous period: `#94A3B8` (opacity 50%)
- Target line: `#E8863A` dashed
- Forecast: `#94A3B8` dashed
- Positive area fill: `#27AE60` opacity 10%

### Layout
- Sidebar width: [ambil dari DESIGN.md]
- Card padding: [ambil dari DESIGN.md]
- Gap antar section: [ambil dari DESIGN.md]