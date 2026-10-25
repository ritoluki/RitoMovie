// Sheet shares the accessible dialog primitive and focus/scroll handling.
export {
  Dialog as Sheet,
  DialogTrigger as SheetTrigger,
  DialogClose as SheetClose,
  DialogTitle as SheetTitle,
  DialogDescription as SheetDescription,
} from './dialog';
import * as React from 'react';
import { DialogContent } from './dialog';
export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>((props, ref) => <DialogContent ref={ref} sheet {...props} />);
SheetContent.displayName = 'SheetContent';
