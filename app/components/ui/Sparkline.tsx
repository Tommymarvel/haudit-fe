'use client';
import { useId } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Sparkline({
  data,
  dataKey = 'v',
  color = '#16A34A', // green default; pass '#DC2626' for red
}: {
  data: Array<Record<string, number>>;
  dataKey?: string;
  color?: string;
}) {
  // unique, SVG-safe id per instance (prevents color bleed)
  const raw = useId();
  const gradientId = `spark-${raw.replace(/[:]/g, '-')}`;

  if (!data?.length) return null;

  return (
    <div className="h-14 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
