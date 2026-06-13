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

- [ ] **Repo to a clean state** — finish/validate the in-progress server-side auth refactor;
  commit + push the WIP and the 13 unpushed commits so `main` is known-good. `[critical→in-session]`
- [ ] **Wire session middleware** — add `src/middleware.ts` re-exporting `src/proxy.ts`; verify
  login → verify-code → complete-profile → logout and session refresh work end-to-end. (User
  believes auth is configured — confirm; fix only the wiring gap, don't rebuild.) `[critical→in-session]`
- [ ] **Admin KYC approve/reject UI** — buttons + notes on `/admin/users`, wired to the existing
  `PATCH /api/users`. Unblocks the whole investor path (no bid without approved KYC). `[critical→in-session]`
- [ ] **Migrations applied to prod Supabase** — confirm 001–009 (esp. once-untracked 002 & 009)
  are applied; prod DB == repo schema. `[critical→in-session]`
- [ ] **Migration 010: `kyc_entity` admin-UPDATE RLS** — add the missing policy mirroring
  `kyc_individual`. `[grunt→Codex]`
- [ ] **Deploy** — create the Vercel project, set env vars, connect the repo, ship a first build. `[critical→in-session]`

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

- [ ] **Smoke tests + minimal CI** — happy-path tests for auth / NDA / bid; GitHub Action running
  lint + typecheck + build on push. `[grunt→Codex]`
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
