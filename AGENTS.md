<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SAVORI — Agent Instructions

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint only (no typecheck in scripts) |

No tests or typecheck scripts exist. `tsc --noEmit` can be run manually.

## Architecture

- **Next.js 16.2.9** App Router + React 19.2.4
- **Tailwind CSS v4** (`@tailwindcss/postcss`, NOT v3 config style)
- **CSS entry**: `app/globals.css` (Tailwind v4 `@import "tailwindcss"`). `styles/global.css` is legacy v3 style — unused
- **shadcn/ui** style: `radix-nova` (v4 style — uses `shadcn/tailwind.css`, NOT `@apply`)
- **Auth**: Supabase Auth via `@supabase/ssr` (NOT better-auth — `lib/better-auth-config.ts` is dead code)
- **Database**: Supabase PostgreSQL — schema in `supabase_schema.sql` (simpler than CLAUDE.md claims)
- **Dashboard data is currently hardcoded mock values** — not real DB aggregations
- **Gemini fallback**: `lib/gemini.ts` returns mock data on API failure (quota), does not throw
- **Env var mismatch**: All Supabase clients use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, but `.env.local` sets `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Auth will fail until this is reconciled
- **No `hooks/` or `stores/` dirs exist** despite CLAUDE.md listing them

## Key file locations

| What | Path |
|---|---|
| Middleware | `proxy.ts` (NOT `middleware.ts`) |
| Auth actions | `actions/auth.ts` (server actions using Supabase) |
| Supabase client (server) | `utils/supabase/server.ts` |
| Supabase client (browser) | `utils/supabase/client.ts` |
| Supabase middleware | `utils/supabase/middleware.ts` |
| Real design tokens | `DESIGN_QUICK_REF.md` (NOT `DESIGN.md` — that's Claude.com's design system) |
| Gemini receipt extraction | `lib/gemini.ts` |
| API response format | Inconsistent across routes — some use `{ data, metadata }`, others use `{ status, data, metadata }` |
| Config references | `components.json`, `tailwind.config.ts` |
| Dashboard pages | `app/dashboard/` (NOT `app/(dashboard)/` — that route group is empty) |
| Login/Register pages | `app/login/`, `app/register/` |
| Layout CSS (Tailwind v4) | `app/globals.css` (NOT `styles/global.css` — legacy v3) |

## Database

Actual tables (from `supabase_schema.sql`): `transactions`, `transaction_items`, `audit_logs`.
The much larger schema in `CLAUDE.md` (branches, vendors, daily_sales, product_sales, forecasts, targets) does NOT exist.

Actual `transactions` columns: `id`, `user_id`, `vendor_name`, `transaction_date`, `branch`, `type`, `category`, `amount`, `status`, `source`, `receipt_image_url`, `notes`, `average_confidence`, `deleted_at` (soft delete).
The `transactions` table is flat (no normalized `branches`/`vendors` tables).

## What not to do

- Don't implement features listed as removed in CLAUDE.md (inventory, live orders, promo tracker, PDF exports, anomaly detection, menu intelligence, stock alerts)
- Don't import `better-auth` — it's installed but unused; auth is Supabase
- Don't follow `DESIGN.md` for SAVORI UI — it's an unrelated Anthropic design spec. Use `DESIGN_QUICK_REF.md` + `tailwind.config.ts` instead
- Don't expect the standard API response format from CLAUDE.md — existing code uses varying formats; ask before standardizing
