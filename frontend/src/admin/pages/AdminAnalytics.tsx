import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Users,
  Film,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import StatCard from '../components/common/StatCard';
import ChartWrapper from '../components/common/ChartWrapper';
import LoadingSpinner from '../../components/common/LoadingSpinner';

type Period = '7d' | '30d' | '90d' | '1y';

const AdminAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<Period>('30d');

  // Fetch analytics data
  const { data: trafficData, isLoading: trafficLoading, refetch: refetchTraffic } = useQuery({
    queryKey: ['admin', 'analytics', 'traffic', period],
    queryFn: () => adminService.getTrafficAnalytics(period),
  });

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'users'],
    queryFn: () => adminService.getUserAnalytics(),
  });

  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'content'],
    queryFn: () => adminService.getContentAnalytics(),
  });

  const isLoading = trafficLoading || userLoading || contentLoading;

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await adminService.exportAnalyticsReport('summary', format);
      if (format === 'csv') {
        // When responseType is 'blob', axios response.data is a Blob
        // Our axios interceptor returns response.data directly, so response IS the Blob
        const blob = response instanceof Blob ? response : new Blob([JSON.stringify(response)], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  // axios interceptor returns response.data directly, so structure is {success, data}
  const traffic = trafficData?.data;
  const users = userData?.data;
  const content = contentData?.data;

  // Prepare chart data
  const registrationChartData = traffic?.userRegistrations?.map((item: { _id: string; count: number }) => ({
    name: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    users: item.count,
  })) || [];

  const watchActivityChartData = traffic?.watchActivity?.map((item: { _id: string; views: number; uniqueUsers: number }) => ({
    name: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: item.views,
    uniqueUsers: item.uniqueUsers,
  })) || [];

  const genreChartData = content?.genreDistribution?.map((item: { _id: string; count: number }) => ({
    name: item._id,
    value: item.count,
  })) || [];

  const roleChartData = users?.roleDistribution?.map((item: { _id: string; count: number }) => ({
    name: item._id,
    value: item.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Detailed insights and performance metrics</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button
            onClick={() => refetchTraffic()}
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Users"
          value={users?.activeUsers || 0}
          icon={<Users className="w-6 h-6" />}
          trend="up"
          trendValue={12}
          color="blue"
        />
        <StatCard
          title="Total Movies"
          value={content?.movieStats?.total || 0}
          icon={<Film className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Avg Rating"
          value={(content?.movieStats?.avgRating || 0).toFixed(1)}
          icon={<TrendingUp className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="Banned Users"
          value={users?.bannedUsers || 0}
          icon={<Users className="w-6 h-6" />}
          color="red"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper
          title="User Registrations"
          type="line"
          data={registrationChartData}
          dataKey="users"
          height={300}
        />
        <ChartWrapper
          title="Watch Activity"
          type="bar"
          data={watchActivityChartData}
          dataKey="views"
          height={300}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper
          title="Genre Distribution"
          type="pie"
          data={genreChartData}
          dataKey="value"
          height={300}
        />
        <ChartWrapper
          title="User Roles"
          type="pie"
          data={roleChartData}
          dataKey="value"
          height={300}
        />
      </div>

      {/* Top Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Rated Movies */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Rated Movies</h3>
          <div className="space-y-3">
            {content?.topRatedMovies?.slice(0, 5).map((movie, index) => (
              <div key={movie.id} className="flex items-center gap-3">
                <span className="text-gray-500 w-6">{index + 1}.</span>
                <img
                  src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '/placeholder.png'}
                  alt={movie.title}
                  className="w-10 h-14 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{movie.title}</p>
                  <p className="text-gray-400 text-sm">Rating: {movie.vote_average?.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Active Users */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Active Users</h3>
          <div className="space-y-3">
            {users?.topActiveUsers?.slice(0, 5).map((item: { _id: string; user: { name: string; email: string; avatar?: string }; watchCount: number }, index: number) => (
              <div key={item._id} className="flex items-center gap-3">
                <span className="text-gray-500 w-6">{index + 1}.</span>
                <img
                  src={item.user?.avatar || `https://ui-avatars.com/api/?name=${item.user?.name || 'U'}&background=random`}
                  alt={item.user?.name}
                  className="w-10 h-10 object-cover rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{item.user?.name}</p>
                  <p className="text-gray-400 text-sm">{item.watchCount} movies watched</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most Watched Movies */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Most Watched Movies</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {content?.mostWatchedMovies?.slice(0, 10).map((movie: { movieId: number; title: string; watchCount: number; poster_path: string }) => (
            <div key={movie.movieId} className="text-center">
              <img
                src={movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : '/placeholder.png'}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover rounded-lg mb-2"
              />
              <p className="text-white text-sm font-medium truncate">{movie.title || `Movie #${movie.movieId}`}</p>
              <p className="text-gray-400 text-xs">{movie.watchCount} views</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
