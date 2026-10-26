import { SelectField } from '@/components/ui/select-field';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import toast from 'react-hot-toast';
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
      toast.success('Selected comments updated');
    },
    onError: () => toast.error('Could not update selected comments'),
  });
  const saveRulesMutation = useMutation({
    mutationFn: () => adminService.updateModerationRules(rules as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation-rules'] });
      toast.success('Moderation rules saved');
    },
    onError: () => toast.error('Could not save moderation rules'),
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
      title: 'Delete selected comments',
      message: `Permanently delete ${selectedRows.length} selected comment(s)?`,
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
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment? This action cannot be undone.',
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
      header: 'User',
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
          <span className="text-white text-sm">{comment.user?.name || 'Unknown'}</span>
        </div>
      ),
    },
    {
      key: 'content',
      header: 'Comment',
      render: (comment) => (
        <div className="max-w-md">
          <p className="text-gray-300 text-sm line-clamp-2">{comment.content}</p>
        </div>
      ),
    },
    {
      key: 'movie',
      header: 'Movie',
      render: (comment) => (
        <span className="text-gray-400 text-sm truncate max-w-[150px] block">
          {comment.movie?.title || 'Unknown'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (comment) => (
        <div className="flex flex-wrap gap-1">
          {comment.isApproved ? (
            <span className="px-2 py-0.5 text-xs bg-green-900/50 text-green-300 rounded">
              Approved
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs bg-yellow-900/50 text-yellow-300 rounded">
              Pending
            </span>
          )}
          {comment.isSpoiler && (
            <span className="px-2 py-0.5 text-xs bg-orange-900/50 text-orange-300 rounded">
              Spoiler
            </span>
          )}
          {comment.isHidden && (
            <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
              Hidden
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (comment) => (
        <span className="text-gray-400 text-sm">
          {new Date(comment.createdAt).toLocaleDateString()}
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
              label: comment.isApproved ? 'Unapprove' : 'Approve',
              icon: comment.isApproved ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />,
              onClick: () => updateMutation.mutate({ id: comment._id, data: { isApproved: !comment.isApproved } }),
            },
            {
              label: comment.isSpoiler ? 'Unmark Spoiler' : 'Mark as Spoiler',
              icon: <AlertTriangle className="h-5 w-5" />,
              onClick: () => updateMutation.mutate({ id: comment._id, data: { isSpoiler: !comment.isSpoiler } }),
            },
            {
              label: comment.isHidden ? 'Unhide' : 'Hide',
              icon: <EyeOff className="h-5 w-5" />,
              onClick: () => updateMutation.mutate({ id: comment._id, data: { isHidden: !comment.isHidden } }),
            },
            {
              label: 'Delete',
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
      <AdminBreadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Comments' }]} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Comments</h1>
        <p className="text-gray-400 mt-1">Moderate user comments</p>
      </div>

      <form onSubmit={event => { event.preventDefault(); saveRulesMutation.mutate(); }} className="mb-6 rounded-xl border border-gray-700 bg-[#1a1a1a] p-5 space-y-4">
        <div><h2 className="text-lg font-semibold text-white">Automatic moderation</h2><p className="text-sm text-gray-400">These rules apply to new comments. Hidden or pending comments stay visible to moderators only.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex items-center gap-2 text-sm text-gray-200"><input type="checkbox" checked={rules.autoApprove} disabled={user?.role === 'analyst'} onChange={e => setRules({ ...rules, autoApprove: e.target.checked })} />Auto approve comments</label>
          <label className="flex items-center gap-2 text-sm text-gray-200"><input type="checkbox" checked={rules.autoHideSpoilers} disabled={user?.role === 'analyst'} onChange={e => setRules({ ...rules, autoHideSpoilers: e.target.checked })} />Hide spoiler comments for review</label>
          <label className="text-sm text-gray-300">Minimum characters<input type="number" min={0} max={1000} disabled={user?.role === 'analyst'} value={rules.minCommentLength} onChange={e => setRules({ ...rules, minCommentLength: Number(e.target.value) })} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white disabled:opacity-50" /></label>
          <label className="text-sm text-gray-300">Maximum characters<input type="number" min={1} max={1000} disabled={user?.role === 'analyst'} value={rules.maxCommentLength} onChange={e => setRules({ ...rules, maxCommentLength: Number(e.target.value) })} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white disabled:opacity-50" /></label>
          <label className="text-sm text-gray-300">Repeated identical comments before hiding<input type="number" min={1} max={100} disabled={user?.role === 'analyst'} value={rules.spamThreshold} onChange={e => setRules({ ...rules, spamThreshold: Number(e.target.value) })} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white disabled:opacity-50" /></label>
          <label className="text-sm text-gray-300 sm:col-span-2 lg:col-span-3">Blocked words (separate with commas)<input disabled={user?.role === 'analyst'} value={rules.blacklistedWords.join(', ')} onChange={e => setRules({ ...rules, blacklistedWords: e.target.value.split(',').map(word => word.trim()).filter(Boolean) })} className="mt-1 w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white disabled:opacity-50" /></label>
        </div>
        {user?.role === 'analyst' ? <p className="text-xs text-gray-400">Analyst access is read only.</p> : <button type="submit" disabled={saveRulesMutation.isPending} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">{saveRulesMutation.isPending ? 'Saving…' : 'Save moderation rules'}</button>}
      </form>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search comments..."
          className="sm:w-64"
        />

        <SelectField
          value={queryParams.status || ''}
          onValueChange={value => setQueryParams({ ...queryParams, status: value as CommentQueryParams['status'], page: 1 })}
          className="w-full sm:w-44"
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="spoiler">Spoilers</option>
        </SelectField>
      </div>

      {/* Bulk actions */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-[#2a2a2a] rounded-lg">
          <span className="text-sm text-gray-300">
            {selectedRows.length} comment(s) selected
          </span>
          <button onClick={() => runBulkAction('approve')} disabled={bulkMutation.isPending} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            Approve
          </button>
          <button onClick={() => runBulkAction('reject')} disabled={bulkMutation.isPending} className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50">
            Reject
          </button>
          <button onClick={() => runBulkAction('delete')} disabled={bulkMutation.isPending} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            Delete
          </button>
          <button
            onClick={() => setSelectedRows([])}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white"
          >
            Clear Selection
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
        emptyMessage="No comments found"
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
