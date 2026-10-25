import * as React from 'react';
import * as Primitive from '@radix-ui/react-tabs';
import { cn } from '@/utils/helpers';
export const Tabs = Primitive.Root;
export const TabsList = React.forwardRef<
  React.ElementRef<typeof Primitive.List>,
  React.ComponentPropsWithoutRef<typeof Primitive.List>
>(({ className, ...props }, ref) => (
  <Primitive.List
    ref={ref}
    className={cn(
      'inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';
export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof Primitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof Primitive.Trigger>
>(({ className, ...props }, ref) => (
  <Primitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-accent data-[state=active]:text-white disabled:opacity-40',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';
export const TabsContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(({ className, ...props }, ref) => (
  <Primitive.Content
    ref={ref}
    className={cn(
      'mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';
