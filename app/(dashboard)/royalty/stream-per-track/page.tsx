// StreamPerTrackPanel.tsx
'use client';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { ViewToggle } from '@/components/dashboard/ViewToggle';
import { Button } from '@/components/ui/Button';
import { Calendar } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
} from 'recharts';

type Row = {
  track: string;
  values: number[]; // per month index 0..7
};

// Example: your table rows
const rowsSeed: Row[] = [
  { track: 'Track A', values: [500, 200, 407, 300, 500, 700, 400, 450] },
  { track: 'Track B', values: [500, 200, 407, 300, 500, 700, 400, 450] },
  { track: 'Track C', values: [600, 300, 350, 250, 450, 650, 500, 380] },
  { track: 'Track D', values: [400, 150, 500, 350, 550, 750, 300, 420] },
  { track: 'Track E', values: [700, 250, 400, 400, 600, 800, 450, 520] },
  { track: 'Track F', values: [550, 350, 420, 280, 480, 680, 380, 410] },
  { track: 'Track G', values: [480, 180, 550, 320, 580, 780, 320, 390] },
];

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

export default function StreamPerTrackPanel() {
  const [rows] = useState<Row[]>(rowsSeed);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(['Track A', 'Track F'])
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const viewMode = (searchParams.get('view') as 'streams' | 'revenue') || 'streams';

  const handleViewChange = (newView: 'streams' | 'revenue') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', newView);
    router.push(`?${params.toString()}`);
  };

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const allChecked = selected.size === rows.length;
  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.track))
    );

  // Transform to chart data: [{ x:'Jan', 'Track A':500, 'Track B':... }, ...]
  const chartData = useMemo(() => {
    return monthLabels.map((label, idx) => {
      const point: Record<string, unknown> = { x: label };
      rows.forEach((r) => {
        if (selected.has(r.track)) {
          const baseValue = r.values[idx] ?? null;
          // If revenue mode, multiply by a factor (e.g., $1 per stream)
          point[r.track] =
            viewMode === 'revenue' && baseValue !== null
              ? baseValue * 1
              : baseValue;
        }
      });
      return point;
    });
  }, [rows, selected, viewMode]);

  return (
    <AppShell>
      <div>
        {/* Header row */}
        <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-[#3C3C3C]">
              {viewMode === 'revenue' ? 'Revenue per Track' : 'Streams per track'}
            </h1>
            <p className="text-base text-[#777777]">
              Dashboard / Royalty /{' '}
              <span className="text-[#7B00D4] font-bold">
                {viewMode === 'revenue' ? 'Revenue per Track' : 'Streams per track'}
              </span>
            </p>
          </div>
          <div className="w-full lg:w-fit flex gap-2">
            <Button
              variant="outline"
              className="w-full bg-[#EAEAEA] rounded-2xl lg:w-auto"
            >
              <Calendar className="h-4 w-4" /> Year
            </Button>
            <Button
              variant="primary"
              className="w-full rounded-2xl lg:w-auto"
              style={{ backgroundColor: BRAND.purple }}
            >
              <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M7.98833 0C8.37963 9.56093e-05 8.75841 0.137862 9.05833 0.389167L9.16667 0.488333L12.845 4.16667C13.1217 4.44335 13.2922 4.80857 13.3267 5.19833L13.3333 5.345V8.33333H11.6667V6.66667H7.91667C7.60593 6.66665 7.30634 6.5509 7.07632 6.34198C6.84629 6.13307 6.70233 5.84597 6.6725 5.53667L6.66667 5.41667V1.66667H1.66667V15H6.66667V16.6667H1.66667C1.24619 16.6668 0.841195 16.508 0.532877 16.2221C0.224559 15.9362 0.0357029 15.5443 0.00416685 15.125L8.35567e-08 15V1.66667C-0.000132983 1.24619 0.158672 0.841194 0.444581 0.532877C0.73049 0.224559 1.12237 0.0357028 1.54167 0.00416676L1.66667 0H7.98833ZM12.2558 10.3875L14.6125 12.7442C14.7687 12.9004 14.8565 13.1124 14.8565 13.3333C14.8565 13.5543 14.7687 13.7662 14.6125 13.9225L12.2558 16.2792C12.179 16.3588 12.087 16.4222 11.9853 16.4659C11.8837 16.5096 11.7743 16.5326 11.6637 16.5335C11.553 16.5345 11.4433 16.5134 11.3409 16.4715C11.2385 16.4296 11.1454 16.3677 11.0672 16.2895C10.9889 16.2113 10.927 16.1182 10.8851 16.0158C10.8432 15.9134 10.8222 15.8036 10.8231 15.693C10.8241 15.5823 10.8471 15.473 10.8907 15.3713C10.9344 15.2697 10.9979 15.1777 11.0775 15.1008L12.0117 14.1667H8.33333C8.11232 14.1667 7.90036 14.0789 7.74408 13.9226C7.5878 13.7663 7.5 13.5543 7.5 13.3333C7.5 13.1123 7.5878 12.9004 7.74408 12.7441C7.90036 12.5878 8.11232 12.5 8.33333 12.5H12.0117L11.0775 11.5658C10.9211 11.4096 10.8332 11.1976 10.8332 10.9765C10.8331 10.7555 10.9208 10.5435 11.0771 10.3871C11.2333 10.2307 11.4453 10.1428 11.6664 10.1427C11.8874 10.1427 12.0995 10.2304 12.2558 10.3867V10.3875ZM8.33333 2.01167V5H11.3217L8.33333 2.01167Z" fill="#2D2D2D"/>
</svg>
 Export Table
            </Button>
          </div>
        </div>

        {/* Toggle for Streams/Revenue */}
        <div className="mt-5">
          <ViewToggle view={viewMode} onChange={handleViewChange} />
        </div>

        <div className="mt-7 space-y-4">
          {/* Chart without ChartCard wrapper */}
          <div className="h-[400px] w-full bg-white rounded-xl">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ left: 0, right: 10, top: 6, bottom: 24 }}
              >
                <defs>
                  {Array.from(selected).map((trackName) => (
                    <linearGradient
                      key={`gradient-${trackName}`}
                      id={`gradient-${trackName}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={colorFor(trackName)}
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="100%"
                        stopColor={colorFor(trackName)}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#E5E7EB"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="x"
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
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                  }}
                />
                {Array.from(selected).map((trackName) => (
                  <Line
                    key={trackName}
                    type="monotone"
                    dataKey={trackName}
                    stroke={colorFor(trackName)}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-8">
            <table className="w-full text-base">
              <thead className="text-left text-neutral-500 bg-[#F4F4F4]">
                <tr>
                  <th className="py-3 pl-3 pr-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded accent-black"
                    />
                  </th>
                  <th className="py-3 pr-4 whitespace-nowrap">Track</th>
                  {monthLabels.map((m) => (
                    <th
                      key={m}
                      className="py-3 pr-4 whitespace-nowrap text-center"
                    >
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((r) => {
                  const checked = selected.has(r.track);
                  return (
                    <tr key={r.track} className="text-neutral-800">
                      <td className="py-3 pl-3 pr-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(r.track)}
                          className="h-4 w-4 rounded accent-black"
                        />
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {r.track}
                        </div>
                      </td>
                      {r.values.map((v, i) => (
                        <td
                          key={i}
                          className="py-3 pr-4 whitespace-nowrap text-center tabular-nums"
                        >
                          {viewMode === 'revenue' ? '$' : ''}
                          {v.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function colorFor(name: string) {
  const colors = [
    '#7B00D4',
    '#00AA39',
    '#F59E0B',
    '#EF4444',
    '#3B82F6',
    '#14B8A6',
    '#8B5CF6',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length];
}
