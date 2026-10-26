import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Clock3, MessageSquareOff } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select-field';
import adminService from '../../services/adminService';
import type { AdminUser } from '../../types/admin';

const durations = [
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'permanent', label: 'Until manually lifted' },
];

export default function CommentRestrictionModal({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
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
      toast.success('Comment restriction applied');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', user?._id] });
      onClose();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Could not restrict comments'),
  });

  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => { if (!open && !restriction.isPending) onClose(); }}>
      <DialogContent>
        <div className="mb-4 inline-flex rounded-xl bg-amber-500/10 p-3 text-amber-300">
          <MessageSquareOff className="h-6 w-6" />
        </div>
        <DialogTitle>Restrict commenting</DialogTitle>
        <DialogDescription className="mt-2">
          {user?.name} can still sign in and watch movies. They will not be able to post or edit comments until the restriction ends.
        </DialogDescription>
        <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); restriction.mutate(); }}>
          <label className="block space-y-2 text-sm font-medium">
            Duration
            <SelectField value={duration} onValueChange={setDuration} className="w-full">
              {durations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </SelectField>
          </label>
          <label className="block space-y-2 text-sm font-medium">
            Reason shown to the user
            <Input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} required placeholder="For example: repeated spam comments" />
          </label>
          {restriction.isError && <p role="alert" className="text-sm text-red-400">{(restriction.error as any)?.response?.data?.message || 'Could not apply the restriction.'}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={restriction.isPending}>Cancel</Button>
            <Button type="submit" disabled={restriction.isPending || !reason.trim()}>
              <Clock3 className="h-4 w-4" />
              {restriction.isPending ? 'Applying...' : 'Apply restriction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
