/**
 * Fixed cosmic backdrop behind all liquid-glass surfaces.
 * Minimalist + refined: a single soft nebula and a sparse, fine starfield over
 * deep space. Pure CSS (server component). Motion is disabled under
 * prefers-reduced-motion (globals.css).
 */
export function SpaceBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base wash — subtle vertical depth, mostly void */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% -10%, hsl(var(--space-1)) 0%, transparent 55%),' +
            'radial-gradient(120% 120% at 50% 110%, hsl(var(--space-3)) 0%, transparent 60%),' +
            'hsl(var(--background))',
        }}
      />
      {/* single soft nebula glow, slow drift */}
      <div
        className="absolute left-1/2 top-[-12%] h-[55vh] w-[70vw] -translate-x-1/2 rounded-full blur-3xl opacity-40 animate-nebula"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.16), transparent 70%)' }}
      />
      {/* sparse, fine starfield */}
      <div
        className="absolute inset-0 animate-twinkle"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 18% 28%, hsl(var(--star) / var(--star-alpha)), transparent),' +
            'radial-gradient(1px 1px at 72% 18%, hsl(var(--star) / var(--star-alpha)), transparent),' +
            'radial-gradient(1px 1px at 48% 62%, hsl(var(--star) / var(--star-alpha)), transparent),' +
            'radial-gradient(1px 1px at 88% 52%, hsl(var(--star) / var(--star-alpha)), transparent)',
          backgroundSize: '460px 460px',
        }}
      />
    </div>
  )
}
