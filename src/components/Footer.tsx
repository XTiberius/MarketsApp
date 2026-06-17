import { Logo } from './Logo'

export function Footer() {
  const year = 2026
  return (
    <footer className="mt-16 border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <Logo size={22} />
        <p>Off-platform settlement</p>
        <p>© {year} IONIC</p>
      </div>
    </footer>
  )
}
