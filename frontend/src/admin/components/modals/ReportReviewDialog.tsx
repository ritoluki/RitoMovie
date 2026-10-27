import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select-field';
import { getErrorMessage } from '@/utils/errorMessage';
import adminService from '../../services/adminService';
import type { AdminReport } from '../../types/admin';

export interface ReportSelection {
  ids: string[];
  bulk?: boolean;
  mode: 'view' | 'resolve' | 'reject';
}

export default function ReportReviewDialog({
  selection,
  onClose,
  onUpdated,
}: {
  selection: ReportSelection | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const noteId = useId();
  const [note, setNote] = useState('');
  const [action, setAction] = useState('NONE');
  const reportId = selection && !selection.bulk ? selection.ids[0] : undefined;
  useEffect(() => {
    setNote('');
    setAction('NONE');
  }, [selection]);
  const details = useQuery({
    queryKey: ['admin', 'reports', 'detail', reportId],
    queryFn: () => adminService.getReportDetails(reportId!),
    enabled: !!reportId,
  });
  const report = details.data?.data.report;
  const target = details.data?.data.target;
  const closed = report?.status === 'RESOLVED' || report?.status === 'REJECTED';
  const mutation = useMutation({
    mutationFn: async ({
      kind,
      priority,
    }: {
      kind: 'review' | 'priority' | 'resolve' | 'reject';
      priority?: AdminReport['priority'];
    }) => {
      if (selection?.bulk) {
        return adminService.bulkReportAction(
          kind === 'review' ? 'set-reviewing' : (kind as 'resolve' | 'reject'),
          selection.ids,
          note.trim(),
        );
      }
      if (kind === 'review')
        return adminService.updateReportStatus(reportId!, 'REVIEWING');
      if (kind === 'priority')
        return adminService.updateReportPriority(reportId!, priority!);
      if (kind === 'resolve')
        return adminService.resolveReport(reportId!, note.trim(), action);
      return adminService.rejectReport(reportId!, note.trim());
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['replies'] });
      toast.success(
        selection?.bulk
          ? t('adminReport.bulkUpdated', {
              count: 'modifiedCount' in result ? result.modifiedCount : 0,
            })
          : t('adminReport.updated'),
      );
      onUpdated();
      if (variables.kind === 'resolve' || variables.kind === 'reject')
        onClose();
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, t('adminReport.failed'))),
  });
  const context = report?.context;
  const sourcePath = context?.pagePath;
  const targetLink =
    sourcePath &&
    /^\/(movie|watch)\//.test(sourcePath) &&
    !/[\\\r\n]/.test(sourcePath)
      ? sourcePath
      : context?.movieSlug
        ? `/watch/${encodeURIComponent(context.movieSlug)}`
        : context?.movieId
          ? `/movie/${context.movieId}?type=${context.mediaType || 'movie'}`
          : undefined;
  const busy = mutation.isPending;
  const ready = !!selection?.bulk || (!!report && !details.isError);
  const canCloseReport = ready && !closed && !busy && note.trim().length >= 5;
  return (
    <Dialog
      open={!!selection}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        closeLabel={t('common.close')}
        className="max-h-[90dvh] max-w-2xl overflow-y-auto"
      >
        <DialogTitle className="pr-8">
          {selection?.bulk
            ? t('adminReport.bulkTitle', { count: selection.ids.length })
            : t(
                selection?.mode === 'resolve'
                  ? 'admin.reports.resolveTitle'
                  : selection?.mode === 'reject'
                    ? 'admin.reports.rejectTitle'
                    : 'admin.reports.viewDetails',
              )}
        </DialogTitle>
        <DialogDescription className="mt-2">
          {t(
            selection?.bulk ? 'adminReport.bulkHint' : 'adminReport.reviewHint',
          )}
        </DialogDescription>
        {reportId && details.isLoading && (
          <div className="flex justify-center p-8">
            <Loader2
              aria-label={t('common.loading')}
              className="size-6 animate-spin"
            />
          </div>
        )}
        {reportId && details.isError && (
          <div role="alert" className="mt-4 space-y-3 text-sm text-red-300">
            <p>{getErrorMessage(details.error, t('adminReport.failed'))}</p>
            <Button variant="outline" onClick={() => details.refetch()}>
              {t('common.retry', 'Try again')}
            </Button>
          </div>
        )}
        {report && (
          <div className="mt-5 space-y-4 text-sm">
            <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[.03] p-4 sm:grid-cols-2">
              <div>
                <p className="text-gray-400">{t('admin.reports.reporter')}</p>
                <p className="break-words">
                  {report.reporter?.name || t('admin.common.unknown')}
                </p>
                <p className="break-all text-xs text-gray-500">
                  {report.reporter?.email}
                </p>
              </div>
              <div>
                <p className="text-gray-400">{t('admin.users.status')}</p>
                <p>{t(`admin.reportStatus.${report.status}`)}</p>
                <p className="text-xs text-gray-500">
                  {new Date(report.createdAt).toLocaleString(i18n.language)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">{t('admin.reports.type')}</p>
                <p>{t(`admin.reports.${report.type.toLowerCase()}`)}</p>
              </div>
              <div>
                <p className="text-gray-400">{t('admin.reports.reason')}</p>
                <p>{t(`admin.reportReasons.${report.reason}`)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">{t('adminReport.target')}</h3>
              <p className="break-words text-gray-300">
                {context?.movieTitle ||
                  context?.authorName ||
                  target?.name ||
                  target?.title ||
                  report.targetId}
              </p>
              <p className="break-all font-mono text-xs text-gray-500">
                {report.targetId}
              </p>
              {(target?.text || context?.commentText) && (
                <blockquote className="whitespace-pre-wrap break-words rounded-xl border-l-2 border-red-400/50 bg-white/5 p-3 text-gray-300">
                  {target?.text || context?.commentText}
                </blockquote>
              )}
              {report.type !== 'MOVIE' &&
                report.type !== 'BUG' &&
                (!target || target.isDeleted) && (
                  <p className="text-amber-300">
                    {t('adminReport.targetMissing')}
                  </p>
                )}
              {target?.isHidden && (
                <p className="text-amber-300">
                  {t('adminReport.alreadyHidden')}
                </p>
              )}
              {(context?.episode || context?.server) && (
                <p className="text-gray-400">
                  {t('adminReport.playbackContext')}:{' '}
                  {[context.episode, context.server]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              {targetLink && (
                <Link
                  to={targetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-red-300 underline underline-offset-4"
                >
                  <ExternalLink className="size-3.5" />
                  {t('adminReport.openTarget')}
                </Link>
              )}
            </div>
            <div>
              <h3 className="mb-2 font-medium">
                {t('admin.reports.descriptionColumn')}
              </h3>
              <p className="whitespace-pre-wrap break-words rounded-xl bg-white/5 p-3 text-gray-300">
                {report.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <div className="space-y-2">
                <label
                  htmlFor={`${noteId}-priority`}
                  className="block text-xs text-gray-400"
                >
                  {t('admin.reports.priority')}
                </label>
                <SelectField
                  id={`${noteId}-priority`}
                  value={report.priority}
                  disabled={busy || closed}
                  onValueChange={(priority) =>
                    mutation.mutate({
                      kind: 'priority',
                      priority: priority as AdminReport['priority'],
                    })
                  }
                >
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(
                    (priority) => (
                      <option key={priority} value={priority}>
                        {t(`admin.reportPriority.${priority}`)}
                      </option>
                    ),
                  )}
                </SelectField>
              </div>
              {report.status === 'PENDING' && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => mutation.mutate({ kind: 'review' })}
                >
                  {t('admin.reports.startReviewing')}
                </Button>
              )}
            </div>
            {closed && (
              <div className="rounded-xl border border-white/10 p-4">
                <h3 className="font-medium">{t('adminReport.resolution')}</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-gray-300">
                  {report.resolution || '—'}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {report.reviewedBy?.name} ·{' '}
                  {report.resolvedAt
                    ? new Date(report.resolvedAt).toLocaleString(i18n.language)
                    : ''}
                </p>
              </div>
            )}
          </div>
        )}
        {ready && !closed && (
          <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
            <label htmlFor={noteId} className="block text-sm font-medium">
              {t('adminReport.resolution')}
            </label>
            <textarea
              id={noteId}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              minLength={5}
              maxLength={500}
              disabled={busy}
              placeholder={t('adminReport.notePlaceholder')}
              className="min-h-24 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm focus:border-red-400 focus:outline-none"
            />
            <p className="text-xs text-gray-400">
              {t('adminReport.noteHint')} · {note.length}/500
            </p>
            {report?.type === 'COMMENT' && target && !target.isDeleted && (
              <div className="space-y-2">
                <label htmlFor={`${noteId}-action`} className="block text-sm">
                  {t('adminReport.action')}
                </label>
                <SelectField
                  id={`${noteId}-action`}
                  value={action}
                  onValueChange={setAction}
                  disabled={busy}
                >
                  <option value="NONE">{t('adminReport.noAction')}</option>
                  <option value="HIDE_COMMENT">
                    {t('adminReport.hideComment')}
                  </option>
                </SelectField>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button
                variant="outline"
                disabled={!canCloseReport}
                onClick={() => mutation.mutate({ kind: 'reject' })}
              >
                <XCircle className="size-4" />
                {t('admin.reports.reject')}
              </Button>
              <Button
                disabled={!canCloseReport}
                onClick={() => mutation.mutate({ kind: 'resolve' })}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle className="size-4" />
                )}
                {t('admin.reports.resolve')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
