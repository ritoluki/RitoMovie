import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';
const badgeVariants = cva(
  'inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'border-brand/20 bg-brand/10 text-brand',
        secondary: 'border-border bg-muted text-gray-300',
        outline: 'border-border text-muted-foreground',
        rating: 'border-yellow-400/20 bg-yellow-400/10 text-yellow-300',
      },
    },
    defaultVariants: { variant: 'secondary' },
  }
);
export const Badge = ({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);
