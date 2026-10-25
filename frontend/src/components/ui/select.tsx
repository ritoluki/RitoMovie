import * as React from 'react';
import * as Primitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/helpers';
export const Select = Primitive.Root;
export const SelectValue = Primitive.Value;
export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof Primitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof Primitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <Primitive.Trigger
    ref={ref}
    className={cn(
      'flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-input bg-background/60 px-3.5 text-left text-sm text-foreground transition-colors hover:border-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-50 [&>span]:truncate',
      className
    )}
    {...props}
  >
    {children}
    <Primitive.Icon asChild>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Primitive.Icon>
  </Primitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';
export const SelectContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(({ children, className, position = 'popper', ...props }, ref) => (
  <Primitive.Portal>
    <Primitive.Content
      ref={ref}
      position={position}
      sideOffset={6}
      collisionPadding={12}
      className={cn(
        'ui-popup z-[100] min-w-[var(--radix-select-trigger-width)] max-h-[min(320px,var(--radix-select-content-available-height))] overflow-hidden rounded-xl border border-border bg-popover text-foreground shadow-2xl',
        className
      )}
      {...props}
    >
      <Primitive.ScrollUpButton className="flex justify-center py-1">
        <ChevronUp className="h-4 w-4" />
      </Primitive.ScrollUpButton>
      <Primitive.Viewport className="p-1.5">{children}</Primitive.Viewport>
      <Primitive.ScrollDownButton className="flex justify-center py-1">
        <ChevronDown className="h-4 w-4" />
      </Primitive.ScrollDownButton>
    </Primitive.Content>
  </Primitive.Portal>
));
SelectContent.displayName = 'SelectContent';
export const SelectItem = React.forwardRef<
  React.ElementRef<typeof Primitive.Item>,
  React.ComponentPropsWithoutRef<typeof Primitive.Item>
>(({ className, children, ...props }, ref) => (
  <Primitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-lg py-2.5 pl-3 pr-9 text-sm outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      className
    )}
    {...props}
  >
    <Primitive.ItemText>{children}</Primitive.ItemText>
    <Primitive.ItemIndicator className="absolute right-3">
      <Check className="h-4 w-4 text-brand" />
    </Primitive.ItemIndicator>
  </Primitive.Item>
));
SelectItem.displayName = 'SelectItem';
