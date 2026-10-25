import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  loading,
}: Props) => {
  const { t } = useTranslation();
  const Icon = variant === 'info' ? Info : AlertTriangle;
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !loading) onClose();
      }}
    >
      <AlertDialogContent>
        <div
          className={`mb-5 inline-flex rounded-xl p-3 ${variant === 'danger' ? 'bg-red-500/10 text-red-400' : variant === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <AlertDialogTitle className="text-xl font-semibold tracking-tight">
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {message}
        </AlertDialogDescription>
        <div className="mt-7 flex justify-end gap-3">
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={loading}>
              {cancelText || t('common.cancel')}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={variant === 'danger' ? 'destructive' : 'default'}
              disabled={loading}
              aria-busy={loading}
              onClick={(event) => {
                event.preventDefault();
                onConfirm();
              }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmText || t('common.confirm')}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default ConfirmDialog;
