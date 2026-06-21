import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-primary text-primary-foreground',
        secondary:   'bg-muted text-muted-foreground',
        outline:     'border border-border text-foreground bg-transparent',
        destructive: 'bg-destructive/10 text-destructive',
        success:     'bg-success/10 text-success',
        warning:     'bg-warning/10 text-warning',
        info:        'bg-info/10 text-info',
        teal:        'bg-teal/10 text-teal',
        mint:        'bg-mint-green/15 text-mint-green',
        muted:       'bg-gray/10 text-gray',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
