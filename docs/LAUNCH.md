# MarketsApp — Launch Roadmap

> Living checklist the Brain + sub-agents work through to reach launch. Check items off as they
> land. Each item is tagged for **model routing**: `[critical→in-session]` (judgment/security —
> the orchestrating Claude session does it) vs `[grunt→Codex]` (mechanical/well-specified —
> delegate to Codex `gpt-5.5` high via `/codex:rescue`, then review in-session before merging).
>
> Context & architecture: [`PROJECT.md`](./PROJECT.md). Launch posture: **real money possible,
> private-beta-level compliance — bias to shipping**, off-platform/manual payments, manual KYC.

## Status key
`[ ]` todo · `[~]` in progress · `[x]` done · `[-]` cut/deferred

---

## P0 — blocks a working launch

- [x] **Repo to a clean state** — server-side auth refactor validated; WIP + backlog committed and pushed. `[critical→in-session]`
- [x] **Verify auth/session** — `src/proxy.ts` is the active Next-16 middleware-equivalent
  (Middleware→Proxy); session refresh live, no `middleware.ts`. Build/smoke/real-login confirmed. `[critical→in-session]`
- [x] **Admin KYC approve/reject UI** — `AdminKycManagement` on `/admin/users`: applicant detail
  panel + Approve + Reject-with-required-reason → `PATCH /api/users`. (Codex-built, reviewed in-session.) `[grunt→Codex]`
- [x] **Migrations applied to prod Supabase** — Supabase CLI linked; 001–009 baselined; migration
  010 (grants reconcile) pushed. Supabase changes are now hands-off via `supabase db push`. `[critical→in-session]`
- [x] **Migration 010: `kyc_entity` admin-UPDATE RLS** — included in 010 and pushed. `[grunt→Codex]`
- [x] **Deploy** — live on Vercel (Git-integration, auto-deploy on `main`); domain
  `www.ionicmarkets.com` (apex 308→www) via GoDaddy DNS, valid HTTPS. Supabase Site URL +
  redirect allow-list point at the prod domain. Real OTP login verified end-to-end →
  `/listings`. `[critical→in-session]`

## P1 — needed for a real (even beta) launch

- [ ] **Admin listing-edit form** — implement `/admin/listings/[id]` (currently a TODO stub);
  mirror `NewListingForm` for edit + status changes. `[grunt→Codex]`
- [ ] **Admin document-upload UI** — attach investment docs to an accepted bid (backend
  `POST /api/documents` is ready; admin uploads post-accept). `[grunt→Codex]`
- [ ] **Cheap hardening** — rate-limit auth endpoints; validate file type/size on document +
  signature uploads. `[grunt→Codex]`
- [ ] **Error / empty / loading states** — `app/error.tsx`, `app/not-found.tsx`, key loading
  fallbacks. `[grunt→Codex]`
- [ ] **Email deliverability** — confirm Supabase Auth sender/SMTP is production-configured so
  OTPs arrive reliably at volume. `[critical→in-session]` (verify; may already be done)

## P2 — fast-follow / post-launch OK

- [x] **e2e tests + minimal CI** — Playwright (public / investor / admin projects) + GitHub Actions
  (lint + typecheck + build). Public suite passes 3/3; **authed/admin specs run once
  `SUPABASE_SERVICE_ROLE_KEY` is set in the local env file** (admin-bypass seeding). e2e-in-CI is a
  documented fast-follow. (Codex-built, reviewed in-session.) `[grunt→Codex]`
- [ ] **Accessibility + monitoring + seed** — ARIA/alt labels pass; Sentry error tracking; a seed
  script for demo data. `[grunt→Codex]`
- [ ] **Wire TanStack Query** — it's configured but unused; optional cleanup/consistency. `[grunt→Codex]`

## Backlog / to triage (add here)
- _Legal: terms & conditions / privacy / investment-disclaimer pages?_
- _Investor email notifications (KYC decision, bid accepted, docs ready)?_
- _Custom domain + branding pass?_
- _Analytics?_

---

### Execution protocol (per item)
1. Clarify scope if ambiguous. 2. Build (delegate grunt to Codex with a complete spec + success
criteria). 3. Review Codex output in-session before merging. 4. Verify against named criteria
(run it / tests). 5. Operator rule: don't commit unrelated WIP; keep changes reviewable; commit
only what the item covers.
