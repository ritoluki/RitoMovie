import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';

interface ChartWrapperProps {
  type: 'line' | 'bar' | 'pie';
  data: Array<Record<string, unknown>>;
  dataKey: string;
  nameKey?: string;
  xAxisKey?: string;
  title?: string;
  height?: number;
  colors?: string[];
  loading?: boolean;
  className?: string;
  horizontal?: boolean;
}

const DEFAULT_COLORS = [
  '#f04452',
  '#fb923c',
  '#facc15',
  '#2dd4bf',
  '#38bdf8',
  '#818cf8',
  '#c084fc',
  '#f472b6',
  '#a3e635',
  '#22d3ee',
];

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const compactFormat = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

const formatAxisLabel = (value: unknown) => {
  const label = String(value ?? '');
  if (/^\d{4}-\d{2}-\d{2}/.test(label)) {
    const date = new Date(label);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
    }
  }
  return label.length > 13 ? `${label.slice(0, 12)}…` : label;
};

type ChartDatum = {
  name?: string | number;
  value?: string | number;
  color?: string;
  payload?: Record<string, unknown>;
};

type ChartTooltipProps = TooltipContentProps<string | number, string | number> & {
  total?: number;
};

const ChartTooltip = ({ active, payload, label, total }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;

  const entries = payload as readonly ChartDatum[];
  const heading = entries[0]?.name ?? label;

  return (
    <div className="min-w-36 rounded-xl border border-white/10 bg-[#111319]/95 px-3.5 py-3 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
      {heading !== undefined && <p className="mb-2 text-xs font-medium text-gray-400">{String(heading)}</p>}
      <div className="space-y-1.5">
        {entries.map((entry, index) => {
          const value = Number(entry.value ?? 0);
          const percent = total && total > 0 ? ` · ${((value / total) * 100).toFixed(1)}%` : '';
          return (
            <div key={`${String(entry.name ?? label)}-${index}`} className="flex items-center gap-2 text-sm">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length] }} />
              <span className="min-w-0 flex-1 truncate text-gray-200">{String(entry.name ?? '')}</span>
              <span className="font-semibold tabular-nums text-white">{numberFormat.format(value)}{percent}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  type,
  data,
  dataKey,
  nameKey = 'name',
  xAxisKey = '_id',
  title,
  height = 300,
  colors = DEFAULT_COLORS,
  loading = false,
  className = '',
  horizontal = false,
}) => {
  const { t } = useTranslation();
  const generatedId = useId().replace(/:/g, '');
  const areaGradientId = `chart-area-${generatedId}`;
  const barGradientId = `chart-bar-${generatedId}`;
  const chartColor = colors[0] || DEFAULT_COLORS[0];
  const values = data.map((item) => Number(item[dataKey]) || 0);
  const total = values.reduce((sum, value) => sum + value, 0);

  if (loading) {
    return (
      <div className={`rounded-2xl border border-white/[.07] bg-gradient-to-br from-[#1c1e25] to-[#15161b] p-5 shadow-lg shadow-black/10 sm:p-6 ${className}`}>
        {title && <div className="mb-5 h-5 w-40 animate-pulse rounded bg-white/10" />}
        <div className="animate-pulse rounded-xl bg-white/[.045]" style={{ height }} />
      </div>
    );
  }

  const axisTick = { fill: '#8f95a3', fontSize: 11 };
  const chartMargin = { top: 10, right: 10, bottom: 2, left: -12 };

  const renderCartesianAxes = () => (
    <>
      <CartesianGrid vertical={false} stroke="#ffffff0d" strokeDasharray="3 5" />
      <XAxis
        dataKey={xAxisKey}
        axisLine={false}
        tickLine={false}
        tick={axisTick}
        tickMargin={12}
        minTickGap={22}
        tickFormatter={formatAxisLabel}
        interval="preserveStartEnd"
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={axisTick}
        tickMargin={10}
        width={42}
        tickFormatter={(value) => compactFormat.format(Number(value))}
      />
      <Tooltip
        content={(props) => <ChartTooltip {...props} />}
        cursor={{ stroke: '#ffffff30', strokeDasharray: '4 4' }}
        wrapperStyle={{ zIndex: 50, outline: 'none' }}
        isAnimationActive={false}
      />
    </>
  );

  const renderChart = () => {
    if (type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={chartMargin}>
            <defs>
              <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.34} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0.015} />
              </linearGradient>
            </defs>
            {renderCartesianAxes()}
            <Area
              type="monotone"
              dataKey={dataKey}
              name={title || dataKey}
              stroke={chartColor}
              strokeWidth={2.5}
              fill={`url(#${areaGradientId})`}
              activeDot={{ r: 5, fill: chartColor, stroke: '#fff', strokeWidth: 2 }}
              dot={false}
              isAnimationActive
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={horizontal ? { top: 4, right: 12, bottom: 4, left: 0 } : chartMargin} layout={horizontal ? 'vertical' : 'horizontal'}>
            <defs>
              <linearGradient id={barGradientId} x1="0" y1="0" x2={horizontal ? '1' : '0'} y2={horizontal ? '0' : '1'}>
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.95} />
                <stop offset="100%" stopColor={colors[1] || chartColor} stopOpacity={0.62} />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal={!horizontal} vertical={false} stroke="#ffffff0d" strokeDasharray="3 5" />
            {horizontal ? (
              <>
                <XAxis type="number" axisLine={false} tickLine={false} tick={axisTick} tickFormatter={(value) => compactFormat.format(Number(value))} />
                <YAxis type="category" dataKey={xAxisKey} axisLine={false} tickLine={false} tick={axisTick} width={88} tickFormatter={formatAxisLabel} />
              </>
            ) : (
              <>
                <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={axisTick} tickMargin={12} minTickGap={22} tickFormatter={formatAxisLabel} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} width={42} tickFormatter={(value) => compactFormat.format(Number(value))} />
              </>
            )}
            <Tooltip
              content={(props) => <ChartTooltip {...props} />}
              cursor={{ fill: '#ffffff08' }}
              wrapperStyle={{ zIndex: 50, outline: 'none' }}
              isAnimationActive={false}
            />
            <Bar dataKey={dataKey} name={title || dataKey} fill={`url(#${barGradientId})`} radius={horizontal ? [0, 7, 7, 0] : [7, 7, 0, 0]} maxBarSize={horizontal ? 22 : 34} isAnimationActive animationDuration={650}>
              {horizontal && data.map((item, index) => (
                <Cell key={`bar-${String(item[xAxisKey])}-${index}`} fill={colors[index % colors.length]} fillOpacity={0.86} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    const pieData = data.map((item) => ({
      ...item,
      [nameKey]: String(item[nameKey] ?? t('admin.common.unknown')),
      [dataKey]: Number(item[dataKey]) || 0,
    }));
    const pieHeight = Math.max(150, height - 68);

    return (
      <>
        <div className="relative mx-auto" style={{ height: pieHeight, maxWidth: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius="61%"
                outerRadius="84%"
                paddingAngle={2.5}
                cornerRadius={4}
                stroke="none"
                dataKey={dataKey}
                nameKey={nameKey}
                isAnimationActive
                animationDuration={750}
              >
                {pieData.map((item, index) => (
                  <Cell key={`slice-${String(item[nameKey])}-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                content={(props) => <ChartTooltip {...props} total={total} />}
                cursor={false}
                wrapperStyle={{ zIndex: 50, outline: 'none' }}
                isAnimationActive={false}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tracking-tight text-white">{compactFormat.format(total)}</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.16em] text-gray-500">{t('admin.common.total')}</span>
          </div>
        </div>
        <div className="mt-1 grid max-h-28 grid-cols-2 gap-x-4 gap-y-2 overflow-y-auto pr-1">
          {pieData.map((item, index) => {
            const value = Number(item[dataKey]) || 0;
            const label = String(item[nameKey] ?? t('admin.common.unknown'));
            return (
              <div key={`legend-${label}-${index}`} className="flex min-w-0 items-center gap-2 text-xs" title={label}>
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="min-w-0 flex-1 truncate text-gray-400">{label}</span>
                <span className="shrink-0 tabular-nums text-gray-200">{total ? `${((value / total) * 100).toFixed(0)}%` : numberFormat.format(value)}</span>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <section className={`rounded-2xl border border-white/[.07] bg-gradient-to-br from-[#1c1e25] to-[#15161b] p-5 shadow-lg shadow-black/10 sm:p-6 ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold tracking-wide text-gray-100 sm:text-base">{title}</h3>
          <span className="size-2 rounded-full" style={{ backgroundColor: chartColor, boxShadow: `0 0 12px ${chartColor}80` }} />
        </div>
      )}
      {data.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-white/[.08] bg-white/[.015] text-sm text-gray-500" style={{ height }}>
          {t('admin.common.noChartData')}
        </div>
      ) : (
        renderChart()
      )}
    </section>
  );
};

export default ChartWrapper;
