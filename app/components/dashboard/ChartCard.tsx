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
} from 'recharts';

/** ── Tooltip (shared) ─────────────────────────────────────────────── */
function BlackTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ value: number; name?: string }>;
}) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const name = payload[0].name ?? label;
  return (
    <div className="rounded-xl bg-neutral-900 px-3 py-2 text-white shadow-lg">
      <p className="text-[11px] text-neutral-300">{name}</p>
      <p className="text-sm font-semibold">{Number(v).toLocaleString()}</p>
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

interface ChartCardProps {
  title: string;
  variant?: 'line' | 'bar' | 'donut';
  data: DonutSlice[] | Array<Record<string, unknown>>;
  xKey?: string;
  yKey?: string;
  color?: string;
  bandFill?: string;
  donutInnerText?: string;
  lineType?: LineType;
  showDots?: boolean;
}

const HOVER_KEY = '__hoverArea__';

/** ── Component ───────────────────────────────────────────────────── */
export function ChartCard({
  title,
  variant = 'line',
  data,
  xKey,
  yKey,
  color,
  bandFill = '#F4F4F4',
  donutInnerText = 'Total\nInteraction',
  lineType = 'linear',
  showDots = false,
}: ChartCardProps) {
  const stroke = color ?? (variant === 'line' ? '#7B00D4' : '#CA98EE');

  // Track the currently hovered point (for tooltip / gradient)
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const isLineVariant = variant === 'line' && !!yKey && !!xKey;

  // Build the chart data once, including a special key used only by the Area.
  const chartData = useMemo(() => {
    const base = (data as Array<Record<string, unknown>>) ?? [];

    if (!isLineVariant || !yKey) return base;

    return base.map((point, idx) => ({
      ...point,
      [HOVER_KEY]:
        activeIndex != null && idx === activeIndex ? point[yKey] : null,
    }));
  }, [data, isLineVariant, yKey, activeIndex]);

  const total =
    variant === 'donut'
      ? (data as DonutSlice[]).reduce((s, d) => s + (Number(d.value) || 0), 0)
      : undefined;

  return (
    <Card className="overflow-hidden">
      <div
        className="px-2 py-3 bg-[color:var(--bandFill)]"
        style={{ '--bandFill': bandFill } as React.CSSProperties}
      >
        <div className="ml-3 pb-2 text-sm font-semibold text-[#3C3C3C]">
          {title}
        </div>

        <div className="h-[350px] rounded-xl bg-white pt-6">
          <ResponsiveContainer width="100%" height="100%">
            {isLineVariant ? (
              <ComposedChart
                data={chartData}
                margin={{ left: 4, right: 8, top: 6, bottom: 2 }}
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
                />
                <Tooltip
                  content={<BlackTooltip />}
                  cursor={{ stroke: '#E5E7EB' }}
                />

                {/* Hover-only gradient area using special key */}
                <Area
                  type={lineType}
                  dataKey={HOVER_KEY}
                  fill="url(#lineGradient)"
                  stroke="none"
                  connectNulls
                  isAnimationActive={false}
                />

                {/* Main line always uses original yKey */}
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
              </ComposedChart>
            ) : variant === 'bar' && yKey && xKey ? (
              <BarChart
                data={data as Array<Record<string, unknown>>}
                margin={{ left: 4, right: 8, top: 6, bottom: 2 }}
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
        </div>
      </div>
    </Card>
  );
}
