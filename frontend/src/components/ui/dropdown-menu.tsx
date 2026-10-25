import * as React from 'react';
import * as Primitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/utils/helpers';
export const DropdownMenu = Primitive.Root;
export const DropdownMenuTrigger = Primitive.Trigger;
export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <Primitive.Portal>
    <Primitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={12}
      className={cn(
        'ui-popup z-[90] min-w-48 rounded-2xl border border-border bg-popover p-1.5 text-foreground shadow-2xl shadow-black/40 outline-none',
        className
      )}
      {...props}
    />
  </Primitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';
export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Primitive.Item>,
  React.ComponentPropsWithoutRef<typeof Primitive.Item>
>(({ className, ...props }, ref) => (
  <Primitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors focus:bg-accent focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-40 [&_svg]:h-4 [&_svg]:w-4',
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';
export const DropdownMenuLabel = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Primitive.Label>) => (
  <Primitive.Label
    className={cn(
      'px-3 py-2 text-xs font-medium text-muted-foreground',
      className
    )}
    {...props}
  />
);
export const DropdownMenuSeparator = () => (
  <Primitive.Separator className="my-1 h-px bg-border" />
);
