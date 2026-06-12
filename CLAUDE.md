# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## Project Context

**MarketsApp** — A venture marketplace platform where accredited investors discover, bid on, and invest in startup fund listings (primary or secondary).

- **Stack:** Next.js 14+ (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Auth + DB + Storage) · TanStack Query
- **Auth:** Email OTP (6-digit code) via Supabase Auth
- **Roles:** `investor` | `admin`
- **Key flows:** Browse listings → Sign NDA → Place bid → Admin reviews bid → Documents uploaded

<!-- BEGIN:brain:coding-discipline v1 — managed by ~/Brain; do not edit here, propose changes in the Brain -->
## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
<!-- END:brain:coding-discipline -->

<!-- BEGIN:brain:agent-wiring v1 — managed by ~/Brain; do not edit here, propose changes in the Brain -->
# Brain operator

This repo is **overseen by the Brain operator** (`~/Brain`). Sections fenced by
`BEGIN:brain:<process>` / `END:brain:<process>` markers (and `# >>> brain:* >>>` fences in
config files) are **managed**: do not edit them in place — propose changes in the Brain
(`~/Brain/operations/processes/`), where they are versioned and redeployed to all overseen
repos. If a managed section looks stale, hand-edited, or wrong, tell the user to run the
Brain's audit ("audit projects" — the `operate` skill).
<!-- END:brain:agent-wiring -->
