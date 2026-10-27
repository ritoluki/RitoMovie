import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Clock3, MessageSquareOff } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select-field';
import adminService from '../../services/adminService';
import type { AdminUser } from '../../types/admin';

const durations = ['1h', '24h', '7d', '30d', 'permanent'] as const;

export default function CommentRestrictionModal({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('24h');

  useEffect(() => {
    setReason('');
    setDuration('24h');
  }, [user?._id]);

  const restriction = useMutation({
    mutationFn: () => adminService.restrictUserComments(user!._id, reason.trim(), duration),
    onSuccess: () => {
      toast.success(t('admin.modals.restrictionApplied'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', user?._id] });
      onClose();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || t('admin.modals.restrictFailed')),
  });

  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => { if (!open && !restriction.isPending) onClose(); }}>
      <DialogContent>
        <div className="mb-4 inline-flex rounded-xl bg-amber-500/10 p-3 text-amber-300">
          <MessageSquareOff className="h-6 w-6" />
        </div>
        <DialogTitle>{t('admin.modals.restrictComments')}</DialogTitle>
        <DialogDescription className="mt-2">
          {t('admin.modals.restrictionDescription', { name: user?.name })}
        </DialogDescription>
        <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); restriction.mutate(); }}>
          <label className="block space-y-2 text-sm font-medium">
            {t('admin.modals.restrictionDuration')}
            <SelectField value={duration} onValueChange={setDuration} className="w-full">
              {durations.map((value) => <option key={value} value={value}>{t(`admin.modals.duration.${value}`)}</option>)}
            </SelectField>
          </label>
          <label className="block space-y-2 text-sm font-medium">
            {t('admin.modals.reasonShown')}
            <Input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} required placeholder={t('admin.modals.reasonPlaceholder')} />
          </label>
          {restriction.isError && <p role="alert" className="text-sm text-red-400">{(restriction.error as any)?.response?.data?.message || t('admin.modals.restrictFailed')}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={restriction.isPending}>{t('admin.common.cancel')}</Button>
            <Button type="submit" disabled={restriction.isPending || !reason.trim()}>
              <Clock3 className="h-4 w-4" />
              {restriction.isPending ? t('admin.modals.applying') : t('admin.modals.applyRestriction')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
