import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'
export { default as SplitBadge } from './SplitBadge.vue'

export const badgeVariants = cva(
  'inline-flex items-center rounded-md border font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // default: 'border-transparent bg-primary text-primary-foreground shadow',
        default: 'border-transparent bg-secondary text-secondary-foreground',
        ai: 'border-transparent bg-ai text-ai-foreground',
        destructive: 'border-transparent bg-destructive-background text-destructive-foreground',
        accent: 'border-transparent bg-accent text-accent-foreground',
        warning: 'border-transparent bg-warning-background text-warning-foreground',
        info: 'border-transparent bg-info-background text-info-foreground',
        success: 'border-transparent bg-success-background text-success-foreground',
        outline: 'border-border text-foreground',
        surface: 'border-transparent bg-surface text-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        primary: 'border-transparent bg-primary text-primary-foreground',
      },
      size: {
        xs: 'text-xs px-1.5 py-0.5 uppercase',
        sm: 'text-xs px-2 py-0.5',
        default: 'text-sm px-2.5 py-0.5',
        lg: 'text-lg px-2.5 py-0.5',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
