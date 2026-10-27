import { SelectField } from '@/components/ui/select-field';
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';
import adminService from '../services/adminService';
import DataTable, { Column } from '../components/common/DataTable';
import ReportReviewDialog, {
  type ReportSelection,
} from '../components/modals/ReportReviewDialog';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorMessage';
import ActionDropdown from '../components/common/ActionDropdown';
import AdminBreadcrumb from '../components/layout/AdminBreadcrumb';
import type { AdminReport, ReportQueryParams } from '../types/admin';

const AdminReports: React.FC = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  // State
  const [queryParams, setQueryParams] = useState<ReportQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selection, setSelection] = useState<ReportSelection | null>(null);
  useEffect(() => setSelectedRows([]), [queryParams]);

  // Fetch reports
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'reports', queryParams],
    queryFn: () => adminService.getReports(queryParams),
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: AdminReport['status'];
    }) => adminService.updateReportStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success(t('adminReport.updated'));
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, t('adminReport.failed'))),
  });

  // axios interceptor returns response.data directly, so structure is {success, data, pagination}
  const reports = data?.data || [];
  const pagination = data?.pagination;
  const statusCounts = data?.statusCounts || {};
  const selectedOpenIds = reports
    .filter(
      (report) =>
        selectedRows.includes(report._id) &&
        ['PENDING', 'REVIEWING'].includes(report.status),
    )
    .map((report) => report._id);

  // Handlers
  const handleResolve = (report: AdminReport) => {
    setSelection({ ids: [report._id], mode: 'resolve' });
  };

  const handleReject = (report: AdminReport) => {
    setSelection({ ids: [report._id], mode: 'reject' });
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
      key: 'targetId',
      header: t('adminReport.target'),
      render: (report) => (
        <button
          onClick={() => setSelection({ ids: [report._id], mode: 'view' })}
          className="max-w-52 truncate text-left text-sm text-red-300 hover:underline"
        >
          {report.context?.movieTitle ||
            report.context?.authorName ||
            report.targetId}
        </button>
      ),
    },
    {
      key: 'type',
      header: t('admin.reports.type'),
      render: (report) => (
        <span className="px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded">
          {t(`admin.reports.${report.type.toLowerCase()}`, {
            defaultValue: report.type,
          })}
        </span>
      ),
    },
    {
      key: 'reason',
      header: t('admin.reports.reason'),
      render: (report) => (
        <span className="text-gray-300 text-sm">
          {t(`admin.reportReasons.${report.reason}`, {
            defaultValue: report.reason.replace('_', ' '),
          })}
        </span>
      ),
    },
    {
      key: 'description',
      header: t('admin.reports.descriptionColumn'),
      render: (report) => (
        <p className="text-gray-400 text-sm line-clamp-2 max-w-xs">
          {report.description}
        </p>
      ),
    },
    {
      key: 'reporter',
      header: t('admin.reports.reporter'),
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
          <span className="text-gray-300 text-sm">
            {report.reporter?.name || t('admin.common.unknown')}
          </span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: t('admin.reports.priority'),
      render: (report) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(report.priority)}`}
        >
          {t(`admin.reportPriority.${report.priority}`, {
            defaultValue: report.priority,
          })}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('admin.common.status'),
      render: (report) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(report.status)}`}
        >
          {t(`admin.reportStatus.${report.status}`, {
            defaultValue: report.status,
          })}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('admin.reports.date'),
      sortable: true,
      render: (report) => (
        <span className="text-gray-400 text-sm">
          {new Date(report.createdAt).toLocaleDateString(i18n.language)}
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
              label: t('admin.reports.viewDetails'),
              icon: <Eye className="h-5 w-5" />,
              onClick: () => setSelection({ ids: [report._id], mode: 'view' }),
            },
            ...(report.status === 'PENDING'
              ? [
                  {
                    label: t('admin.reports.startReviewing'),
                    icon: <RefreshCw className="h-5 w-5" />,
                    onClick: () =>
                      updateStatusMutation.mutate({
                        id: report._id,
                        status: 'REVIEWING',
                      }),
                    disabled: updateStatusMutation.isPending,
                  },
                ]
              : []),
            ...(report.status !== 'RESOLVED' && report.status !== 'REJECTED'
              ? [
                  {
                    label: t('admin.reports.resolve'),
                    icon: <CheckCircle className="h-5 w-5" />,
                    onClick: () => handleResolve(report),
                  },
                  {
                    label: t('admin.reports.reject'),
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
      <AdminBreadcrumb
        items={[
          { label: t('admin.common.admin'), href: '/admin' },
          { label: t('admin.reports.title') },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {t('admin.reports.title')}
        </h1>
        <p className="text-gray-400 mt-1">{t('admin.reports.description')}</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() =>
            setQueryParams({ ...queryParams, status: undefined, page: 1 })
          }
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !queryParams.status
              ? 'bg-red-600 text-white'
              : 'bg-[#2a2a2a] text-gray-300 hover:bg-gray-700'
          }`}
        >
          {t('admin.common.all')} (
          {Object.values(statusCounts).reduce((a, b) => a + b, 0) || 0})
        </button>
        {['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() =>
              setQueryParams({
                ...queryParams,
                status: status as ReportQueryParams['status'],
                page: 1,
              })
            }
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              queryParams.status === status
                ? 'bg-red-600 text-white'
                : 'bg-[#2a2a2a] text-gray-300 hover:bg-gray-700'
            }`}
          >
            {t(`admin.reportStatus.${status}`, {
              defaultValue: status.charAt(0) + status.slice(1).toLowerCase(),
            })}{' '}
            ({statusCounts[status] || 0})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SelectField
          value={queryParams.type || ''}
          onValueChange={(value) =>
            setQueryParams({
              ...queryParams,
              type: value as ReportQueryParams['type'],
              page: 1,
            })
          }
          className="w-full sm:w-44"
        >
          <option value="">{t('admin.reports.allTypes')}</option>
          <option value="COMMENT">{t('admin.reports.comment')}</option>
          <option value="USER">{t('admin.reports.user')}</option>
          <option value="MOVIE">{t('admin.reports.movie')}</option>
          <option value="BUG">{t('admin.reports.bug')}</option>
        </SelectField>

        <SelectField
          value={queryParams.priority || ''}
          onValueChange={(value) =>
            setQueryParams({
              ...queryParams,
              priority: value as ReportQueryParams['priority'],
              page: 1,
            })
          }
          className="w-full sm:w-44"
        >
          <option value="">{t('admin.reports.allPriorities')}</option>
          <option value="CRITICAL">{t('admin.reports.critical')}</option>
          <option value="HIGH">{t('admin.reports.high')}</option>
          <option value="MEDIUM">{t('admin.reports.medium')}</option>
          <option value="LOW">{t('admin.reports.low')}</option>
        </SelectField>
      </div>

      {/* Bulk actions */}
      {selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-[#2a2a2a] rounded-lg">
          <span className="text-sm text-gray-300">
            {t('admin.reports.selected', { count: selectedRows.length })}
          </span>
          <button
            disabled={!selectedOpenIds.length}
            onClick={() =>
              setSelection({
                ids: selectedOpenIds,
                bulk: true,
                mode: 'resolve',
              })
            }
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40"
          >
            {t('admin.reports.resolveSelected')}
          </button>
          <button
            disabled={!selectedOpenIds.length}
            onClick={() =>
              setSelection({ ids: selectedOpenIds, bulk: true, mode: 'reject' })
            }
            className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40"
          >
            {t('admin.reports.rejectSelected')}
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
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-sm text-red-300"
        >
          {getErrorMessage(error, t('adminReport.failed'))}
          <button className="underline" onClick={() => refetch()}>
            {t('common.retry', 'Try again')}
          </button>
        </div>
      )}
      <DataTable
        columns={columns}
        data={reports}
        loading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setQueryParams({ ...queryParams, page })}
        onSort={(key, order) =>
          setQueryParams({ ...queryParams, sortBy: key, sortOrder: order })
        }
        sortBy={queryParams.sortBy}
        sortOrder={queryParams.sortOrder}
        selectable
        selectedRows={selectedRows}
        onSelectRows={setSelectedRows}
        emptyMessage={t('admin.reports.noReports')}
      />

      <ReportReviewDialog
        selection={selection}
        onClose={() => setSelection(null)}
        onUpdated={() => setSelectedRows([])}
      />
    </div>
  );
};

export default AdminReports;
