# design-sync notes — MarketsApp (Ionic DS)

This repo is a **Next.js app**, not a published component library. The design system is the
shadcn/ui-style components in `src/components/ui/` (11 carded). The sync runs in the package
shape's **synth-entry mode** (no `dist/`, no shipped `.d.ts`).

## Critical re-sync setup (do this on a fresh clone, before building)

- **Self-package symlink.** The converter resolves `PKG_DIR = node_modules/<pkg>` = `node_modules/ionic`,
  which doesn't exist (npm won't self-install the repo). Without it the build dies with
  `ENOENT … node_modules/ionic/package.json`. Recreate it:
  ```sh
  ln -sfn "$(pwd)" node_modules/ionic
  ```
  (gitignored via node_modules rules — must be recreated per clone.)
- **CSS build.** `cfg.buildCmd` = `node .design-sync/build-css.mjs` compiles the app's Tailwind v4
  stylesheet (`src/app/globals.css`) into `.design-sync/compiled.css` (gitignored, regenerated) using
  the repo's own `@tailwindcss/postcss`. It (a) prepends Google-Fonts `@import` + `--font-*` vars that
  next/font injects at runtime, and (b) **safelists the full semantic token palette** as `{bg,text,border}-<token>`
  so the whole palette ships even though the existing components only use a subset (the design agent
  composes new layouts with all of it). Run it before `package-build` if the CSS source changed.
- Converter deps live in `.ds-sync/` (staged, gitignored): `npm i esbuild ts-morph @types/react` there.

## Key config decisions

- `srcDir: src/components/ui` scopes the synth entry to UI components (else it would `export *` all of
  `src/`, pulling in app pages / API routes / server code and breaking the bundle).
- `componentSrcMap` **pins all 11** card components. Synth `deriveComponentsFromSrc` only runs when the
  `.d.ts` export scan finds zero — and it flukily found one, so discovery is driven entirely by the pins.
  Compound sub-parts (Dialog*/Accordion*/Select* members) are intentionally **not carded** but ARE in the
  bundle (`window.Ionic.*`, 29 exports) via `export *`, so the agent can compose full compounds.
- `dtsPropsFor` hand-writes each component's props body — synth mode has no `.d.ts` tree to extract from,
  so without these the contracts degrade to `[key: string]: unknown`. Bodies mirror the real source
  (Button variant/size, Badge/StatusBadge tones, GlassCard.interactive, Radix root props). **Re-check
  these against `src/components/ui/*.tsx` if the component APIs change.**
- `guidelinesGlob: ["docs/design/**/*.md"]` (a path that currently matches nothing) — the default
  `docs/*.md` would ship `docs/LAUNCH.md` and `docs/PROJECT.md`, which are **internal launch/strategy
  docs, not design guidelines**. Do not let those reach the design agent.
- `runtimeFontPrefixes: [Geist, Geist Mono, Space Grotesk]` — fonts load via remote Google-Fonts
  `@import`, not shipped `@font-face`. Expect `[FONT_REMOTE]` (informational); `[FONT_MISSING]` is suppressed.

## Preview conventions

- The DS is **dark-by-default** ("Purple Space"). Every authored preview wraps content in
  `<div className="dark" style={{ background:'hsl(var(--background))', color:'hsl(var(--foreground))' }}>`.
  The `color` is required — plain (un-classed) text inherits the browser default (black) and is invisible
  on dark; component-classed text (`text-foreground`) is fine without it.
- **Glass tokens are defined only under `.dark`** — `glass`/`<GlassCard>` render unstyled outside it.
- Wide form components (Input/Label/Select/Skeleton/Textarea) use `cfg.overrides.<N>.cardMode: column`
  (they overflow a grid cell otherwise). Dialog uses `cardMode: single` + a fixed viewport (overlay).
- **Select open listbox is skipped** — Radix portal + popper positioning isn't statically renderable;
  the card shows the styled closed trigger (how it looks at rest in a form).

## Known render warns
- None outstanding. The 5 `[GRID_OVERFLOW]` warns were resolved by `cardMode: column`.

## Re-sync risks (watch list)
- **Symlink + compiled.css** are both regenerated/non-committed — a re-sync that skips the setup above
  fails or ships a stale/missing stylesheet.
- **`dtsPropsFor` can silently drift** from source: it's hand-written, so an API change in
  `src/components/ui` won't propagate until the body is updated. Re-verify on any component API change.
- **conventions.md vocabulary is tied to the token names** in `globals.css` (`--primary`, `--type-primary`,
  `glass`, `font-display`, …). If tokens are renamed, the conventions header (and safelist) drift — the
  authoring step re-validates names against the build on each re-sync.
- The bundle pins React 19 from the repo's node_modules; a major React bump could change the vendored shim.
