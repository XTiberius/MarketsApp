// Compiles the app's Tailwind v4 stylesheet into a static sheet design-sync can ship.
// Uses the repo's OWN installed tailwind (exact version) via the postcss plugin,
// auto-scanning the repo for utility classes used by components + authored previews.
// Prepends Google-Font @imports + the --font-* vars that next/font injects at runtime,
// so previews render in the real brand typography (Geist / Space Grotesk).
//
// Output: .design-sync/compiled.css  (pointed at by cfg.cssEntry)
// Re-run via cfg.buildCmd on every re-sync.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const input = resolve(repoRoot, 'src/app/globals.css');
const out = resolve(repoRoot, '.design-sync/compiled.css');

// next/font/google injects these CSS vars at runtime; the bundle has no Next runtime,
// so define them from the public Google Fonts CDN (loads at render time → [FONT_REMOTE]).
const fontPrelude = `@import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&family=Space+Grotesk:wght@300..700&display=swap');
:root {
  --font-geist-sans: 'Geist', system-ui, sans-serif;
  --font-geist-mono: 'Geist Mono', ui-monospace, monospace;
  --font-space-grotesk: 'Space Grotesk', system-ui, sans-serif;
}
`;

// Safelist the full semantic token palette as bg/text/border utilities. The
// shipped stylesheet is the ONLY CSS rendered designs receive, and the design
// agent composes new layouts with the whole palette — not just the subset the
// existing components happen to use — so force-generate them even if unused.
const COLORS = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'muted', 'muted-foreground', 'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
  'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input', 'ring',
  'type-primary', 'type-secondary', 'success', 'warning', 'danger', 'info', 'neutral',
];
const safelist = `@source inline("{bg,text,border}-{${COLORS.join(',')}}");\n`;

const css = safelist + readFileSync(input, 'utf8');
const result = await postcss([tailwindcss({ base: repoRoot })]).process(css, { from: input, to: out });
writeFileSync(out, fontPrelude + result.css);
console.error(`build-css: wrote ${out} (${(Buffer.byteLength(fontPrelude + result.css) / 1024).toFixed(0)} KB)`);
