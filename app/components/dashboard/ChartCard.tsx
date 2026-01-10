'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
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

/** ── Tooltip (shared) ─────────────────────────────────────────────── */
function BlackTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{
    value: number;
    name?: string;
    stroke?: string;
    dataKey?: string;
  }>;
}) {
  if (!active || !payload?.length) return null;

  // If multiple series, list them; else keep your old look
  const isMulti = payload.length > 1;
  return (
    <div className="rounded-xl bg-neutral-900 px-3 py-2 text-white shadow-lg">
      <p className="text-[11px] text-neutral-300">{label}</p>
      {isMulti ? (
        payload.map((p) => (
          <p key={p.dataKey ?? p.name} className="text-sm font-semibold">
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 9999,
                background: p.stroke ?? '#fff',
                marginRight: 6,
              }}
            />
            {p.name ?? p.dataKey}: {Number(p.value).toLocaleString()}
          </p>
        ))
      ) : (
        <>
          <p className="text-sm font-semibold">
            {Number(payload[0].value).toLocaleString()}
          </p>
        </>
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
}: ChartCardProps) {
  const stroke = color ?? (variant === 'line' ? '#7B00D4' : '#CA98EE');

  // curved lines (always-on gradient for single series)
  const isCurvedLine =
    lineType === 'monotone' ||
    lineType === 'monotoneX' ||
    lineType === 'monotoneY' ||
    lineType === 'natural';

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  return (
    <Card className="overflow-hidden">
      <div
        className="px-3 py-3 bg-[color:var(--bandFill)]"
        style={{ '--bandFill': bandFill } as React.CSSProperties}
      >
        {/* Header: title + optional filter */}
        <div className="flex items-center justify-between pb-2">
          <div className="text-sm font-semibold text-[#3C3C3C]">{title}</div>

          {headerFilterLabel && (
            <button
              type="button"
              onClick={onHeaderFilterClick}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
            >
              <span>{headerFilterLabel}</span>
              <span className="text-[10px] leading-none">▾</span>
            </button>
          )}
        </div>

        {/* Chart body */}
        <div className="relative h-[350px] rounded-xl bg-white pt-6">
          <ResponsiveContainer width="100%" height="100%">
            {isLineVariant ? (
              <ComposedChart
                data={chartData}
                margin={{ left: 8, right: 16, top: 6, bottom: 24 }}
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
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                  </linearGradient>
                  {/* neutral hover band for multi-series */}
                  <linearGradient id="hoverBand" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#hoverBand)"
                      strokeOpacity={0}
                      ifOverflow="hidden"
                    />
                  ) : null
                ) : (
                  <Area
                    type={lineType}
                    dataKey={HOVER_KEY}
                    fill="url(#lineGradient)"
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
                            fill="url(#lineGradient)"
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
                margin={{ left: 8, right: 16, top: 6, bottom: 24 }}
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
                />
                <Bar dataKey={yKey} fill={stroke} radius={[10, 10, 0, 0]} />
              </BarChart>
            ) : (
              <PieChart>
                <Tooltip content={<BlackTooltip />} />
                <Pie
                  data={data as DonutSlice[]}
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
                  {(data as DonutSlice[]).map((s, i) => (
                    <Cell key={i} fill={s.color} />
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
