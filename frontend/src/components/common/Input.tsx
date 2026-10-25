import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Input as UIInput } from '@/components/ui/input';
import { cn } from '@/utils/helpers';
interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, id: suppliedId, ...props }, ref) => {
    const generatedId = useId();
    const id = suppliedId || generatedId;
    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <UIInput
          ref={ref}
          id={id}
          {...props}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={
            [props['aria-describedby'], error && `${id}-error`]
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={cn(
            error && 'border-red-500 focus-visible:ring-red-500/30',
            className
          )}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
export default Input;
