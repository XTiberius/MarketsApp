/**
 * Fixed cosmic backdrop behind all liquid-glass surfaces.
 * Pure CSS (server component): nebula blobs + a tiled starfield.
 * Drift/twinkle animations are disabled under prefers-reduced-motion (globals.css).
 */
export function SpaceBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(125% 125% at 15% 0%, hsl(var(--space-1)) 0%, transparent 55%),' +
            'radial-gradient(110% 110% at 90% 10%, hsl(var(--space-2)) 0%, transparent 50%),' +
            'radial-gradient(140% 140% at 50% 100%, hsl(var(--space-3)) 0%, transparent 60%),' +
            'hsl(var(--background))',
        }}
      />
      {/* drifting nebula glow */}
      <div
        className="absolute -left-1/4 top-[-10%] h-[60vh] w-[60vw] rounded-full blur-3xl opacity-60 animate-nebula"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.28), transparent 70%)' }}
      />
      <div
        className="absolute right-[-15%] bottom-[-15%] h-[55vh] w-[55vw] rounded-full blur-3xl opacity-50 animate-nebula"
        style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.22), transparent 70%)' }}
      />
      {/* starfield */}
      <div
        className="absolute inset-0 animate-twinkle"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 20% 30%, hsl(var(--star) / var(--star-alpha)), transparent),' +
            'radial-gradient(1px 1px at 70% 20%, hsl(var(--star) / var(--star-alpha)), transparent),' +
            'radial-gradient(1px 1px at 40% 70%, hsl(var(--star) / var(--star-alpha)), transparent),' +
            'radial-gradient(1.5px 1.5px at 85% 60%, hsl(var(--star) / var(--star-alpha)), transparent),' +
            'radial-gradient(1px 1px at 55% 45%, hsl(var(--star) / var(--star-alpha)), transparent),' +
            'radial-gradient(1px 1px at 10% 85%, hsl(var(--star) / var(--star-alpha)), transparent)',
          backgroundSize: '320px 320px',
        }}
      />
    </div>
  )
}
