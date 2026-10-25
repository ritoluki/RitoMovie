import * as React from 'react';
import * as Primitive from '@radix-ui/react-alert-dialog';
import { cn } from '@/utils/helpers';
export const AlertDialog = Primitive.Root;
export const AlertDialogAction = Primitive.Action;
export const AlertDialogCancel = Primitive.Cancel;
export const AlertDialogTitle = Primitive.Title;
export const AlertDialogDescription = Primitive.Description;
export const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(({ className, ...props }, ref) => (
  <Primitive.Portal>
    <Primitive.Overlay className="ui-overlay fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm" />
    <Primitive.Content
      ref={ref}
      className={cn(
        'ui-popup fixed left-1/2 top-1/2 z-[80] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 text-foreground shadow-2xl outline-none',
        className
      )}
      {...props}
    />
  </Primitive.Portal>
));
AlertDialogContent.displayName = 'AlertDialogContent';
