import * as React from 'react';
import * as Primitive from '@radix-ui/react-popover';
import { cn } from '@/utils/helpers';
export const Popover = Primitive.Root;
export const PopoverTrigger = Primitive.Trigger;
export const PopoverClose = Primitive.Close;
export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(
  (
    {
      className,
      align = 'center',
      sideOffset = 8,
      collisionPadding = 16,
      ...props
    },
    ref
  ) => (
    <Primitive.Portal>
      <Primitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'ui-popup z-[90] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-popover p-2 text-foreground shadow-2xl shadow-black/40 outline-none',
          className
        )}
        {...props}
      />
    </Primitive.Portal>
  )
);
PopoverContent.displayName = 'PopoverContent';
