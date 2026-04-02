'use client';

import React, { useId, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ChartEmptyState } from '@/components/dashboard/ChartEmptyState';
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  ReferenceArea, // ⬅️ added for hover band in multi-series
} from 'recharts';
import { ChevronDown } from 'lucide-react';

type TooltipPayloadItem = {
  value: number;
  name?: string;
  stroke?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
};

/** ── Tooltip (shared) ─────────────────────────────────────────────── */
function BlackTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;

  const formatValue = (value: number) => Number(value).toLocaleString();
  const formatLabel = (rawLabel?: string) => {
    if (!rawLabel) return '';
    if (!/\d/.test(rawLabel)) return rawLabel;
    const parsed = new Date(rawLabel);
    if (Number.isNaN(parsed.getTime())) return rawLabel;
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  const fromMonthLabel = (rawLabel?: string) => {
    if (!rawLabel) return '';
    const monthIndex: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    const short = rawLabel.trim().slice(0, 3).toLowerCase();
    if (!(short in monthIndex)) return rawLabel;
    const date = new Date(new Date().getFullYear(), monthIndex[short], 5);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  const prettifySeriesName = (name?: string, dataKey?: string) => {
    const base = name && name !== 'value' ? name : dataKey;
    if (!base || base === 'value') return 'Value';
    return String(base)
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  };

  // Recharts can pass duplicate entries (e.g., Line + Area with same dataKey).
  const uniquePayload = payload.filter((point, index, arr) => {
    const key = point.dataKey ?? point.name ?? `series-${index}`;
    return arr.findIndex((item) => (item.dataKey ?? item.name) === key) === index;
  });
  const isMulti = uniquePayload.length > 1;
  const payloadDate = uniquePayload[0]?.payload?.date;
  const baseLabel = typeof payloadDate === 'string' ? payloadDate : label;
  const displayLabel =
    formatLabel(baseLabel) || fromMonthLabel(baseLabel) || String(baseLabel ?? '');
  const singleValueText = formatValue(uniquePayload[0].value);

  return (
    <div className="rounded-2xl bg-[#2F2F31] px-4 py-3 text-center text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)]">
      <p className=" text-[12px] font-medium leading-[120%] tracking-[0] text-center text-white/80">
        {displayLabel}
      </p>
      {isMulti ? (
        <div className="mt-1 space-y-0.5">
          {uniquePayload.map((point) => (
            <p
              key={point.dataKey ?? point.name}
              className=" text-[16px] font-medium leading-[120%] tracking-[0] text-center text-white"
            >
              {prettifySeriesName(point.name, point.dataKey)}:{' '}
              {formatValue(point.value)}
            </p>
          ))}
        </div>
      ) : (
        <p className=" mt-1 text-[16px] font-medium leading-[120%] tracking-[0] text-center text-white">
          {singleValueText}
        </p>
      )}
    </div>
  );
}

/** ── Donut callout label (connector + dot + 2-line text) ─────────── */
function CalloutLabel(props: unknown) {
  const { cx, cy, midAngle, outerRadius, name, value, fill } = props as {
    cx: number;
    cy: number;
    midAngle: number;
    outerRadius: number;
    name: string;
    value: number;
    fill: string;
  };

  const RAD = Math.PI / 180;
  const r1 = outerRadius + 10;
  const r2 = r1 + 14;
  const stub = 16;

  const xRad = cx + r1 * Math.cos(-midAngle * RAD);
  const yRad = cy + r1 * Math.sin(-midAngle * RAD);
  const xElb = cx + r2 * Math.cos(-midAngle * RAD);
  const yElb = cy + r2 * Math.sin(-midAngle * RAD);

  const isLeft = xElb < cx;
  const xStub = isLeft ? xElb - stub : xElb + stub;
  const textX = isLeft ? xStub - 6 : xStub + 6;
  const anchor = isLeft ? 'end' : 'start';

  const [line1, line2] = (() => {
    const parts = String(name ?? '').split(' ');
    if (parts.length <= 1) return [parts[0] ?? '', ''];
    const half = Math.ceil(parts.length / 2);
    return [parts.slice(0, half).join(' '), parts.slice(half).join(' ')];
  })();

  return (
    <g>
      <path
        d={`M${xRad},${yRad} L${xElb},${yElb}`}
        stroke="#9CA3AF"
        fill="none"
      />
      <path
        d={`M${xElb},${yElb} L${xStub},${yElb}`}
        stroke="#9CA3AF"
        fill="none"
      />
      <circle cx={xRad} cy={yRad} r={3} fill={fill} stroke="#6B7280" />
      <circle cx={xStub} cy={yElb} r={3} fill="#9CA3AF" />
      <text
        x={textX}
        y={yElb - 2}
        textAnchor={anchor}
        className="fill-neutral-900"
        style={{ fontSize: 14, fontWeight: 600 }}
      >
        {Number(value).toLocaleString()}
      </text>
      {line1 && (
        <text
          x={textX}
          y={yElb + 14}
          textAnchor={anchor}
          className="fill-neutral-500"
          style={{ fontSize: 12 }}
        >
          {line1}
        </text>
      )}
      {line2 && (
        <text
          x={textX}
          y={yElb + 28}
          textAnchor={anchor}
          className="fill-neutral-500"
          style={{ fontSize: 12 }}
        >
          {line2}
        </text>
      )}
    </g>
  );
}

/** Specific callout layout for the "Advance request type" donut */
function AdvanceCalloutLabel(props: unknown) {
  const { cx, cy, midAngle, outerRadius, name, value, fill, percent } = props as {
    cx: number;
    cy: number;
    midAngle: number;
    outerRadius: number;
    name: string;
    value: number;
    fill: string;
    percent: number;
  };

  const RAD = Math.PI / 180;
  const r1 = outerRadius - 2;
  const r2 = outerRadius + 20;
  const stub = 24;

  const x1 = cx + r1 * Math.cos(-midAngle * RAD);
  const y1 = cy + r1 * Math.sin(-midAngle * RAD);
  const x2Raw = cx + r2 * Math.cos(-midAngle * RAD);
  const y2Raw = cy + r2 * Math.sin(-midAngle * RAD);

  const estimatedChartWidth = Math.max(260, cx * 2);
  const estimatedChartHeight = Math.max(260, cy / 0.52);
  const safeX = 12;
  const safeYTop = 20;
  const safeYBottom = estimatedChartHeight - 34;

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const y2 = clamp(y2Raw, safeYTop, safeYBottom);
  const isLeft = x2Raw < cx;
  const x3 = clamp(
    isLeft ? x2Raw - stub : x2Raw + stub,
    safeX + 10,
    estimatedChartWidth - safeX - 10
  );
  const valueText = `$${Number(value).toLocaleString()} \u2022 ${Math.round(
    (percent ?? 0) * 100
  )}%`;
  const approxTextWidth = Math.max(90, valueText.length * 10);

  const anchor = isLeft ? 'end' : 'start';
  const textX =
    anchor === 'end'
      ? Math.max(x3 - 6, safeX + approxTextWidth)
      : Math.min(x3 + 6, estimatedChartWidth - safeX - approxTextWidth);

  return (
    <g>
      <path d={`M${x1},${y1} L${x2Raw},${y2}`} stroke="#7B7B7B" fill="none" />
      <path d={`M${x2Raw},${y2} L${x3},${y2}`} stroke="#7B7B7B" fill="none" />
      <circle cx={x1} cy={y1} r={4} fill={fill} />
      <circle cx={x2Raw} cy={y2} r={4} fill="#7B7B7B" />
      <circle cx={x3} cy={y2} r={4} fill="#7B7B7B" />
      <text
        x={textX}
        y={y2 - 2}
        textAnchor={anchor}
        className="fill-[#3C3C3C]"
        style={{ fontSize: 20, fontWeight: 500 }}
      >
        {valueText}
      </text>
      <text
        x={textX}
        y={y2 + 22}
        textAnchor={anchor}
        className="fill-[#6A6A6A]"
        style={{ fontSize: 16, fontWeight: 400 }}
      >
        {name}
      </text>
    </g>
  );
}

/** ── Types ────────────────────────────────────────────────────────── */
export type DonutSlice = { name: string; value: number; color: string };

type LineType =
  | 'basis'
  | 'basisClosed'
  | 'basisOpen'
  | 'linear'
  | 'linearClosed'
  | 'natural'
  | 'monotoneX'
  | 'monotoneY'
  | 'monotone'
  | 'step'
  | 'stepBefore'
  | 'stepAfter';

type SeriesDef = { key: string; label?: string; color?: string };

interface ChartCardProps {
  title: string;
  variant?: 'line' | 'bar' | 'donut';
  data: DonutSlice[] | Array<Record<string, unknown>>;
  xKey?: string;
  yKey?: string; // single-series key (back-compat)
  /** Provide to plot multiple series: one line per key */
  series?: SeriesDef[];
  color?: string;
  bandFill?: string;
  donutInnerText?: string;
  lineType?: LineType;
  showDots?: boolean;
  /** Optional header filter dropdown label (e.g. "All months") */
  headerFilterLabel?: string;
  onHeaderFilterClick?: () => void;
  /** Optional footer action pill (e.g. "View all report insight") */
  footerActionLabel?: string;
  onFooterActionClick?: () => void;
  /** Render standard donut or half-donut */
  isHalfDonut?: boolean;
  /** Optional specialized donut presentation */
  donutStyle?: 'default' | 'advance';
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  chartOverlay?: React.ReactNode;
  chartMarginTop?: number;
  chartHeight?: number;
}

const HOVER_KEY = '__hoverArea__';
const PALETTE = [
  '#7B00D4',
  '#00AA39',
  '#F59E0B',
  '#EF4444',
  '#3B82F6',
  '#14B8A6',
  '#8B5CF6',
  '#EA580C',
];
const colorFor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
};
const hasNumericValue = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value !== 0;

/** ── Component ───────────────────────────────────────────────────── */
export function ChartCard({
  title,
  variant = 'line',
  data,
  xKey,
  yKey,
  series, // ⬅️ new (optional)
  color,
  bandFill = '#F4F4F4',
  donutInnerText = 'Total\nInteraction',
  lineType = 'linear',
  showDots = false,
  headerFilterLabel,
  onHeaderFilterClick,
  footerActionLabel,
  onFooterActionClick,
  isHalfDonut = false,
  donutStyle = 'default',
  emptyStateTitle,
  emptyStateDescription,
  chartOverlay,
  chartMarginTop = 6,
  chartHeight = 350,
}: ChartCardProps) {
  const stroke = color ?? (variant === 'line' ? '#7B00D4' : '#CA98EE');

  // curved lines (always-on gradient for single series)
  const isCurvedLine =
    lineType === 'monotone' ||
    lineType === 'monotoneX' ||
    lineType === 'monotoneY' ||
    lineType === 'natural';

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const gradientBaseId = useId().replace(/:/g, '');
  const lineGradientId = `${gradientBaseId}-line-gradient`;
  const hoverBandGradientId = `${gradientBaseId}-hover-band`;

  const isLineVariant =
    variant === 'line' && !!xKey && (!!yKey || (series && series.length > 0));
  const isMulti = Boolean(series && series.length > 0);

  // x labels (for hover band width in multi mode)
  const xLabels = useMemo(
    () =>
      isLineVariant
        ? (data as Array<Record<string, unknown>>).map((d) => String(d[xKey as string]))
        : [],
    [data, isLineVariant, xKey]
  );

  // Build chartData:
  // - single straight line uses HOVER_KEY for hover-only area
  // - everything else just passes through base data
  const chartData = useMemo(() => {
    const base = (data as Array<Record<string, unknown>>) ?? [];
    if (!isLineVariant) return base;

    if (isMulti) return base; // multi-series: use ReferenceArea for hover band

    if (!yKey) return base; // defensive

    if (isCurvedLine) return base; // curved single-series uses always-on area with yKey

    // single-series straight line: inject HOVER_KEY for hovered point
    return base.map((point, idx) => ({
      ...point,
      [HOVER_KEY]:
        activeIndex != null && idx === activeIndex ? point[yKey] : null,
    }));
  }, [data, isLineVariant, isMulti, yKey, activeIndex, isCurvedLine]);

  const total =
    variant === 'donut'
      ? (data as DonutSlice[]).reduce((s, d) => s + (Number(d.value) || 0), 0)
      : undefined;
  const isHalfDonutVariant = variant === 'donut' && isHalfDonut;
  const isAdvanceDonutVariant =
    variant === 'donut' && !isHalfDonut && donutStyle === 'advance';
  const donutSlices = useMemo(
    () => (variant === 'donut' ? (data as DonutSlice[]) : []),
    [data, variant]
  );
  const halfDonutLegendItems = useMemo(() => {
    if (!isHalfDonutVariant) return [];
    const streamSlice = donutSlices.find(
      (slice) => slice.name.toLowerCase() === 'stream'
    );
    const downloadSlice = donutSlices.find(
      (slice) => slice.name.toLowerCase() === 'download'
    );
    if (streamSlice && downloadSlice) return [streamSlice, downloadSlice];
    return donutSlices.slice(0, 2);
  }, [donutSlices, isHalfDonutVariant]);
  const { advanceMinValue, advanceMaxValue } = useMemo(() => {
    const values = donutSlices
      .map((slice) => Number(slice.value) || 0)
      .filter((value) => Number.isFinite(value));

    if (!values.length) {
      return { advanceMinValue: 0, advanceMaxValue: 0 };
    }

    return {
      advanceMinValue: Math.min(...values),
      advanceMaxValue: Math.max(...values),
    };
  }, [donutSlices]);

  const hasData = useMemo(() => {
    if (variant === 'donut') {
      return (data as DonutSlice[]).some((slice) => hasNumericValue(slice.value));
    }

    if (variant === 'bar') {
      if (!yKey) return false;
      const barData = data as Array<Record<string, unknown>>;
      return barData.some((point) => hasNumericValue(point[yKey]));
    }

    if (!isLineVariant) return false;

    const lineData = data as Array<Record<string, unknown>>;
    if (!lineData.length) return false;

    if (isMulti) {
      const keys = (series ?? []).map((s) => s.key);
      if (!keys.length) return false;
      return lineData.some((point) =>
        keys.some((key) => hasNumericValue(point[key]))
      );
    }

    if (!yKey) return false;
    return lineData.some((point) => hasNumericValue(point[yKey]));
  }, [data, isLineVariant, isMulti, series, variant, yKey]);
  const tooltipWrapperStyle: React.CSSProperties = {
    pointerEvents: 'none',
    zIndex: 30,
  };
  const effectiveChartMarginTop = chartOverlay
    ? Math.max(chartMarginTop, 60)
    : chartMarginTop;

  return (
    <Card className="overflow-hidden">
      <div
        className="px-3 py-3 bg-[color:var(--bandFill)]"
        style={{ '--bandFill': bandFill } as React.CSSProperties}
      >
        {/* Header: title + optional filter */}
        <div className="flex items-center justify-between pb-2">
          <div
            className={
              isHalfDonutVariant || isAdvanceDonutVariant
                ? 'text-[14px] font-semibold text-[#3C3C3C]'
                : 'text-sm font-semibold text-[#3C3C3C]'
            }
          >
            {title}
          </div>

          {headerFilterLabel && (
            <button
              type="button"
              onClick={onHeaderFilterClick}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-transparent pl-3 pr-2 py-1 text-xs font-medium text-[#3C3C3C] shadow-sm hover:bg-neutral-50"
            >
              <span>{headerFilterLabel}</span>
            <ChevronDown className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Chart body */}
        <div
          className={
            isHalfDonutVariant
              ? 'relative rounded-2xl bg-white px-2 pt-5'
              : 'relative rounded-xl bg-white'
          }
          style={{ height: chartHeight }}
        >
          {chartOverlay ? (
            <div className="pointer-events-none absolute left-4 top-3 z-10">
              {chartOverlay}
            </div>
          ) : null}
          {hasData ? (
            isHalfDonutVariant ? (
              <div className="h-full w-full">
                <div className="h-[72%]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        content={<BlackTooltip />}
                        offset={0}
                        wrapperStyle={tooltipWrapperStyle}
                      />
                      <Pie
                        data={donutSlices}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="86%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={84}
                        outerRadius={116}
                        cornerRadius={12}
                        paddingAngle={4}
                        stroke="#FFFFFF"
                        strokeWidth={10}
                        labelLine={false}
                      >
                        {donutSlices.map((slice, index) => (
                          <Cell key={`${slice.name}-${index}`} fill={slice.color} />
                        ))}
                      </Pie>
                      <text
                        x="50%"
                        y="65%"
                        textAnchor="middle"
                        className="fill-neutral-900  text-[30px] font-normal leading-[120%] tracking-[0] text-center"
                      >
                        {Number(total).toLocaleString()}
                      </text>
                      <text
                        x="50%"
                        y="78%"
                        textAnchor="middle"
                        className="fill-neutral-500"
                        style={{ fontSize: 14 }}
                      >
                        {donutInnerText.split('\n').map((line, index) => (
                          <tspan
                            key={`${line}-${index}`}
                            x="50%"
                            dy={index === 0 ? 0 : 18}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mx-3 border-t border-neutral-200 pt-5">
                  <div className="grid grid-cols-2 divide-x divide-[#EAEAEA]">
                    {halfDonutLegendItems.map((slice, index) => (
                      <div
                        key={`${slice.name}-legend-${index}`}
                        className="flex flex-col items-center justify-center px-2 text-center"
                      >
                        <div className="flex items-center justify-center gap-2 text-base text-neutral-500">
                          <span
                            className="h-[6px] w-[6px] rounded-full"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className='text-sm'>{slice.name}</span>
                        </div>
                        <div className="mt-1  text-[18px] font-medium leading-[120%] tracking-[0] text-center text-[#3C3C3C]">
                          {Number(slice.value).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {isLineVariant ? (
                  <ComposedChart
                    data={chartData}
                    margin={{ left: 8, right: 16, top: effectiveChartMarginTop, bottom: 24 }}
                    onMouseMove={(state) => {
                      if (
                        state?.isTooltipActive &&
                        typeof state.activeTooltipIndex === 'number'
                      ) {
                        setActiveIndex(state.activeTooltipIndex);
                      } else {
                        setActiveIndex(null);
                      }
                    }}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    <defs>
                      <linearGradient id={lineGradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stroke} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                      </linearGradient>
                      {/* neutral hover band for multi-series */}
                      <linearGradient id={hoverBandGradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#000" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#000" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      vertical={false}
                      stroke="#E5E7EB"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey={xKey}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#AAAAAA', fontSize: 14 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#AAAAAA', fontSize: 14 }}
                      padding={{ bottom: 8 }}
                    />
                    <Tooltip
                      content={<BlackTooltip />}
                      cursor={{ stroke: '#E5E7EB' }}
                      offset={0}
                      wrapperStyle={tooltipWrapperStyle}
                    />

                    {/* Hover band:
                        - single straight line: use Area + HOVER_KEY
                        - multi-series OR curved lines: show a neutral ReferenceArea on hover */}
                    {isMulti || isCurvedLine ? (
                      activeIndex != null && xLabels.length > 0 ? (
                        <ReferenceArea
                          x1={xLabels[Math.max(0, activeIndex - 1)]}
                          x2={xLabels[activeIndex]}
                          y1="dataMin"
                          y2="dataMax"
                          fill={`url(#${hoverBandGradientId})`}
                          strokeOpacity={0}
                          ifOverflow="hidden"
                        />
                      ) : null
                    ) : (
                      <Area
                        type={lineType}
                        dataKey={HOVER_KEY}
                        fill={`url(#${lineGradientId})`}
                        stroke="none"
                        connectNulls
                        isAnimationActive={false}
                      />
                    )}

                    {/* Lines */}
                    {isMulti
                      ? (series as SeriesDef[]).map((s) => (
                        <Line
                          key={s.key}
                          name={s.label ?? s.key}
                          type={lineType}
                          dataKey={s.key}
                          stroke={s.color ?? colorFor(s.key)}
                          strokeWidth={3}
                          dot={showDots}
                          activeDot={{ r: 4 }}
                          connectNulls
                          strokeLinecap="butt"
                          strokeLinejoin="miter"
                          isAnimationActive={false}
                        />
                      ))
                      : yKey && (
                        <>
                          {/* Curved single-series wants always-on area under the line */}
                          {isCurvedLine && (
                            <Area
                              type={lineType}
                              dataKey={yKey}
                              fill={`url(#${lineGradientId})`}
                              stroke="none"
                              connectNulls
                              isAnimationActive={false}
                            />
                          )}
                          <Line
                            type={lineType}
                            dataKey={yKey}
                            stroke={stroke}
                            strokeWidth={3}
                            dot={showDots}
                            activeDot={{ r: 4 }}
                            connectNulls
                            strokeLinecap="butt"
                            strokeLinejoin="miter"
                            isAnimationActive={false}
                          />
                        </>
                      )}
                  </ComposedChart>
                ) : variant === 'bar' && yKey && xKey ? (
                  <BarChart
                    data={data as Array<Record<string, unknown>>}
                    margin={{ left: 8, right: 16, top: effectiveChartMarginTop, bottom: 24 }}
                  >
                    <CartesianGrid vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey={xKey}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#AAAAAA', fontSize: 14 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#AAAAAA', fontSize: 14 }}
                      padding={{ bottom: 8 }}
                    />
                    <Tooltip
                      content={<BlackTooltip />}
                      cursor={{ fill: 'transparent' }}
                      offset={0}
                      wrapperStyle={tooltipWrapperStyle}
                    />
                    <Bar dataKey={yKey} fill={stroke} radius={[10, 10, 0, 0]} />
                  </BarChart>
                ) : isAdvanceDonutVariant ? (
                  <PieChart margin={{ top: 4, right: 28, bottom: 20, left: 28 }}>
                    <Tooltip
                      content={<BlackTooltip />}
                      offset={0}
                      wrapperStyle={tooltipWrapperStyle}
                    />
                    <Pie
                      data={donutSlices}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="52%"
                      startAngle={170}
                      endAngle={-190}
                      innerRadius={28}
                      outerRadius={(entry: DonutSlice) => {
                        const maxRadius = 100;
                        const minRadius = 80;
                        const value = Number(entry.value) || 0;

                        if (advanceMaxValue === advanceMinValue) {
                          return maxRadius;
                        }

                        const ratio =
                          (value - advanceMinValue) /
                          (advanceMaxValue - advanceMinValue);

                        return minRadius + ratio * (maxRadius - minRadius);
                      }}
                      cornerRadius={10}
                      labelLine={false}
                      label={<AdvanceCalloutLabel />}
                      paddingAngle={5}
                      stroke="#FFFFFF"
                      strokeWidth={6}
                    >
                      {donutSlices.map((slice, index) => (
                        <Cell key={`${slice.name}-${index}`} fill={slice.color} />
                      ))}
                    </Pie>
                  </PieChart>
                ) : (
                  <PieChart>
                    <Tooltip
                      content={<BlackTooltip />}
                      offset={0}
                      wrapperStyle={tooltipWrapperStyle}
                    />
                    <Pie
                      data={donutSlices}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      cornerRadius={12}
                      labelLine={false}
                      label={<CalloutLabel />}
                      paddingAngle={3}
                    >
                      {donutSlices.map((slice, index) => (
                        <Cell key={`${slice.name}-${index}`} fill={slice.color} />
                      ))}
                    </Pie>
                    <text
                      x="50%"
                      y="46%"
                      textAnchor="middle"
                      className="fill-neutral-900"
                      style={{ fontSize: 30, fontWeight: 600 }}
                    >
                      {Number(total).toLocaleString()}
                    </text>
                    <text
                      x="50%"
                      y="58%"
                      textAnchor="middle"
                      className="fill-neutral-500 whitespace-pre-line"
                      style={{ fontSize: 12 }}
                    >
                      {donutInnerText}
                    </text>
                  </PieChart>
                )}
              </ResponsiveContainer>
            )
          ) : (
            <ChartEmptyState
              title={emptyStateTitle}
              description={emptyStateDescription}
            />
          )}

          {/* Footer pill – shows for ANY variant if you pass footerActionLabel */}
          {footerActionLabel && (
            <button
              type="button"
              onClick={onFooterActionClick}
              className="pointer-events-auto absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#7B00D4] shadow-md hover:shadow-lg"
            >
              <span>{footerActionLabel}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
