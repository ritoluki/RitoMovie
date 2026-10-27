import { SelectField } from '@/components/ui/select-field';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Check,
  X,
  Trash2,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import adminService from '../services/adminService';
import DataTable, { Column } from '../components/common/DataTable';
import SearchInput from '../components/common/SearchInput';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ActionDropdown from '../components/common/ActionDropdown';
import AdminBreadcrumb from '../components/layout/AdminBreadcrumb';
import type { AdminComment, CommentQueryParams } from '../types/admin';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

interface ModerationRules {
  autoApprove: boolean;
  blacklistedWords: string[];
  maxCommentLength: number;
  minCommentLength: number;
  spamThreshold: number;
  autoHideSpoilers: boolean;
}

const DEFAULT_RULES: ModerationRules = {
  autoApprove: true, blacklistedWords: [], maxCommentLength: 1000,
  minCommentLength: 1, spamThreshold: 3, autoHideSpoilers: true,
};

const AdminComments: React.FC = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // State
  const [queryParams, setQueryParams] = useState<CommentQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [search, setSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [rules, setRules] = useState<ModerationRules>(DEFAULT_RULES);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    action: () => {},
  });

  // Fetch comments
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'comments', queryParams, search],
    queryFn: () => adminService.getComments({ ...queryParams, search: search || undefined }),
  });

  const { data: rulesData } = useQuery({
    queryKey: ['admin', 'moderation-rules'],
    queryFn: () => adminService.getModerationRules(),
  });
  useEffect(() => {
    const saved = (rulesData as { data?: Partial<ModerationRules> } | undefined)?.data;
    if (saved) setRules({ ...DEFAULT_RULES, ...saved });
  }, [rulesData]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isApproved?: boolean; isSpoiler?: boolean; isHidden?: boolean } }) =>
      adminService.updateCommentStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (action: 'approve' | 'reject' | 'hide' | 'delete') => adminService.bulkCommentAction(action, selectedRows),
    onSuccess: () => {
      setSelectedRows([]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
      toast.success(t('admin.comments.selectedUpdated'));
    },
    onError: () => toast.error(t('admin.comments.updateFailed')),
  });
  const saveRulesMutation = useMutation({
    mutationFn: () => adminService.updateModerationRules(rules as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation-rules'] });
      toast.success(t('admin.comments.rulesSaved'));
    },
    onError: () => toast.error(t('admin.comments.rulesSaveFailed')),
  });

  // axios interceptor returns response.data directly, so structure is {success, data, pagination}
  const comments = data?.data || [];
  const pagination = data?.pagination;

  const runBulkAction = (action: 'approve' | 'reject' | 'delete') => {
    if (action !== 'delete') {
      bulkMutation.mutate(action);
      return;
    }
    setConfirmDialog({
      open: true,
      title: t('admin.comments.deleteSelectedTitle'),
      message: t('admin.comments.deleteSelectedMessage', { count: selectedRows.length }),
      action: () => {
        bulkMutation.mutate('delete');
        setConfirmDialog(previous => ({ ...previous, open: false }));
      },
    });
  };

  // Handle actions
  const handleDeleteComment = (comment: AdminComment) => {
    setConfirmDialog({
      open: true,
      title: t('admin.comments.deleteTitle'),
      message: t('admin.comments.deleteMessage'),
      action: () => {
        deleteMutation.mutate(comment._id);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  // Table columns
  const columns: Column<AdminComment>[] = [
    {
      key: 'user',
      header: t('admin.comments.user'),
      render: (comment) => (
        <div className="flex items-center space-x-2">
          {comment.user?.avatar ? (
            <img
              src={comment.user.avatar}
              alt={comment.user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm">
              {comment.user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <span className="text-white text-sm">{comment.user?.name || t('admin.common.unknown')}</span>
        </div>
      ),
    },
    {
      key: 'content',
      header: t('admin.comments.comment'),
      render: (comment) => (
        <div className="max-w-md">
          <p className="text-gray-300 text-sm line-clamp-2">{comment.content}</p>
        </div>
      ),
    },
    {
      key: 'movie',
      header: t('admin.comments.movie'),
      render: (comment) => (
        <span className="text-gray-400 text-sm truncate max-w-[150px] block">
          {comment.movie?.title || t('admin.common.unknown')}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('admin.common.status'),
      render: (comment) => (
        <div className="flex flex-wrap gap-1">
          {comment.isApproved ? (
            <span className="px-2 py-0.5 text-xs bg-green-900/50 text-green-300 rounded">
              {t('admin.comments.approved')}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs bg-yellow-900/50 text-yellow-300 rounded">
              {t('admin.comments.pending')}
            </span>
          )}
          {comment.isSpoiler && (
            <span className="px-2 py-0.5 text-xs bg-orange-900/50 text-orange-300 rounded">
              {t('admin.comments.spoilers')}
            </span>
          )}
          {comment.isHidden && (
            <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
              {t('admin.homeLayout.hidden')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: t('admin.comments.date'),
      sortable: true,
      render: (comment) => (
        <span className="text-gray-400 text-sm">
          {new Date(comment.createdAt).toLocaleDateString(i18n.language)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '80px',
      render: (comment) => (
        <ActionDropdown
          actions={[
            {
              label: comment.isApproved ? t('admin.comments.unapprove') : t('admin.comments.approve'),
              icon: comment.isApproved ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />,
              onClick: () => updateMutation.mutate({ id: comment._id, data: { isApproved: !comment.isApproved } }),
            },
            {
              label: comment.isSpoiler ? t('admin.comments.unmarkSpoiler') : t('admin.comments.markSpoiler'),
              icon: <AlertTriangle className="h-5 w-5" />,
              onClick: () => updateMutation.mutate({ id: comment._id, data: { isSpoiler: !comment.isSpoiler } }),
            },
            {
              label: comment.isHidden ? t('admin.comments.unhide') : t('admin.comments.hide'),
              icon: <EyeOff className="h-5 w-5" />,
              onClick: () => updateMutation.mutate({ id: comment._id, data: { isHidden: !comment.isHidden } }),
            },
            {
              label: t('admin.comments.delete'),
              icon: <Trash2 className="h-5 w-5" />,
              onClick: () => handleDeleteComment(comment),
              variant: 'danger',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminBreadcrumb items={[{ label: t('admin.common.admin'), href: '/admin' }, { label: t('admin.comments.title') }]} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{t('admin.comments.title')}</h1>
        <p className="text-gray-400 mt-1">{t('admin.comments.description')}</p>
      </div>

      <form onSubmit={event => { event.preventDefault(); saveRulesMutation.mutate(); }} className="mb-6 rounded-xl border border-gray-700 bg-[#1a1a1a] p-5 space-y-4">
        <div><h2 className="text-lg font-semibold text-white">{t('admin.comments.automaticModeration')}</h2><p className="text-sm text-gray-400">{t('admin.comments.rulesDescription')}</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex items-center gap-2 text-sm text-gray-200"><input type="checkbox" checked={rules.autoApprove} disabled={user?.role === 'analyst'} onChange={e => setRules({ ...rules, autoApprove: e.target.checked })} />{t('admin.comments.autoApprove')}</label>
          <label className="flex items-center gap-2 text-sm text-gray-200"><input type="checkbox" checked={rules.autoHideSpoilers} disabled={user?.role === 'analyst'} onChange={e => setRules({ ...rules, autoHideSpoilers: e.target.checked })} />{t('admin.comments.hideSpoilers')}</label>
          <label className="text-sm text-gray-300">{t('admin.comments.minimumCharacters')}<input type="number" min={0} max={1000} disabled={user?.role === 'analyst'} value={rules.minCommentLength} onChange={e => setRules({ ...rules, minCommentLength: Number(e.target.value) })} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white disabled:opacity-50" /></label>
          <label className="text-sm text-gray-300">{t('admin.comments.maximumCharacters')}<input type="number" min={1} max={1000} disabled={user?.role === 'analyst'} value={rules.maxCommentLength} onChange={e => setRules({ ...rules, maxCommentLength: Number(e.target.value) })} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white disabled:opacity-50" /></label>
          <label className="text-sm text-gray-300">{t('admin.comments.spamThreshold')}<input type="number" min={1} max={100} disabled={user?.role === 'analyst'} value={rules.spamThreshold} onChange={e => setRules({ ...rules, spamThreshold: Number(e.target.value) })} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white disabled:opacity-50" /></label>
          <label className="text-sm text-gray-300 sm:col-span-2 lg:col-span-3">{t('admin.comments.blockedWords')}<input disabled={user?.role === 'analyst'} value={rules.blacklistedWords.join(', ')} onChange={e => setRules({ ...rules, blacklistedWords: e.target.value.split(',').map(word => word.trim()).filter(Boolean) })} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white disabled:opacity-50" /></label>
        </div>
        {user?.role === 'analyst' ? <p className="text-xs text-gray-400">{t('admin.comments.readOnly')}</p> : <button type="submit" disabled={saveRulesMutation.isPending} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">{saveRulesMutation.isPending ? t('admin.common.saving') : t('admin.comments.saveRules')}</button>}
      </form>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('admin.comments.searchPlaceholder')}
          className="sm:w-64"
        />

        <SelectField
          value={queryParams.status || ''}
          onValueChange={value => setQueryParams({ ...queryParams, status: value as CommentQueryParams['status'], page: 1 })}
          className="w-full sm:w-44"
        >
          <option value="">{t('admin.comments.allStatus')}</option>
          <option value="approved">{t('admin.comments.approved')}</option>
          <option value="pending">{t('admin.comments.pending')}</option>
          <option value="spoiler">{t('admin.comments.spoilers')}</option>
        </SelectField>
      </div>

      {/* Bulk actions */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-[#2a2a2a] rounded-lg">
          <span className="text-sm text-gray-300">
            {t('admin.comments.selected', { count: selectedRows.length })}
          </span>
          <button onClick={() => runBulkAction('approve')} disabled={bulkMutation.isPending} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {t('admin.comments.approve')}
          </button>
          <button onClick={() => runBulkAction('reject')} disabled={bulkMutation.isPending} className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50">
            {t('admin.comments.reject')}
          </button>
          <button onClick={() => runBulkAction('delete')} disabled={bulkMutation.isPending} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {t('admin.comments.delete')}
          </button>
          <button
            onClick={() => setSelectedRows([])}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white"
          >
            {t('admin.common.clearSelection')}
          </button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={comments}
        loading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setQueryParams({ ...queryParams, page })}
        onSort={(key, order) => setQueryParams({ ...queryParams, sortBy: key, sortOrder: order })}
        sortBy={queryParams.sortBy}
        sortOrder={queryParams.sortOrder}
        selectable
        selectedRows={selectedRows}
        onSelectRows={setSelectedRows}
        emptyMessage={t('admin.comments.noComments')}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminComments;
