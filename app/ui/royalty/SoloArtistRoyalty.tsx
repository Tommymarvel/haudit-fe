'use client';

import { useState } from 'react';
import { ChevronDown, Download, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';

import { ChartCard } from '@/components/dashboard/ChartCard';

const PURPLE = '#7B00D4';

const FILTER_OPTIONS = [
  { key: 'all_months', label: 'All months' },
  { key: 'last_30_days', label: 'Last 30 days' },
  { key: 'this_year', label: 'This year' },
];

/* ---------- Shared UI ---------- */




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
  const [filter1, setFilter1] = useState('all_months');
  const [filter2, setFilter2] = useState('all_months');
  const [filter3, setFilter3] = useState('all_months');
  const [filter4, setFilter4] = useState('all_months');
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const [showDropdown3, setShowDropdown3] = useState(false);
  const [showDropdown4, setShowDropdown4] = useState(false);

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
        <div className="flex-1 relative">
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
            headerFilterLabel={
              FILTER_OPTIONS.find((f) => f.key === filter1)?.label ||
              'All months'
            }
            onHeaderFilterClick={() => setShowDropdown1(!showDropdown1)}
            footerActionLabel="View all report insight"
            onFooterActionClick={() => {
              /* navigate */
            }}
          />
          {showDropdown1 && (
            <div className="absolute top-16 right-6 z-10 w-48 rounded-xl border border-neutral-200 bg-white shadow-lg">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setFilter1(opt.key);
                    setShowDropdown1(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 first:rounded-t-xl last:rounded-b-xl"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2) Track streams per DSP (donut look-alike center total) */}
        {/* <SoftHeader title="Track streams per DSP" right={<FilterPill />} /> */}
        <div className="xl:w-[30%] relative">
          <ChartCard
            title="Track Interaction Type"
            variant="donut"
            data={donutParts}
            donutInnerText={'Total\nInteraction'}
            headerFilterLabel={
              FILTER_OPTIONS.find((f) => f.key === filter2)?.label ||
              'All months'
            }
            onHeaderFilterClick={() => setShowDropdown2(!showDropdown2)}
            footerActionLabel="View all report insight"
            onFooterActionClick={() => {
              /* navigate */
            }}
          />
          {showDropdown2 && (
            <div className="absolute top-16 right-6 z-10 w-48 rounded-xl border border-neutral-200 bg-white shadow-lg">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setFilter2(opt.key);
                    setShowDropdown2(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 first:rounded-t-xl last:rounded-b-xl"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col xl:flex-row gap-4 mt-6">
        {/* 3) Streams per Track */}
        <Card className="overflow-hidden  xl:w-[30%]">
          <SoftHeader title="Streams per Track" right={<FilterPill />} />
          <div className="bg-white p-4">
            <div className="mb-3 flex items-baseline gap-2">
              <div className="text-4xl font-semibold">84</div>
              <div className="text-sm text-neutral-500">Total Stream</div>
            </div>
            <div className="flex gap-0.5 rounded-xl bg-neutral-50 p-3">
              {streamsBarsA.map((_, i) => (
                <div
                  key={i}
                  className="h-3 w-2 rounded bg-gradient-to-b from-[#B57CF6] to-[#E8D7FF]"
                />
              ))}
            </div>
          </div>
        </Card>

        {/* 4) Revenue per Track */}
        {/* <SoftHeader title="Revenue per Track" right={<FilterPill />} /> */}
        <div className="flex-1 relative">
          <ChartCard
            title="All album performance"
            variant="line"
            data={revPerTrack}
            xKey="x"
            yKey="v"
            lineType="monotone"
            headerFilterLabel={
              FILTER_OPTIONS.find((f) => f.key === filter3)?.label ||
              'All months'
            }
            onHeaderFilterClick={() => setShowDropdown3(!showDropdown3)}
            footerActionLabel="View all report insight"
            onFooterActionClick={() => {
              /* navigate */
            }}
          />
          {showDropdown3 && (
            <div className="absolute top-16 right-6 z-10 w-48 rounded-xl border border-neutral-200 bg-white shadow-lg">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setFilter3(opt.key);
                    setShowDropdown3(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 first:rounded-t-xl last:rounded-b-xl"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== GRID B (4 cards) ===== */}
      <div className="flex flex-col xl:flex-row gap-4 mt-6">
        {/* 5) Revenue per DSP (monthly) */}
        <div className="overflow-hidden flex-1 relative">
          <ChartCard
            title="Revenue per DSP"
            variant="line"
            data={revPerTrack}
            xKey="x"
            yKey="v"
            lineType="monotone"
            headerFilterLabel={
              FILTER_OPTIONS.find((f) => f.key === filter4)?.label ||
              'All months'
            }
            onHeaderFilterClick={() => setShowDropdown4(!showDropdown4)}
            footerActionLabel="View all report insight"
            onFooterActionClick={() => {
              /* navigate */
            }}
          />
          {showDropdown4 && (
            <div className="absolute top-16 right-6 z-10 w-48 rounded-xl border border-neutral-200 bg-white shadow-lg">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setFilter4(opt.key);
                    setShowDropdown4(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 first:rounded-t-xl last:rounded-b-xl"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 6) Streams per DSP (bars + legend) */}
        <Card className="overflow-hidden xl:w-[30%]">
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
      </div>

      <div className="flex flex-col w-full xl:flex-row gap-4 mt-6">
        {/* 7) Territory Analysis (list + bars) */}
        <Card className="overflow-hidden flex-1">
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
        <Card className="overflow-hidden flex-1">
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
