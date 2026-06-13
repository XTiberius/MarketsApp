# MarketsApp — Project Dossier

> Single source of truth for what MarketsApp is, how it's built, and where it stands. Written so
> any agent (or new engineer) can act without re-deriving context. Pair with
> [`LAUNCH.md`](./LAUNCH.md) for the prioritized path to go-live.
>
> _Maintained as the project evolves. Last full audit: 2026-06-13._

---

## 1. Executive summary

MarketsApp is a **private venture marketplace for accredited investors.** Admins publish deal
**listings** — primary raises or secondary share sales — with a public teaser; the sensitive
terms (valuation, amount raised, investment structure) stay **locked behind a per-deal NDA** that
the investor signs by drawing a signature. Investors complete **KYC / accreditation** (reviewed
manually by an admin), then place **bids** (minimum **$50,000**) that an admin advances through a
fixed state machine. Deal **documents** (investment agreement, K-1, Reg D) are attached to a bid
along the way.

**Money moves off-platform** (bank wire). The app does **not** process payments — it tracks
status: an admin marks a bid `invested` once funds arrive. Auth is **passwordless email OTP**.
There are two roles: **investor** and **admin**.

## 2. Product intent & key rules

- **Gated confidentiality:** public listing fields are safe to show anyone; valuation / amount
  raised / investment structure are revealed only after the investor signs that listing's NDA.
- **Accreditation gate:** an investor cannot bid until their KYC is **approved** by an admin.
- **One active bid per investor per listing** (DB-enforced, except rejected bids).
- **Bid state machine** (server-enforced): `placed → accepted | rejected`,
  `accepted → awaiting_payment`, `awaiting_payment → invested`.
- **Off-platform settlement:** `awaiting_payment → invested` is a manual admin action after a wire.

## 3. Roles & primary flows

**Investor**
1. Sign in (email OTP) → complete profile (first/last name).
2. Browse `/listings` → open a listing → **sign NDA** (draw signature) to unlock deal terms.
3. Submit **KYC** (individual) → wait for admin approval.
4. Once approved, **place a bid** (≥ $50k) → track it on `/bids`.

**Admin**
1. Create/edit **listings** (`/admin/listings`).
2. Review & **approve/reject KYC** (`/admin/users`).
3. Review **bids** and advance status (`/admin/bids`).
4. Upload deal **documents** to accepted bids; view all docs (`/admin/documents`).

## 4. Architecture

**Stack:** Next.js 16.2 (App Router) · React 19 · TypeScript (strict) · Supabase (Auth + Postgres
+ Storage) · Tailwind 4 + shadcn/ui (Radix) · TanStack Query (configured, **not yet used** — all
fetching is server components + `fetch()` mutations).

### 4.1 Routes (`src/app/`)
- **Public:** `/` (landing), `/listings` (grid), `/listings/[id]` (detail; NDA-gated terms, inline
  NDA + bid modals).
- **Auth:** `/auth/login` (email → OTP), `/auth/verify-code` (6-digit), `/auth/complete-profile`,
  `/auth/kyc` (KYC form).
- **Investor:** `/bids` (own bids; `requireKycApproved`), `/profile` (account + KYC status).
- **Admin (`requireAdmin`):** `/admin/dashboard`, `/admin/listings`, `/admin/listings/new`,
  `/admin/listings/[id]` **(edit — STUBBED, TODO)**, `/admin/bids`, `/admin/users` **(KYC view
  only — no approve/reject UI yet)**, `/admin/documents`.

### 4.2 API (`src/app/api/`)
- **Auth:** `POST /api/auth/login` (send OTP), `/verify-code` (verify), `/logout`.
- **Users:** `PATCH /api/users/me` (own name only), `PATCH /api/users` (admin: KYC status + notes).
- **KYC:** `POST /api/kyc` (investor submits individual KYC → status `pending`).
- **NDA:** `POST /api/nda` (upload signature PNG → `signatures` bucket → `nda_signatures` row).
- **Listings:** `GET` (published; excludes confidential fields), `POST` (admin create),
  `DELETE /api/listings/[id]` (admin).
- **Bids:** `GET` (own + joined listing), `POST` (place; min $50k), `PATCH /api/bids/[id]`
  (admin state transition; `VALID_TRANSITIONS` enforced).
- **Documents:** `POST /api/documents` (admin upload to a bid → `documents` bucket +
  `associated_documents` row). **No UI triggers this yet.**

### 4.3 Data model (`supabase/migrations/`, 9 migrations, RLS on all 7 tables)
- **users** (id=auth.uid, email, role, kyc_status, first/last name) — auto-created by
  `handle_new_user` trigger; `prevent_unauthorized_user_changes` blocks non-admins editing
  role/kyc_status.
- **kyc_individual** / **kyc_entity** (1:1 with users; submission + review metadata).
- **listings** (admin_id, company_name, logo_url, description, valuation, amount_raised,
  investment_structure, nda_text, listing_type[`primary|secondary`], industry,
  status[`draft|published|closed`]).
- **bids** (investor_id, listing_id, amount≥0, status[bid_status], nda_signed*) — unique
  `(investor_id, listing_id)` where status ≠ rejected.
- **nda_signatures** (investor_id, listing_id, signature_image_url) — unique per
  (investor, listing); signed **before** bidding (restructured in migration 007).
- **associated_documents** (bid_id, file_name, file_url, document_type[`investment_agreement|k1|
  reg_d|other`], uploaded_by).
- Enums: user_role, kyc_status, entity_type, listing_type, listing_status, bid_status,
  document_type. Helper `is_admin()` (SECURITY DEFINER) used across RLS.

### 4.4 Auth & session
- Supabase email OTP. Browser + server clients in `src/lib/supabase*.ts`; guards in
  `src/lib/auth.ts` (`getServerUser`, `requireAuth`, `requireAdmin`, `requireKycApproved`).
- **`src/proxy.ts`** holds the session-refresh middleware logic **but is not wired** — there is no
  `src/middleware.ts`, so session refresh is currently inactive. (See LAUNCH P0.)

### 4.5 Storage (Supabase buckets, RLS via migrations 008/009)
- **logos** (public), **signatures** (private; `{investor}/{listing}/*.png`; investor writes own,
  admin reads all), **documents** (private; `{bid_id}/*`; admin writes, investor reads own bid's).

### 4.6 Env
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public). Optional server-side
  `SUPABASE_SERVICE_ROLE_KEY`. Secrets live in `.env.local` (never read/committed; gitignored).

## 5. Current state (2026-06-13 audit)

**Working:** data model + RLS, email-OTP auth, browse → NDA → bid → admin bid-review, listing
**create**, KYC **submit**, storage policies, code/schema in sync (no drift).

**Known gaps** (→ tracked in [`LAUNCH.md`](./LAUNCH.md)):
- Session middleware not wired (`proxy.ts` → needs `middleware.ts`).
- Admin **KYC approve/reject UI** missing (endpoint exists).
- Admin **listing-edit** form stubbed.
- Admin **document-upload UI** missing (backend ready).
- `kyc_entity` missing an admin-UPDATE RLS policy.
- No tests / CI / deploy config; light hardening (rate-limit, file validation, error/404) absent.

**Repo:** `github.com/XTiberius/MarketsApp`, branch `main` — **13 commits unpushed** + an
in-progress server-side auth refactor uncommitted (login/verify/logout moving to API routes).
Get to a clean, pushed state before feature work (LAUNCH P0).

## 6. Operating notes
- This repo is overseen by the **Brain operator** (`~/Brain`); `brain:*` marker blocks in
  `CLAUDE.md` / `AGENTS.md` / `.gitignore` are managed — edit them in the Brain, not here.
- Security protocol applies: never read/print/commit secrets (`.env.local`, keys). See `AGENTS.md`.
