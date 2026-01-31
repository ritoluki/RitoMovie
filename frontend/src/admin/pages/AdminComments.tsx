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

const AdminComments: React.FC = () => {
  const queryClient = useQueryClient();

  // State
  const [queryParams, setQueryParams] = useState<CommentQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [search, setSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
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

  // axios interceptor returns response.data directly, so structure is {success, data, pagination}
  const comments = data?.data || [];
  const pagination = data?.pagination;

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search comments..."
          className="sm:w-64"
        />

        <select
          value={queryParams.status || ''}
          onChange={(e) => setQueryParams({ ...queryParams, status: e.target.value as CommentQueryParams['status'], page: 1 })}
          className="px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="spoiler">Spoilers</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-[#2a2a2a] rounded-lg">
          <span className="text-sm text-gray-300">
            {selectedRows.length} comment(s) selected
          </span>
          <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
            Approve
          </button>
          <button className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
            Reject
          </button>
          <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
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
