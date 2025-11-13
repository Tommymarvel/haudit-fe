'use client';
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
} from 'recharts';

function BlackTooltip({ active, label, payload }: any) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-xl bg-neutral-900 px-3 py-2 text-white shadow-lg">
      <p className="text-[11px] text-neutral-300">{label}</p>
      <p className="text-sm font-semibold">
        {Number(v).toLocaleString()} streams
      </p>
    </div>
  );
}

type LineType =
  | 'linear'
  | 'monotone'
  | 'step'
  | 'stepBefore'
  | 'stepAfter'
  | 'basis'
  | 'cardinal'
  | 'natural'
  | 'catmullRom';

export function ChartCard({
  title,
  variant = 'line',
  data,
  xKey,
  yKey,
  color,
  bandFill = '#F4F4F4',
  headerFill = '#F3F4F6',
  lineType = 'linear', // << NEW: choose curve/interpolation
}: {
  title: string;
  variant?: 'line' | 'bar';
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  bandFill?: string;
  headerFill?: string;
  lineType?: LineType;
}) {
  const stroke = color ?? (variant === 'line' ? '#00AA39' : '#CA98EE');

  return (
    <Card className="overflow-hidden">
      <div
        className="px-2 py-3 bg-[color:var(--bandFill)] "
        style={{ ['--bandFill' as any]: bandFill }}
      >
        <div className="text-sm font-semibold ml-3 pb-2 text-[#3C3C3C]">
          {title}
        </div>

        <div className="h-[350px] rounded-xl bg-white pt-6">
          <ResponsiveContainer width="100%" height="100%">
            {variant === 'line' ? (
              <ComposedChart
                data={data}
                margin={{ left: 4, right: 8, top: 6, bottom: 2 }}
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

                {/* Keep the soft fill if you want; remove Area for totally hard look */}
                <Area
                  type={lineType}
                  dataKey={yKey}
                  fill="url(#lineGradient)"
                  stroke="none"
                />

                <Line
                  type={lineType}
                  dataKey={yKey}
                  stroke={stroke}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 4 }}
                  strokeLinecap="butt" // << sharp ends
                  strokeLinejoin="miter" // << sharp corners
                />
              </ComposedChart>
            ) : (
              <BarChart
                data={data}
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
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
