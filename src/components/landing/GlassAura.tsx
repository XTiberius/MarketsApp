/**
 * Soft accent light-blooms behind the content, so the liquid-glass cards have
 * color/light to refract (the dark coast alone gives the displacement little to
 * bend). Fixed, low z — above the scrub, behind the content + hero video.
 */
export function GlassAura() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute left-[-8%] top-[12%] h-[60vh] w-[60vh] rounded-full blur-[90px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.22), transparent 70%)' }}
      />
      <div
        className="absolute right-[-6%] top-[46%] h-[55vh] w-[55vh] rounded-full blur-[90px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.20), transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-10%] left-[35%] h-[50vh] w-[50vh] rounded-full blur-[90px]"
        style={{ background: 'radial-gradient(circle, hsl(200 75% 60% / 0.16), transparent 70%)' }}
      />
    </div>
  )
}
