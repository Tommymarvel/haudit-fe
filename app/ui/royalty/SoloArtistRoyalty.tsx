'use client';

import {  useState } from 'react';
import { ChevronDown, Download, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts';
import { ChartCard } from '@/components/dashboard/ChartCard';

const PURPLE = '#7B00D4';

/* ---------- Shared UI ---------- */
interface BlackTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    value?: number | string | null;
    payload?: {
      title?: string;
      [key: string]: unknown;
    } | null;
  }>;
}

function BlackTooltip({ active, label, payload }: BlackTooltipProps) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const extra = payload[0]?.payload?.title;
  return (
    <div className="rounded-xl bg-neutral-900 px-3 py-2 text-white shadow-lg">
      {extra && <p className="text-[11px] text-neutral-300">{extra}</p>}
      <p className="text-sm font-semibold">
        {label}
        {v != null ? `\n$${Number(v).toLocaleString()}` : ''}
      </p>
    </div>
  );
}

function SoftHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50/70 px-3 py-2 rounded-t-2xl">
      <span className="text-sm font-semibold text-[#3C3C3C]">{title}</span>
      {right}
    </div>
  );
}
function FilterPill({ label = 'All months' }: { label?: string }) {
  return (
    <button className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-600">
      {label} <ChevronDown className="h-3.5 w-3.5" />
    </button>
  );
}

/* ---------- Mock data (swap with API) ---------- */
// 1) Track revenue per DSP (per-DSP axis)



// 2) Track streams per DSP (donut) — we’ll show only total in center here
const donutParts = [
  { name: 'Apple music', value: 500, color: '#E9D7FE' },
  { name: 'YouTube', value: 240, color: '#FFDFAF' },
  { name: 'Spotify', value: 122, color: '#00C853' },
  { name: 'Audiomack', value: 12, color: '#8A8A8A' },
  { name: 'Others', value: 74, color: PURPLE },
];

// 3) Streams per Track (tiny bars total = 84)
const streamsBarsA = new Array(84).fill(0).map((_, i) => ({ i }));

// 4) Revenue per Track (time series)
const revPerTrack = [
  { x: 'Jan', v: 30 },
  { x: 'Feb', v: 20 },
  { x: 'Mar', v: 65 },
  { x: 'Apr', v: 75 },
  { x: 'May', v: 60 },
  { x: 'Jun', v: 32 },
  { x: 'Jul', v: 85 },
  { x: 'Aug', v: 78 },
  { x: 'Sep', v: 40 },
  { x: 'Oct', v: 45 },
  { x: 'Nov', v: 70 },
  { x: 'Dec', v: 66 },
];

// 5) Revenue per DSP (time series monthly)
const revenuePerDSPMonthly = [
  { x: 'Jan', value: 28, title: 'Apple Music' },
  { x: 'Feb', value: 35, title: 'Apple Music' },
  { x: 'Mar', value: 50, title: 'Apple Music' },
  { x: 'Apr', value: 58, title: 'Apple Music' },
  { x: 'May', value: 55, title: 'Apple Music' },
  { x: 'Jun', value: 57, title: 'Apple Music' },
  { x: 'Jul', value: 75, title: 'Apple Music' },
];

// 6) Streams per DSP (bars + legend)
const streamsByDSP = {
  total: 84,
  bars: new Array(84).fill(0).map((_, i) => ({
    i,
    color: i % 3 === 0 ? PURPLE : i % 3 === 1 ? '#00C853' : '#FFC24D',
  })),
  legend: [
    { label: 'DSP 1', color: PURPLE, value: 700 },
    { label: 'DSP 2', color: '#00C853', value: 700 },
    { label: 'DSP 3', color: '#FFC24D', value: 700 },
  ],
};

// 7) Territory list
const territories = [
  { country: 'Denmark', value: 1500 },
  { country: 'United States', value: 24690 },
  { country: 'Japan', value: 8320 },
  { country: 'Brazil', value: 112800 },
  { country: 'Nigeria', value: 950 },
];
const totalTerritories = 20;

// 8) Minimal map placeholder
function WorldMiniMap() {
  return (
    <div className="relative h-[240px] w-full overflow-hidden rounded-xl bg-neutral-50">
      <div className="absolute inset-0 opacity-60 [background:radial-gradient(120%_80%_at_40%_30%,#EEE,transparent_60%),radial-gradient(100%_70%_at_70%_60%,#EEE,transparent_60%)]" />
      {[
        { left: '22%', top: '40%' },
        { left: '28%', top: '55%' },
        { left: '52%', top: '45%' },
        { left: '60%', top: '55%' },
        { left: '72%', top: '50%' },
        { left: '80%', top: '48%' },
        { left: '86%', top: '40%' },
        { left: '78%', top: '30%' },
      ].map((p, i) => (
        <span
          key={i}
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: p.left, top: p.top, backgroundColor: PURPLE }}
        />
      ))}
    </div>
  );
}



/* ======================= PAGE ======================= */
export default function SoloArtistRoyalty() {
  const [year] = useState(2024);

  const maxTerritory = Math.max(...territories.map((t) => t.value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Analytics</h1>
          <p className="text-sm text-neutral-500">
            Monitor your music performance and royalty earnings.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex lg:w-fit">
          <button className="w-full rounded-2xl bg-[#EAEAEA] px-3 py-2 text-sm font-medium text-neutral-800 lg:w-auto">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Filter by: {year}
            </span>
          </button>
          <button className="w-full rounded-2xl bg-[#EAEAEA] px-3 py-2 text-sm font-medium text-neutral-800 lg:w-auto">
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" /> Export
            </span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-neutral-200">
        <button className="relative py-2 text-sm font-medium text-black after:absolute after:-bottom-px after:left-0 after:h-[2px] after:w-full after:bg-[#7B00D4]">
          Analytics
        </button>
        <button className="py-2 text-sm text-neutral-500">Files</button>
      </div>

      {/* ===== GRID A (4 cards) ===== */}
      <div className="flex flex-col xl:flex-row gap-4 mt-6">
        {/* 1) Track revenue per DSP */}
        <div className="flex-1">
          <ChartCard
            title="Track revenue per DSP"
            variant="line"
            data={[
              { x: 'DSP 1', value: 40 },
              { x: 'DSP 2', value: 100 },
              { x: 'DSP 3', value: 60 },
              { x: 'DSP 4', value: 70 },
              { x: 'DSP 5', value: 60 },
              { x: 'DSP 6', value: 80 },
              { x: 'DSP 7', value: 40 },
            ]}
            showDots={true}
            xKey="x"
            yKey="value"
            color="#7B00D4"
            lineType="linear"
          />
        </div>

        {/* 2) Track streams per DSP (donut look-alike center total) */}
        {/* <SoftHeader title="Track streams per DSP" right={<FilterPill />} /> */}
        <div className="xl:w-[25.11%]">
          <ChartCard
            title="Track Interaction Type"
            variant="donut"
            data={donutParts}
            donutInnerText={'Total\nInteraction'}
          />
        </div>
      </div>
      <div>
        {/* 3) Streams per Track */}
        <Card className="overflow-hidden">
          <SoftHeader title="Streams per Track" right={<FilterPill />} />
          <div className="bg-white p-4">
            <div className="mb-3 flex items-baseline gap-2">
              <div className="text-4xl font-semibold">84</div>
              <div className="text-sm text-neutral-500">Total Stream</div>
            </div>
            <div className="grid grid-cols-14 gap-1 rounded-xl bg-neutral-50 p-3">
              {streamsBarsA.map((_, i) => (
                <div
                  key={i}
                  className="h-3 rounded bg-gradient-to-b from-[#B57CF6] to-[#E8D7FF]"
                />
              ))}
            </div>
          </div>
        </Card>

        {/* 4) Revenue per Track */}
        <Card className="overflow-hidden">
          <SoftHeader title="Revenue per Track" right={<FilterPill />} />
          <div className="h-[310px] bg-white px-3 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revPerTrack}
                margin={{ left: 6, right: 10, top: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#EEE" vertical={false} />
                <XAxis
                  dataKey="x"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip
                  content={<BlackTooltip />}
                  cursor={{ stroke: '#E5E7EB' }}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={PURPLE}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ===== GRID B (4 cards) ===== */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 5) Revenue per DSP (monthly) */}
        <Card className="overflow-hidden">
          <SoftHeader title="Revenue per DSP" right={<FilterPill />} />
          <div className="h-[310px] bg-white px-3 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenuePerDSPMonthly}
                margin={{ left: 6, right: 10, top: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#EEE" vertical={false} />
                <XAxis
                  dataKey="x"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF' }}
                />
                <ReferenceArea
                  x1="Feb"
                  x2="Feb"
                  y1={0}
                  y2={100}
                  fill={PURPLE}
                  fillOpacity={0.08}
                />
                <Tooltip
                  content={<BlackTooltip />}
                  cursor={{ stroke: '#E5E7EB' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={PURPLE}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 6) Streams per DSP (bars + legend) */}
        <Card className="overflow-hidden">
          <SoftHeader title="Streams per DSP" right={<FilterPill />} />
          <div className="bg-white p-4">
            <div className="mb-3 flex items-baseline gap-2">
              <div className="text-4xl font-semibold">{streamsByDSP.total}</div>
              <div className="text-sm text-neutral-500">Total Stream</div>
            </div>
            <div className="grid grid-cols-14 gap-1 rounded-xl bg-neutral-50 p-3">
              {streamsByDSP.bars.map((b, i) => (
                <div
                  key={i}
                  className="h-3 rounded"
                  style={{ background: b.color }}
                />
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {streamsByDSP.legend.map((l) => (
                <div
                  key={l.label}
                  className="flex items-center justify-between"
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded"
                      style={{ background: l.color }}
                    />
                    {l.label}
                  </span>
                  <span className="text-neutral-500">
                    {l.value.toLocaleString()} streams
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 7) Territory Analysis (list + bars) */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50/70 px-3 py-2 rounded-t-2xl">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{totalTerritories}</span>
              <span className="text-sm text-neutral-500">Total Territory</span>
            </div>
            <FilterPill />
          </div>
          <div className="grid grid-cols-1 gap-4 bg-white p-4 md:grid-cols-2">
            <div className="space-y-4">
              {territories.map((t) => {
                const pct = Math.max(0.06, Math.min(1, t.value / maxTerritory));
                return (
                  <div key={t.country}>
                    <div className="mb-1 h-7 w-full rounded-full bg-[#F3E9FF]">
                      <div
                        className="h-7 rounded-full"
                        style={{ width: `${pct * 100}%`, background: PURPLE }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-4">
              {territories.map((t) => (
                <div
                  key={t.country}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-neutral-700">{t.country}</span>
                  <span className="rounded-full bg-[#EDE7F6] px-3 py-1 text-sm text-neutral-700">
                    ${t.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 8) Territory map */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50/70 px-3 py-2 rounded-t-2xl">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{totalTerritories}</span>
              <span className="text-sm text-neutral-500">Total Territory</span>
            </div>
            <FilterPill />
          </div>
          <div className="bg-white p-4">
            <WorldMiniMap />
            <div className="mt-4">
              <button className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700">
                View report insight{' '}
                <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
