import { SelectField } from '@/components/ui/select-field';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Download,
  RefreshCw,
  Filter,
  Clock,
  User,
  Shield,
  AlertTriangle,
  Eye,
  Calendar,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import DataTable, { Column } from '../components/common/DataTable';
import ChartWrapper from '../components/common/ChartWrapper';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface AuditLog {
  _id: string;
  admin: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  } | null;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditLogStats {
  actionsByType: { _id: string; count: number }[];
  resourcesByType: { _id: string; count: number }[];
  actionsByAdmin: { _id: string; count: number; admin: { name: string; email: string } }[];
  dailyActivity: { _id: string; count: number }[];
  securityEvents: { _id: string; count: number }[];
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-500/20 text-green-400',
  UPDATE: 'bg-blue-500/20 text-blue-400',
  DELETE: 'bg-red-500/20 text-red-400',
  LOGIN: 'bg-purple-500/20 text-purple-400',
  LOGOUT: 'bg-gray-500/20 text-gray-400',
  BAN: 'bg-orange-500/20 text-orange-400',
  UNBAN: 'bg-teal-500/20 text-teal-400',
  RESTRICT_COMMENTS: 'bg-amber-500/20 text-amber-300',
  LIFT_COMMENT_RESTRICTION: 'bg-teal-500/20 text-teal-300',
  APPROVE: 'bg-green-500/20 text-green-400',
  REJECT: 'bg-red-500/20 text-red-400',
  UNAUTHORIZED_ACCESS: 'bg-red-500/20 text-red-400',
  SECURITY_ALERT: 'bg-yellow-500/20 text-yellow-400',
};

const AdminAuditLog: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  // Fetch audit logs
  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'audit-logs', page, search, actionFilter, resourceFilter, dateFrom, dateTo],
    queryFn: () => adminService.getAuditLogs({
      page,
      limit,
      search: search || undefined,
      action: actionFilter || undefined,
      resource: resourceFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['admin', 'audit-logs', 'stats'],
    queryFn: () => adminService.getAuditLogStats('7d'),
  });

  // axios interceptor returns response.data directly, so structure is {success, data, pagination}
  const logs = (logsData?.data || []) as AuditLog[];
  const pagination = logsData?.pagination;
  const stats: AuditLogStats | undefined = statsData?.data;

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await adminService.exportAuditLogs(format, dateFrom, dateTo);
      if (format === 'csv') {
        // When responseType is 'blob', axios response.data is a Blob
        // Our axios interceptor returns response.data directly, so response IS the Blob
        const blob = response instanceof Blob ? response : new Blob([JSON.stringify(response)], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      header: t('admin.audit.time'),
      sortable: true,
      render: (log) => (
        <div className="flex items-center gap-2 text-gray-300">
          <Clock className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-sm">{new Date(log.createdAt).toLocaleDateString(dateLocale)}</p>
            <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleTimeString(dateLocale)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'admin',
      header: t('admin.audit.admin'),
      render: (log) => (
        <div className="flex items-center gap-2">
          {log.admin ? (
            <>
              <img
                src={log.admin.avatar || `https://ui-avatars.com/api/?name=${log.admin.name}&background=random`}
                alt={log.admin.name}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-white text-sm">{log.admin.name}</p>
                <p className="text-gray-500 text-xs">{log.admin.email}</p>
              </div>
            </>
          ) : (
            <span className="text-gray-500">{t('admin.common.system')}</span>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: t('admin.audit.action'),
      sortable: true,
      render: (log) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${actionColors[log.action] || 'bg-gray-500/20 text-gray-400'}`}>
          {t(`admin.auditActions.${log.action}`, { defaultValue: log.action })}
        </span>
      ),
    },
    {
      key: 'resource',
      header: t('admin.audit.resource'),
      sortable: true,
      render: (log) => (
        <div>
          <p className="text-white text-sm">{t(`admin.resources.${log.resource}`, { defaultValue: log.resource })}</p>
          {log.resourceId && (
            <p className="text-gray-500 text-xs truncate max-w-[150px]">{log.resourceId}</p>
          )}
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: t('admin.audit.ipAddress'),
      render: (log) => (
        <span className="text-gray-400 text-sm">{log.ipAddress || t('admin.common.na')}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (log) => (
        <button
          onClick={() => setSelectedLog(log)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  // Prepare chart data
  const activityChartData = stats?.dailyActivity?.map((item) => ({
      name: new Date(item._id).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' }),
    actions: item.count,
  })) || [];

  const actionTypeChartData = stats?.actionsByType?.map((item) => ({
      name: t(`admin.auditActions.${item._id}`, { defaultValue: item._id }),
    value: item.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('admin.audit.title')}</h1>
          <p className="text-gray-400 mt-1">{t('admin.audit.description')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('admin.common.export')}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWrapper
            title={t('admin.audit.dailyActivity')}
            type="bar"
            data={activityChartData}
            dataKey="actions"
            height={200}
          />
          <ChartWrapper
            title={t('admin.audit.actionsByType')}
            type="pie"
            data={actionTypeChartData}
            dataKey="value"
            height={200}
          />
        </div>
      )}

      {/* Security Alerts */}
      {stats?.securityEvents && stats.securityEvents.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-red-400 font-semibold">{t('admin.audit.securityEvents')}</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            {stats.securityEvents.map((event) => (
              <div key={event._id} className="flex items-center gap-2">
                <span className="text-red-300">{t(`admin.auditActions.${event._id}`, { defaultValue: event._id })}:</span>
                <span className="text-white font-medium">{event.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.audit.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            {t('admin.audit.filters')}
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700">
            <div>
              <label className="block text-gray-400 text-sm mb-1">{t('admin.audit.action')}</label>
              <SelectField
                value={actionFilter}
                onValueChange={value => setActionFilter(value)}
                className="w-full sm:w-44"
              >
                <option value="">{t('admin.audit.allActions')}</option>
                <option value="CREATE">{t('admin.auditActions.CREATE')}</option>
                <option value="UPDATE">{t('admin.auditActions.UPDATE')}</option>
                <option value="DELETE">{t('admin.auditActions.DELETE')}</option>
                <option value="BAN">{t('admin.auditActions.BAN')}</option>
                <option value="UNBAN">{t('admin.auditActions.UNBAN')}</option>
                <option value="RESTRICT_COMMENTS">{t('admin.auditActions.RESTRICT_COMMENTS')}</option>
                <option value="LIFT_COMMENT_RESTRICTION">{t('admin.auditActions.LIFT_COMMENT_RESTRICTION')}</option>
                <option value="APPROVE">{t('admin.auditActions.APPROVE')}</option>
                <option value="REJECT">{t('admin.auditActions.REJECT')}</option>
                <option value="LOGIN">{t('admin.auditActions.LOGIN')}</option>
                <option value="UNAUTHORIZED_ACCESS">{t('admin.auditActions.UNAUTHORIZED_ACCESS')}</option>
              </SelectField>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">{t('admin.audit.resource')}</label>
              <SelectField
                value={resourceFilter}
                onValueChange={value => setResourceFilter(value)}
                className="w-full sm:w-44"
              >
                <option value="">{t('admin.audit.allResources')}</option>
                <option value="USER">{t('admin.reports.user')}</option>
                <option value="MOVIE">{t('admin.reports.movie')}</option>
                <option value="COMMENT">{t('admin.reports.comment')}</option>
                <option value="REPORT">{t('admin.nav.reports')}</option>
                <option value="SETTING">{t('admin.nav.settings')}</option>
              </SelectField>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">{t('admin.audit.from')}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">{t('admin.audit.to')}</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          loading={isLoading}
          pagination={{
            page,
            limit,
            total: pagination?.total || 0,
            pages: pagination?.pages || Math.ceil((pagination?.total || 0) / limit),
          }}
          onPageChange={setPage}
        />
      )}

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">{t('admin.audit.logDetails')}</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">{t('admin.audit.time')}</label>
                    <p className="text-white">{new Date(selectedLog.createdAt).toLocaleString(dateLocale)}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">{t('admin.audit.action')}</label>
                    <p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${actionColors[selectedLog.action] || 'bg-gray-500/20 text-gray-400'}`}>
                        {t(`admin.auditActions.${selectedLog.action}`, { defaultValue: selectedLog.action })}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">{t('admin.audit.admin')}</label>
                    <p className="text-white">{selectedLog.admin?.name || t('admin.common.system')}</p>
                    <p className="text-gray-500 text-sm">{selectedLog.admin?.email}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">{t('admin.audit.resource')}</label>
                    <p className="text-white">{t(`admin.resources.${selectedLog.resource}`, { defaultValue: selectedLog.resource })}</p>
                    <p className="text-gray-500 text-sm truncate">{selectedLog.resourceId}</p>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm">{t('admin.audit.ipAddress')}</label>
                  <p className="text-white">{selectedLog.ipAddress || t('admin.common.na')}</p>
                </div>

                <div>
                  <label className="text-gray-400 text-sm">{t('admin.audit.userAgent')}</label>
                  <p className="text-gray-300 text-sm break-all">{selectedLog.userAgent || t('admin.common.na')}</p>
                </div>

                {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                  <div>
                    <label className="text-gray-400 text-sm">{t('admin.audit.details')}</label>
                    <pre className="mt-2 p-4 bg-gray-900 rounded-lg text-gray-300 text-sm overflow-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  {t('admin.modals.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLog;
