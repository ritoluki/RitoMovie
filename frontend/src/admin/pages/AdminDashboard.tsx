import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Film,
  MessageCircle,
  Star,
  Flag,
  UserCheck,
} from 'lucide-react';
import adminService from '../services/adminService';
import StatCard from '../components/common/StatCard';
import ChartWrapper from '../components/common/ChartWrapper';
import AdminBreadcrumb from '../components/layout/AdminBreadcrumb';

const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => adminService.getDashboardStats(),
  });

  // Fetch chart data
  const { data: chartsData, isLoading: chartsLoading } = useQuery({
    queryKey: ['admin', 'dashboard', 'charts'],
    queryFn: () => adminService.getDashboardCharts('7d'),
  });

  // Fetch recent activity
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['admin', 'dashboard', 'activity'],
    queryFn: () => adminService.getDashboardActivity(10),
  });

  // Fetch alerts
  const { data: alertsData } = useQuery({
    queryKey: ['admin', 'dashboard', 'alerts'],
    queryFn: () => adminService.getDashboardAlerts(),
  });

  // axios interceptor returns response.data directly, so structure is {success, data}
  const stats = statsData?.data;
  const charts = chartsData?.data;
  const activity = activityData?.data;
  const alerts = alertsData?.data || [];

  return (
    <div>
      <AdminBreadcrumb items={[{ label: t('admin.nav.dashboard') }]} />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{t('admin.nav.dashboard')}</h1>
        <p className="text-gray-400 mt-1">{t('admin.dashboard.welcome')}</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                alert.type === 'error'
                  ? 'bg-red-900/20 border-red-700 text-red-400'
                  : alert.type === 'warning'
                  ? 'bg-yellow-900/20 border-yellow-700 text-yellow-400'
                  : 'bg-blue-900/20 border-blue-700 text-blue-400'
              }`}
            >
              {alert.key
                ? t(`admin.dashboard.alerts.${alert.key}`, {
                    count: alert.count ?? 0,
                    defaultValue: alert.message,
                  })
                : alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard
          title={t('admin.dashboard.totalUsers')}
          value={stats?.overview?.totalUsers || 0}
          icon={<Users className="h-5 w-5 text-blue-400" />}
          trend={stats?.trends?.userTrend >= 0 ? 'up' : 'down'}
          trendValue={Math.abs(stats?.trends?.userTrend || 0)}
          trendLabel={t('admin.dashboard.vsLastWeek')}
          loading={statsLoading}
        />
        <StatCard
          title={t('admin.dashboard.managedMovies')}
          value={stats?.overview?.totalMovies || 0}
          icon={<Film className="h-5 w-5 text-purple-400" />}
          loading={statsLoading}
        />
        <StatCard
          title={t('admin.dashboard.totalComments')}
          value={stats?.overview?.totalComments || 0}
          icon={<MessageCircle className="h-5 w-5 text-green-400" />}
          trend={stats?.trends?.commentTrend >= 0 ? 'up' : 'down'}
          trendValue={Math.abs(stats?.trends?.commentTrend || 0)}
          trendLabel={t('admin.dashboard.vsLastWeek')}
          loading={statsLoading}
        />
        <StatCard
          title={t('admin.dashboard.totalRatings')}
          value={stats?.overview?.totalRatings || 0}
          icon={<Star className="h-5 w-5 text-yellow-400" />}
          loading={statsLoading}
        />
        <StatCard
          title={t('admin.dashboard.pendingReports')}
          value={stats?.overview?.pendingReports || 0}
          icon={<Flag className="h-5 w-5 text-red-400" />}
          loading={statsLoading}
        />
        <StatCard
          title={t('admin.dashboard.activeUsers')}
          value={stats?.overview?.activeUsers || 0}
          icon={<UserCheck className="h-5 w-5 text-cyan-400" />}
          loading={statsLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartWrapper
          type="line"
          data={charts?.userGrowth || []}
          dataKey="count"
          xAxisKey="_id"
          title={t('admin.dashboard.userGrowth')}
          loading={chartsLoading}
        />
        <ChartWrapper
          type="bar"
          data={charts?.viewsData || []}
          dataKey="count"
          xAxisKey="_id"
          title={t('admin.dashboard.views')}
          loading={chartsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartWrapper
          type="bar"
          data={charts?.topGenres?.slice(0, 8) || []}
          dataKey="count"
          xAxisKey="_id"
          horizontal
          title={t('admin.dashboard.topGenres')}
          loading={chartsLoading}
        />
        <ChartWrapper
          type="pie"
          data={charts?.ratingDistribution || []}
          dataKey="count"
          nameKey="_id"
          title={t('admin.dashboard.ratingDistribution')}
          loading={chartsLoading}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">{t('admin.dashboard.recentUsers')}</h3>
          {activityLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-1/2 mb-1"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {activity?.recentUsers?.slice(0, 5).map((user) => (
                <div key={user._id} className="flex items-center space-x-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString(i18n.language)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Admin Actions */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">{t('admin.dashboard.recentActions')}</h3>
          {activityLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {activity?.recentAdminActions?.slice(0, 5).map((log) => (
                <div key={log._id} className="p-3 bg-[#2a2a2a] rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">
                      <span className="font-medium">{log.admin?.name || t('admin.common.system')}</span>
                      {' '}
                      <span className="text-gray-400">{t(`admin.auditActions.${log.action}`, { defaultValue: log.action.toLowerCase() })}</span>
                      {' '}
                      <span className="text-gray-300">{t(`admin.resources.${log.resource}`, { defaultValue: log.resource.toLowerCase() })}</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString(i18n.language)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
