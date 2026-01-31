import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import adminService from '../services/adminService';
import DataTable, { Column } from '../components/common/DataTable';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ActionDropdown from '../components/common/ActionDropdown';
import AdminBreadcrumb from '../components/layout/AdminBreadcrumb';
import type { AdminReport, ReportQueryParams } from '../types/admin';

const AdminReports: React.FC = () => {
  const queryClient = useQueryClient();

  // State
  const [queryParams, setQueryParams] = useState<ReportQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
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
    variant: 'info',
  });

  // Fetch reports
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', queryParams],
    queryFn: () => adminService.getReports(queryParams),
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminReport['status'] }) =>
      adminService.updateReportStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      adminService.resolveReport(id, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.rejectReport(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });

  // axios interceptor returns response.data directly, so structure is {success, data, pagination}
  const reports = data?.data || [];
  const pagination = data?.pagination;
  const statusCounts = data?.statusCounts || {};

  // Handlers
  const handleResolve = (report: AdminReport) => {
    setConfirmDialog({
      open: true,
      title: 'Resolve Report',
      message: `Mark this ${report.type.toLowerCase()} report as resolved?`,
      variant: 'info',
      action: () => {
        resolveMutation.mutate({ id: report._id, resolution: 'Resolved by admin' });
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleReject = (report: AdminReport) => {
    setConfirmDialog({
      open: true,
      title: 'Reject Report',
      message: `Reject this ${report.type.toLowerCase()} report?`,
      variant: 'warning',
      action: () => {
        rejectMutation.mutate({ id: report._id, reason: 'Rejected by admin' });
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  // Priority badge colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-900/50 text-red-300';
      case 'HIGH':
        return 'bg-orange-900/50 text-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-900/50 text-yellow-300';
      case 'LOW':
        return 'bg-gray-700 text-gray-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-900/50 text-yellow-300';
      case 'REVIEWING':
        return 'bg-blue-900/50 text-blue-300';
      case 'RESOLVED':
        return 'bg-green-900/50 text-green-300';
      case 'REJECTED':
        return 'bg-gray-700 text-gray-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  // Table columns
  const columns: Column<AdminReport>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (report) => (
        <span className="px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded">
          {report.type}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (report) => (
        <span className="text-gray-300 text-sm">{report.reason.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (report) => (
        <p className="text-gray-400 text-sm line-clamp-2 max-w-xs">
          {report.description}
        </p>
      ),
    },
    {
      key: 'reporter',
      header: 'Reporter',
      render: (report) => (
        <div className="flex items-center space-x-2">
          {report.reporter?.avatar ? (
            <img
              src={report.reporter.avatar}
              alt={report.reporter.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs">
              {report.reporter?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <span className="text-gray-300 text-sm">{report.reporter?.name || 'Unknown'}</span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (report) => (
        <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(report.priority)}`}>
          {report.priority}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (report) => (
        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(report.status)}`}>
          {report.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (report) => (
        <span className="text-gray-400 text-sm">
          {new Date(report.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '80px',
      render: (report) => (
        <ActionDropdown
          actions={[
            {
              label: 'View Details',
              icon: <Eye className="h-5 w-5" />,
              onClick: () => console.log('View', report._id),
            },
            ...(report.status === 'PENDING'
              ? [
                  {
                    label: 'Start Reviewing',
                    icon: <RefreshCw className="h-5 w-5" />,
                    onClick: () => updateStatusMutation.mutate({ id: report._id, status: 'REVIEWING' }),
                  },
                ]
              : []),
            ...(report.status !== 'RESOLVED' && report.status !== 'REJECTED'
              ? [
                  {
                    label: 'Resolve',
                    icon: <CheckCircle className="h-5 w-5" />,
                    onClick: () => handleResolve(report),
                  },
                  {
                    label: 'Reject',
                    icon: <XCircle className="h-5 w-5" />,
                    onClick: () => handleReject(report),
                    variant: 'danger' as const,
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminBreadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Reports' }]} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-gray-400 mt-1">Handle user reports and flags</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setQueryParams({ ...queryParams, status: undefined, page: 1 })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !queryParams.status
              ? 'bg-red-600 text-white'
              : 'bg-[#2a2a2a] text-gray-300 hover:bg-gray-700'
          }`}
        >
          All ({Object.values(statusCounts).reduce((a, b) => a + b, 0) || 0})
        </button>
        {['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setQueryParams({ ...queryParams, status: status as ReportQueryParams['status'], page: 1 })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              queryParams.status === status
                ? 'bg-red-600 text-white'
                : 'bg-[#2a2a2a] text-gray-300 hover:bg-gray-700'
            }`}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()} ({statusCounts[status] || 0})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={queryParams.type || ''}
          onChange={(e) => setQueryParams({ ...queryParams, type: e.target.value as ReportQueryParams['type'], page: 1 })}
          className="px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
        >
          <option value="">All Types</option>
          <option value="COMMENT">Comment</option>
          <option value="USER">User</option>
          <option value="MOVIE">Movie</option>
          <option value="BUG">Bug</option>
        </select>

        <select
          value={queryParams.priority || ''}
          onChange={(e) => setQueryParams({ ...queryParams, priority: e.target.value as ReportQueryParams['priority'], page: 1 })}
          className="px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-[#2a2a2a] rounded-lg">
          <span className="text-sm text-gray-300">
            {selectedRows.length} report(s) selected
          </span>
          <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
            Resolve Selected
          </button>
          <button className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Reject Selected
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
        data={reports}
        loading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setQueryParams({ ...queryParams, page })}
        onSort={(key, order) => setQueryParams({ ...queryParams, sortBy: key, sortOrder: order })}
        sortBy={queryParams.sortBy}
        sortOrder={queryParams.sortOrder}
        selectable
        selectedRows={selectedRows}
        onSelectRows={setSelectedRows}
        emptyMessage="No reports found"
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        loading={resolveMutation.isPending || rejectMutation.isPending}
      />
    </div>
  );
};

export default AdminReports;
