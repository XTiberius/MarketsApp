# Ionic — MarketsApp design system

A dark-first "Purple Space / Liquid Glass" system for a venture marketplace (accredited investors browse, bid on, and invest in fund listings). Built on React 19 + Tailwind v4 with semantic CSS-variable tokens. Components are the app's real shipped `src/components/ui` — import them from `window.Ionic.*`.

## Wrapping & setup (read first)

- **Dark by default.** The brand theme is the dark "deep space" palette. Wrap the app (or any rendered subtree) in an element with `class="dark"`, and set `background: hsl(var(--background))` + `color: hsl(var(--foreground))` on that root. Light mode (`:root`) exists but is secondary.
- **Glass needs `.dark`.** The glass tokens (`--glass-bg`, `--glass-border`, `--glass-shadow`, `--blur`) are defined **only** under `.dark`. The `glass` utility and `<GlassCard>` render correctly only inside a `.dark` ancestor — outside it they collapse to an unstyled box.
- **No provider required.** Components read no React context for theming — styling is pure CSS variables + utility classes. Radix-based components (`Dialog`, `Select`, `Accordion`) manage their own state.
- **Fonts:** `Geist` (default sans), `Space Grotesk` (headings — applied with `font-display`), `Geist Mono`. Plain text inherits `color` — set `color: hsl(var(--foreground))` on your container so unstyled text isn't invisible on dark.

## Styling idiom — Tailwind v4 utilities mapped to tokens

Style with these utility classes (never invent new color names — use the tokens below). For your own layout glue, normal Tailwind spacing/flex utilities are fine.

| Purpose | Classes |
|---|---|
| Surfaces | `bg-background`, `bg-card`, `bg-popover`, `bg-muted` |
| Text | `text-foreground`, `text-muted-foreground` |
| Brand action | `bg-primary` / `text-primary-foreground`, `bg-accent`, `bg-destructive` / `text-destructive-foreground` |
| Borders / focus | `border-border`, `border-input`, `ring-ring` |
| Status palette (color-coded) | `text-type-primary`, `text-type-secondary`, `text-success`, `text-warning`, `text-danger`, `text-info`, `text-neutral` (+ matching `bg-*` / `border-*`, usually tinted: `bg-success/14`) |
| Radius | `rounded-xl`, `rounded-2xl`, `rounded-full` (driven by `--radius`) |
| Signature surface | the `glass` utility class — or just use `<GlassCard>` |
| Headings | `font-display` (Space Grotesk) |

Tokens are HSL **channels**, so apply alpha as `hsl(var(--primary) / 0.5)`. Raw access (`hsl(var(--muted-foreground))`, etc.) is fine for inline styles.

## Where the truth lives

- Stylesheet: `styles.css` → `@import`s `_ds_bundle.css` (compiled tokens + utilities). Read it for the exact token/utility set.
- Per-component API + usage: `components/general/<Name>/<Name>.d.ts` and `<Name>.prompt.md`.

## Idiomatic example — a listing card

```tsx
const { GlassCard, Badge, Button, StatusBadge } = window.Ionic

function ListingCard() {
  return (
    <div className="dark" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', padding: 32 }}>
      <GlassCard className="rounded-2xl" style={{ padding: 24, width: 340 }}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">Helios Ventures II</h3>
            <p className="text-muted-foreground text-sm">Series B · Climate Tech</p>
          </div>
          <Badge tone="typePrimary">Primary</Badge>
        </div>
        <p className="text-muted-foreground text-sm">$40M target raise · lead allocation open.</p>
        <StatusBadge kind="listingStatus" value="published" />
        <Button variant="primary" className="w-full">Place Bid</Button>
      </GlassCard>
    </div>
  )
}
```
