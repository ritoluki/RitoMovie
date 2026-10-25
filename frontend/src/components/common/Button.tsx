import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { Button as UIControl } from '@/components/ui/button';
import { cn } from '@/utils/helpers';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading,
      disabled,
      className,
      ...props
    },
    ref
  ) => (
    <UIControl
      ref={ref}
      variant={
        variant === 'primary'
          ? 'default'
          : variant === 'danger'
            ? 'destructive'
            : variant
      }
      size={size === 'md' ? 'default' : size === 'xs' ? 'sm' : size}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={cn(size === 'xs' && 'h-8 px-3 text-xs', className)}
      {...props}
    >
      {isLoading && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
      {children}
    </UIControl>
  )
);
Button.displayName = 'Button';
export default Button;
