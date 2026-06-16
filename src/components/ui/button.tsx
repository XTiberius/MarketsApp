import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // primary: violet fill with a soft glow
        primary:
          'bg-primary text-primary-foreground shadow-[0_4px_24px_-6px_hsl(var(--primary)/0.7)] hover:shadow-[0_6px_30px_-4px_hsl(var(--primary)/0.85)] hover:brightness-110',
        // glass: frosted translucent surface
        glass:
          'glass text-foreground hover:bg-[hsl(var(--glass-bg)/calc(var(--glass-bg-alpha)+0.12))]',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-muted/60',
        ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
        destructive:
          'bg-destructive text-destructive-foreground hover:brightness-110',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-5',
        lg: 'h-12 px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { buttonVariants }
