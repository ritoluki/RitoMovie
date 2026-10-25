import * as React from 'react';
import * as Primitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/utils/helpers';
export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;
export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof Primitive.Title>,
  React.ComponentPropsWithoutRef<typeof Primitive.Title>
>(({ className, ...props }, ref) => (
  <Primitive.Title
    ref={ref}
    className={cn(
      'text-xl font-semibold tracking-tight text-foreground',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';
export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof Primitive.Description>,
  React.ComponentPropsWithoutRef<typeof Primitive.Description>
>(({ className, ...props }, ref) => (
  <Primitive.Description
    ref={ref}
    className={cn('text-sm leading-relaxed text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';
interface ContentProps
  extends React.ComponentPropsWithoutRef<typeof Primitive.Content> {
  closeLabel?: string;
  sheet?: boolean;
}
export const DialogContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  ContentProps
>(({ className, children, closeLabel = 'Close', sheet, ...props }, ref) => (
  <Primitive.Portal>
    <Primitive.Overlay className="ui-overlay fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm" />
    <Primitive.Content
      ref={ref}
      className={cn(
        'z-[80] border border-border bg-card text-foreground shadow-2xl outline-none',
        sheet
          ? 'ui-sheet fixed inset-y-0 right-0 flex w-full max-w-lg flex-col border-y-0 border-r-0'
          : 'ui-popup fixed left-1/2 top-1/2 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6',
        className
      )}
      {...props}
    >
      {children}
      <Primitive.Close
        aria-label={closeLabel}
        className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-4 w-4" />
      </Primitive.Close>
    </Primitive.Content>
  </Primitive.Portal>
));
DialogContent.displayName = 'DialogContent';
