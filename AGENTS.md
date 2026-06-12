<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:brain:security-protocol v1 — managed by ~/Brain; do not edit here, propose changes in the Brain -->
# Security

**Never read, print, transmit, or commit secrets.** Full protocol: `~/.claude/SECURITY.md`.

This repo may hold real secrets (API keys, service credentials) in env files — **never** open,
`cat`, print, or commit them. Refer to secret files by **path only**, never by value. Treat as
secret: `.env` / `.env.*` (not `*.example`), `*.pem`, `*.key`, `credentials*`,
`*service-account*.json`, `secrets*.{json,yaml,yml}`, `.npmrc`, `*.token`, and anything under
`~/.ssh` / `~/.aws`. Use environment-variable references in code (`process.env.X`,
`os.environ["X"]`) — never hardcode a key. Before committing, check `git diff --cached` for
secret material; verify `.gitignore` covers the patterns above.

If you find an exposed secret: report its **path** (not value), don't display it, recommend rotation.

> Note: Claude Code enforces this via deny rules + a PreToolUse hook. For other agents these
> rules are **advisory** — be disciplined; the `.gitignore` still backstops commits.
<!-- END:brain:security-protocol -->

_Project note: this app's real secrets (Supabase keys, etc.) live in `.env.local`._

<!-- BEGIN:brain:agent-wiring v1 — managed by ~/Brain; do not edit here, propose changes in the Brain -->
# Brain operator

This repo is **overseen by the Brain operator** (`~/Brain`). Sections fenced by
`BEGIN:brain:<process>` / `END:brain:<process>` markers (and `# >>> brain:* >>>` fences in
config files) are **managed**: do not edit them in place — propose changes in the Brain
(`~/Brain/operations/processes/`), where they are versioned and redeployed to all overseen
repos. If a managed section looks stale, hand-edited, or wrong, tell the user to run the
Brain's audit ("audit projects" — the `operate` skill).
<!-- END:brain:agent-wiring -->
