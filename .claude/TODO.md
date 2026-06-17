# MarketsApp — Open TODOs

Outstanding work that is **not yet done**. Resume context for a future Claude Code
session: read this file, skim recent `git log` on `main`/`feat/platform-v1`, and the
relevant files named below. The app is live at **https://www.ionicmarkets.com**
(Vercel project `davidrashid/markets-app`, GitHub `XTiberius/MarketsApp`, production
branch = `main`). The remote Supabase is shared across all environments; apply DB
changes with `supabase db push` (linked CLI; see the `supabase-sql-apply` skill).

Status convention: `[ ]` open · `[~]` partially done · `[x]` done (leave briefly for history).

---

## 1. [ ] Set production env vars in Vercel (Production scope)
The app degrades gracefully without these, but features stay off until they're set in
the Vercel project → Settings → Environment Variables (Production), then redeploy.

- `SUPABASE_SERVICE_ROLE_KEY` — required for emailing **all** admins on investor-triggered
  events and other server-side admin tasks. Confirm it's present in Vercel (it's also
  needed locally for the Playwright e2e harness).
- `RESEND_API_KEY` + `EMAIL_FROM` (+ a verified Resend sending domain) — branded status /
  notification emails. Without them, `src/lib/email.ts` logs a stub and no email sends.
- `ANTHROPIC_API_KEY` — currently powers the AI newsfeed (`/api/listings/[id]/newsfeed`);
  without it the admin "Refresh" returns **503**. **But see item 2** — we intend to move
  this feature off Anthropic, so prefer wiring `OPENAI_API_KEY` instead once item 2 lands.
- Already set (app builds + serves fine): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 2. [ ] AI newsfeed: generate summaries with OpenAI/ChatGPT instead of Claude
**Why:** Brain model-routing policy — push grunt work to ChatGPT/GPT (more token-efficient
than Claude for this). The newsfeed summary generation is exactly that kind of grunt work.
**Note:** "Codex" is a dev-time CLI; the *app runtime* can't call it — it must call the
**OpenAI API** directly (a GPT model), not the Codex CLI.

- File: `src/app/api/listings/[id]/newsfeed/route.ts`. Today it uses `@anthropic-ai/sdk`
  with `claude-sonnet-4-6` + Anthropic's `web_search_20250305` server tool, parses a
  trailing-JSON `{bullets:[...]}` (with a line-bullet fallback), caches into
  `listing_newsfeed` (upsert on `listing_id`), and is admin-only + NDA-gated on display.
- To do: reimplement generation with the OpenAI API (Responses API + web_search tool, or
  equivalent) producing the same 3–7 factual bullets. Switch the env guard from
  `ANTHROPIC_API_KEY` → `OPENAI_API_KEY` (keep the **503-when-missing** behavior). Re-do the
  JSON-bullet parse for OpenAI's response shape. **Keep unchanged:** the disclosure text,
  caching, admin guard (403 for non-admins), NDA gating, on-demand Refresh.
- Cleanup after migrating: remove the `@anthropic-ai/sdk` dependency and, if present, the
  hand-rolled type shim. Verify web-search quality is acceptable on OpenAI.
- Trade-off note: the `claude-api` skill defaults to Claude; choosing OpenAI here is a
  deliberate cost decision per the user.

## 3. [ ] Team page — build the bust animations + add the other members/bios
The public `/team` page exists (any visitor; `src/app/team/page.tsx`). Currently shows only
David Monroe Rashid (Founder & Chairman) with a placeholder and no bio.

- **Greek bust animations (chest-up) are NOT built** — intentionally deferred. Single mount
  point: `src/components/team/TeamBust.tsx` (already a client component, takes `member`;
  currently renders the member's initials in a framed box). When ready, replace the
  placeholder block marked with the `TODO:` comment; keep the outer frame + `aspect-[4/5]`
  so the page layout stays stable.
- **Add the other 3 members + fill bios:** roster is `src/lib/team.ts`. CEO / COO / CIO are
  present as commented-out `XYZ` entries — uncomment and fill real names, titles, bios.
  All bios (including David's) are blank by design; the page renders a bio only when
  non-empty. Final roster: David Monroe Rashid (Founder & Chairman), + CEO, COO, CIO.

## 4. [ ] (Minor) Remove dead code
`uploadPrivate` in `src/lib/storage.ts` is unused after uploads moved browser→Supabase
direct (the `documents` + `listing-docs` routes now take JSON metadata). Safe to delete.
`MAX_UPLOAD_BYTES` / `MAX_UPLOAD_LABEL` in the same file are still used (client-side size
checks) — keep them.

---

## Context already handled (so it's not re-investigated)
- Large-PDF uploads now go **browser→Supabase directly** (bypasses Vercel's ~4.5MB function
  body limit). Bucket `file_size_limit` is 50MB (migration 015). To allow bigger files, raise
  the bucket limit *and* `MAX_UPLOAD_BYTES`.
- Migrations 015 (documents-bucket RLS + amount_raised + size limits) and 016 (storage DELETE
  policies) are applied to the shared remote Supabase.
- e2e suite: `npx playwright test` (needs `SUPABASE_SERVICE_ROLE_KEY` locally for the authed
  specs; covers create-with-aura, NII upload, portfolio embeds, gating).
