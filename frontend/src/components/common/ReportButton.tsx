import { FormEvent, useEffect, useId, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Flag, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select-field';
import { useAuthStore } from '@/store/authStore';
import {
  createReport,
  reportReasons,
  type ReportReason,
  type ReportTarget,
} from '@/services/reportService';

export default function ReportButton({
  target,
  compact = false,
}: {
  target: ReportTarget;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const location = useLocation();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [reportAuthor, setReportAuthor] = useState(false);
  const [reason, setReason] = useState<ReportReason>(
    reportReasons[target.type][0],
  );
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(0);
  const cooldownKey = `report-cooldown:${user?._id}`;
  const type = reportAuthor && target.authorId ? 'USER' : target.type;
  useEffect(() => {
    if (!open) return;
    const update = () =>
      setRemaining(
        Math.max(
          0,
          Math.ceil(
            (Number(sessionStorage.getItem(cooldownKey)) - Date.now()) / 1000,
          ),
        ),
      );
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [open, cooldownKey]);
  const submission = useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      sessionStorage.setItem(cooldownKey, String(Date.now() + 60_000));
      setOpen(false);
      setDescription('');
      toast.success(t('reporting.success'));
    },
    onError: (failure: unknown) => {
      const code = (failure as { code?: string })?.code;
      const errors: Record<string, string> = {
        REPORT_DUPLICATE: 'duplicate',
        REPORT_RATE_LIMITED: 'rateLimited',
        REPORT_DAILY_LIMIT: 'dailyLimit',
        REPORT_INVALID: 'invalid',
        REPORT_TARGET_MISSING: 'targetMissing',
        REPORT_SELF: 'selfReport',
      };
      if (code === 'REPORT_RATE_LIMITED') {
        sessionStorage.setItem(cooldownKey, String(Date.now() + 60_000));
        setRemaining(60);
      }
      setError(t(`reporting.${errors[code || ''] || 'failed'}`));
    },
  });
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (
      description.trim().length < 10 ||
      description.trim().length > 1000 ||
      remaining ||
      submission.isPending
    )
      return;
    setError('');
    submission.mutate({
      type,
      targetId: reportAuthor ? target.authorId! : target.targetId,
      reason,
      description: description.trim(),
      context: {
        ...target.context,
        ...(target.type === 'COMMENT' ? { commentId: target.targetId } : {}),
        pagePath: `${location.pathname}${location.search}`,
      },
    });
  };
  if (target.type === 'COMMENT' && target.authorId === user?._id) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (submission.isPending) return;
        if (value) {
          setError('');
          setReportAuthor(false);
          setReason(reportReasons[target.type][0]);
        }
        setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            compact
              ? 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-gray-400 transition hover:bg-white/[.06] hover:text-white'
              : 'inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white'
          }
        >
          <Flag className="size-3.5" />
          {t(compact ? 'reporting.open' : 'reporting.movieButton')}
        </button>
      </DialogTrigger>
      <DialogContent
        closeLabel={t('common.close')}
        className="max-h-[90dvh] overflow-y-auto"
      >
        <DialogTitle className="pr-8">{t('reporting.title')}</DialogTitle>
        <DialogDescription className="mt-2">
          {t('reporting.description')}
        </DialogDescription>
        {!user ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-300">
              {t('reporting.loginRequired')}
            </p>
            <Button asChild className="w-full">
              <Link
                to="/login"
                state={{
                  from: { pathname: `${location.pathname}${location.search}` },
                }}
              >
                {t('header.signIn')}
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            {target.label && (
              <p className="break-words rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-gray-300">
                {target.label}
              </p>
            )}
            {target.type === 'COMMENT' && target.authorId && (
              <fieldset
                className="flex flex-wrap gap-4 text-sm text-gray-300"
                disabled={submission.isPending}
              >
                <legend className="mb-2 text-gray-400">
                  {t('reporting.target')}
                </legend>
                {[false, true].map((author) => (
                  <label
                    key={String(author)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="radio"
                      name={`${id}-target`}
                      checked={reportAuthor === author}
                      className="accent-red-500"
                      onChange={() => {
                        setReportAuthor(author);
                        setReason(
                          reportReasons[author ? 'USER' : 'COMMENT'][0],
                        );
                      }}
                    />
                    {t(author ? 'reporting.author' : 'reporting.comment')}
                  </label>
                ))}
              </fieldset>
            )}
            <div className="space-y-2">
              <label
                htmlFor={`${id}-reason`}
                className="block text-sm font-medium"
              >
                {t('reporting.reason')}
              </label>
              <SelectField
                id={`${id}-reason`}
                value={reason}
                onValueChange={(value) => setReason(value as ReportReason)}
                disabled={submission.isPending}
              >
                {reportReasons[type].map((value) => (
                  <option key={value} value={value}>
                    {t(`admin.reportReasons.${value}`)}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="space-y-2">
              <label
                htmlFor={`${id}-description`}
                className="block text-sm font-medium"
              >
                {t('reporting.details')}
              </label>
              <textarea
                id={`${id}-description`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                minLength={10}
                maxLength={1000}
                disabled={submission.isPending}
                placeholder={t('reporting.placeholder')}
                className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-black/20 p-3 text-sm focus:border-red-400 focus:outline-none"
              />
              <div className="flex justify-between gap-3 text-xs text-gray-400">
                <span>{t('reporting.minLength')}</span>
                <span>{description.length}/1000</span>
              </div>
            </div>
            {(target.context?.episode || target.context?.server) && (
              <p className="text-xs text-gray-400">
                {[target.context.episode, target.context.server]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-300">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                disabled={submission.isPending}
                onClick={() => setOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={
                  submission.isPending ||
                  !!remaining ||
                  description.trim().length < 10
                }
              >
                {submission.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {remaining
                  ? t('reporting.wait', { count: remaining })
                  : t('reporting.submit')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
