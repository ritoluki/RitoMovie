import { SelectField } from '@/components/ui/select-field';
import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  Eye,
  ShieldCheck,
  MessageSquareOff,
} from 'lucide-react';
import adminService from '../services/adminService';
import DataTable, { Column } from '../components/common/DataTable';
import SearchInput from '../components/common/SearchInput';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ActionDropdown from '../components/common/ActionDropdown';
import AdminBreadcrumb from '../components/layout/AdminBreadcrumb';
import { UserDetailsModal, EditUserModal, ChangeRoleModal } from '../components/modals';
import CommentRestrictionModal from '../components/modals/CommentRestrictionModal';
import type { AdminUser, UserQueryParams } from '../types/admin';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/utils/errorMessage';

const AdminUsers: React.FC = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  
  // State
  const [queryParams, setQueryParams] = useState<UserQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [search, setSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  // Modal states
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [changeRoleUser, setChangeRoleUser] = useState<AdminUser | null>(null);
  const [restrictCommentsUser, setRestrictCommentsUser] = useState<AdminUser | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    open: false,
    title: '',
    message: '',
    action: () => {},
    variant: 'danger',
  });

  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', queryParams, search],
    queryFn: () => adminService.getUsers({ ...queryParams, search: search || undefined }),
  });

  // Mutations
  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.banUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (id: string) => adminService.unbanUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: ({ action, userIds, reason }: { action: 'ban' | 'delete'; userIds: string[]; reason?: string }) =>
      adminService.bulkUserAction(action, userIds, reason),
    onSuccess: (result, variables) => {
      toast.success(t(variables.action === 'ban' ? 'admin.users.bannedCount' : 'admin.users.deletedCount', { count: result.modifiedCount }));
      setSelectedRows([]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setConfirmDialog((previous) => ({ ...previous, open: false }));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('admin.users.bulkFailed')));
      setConfirmDialog((previous) => ({ ...previous, open: false }));
    },
  });

  const liftCommentRestrictionMutation = useMutation({
    mutationFn: (id: string) => adminService.liftUserCommentRestriction(id),
    onSuccess: () => {
      toast.success(t('admin.users.restrictionLifted'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || t('admin.users.liftRestrictionFailed')),
  });

  // axios interceptor returns response.data directly, so structure is {success, data, pagination}
  const users = data?.data || [];
  const pagination = data?.pagination;
  const hasActiveCommentRestriction = (user: AdminUser) =>
    Boolean(user.isCommentRestricted && (!user.commentRestrictionExpiresAt || new Date(user.commentRestrictionExpiresAt).getTime() > Date.now()));
  const bulkBanIds = selectedRows.filter((id) => id !== currentUser?._id);

  // Handle actions
  const handleBanUser = (user: AdminUser) => {
    setConfirmDialog({
      open: true,
      title: t('admin.users.banTitle'),
      message: t('admin.users.banMessage', { name: user.name }),
      variant: 'warning',
      action: () => {
        banMutation.mutate({ id: user._id, reason: 'Banned by admin' });
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleUnbanUser = (user: AdminUser) => {
    unbanMutation.mutate(user._id);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setConfirmDialog({
      open: true,
      title: t('admin.users.deleteTitle'),
      message: t('admin.users.deleteMessage', { name: user.name }),
      variant: 'danger',
      action: () => {
        deleteMutation.mutate(user._id);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleBulkBan = () => {
    if (!bulkBanIds.length) return;
    setConfirmDialog({
      open: true,
      title: t('admin.users.banSelectedTitle'),
      message: t('admin.users.banSelectedMessage', { count: bulkBanIds.length }),
      variant: 'warning',
      action: () => bulkMutation.mutate({
        action: 'ban',
        userIds: bulkBanIds,
        reason: 'Banned by admin using bulk action',
      }),
    });
  };

  const handleBulkDelete = () => {
    if (!selectedRows.length || currentUser?.role !== 'super_admin') return;
    setConfirmDialog({
      open: true,
      title: t('admin.users.deleteSelectedTitle'),
      message: t('admin.users.deleteSelectedMessage'),
      variant: 'danger',
      action: () => bulkMutation.mutate({ action: 'delete', userIds: selectedRows }),
    });
  };

  // Table columns
  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: t('admin.users.user'),
      sortable: true,
      render: (user) => (
        <div className="flex items-center space-x-3">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-white font-medium">{user.name}</p>
            <p className="text-gray-400 text-xs">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: t('admin.users.role'),
      sortable: true,
      render: (user) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            user.role === 'super_admin'
              ? 'bg-purple-900/50 text-purple-300'
              : user.role === 'admin'
              ? 'bg-blue-900/50 text-blue-300'
              : user.role === 'moderator'
              ? 'bg-green-900/50 text-green-300'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          {t(`admin.roles.${user.role}`, { defaultValue: user.role.replace('_', ' ') })}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('admin.users.status'),
      render: (user) => (
        <div className="flex flex-col items-start gap-1.5">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.isBanned ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
            {user.isBanned ? t('admin.users.banned') : t('admin.users.active')}
          </span>
          {hasActiveCommentRestriction(user) && (
            <span title={user.commentRestrictionReason || t('admin.users.commentRestrictionTitle')} className="px-2 py-1 text-xs font-medium rounded-full bg-amber-900/50 text-amber-200">
              {t('admin.users.commentRestricted')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: t('admin.users.joined'),
      sortable: true,
      render: (user) => (
        <span className="text-gray-400">
          {new Date(user.createdAt).toLocaleDateString(i18n.language)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('admin.users.actions'),
      width: '80px',
      render: (user) => (
        <ActionDropdown
          actions={[
            {
              label: t('admin.users.viewDetails'),
              icon: <Eye className="h-5 w-5" />,
              onClick: () => setViewUserId(user._id),
            },
            {
              label: t('admin.users.editUser'),
              icon: <Pencil className="h-5 w-5" />,
              onClick: () => setEditUser(user),
            },
            {
              label: t('admin.users.changeRole'),
              icon: <ShieldCheck className="h-5 w-5" />,
              onClick: () => setChangeRoleUser(user),
            },
            ...(hasActiveCommentRestriction(user)
              ? [{
                  label: t('admin.users.allowComments'),
                  icon: <CheckCircle className="h-5 w-5" />,
                  onClick: () => liftCommentRestrictionMutation.mutate(user._id),
                  disabled: liftCommentRestrictionMutation.isPending,
                }]
              : [{
                  label: t('admin.users.restrictComments'),
                  icon: <MessageSquareOff className="h-5 w-5" />,
                  onClick: () => setRestrictCommentsUser(user),
                  disabled: user.isBanned || ['super_admin', 'admin', 'moderator'].includes(user.role),
                }]),
            ...(user.isBanned
              ? [
                  {
                    label: t('admin.users.unban'),
                    icon: <CheckCircle className="h-5 w-5" />,
                    onClick: () => handleUnbanUser(user),
                  },
                ]
              : [
                  {
                    label: t('admin.users.ban'),
                    icon: <Ban className="h-5 w-5" />,
                    onClick: () => handleBanUser(user),
                    variant: 'danger' as const,
                    disabled: ['super_admin', 'admin'].includes(user.role),
                  },
                ]),
            {
              label: t('admin.users.delete'),
              icon: <Trash2 className="h-5 w-5" />,
              onClick: () => handleDeleteUser(user),
              variant: 'danger',
              disabled: user.role === 'super_admin',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminBreadcrumb items={[{ label: t('admin.common.admin'), href: '/admin' }, { label: t('admin.users.title') }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('admin.users.title')}</h1>
          <p className="text-gray-400 mt-1">{t('admin.users.description')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('admin.users.searchPlaceholder')}
          className="sm:w-64"
        />
        
        <SelectField
          value={queryParams.role || ''}
          onValueChange={value => setQueryParams({ ...queryParams, role: value || undefined, page: 1 })}
          className="w-full sm:w-44"
        >
          <option value="">{t('admin.users.allRoles')}</option>
          <option value="user">{t('admin.roles.user')}</option>
          <option value="moderator">{t('admin.roles.moderator')}</option>
          <option value="analyst">{t('admin.roles.analyst')}</option>
          <option value="admin">{t('admin.roles.admin')}</option>
          <option value="super_admin">{t('admin.roles.super_admin')}</option>
        </SelectField>

        <SelectField
          value={queryParams.status || ''}
          onValueChange={value => setQueryParams({ ...queryParams, status: value as UserQueryParams['status'], page: 1 })}
          className="w-full sm:w-44"
        >
          <option value="">{t('admin.users.allStatuses')}</option>
          <option value="active">{t('admin.users.active')}</option>
          <option value="banned">{t('admin.users.banned')}</option>
          <option value="comment_restricted">{t('admin.users.commentRestricted')}</option>
        </SelectField>
      </div>

      {/* Bulk actions */}
      {selectedRows.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/[.07] bg-[#202126] p-4">
          <span className="mr-auto text-sm text-gray-300">{t('admin.common.selected', { count: selectedRows.length })}</span>
          <button
            onClick={handleBulkBan}
            disabled={!bulkBanIds.length || bulkMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Ban className="size-4" />{t('admin.users.banSelected')}
          </button>
          {currentUser?.role === 'super_admin' && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="size-4" />{t('admin.users.deleteSelected')}
            </button>
          )}
          <button
            onClick={() => setSelectedRows([])}
            disabled={bulkMutation.isPending}
            className="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/[.05] hover:text-white disabled:opacity-40"
          >
            {t('admin.common.clearSelection')}
          </button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setQueryParams({ ...queryParams, page })}
        onSort={(key, order) => setQueryParams({ ...queryParams, sortBy: key, sortOrder: order })}
        sortBy={queryParams.sortBy}
        sortOrder={queryParams.sortOrder}
        selectable
        selectedRows={selectedRows}
        onSelectRows={setSelectedRows}
        emptyMessage={t('admin.users.noUsers')}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        loading={banMutation.isPending || deleteMutation.isPending || bulkMutation.isPending}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={!!viewUserId}
        onClose={() => setViewUserId(null)}
        userId={viewUserId}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
      />

      {/* Change Role Modal */}
      <ChangeRoleModal
        isOpen={!!changeRoleUser}
        onClose={() => setChangeRoleUser(null)}
        user={changeRoleUser}
      />

      <CommentRestrictionModal
        user={restrictCommentsUser}
        onClose={() => setRestrictCommentsUser(null)}
      />
    </div>
  );
};

export default AdminUsers;
