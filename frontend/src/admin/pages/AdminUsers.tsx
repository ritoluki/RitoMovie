import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import adminService from '../services/adminService';
import DataTable, { Column } from '../components/common/DataTable';
import SearchInput from '../components/common/SearchInput';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ActionDropdown from '../components/common/ActionDropdown';
import AdminBreadcrumb from '../components/layout/AdminBreadcrumb';
import { UserDetailsModal, EditUserModal, ChangeRoleModal } from '../components/modals';
import type { AdminUser, UserQueryParams } from '../types/admin';

const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();
  
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

  // axios interceptor returns response.data directly, so structure is {success, data, pagination}
  const users = data?.data || [];
  const pagination = data?.pagination;

  // Handle actions
  const handleBanUser = (user: AdminUser) => {
    setConfirmDialog({
      open: true,
      title: 'Ban User',
      message: `Are you sure you want to ban ${user.name}? They will not be able to access their account.`,
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
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      variant: 'danger',
      action: () => {
        deleteMutation.mutate(user._id);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  // Table columns
  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'User',
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
      header: 'Role',
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
          {user.role}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            user.isBanned
              ? 'bg-red-900/50 text-red-300'
              : 'bg-green-900/50 text-green-300'
          }`}
        >
          {user.isBanned ? 'Banned' : 'Active'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: (user) => (
        <span className="text-gray-400">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '80px',
      render: (user) => (
        <ActionDropdown
          actions={[
            {
              label: 'View Details',
              icon: <Eye className="h-5 w-5" />,
              onClick: () => setViewUserId(user._id),
            },
            {
              label: 'Edit User',
              icon: <Pencil className="h-5 w-5" />,
              onClick: () => setEditUser(user),
            },
            {
              label: 'Change Role',
              icon: <ShieldCheck className="h-5 w-5" />,
              onClick: () => setChangeRoleUser(user),
            },
            ...(user.isBanned
              ? [
                  {
                    label: 'Unban User',
                    icon: <CheckCircle className="h-5 w-5" />,
                    onClick: () => handleUnbanUser(user),
                  },
                ]
              : [
                  {
                    label: 'Ban User',
                    icon: <Ban className="h-5 w-5" />,
                    onClick: () => handleBanUser(user),
                    variant: 'danger' as const,
                    disabled: ['super_admin', 'admin'].includes(user.role),
                  },
                ]),
            {
              label: 'Delete User',
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
      <AdminBreadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 mt-1">Manage user accounts and permissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search users..."
          className="sm:w-64"
        />
        
        <select
          value={queryParams.role || ''}
          onChange={(e) => setQueryParams({ ...queryParams, role: e.target.value || undefined, page: 1 })}
          className="px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>

        <select
          value={queryParams.status || ''}
          onChange={(e) => setQueryParams({ ...queryParams, status: e.target.value as 'active' | 'banned' | undefined, page: 1 })}
          className="px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-[#2a2a2a] rounded-lg">
          <span className="text-sm text-gray-300">
            {selectedRows.length} user(s) selected
          </span>
          <button
            onClick={() => console.log('Bulk ban', selectedRows)}
            className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Ban Selected
          </button>
          <button
            onClick={() => console.log('Bulk delete', selectedRows)}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete Selected
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
        emptyMessage="No users found"
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        loading={banMutation.isPending || deleteMutation.isPending}
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
    </div>
  );
};

export default AdminUsers;
