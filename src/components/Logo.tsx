import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  href?: string
  showWordmark?: boolean
  size?: number
  className?: string
}

/** IONIC brand lockup: square mark + typographic wordmark. */
export function Logo({ href = '/', showWordmark = true, size = 30, className }: LogoProps) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src="/ionic-logo.png"
        alt="IONIC"
        width={size}
        height={size}
        priority
        className="rounded-lg"
      />
      {showWordmark && (
        <span className="font-display text-lg font-semibold tracking-[0.2em] text-foreground">
          IONIC
        </span>
      )}
    </span>
  )

  if (!href) return content
  return (
    <Link href={href} aria-label="IONIC home" className="inline-flex items-center">
      {content}
    </Link>
  )
}
