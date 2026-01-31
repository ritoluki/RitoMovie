import React, { useState } from 'react';
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
  APPROVE: 'bg-green-500/20 text-green-400',
  REJECT: 'bg-red-500/20 text-red-400',
  UNAUTHORIZED_ACCESS: 'bg-red-500/20 text-red-400',
  SECURITY_ALERT: 'bg-yellow-500/20 text-yellow-400',
};

const AdminAuditLog: React.FC = () => {
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
      header: 'Time',
      sortable: true,
      render: (log) => (
        <div className="flex items-center gap-2 text-gray-300">
          <Clock className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-sm">{new Date(log.createdAt).toLocaleDateString()}</p>
            <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleTimeString()}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'admin',
      header: 'Admin',
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
            <span className="text-gray-500">System</span>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (log) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${actionColors[log.action] || 'bg-gray-500/20 text-gray-400'}`}>
          {log.action}
        </span>
      ),
    },
    {
      key: 'resource',
      header: 'Resource',
      sortable: true,
      render: (log) => (
        <div>
          <p className="text-white text-sm">{log.resource}</p>
          {log.resourceId && (
            <p className="text-gray-500 text-xs truncate max-w-[150px]">{log.resourceId}</p>
          )}
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (log) => (
        <span className="text-gray-400 text-sm">{log.ipAddress || 'N/A'}</span>
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
    name: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    actions: item.count,
  })) || [];

  const actionTypeChartData = stats?.actionsByType?.map((item) => ({
    name: item._id,
    value: item.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-gray-400 mt-1">Track all administrative actions and security events</p>
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
            Export
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWrapper
            title="Daily Activity (Last 7 days)"
            type="bar"
            data={activityChartData}
            dataKey="actions"
            height={200}
          />
          <ChartWrapper
            title="Actions by Type"
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
            <h3 className="text-red-400 font-semibold">Security Events (Last 7 days)</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            {stats.securityEvents.map((event) => (
              <div key={event._id} className="flex items-center gap-2">
                <span className="text-red-300">{event._id}:</span>
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
              placeholder="Search logs..."
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
            Filters
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="BAN">Ban</option>
                <option value="UNBAN">Unban</option>
                <option value="APPROVE">Approve</option>
                <option value="REJECT">Reject</option>
                <option value="LOGIN">Login</option>
                <option value="UNAUTHORIZED_ACCESS">Unauthorized Access</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">Resource</label>
              <select
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="">All Resources</option>
                <option value="USER">User</option>
                <option value="MOVIE">Movie</option>
                <option value="COMMENT">Comment</option>
                <option value="REPORT">Report</option>
                <option value="SETTING">Setting</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1">To Date</label>
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
                <h2 className="text-xl font-bold text-white">Log Details</h2>
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
                    <label className="text-gray-400 text-sm">Time</label>
                    <p className="text-white">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Action</label>
                    <p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${actionColors[selectedLog.action] || 'bg-gray-500/20 text-gray-400'}`}>
                        {selectedLog.action}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Admin</label>
                    <p className="text-white">{selectedLog.admin?.name || 'System'}</p>
                    <p className="text-gray-500 text-sm">{selectedLog.admin?.email}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Resource</label>
                    <p className="text-white">{selectedLog.resource}</p>
                    <p className="text-gray-500 text-sm truncate">{selectedLog.resourceId}</p>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm">IP Address</label>
                  <p className="text-white">{selectedLog.ipAddress || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-gray-400 text-sm">User Agent</label>
                  <p className="text-gray-300 text-sm break-all">{selectedLog.userAgent || 'N/A'}</p>
                </div>

                {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                  <div>
                    <label className="text-gray-400 text-sm">Details</label>
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
                  Close
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
