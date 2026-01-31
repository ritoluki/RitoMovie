import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'gray';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: number;
  trendLabel?: string;
  color?: CardColor;
  className?: string;
  loading?: boolean;
}

const colorClasses: Record<CardColor, string> = {
  red: 'bg-red-500/10 border-red-500/30',
  blue: 'bg-blue-500/10 border-blue-500/30',
  green: 'bg-green-500/10 border-green-500/30',
  yellow: 'bg-yellow-500/10 border-yellow-500/30',
  purple: 'bg-purple-500/10 border-purple-500/30',
  gray: 'bg-gray-500/10 border-gray-500/30',
};

const iconColorClasses: Record<CardColor, string> = {
  red: 'text-red-400',
  blue: 'text-blue-400',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
  gray: 'text-gray-400',
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendValue,
  trendLabel,
  color = 'gray',
  className = '',
  loading = false,
}) => {
  const isPositive = trend === 'up';

  if (loading) {
    return (
      <div className={`bg-[#1a1a1a] rounded-xl p-6 border border-gray-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-6 border transition-colors ${colorClasses[color]} hover:opacity-90 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        {icon && (
          <div className={`p-2 bg-black/20 rounded-lg ${iconColorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          
          {(trend || trendValue !== undefined) && (
            <div className="flex items-center mt-2">
              <span
                className={`flex items-center text-sm font-medium ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {isPositive ? (
                  <ArrowUp className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDown className="h-4 w-4 mr-1" />
                )}
                {trendValue !== undefined && `${Math.abs(trendValue)}%`}
              </span>
              {trendLabel && (
                <span className="text-sm text-gray-500 ml-2">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
