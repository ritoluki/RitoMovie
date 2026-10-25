import * as React from 'react';
import { cn } from '@/utils/helpers';
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-11 w-full min-w-0 rounded-xl border border-input bg-background/60 px-3.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/70 hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';
