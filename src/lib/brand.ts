/**
 * Monroe Markets brand geometry, lifted from the "Website UX Package v1" design
 * canvas (`#mk` and `#wm` symbols). Shared by the Logo lockup, the landing hero
 * and the OpenGraph image so the paths live in exactly one place.
 */

/** The mark's native coordinate space (x y width height). */
export const MARK_VIEWBOX = '44.74 84.81 187.98 107.84'
/** Mark width ÷ height. */
export const MARK_RATIO = 187.98 / 107.84

/** Mark paths. The two bars fade out along x; the hook is solid; the body shades base → tint. */
export const MARK_PATHS = {
  barA: 'M77.09,106.37H124.88V127.94H77.09V127.5H76.5V107H77.09Z',
  hook: 'M77.09,149.51c-5.96,0-10.78-4.83-10.78-10.78s4.83-10.78,10.78-10.78v-21.57c-17.87,0-32.35,14.48-32.35,32.35s14.48,32.35,32.35,32.35h47.79v-21.57h-47.79Z',
  barB: 'M124.3,149.51H124.88V149H172.67V171.6H124.88V171.08H124.3Z',
  body: 'M172.67,149.51c5.96,0,10.78-4.83,10.78-10.78s-4.83-10.78-10.78-10.78h-47.79v21.57h47.79Z M124.88,84.81v21.57h47.79c17.87,0,32.35,14.48,32.35,32.35s-14.48,32.35-32.35,32.35h-47.79v21.57h107.84V84.81H124.88Z',
}

/** Horizontal gradient spans (x1 → x2) in the mark's user space, one per faded path. */
export const MARK_GRADIENTS = {
  barA: [77.09, 124.88],
  barB: [124.88, 172.67],
  body: [124.88, 232.71],
} as const

/** The wordmark's native coordinate space. */
export const WORDMARK_VIEWBOX = '0 0 163 10'
/** Wordmark width ÷ height. */
export const WORDMARK_RATIO = 16.3

/** "MONROE MARKETS" glyphs, each a 10×10 path offset along x. */
export const WORDMARK_GLYPHS: { x: number; d: string }[] = [
  { x: 0, d: 'M0,0h2v10h-2ZM8,0h2v10h-2ZM0,0L2.32,0L6.16,6.5L3.84,6.5ZM7.68,0L10,0L6.16,6.5L3.84,6.5Z' },
  { x: 12.5, d: 'M2.5,0H7.5A2.5,2.5 0 0 1 10,2.5V7.5A2.5,2.5 0 0 1 7.5,10H2.5A2.5,2.5 0 0 1 0,7.5V2.5A2.5,2.5 0 0 1 2.5,0ZM2.5,2A0.5,0.5 0 0 0 2,2.5V7.5A0.5,0.5 0 0 0 2.5,8H7.5A0.5,0.5 0 0 0 8,7.5V2.5A0.5,0.5 0 0 0 7.5,2Z' },
  { x: 25, d: 'M0,0h2v10h-2ZM8,0h2v10h-2ZM0,0L2.5,0L10,10L7.5,10Z' },
  { x: 37.5, d: 'M0,0h2v10h-2ZM0,0H7.5A2.5,2.5 0 0 1 10,2.5V4.5A2.5,2.5 0 0 1 7.5,7H0ZM2,2V5H7.5A0.5,0.5 0 0 0 8,4.5V2.5A0.5,0.5 0 0 0 7.5,2ZM4.22,6L6.78,6L10,10L7.43,10Z' },
  { x: 50, d: 'M2.5,0H7.5A2.5,2.5 0 0 1 10,2.5V7.5A2.5,2.5 0 0 1 7.5,10H2.5A2.5,2.5 0 0 1 0,7.5V2.5A2.5,2.5 0 0 1 2.5,0ZM2.5,2A0.5,0.5 0 0 0 2,2.5V7.5A0.5,0.5 0 0 0 2.5,8H7.5A0.5,0.5 0 0 0 8,7.5V2.5A0.5,0.5 0 0 0 7.5,2Z' },
  { x: 62.5, d: 'M0,0h2v10h-2ZM0,0h9v2h-9ZM0,4h8v2h-8ZM0,8h9v2h-9Z' },
  { x: 79, d: 'M0,0h2v10h-2ZM8,0h2v10h-2ZM0,0L2.32,0L6.16,6.5L3.84,6.5ZM7.68,0L10,0L6.16,6.5L3.84,6.5Z' },
  { x: 91.5, d: 'M2.5,0H7.5A2.5,2.5 0 0 1 10,2.5V10H8V2.5A0.5,0.5 0 0 0 7.5,2H2.5A0.5,0.5 0 0 0 2,2.5V10H0V2.5A2.5,2.5 0 0 1 2.5,0ZM0,5h10v2h-10Z' },
  { x: 104, d: 'M0,0h2v10h-2ZM0,0H7.5A2.5,2.5 0 0 1 10,2.5V4.5A2.5,2.5 0 0 1 7.5,7H0ZM2,2V5H7.5A0.5,0.5 0 0 0 8,4.5V2.5A0.5,0.5 0 0 0 7.5,2ZM4.22,6L6.78,6L10,10L7.43,10Z' },
  { x: 116.5, d: 'M0,0h2v10h-2ZM6.65,0L10,0L3.28,5L-0.08,5ZM-0.08,5L3.28,5L10,10L6.65,10Z' },
  { x: 129, d: 'M0,0h2v10h-2ZM0,0h9v2h-9ZM0,4h8v2h-8ZM0,8h9v2h-9Z' },
  { x: 140.5, d: 'M0,0h10v2h-10ZM4,0h2v10h-2Z' },
  { x: 153, d: 'M2.5,0H10V2H2.5A0.5,0.5 0 0 0 2,2.5V3.5A0.5,0.5 0 0 0 2.5,4H7.5A2.5,2.5 0 0 1 10,6.5V7.5A2.5,2.5 0 0 1 7.5,10H0V8H7.5A0.5,0.5 0 0 0 8,7.5V6.5A0.5,0.5 0 0 0 7.5,6H2.5A2.5,2.5 0 0 1 0,3.5V2.5A2.5,2.5 0 0 1 2.5,0Z' },
]
