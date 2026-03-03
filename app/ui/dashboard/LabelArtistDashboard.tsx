'use client';
import { useMemo } from 'react';
import Image from 'next/image';
import Topbar from '@/components/layout/Topbar';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartCard, DonutSlice } from '@/components/dashboard/ChartCard';
import { useRoyalty } from '@/hooks/useRoyalty';
import { BRAND } from '@/lib/brand';

const DSP_COLORS = [
  BRAND.purple,
  BRAND.green,
  '#F59E0B',
  '#EF4444',
  '#3B82F6',
  '#14B8A6',
];

export default function LabelArtistDashboard() {
  const {
    dashboardMetrics,
    albumPerformance,
    albumRevenue,
    trackStreamsDsp,
    tracksStreams,
  } = useRoyalty();

  const sparkUp = [{ v: 20 }, { v: 35 }, { v: 30 }, { v: 55 }, { v: 52 }, { v: 70 }];
  const sparkDown = [{ v: 65 }, { v: 40 }, { v: 45 }, { v: 38 }, { v: 42 }, { v: 35 }];

  const totalRevenueValue = useMemo(
    () => `$${Math.floor((dashboardMetrics?.totalRevenue ?? 0) * 1000) / 1000}`,
    [dashboardMetrics]
  );

  const totalStreamsValue = useMemo(
    () => (dashboardMetrics?.totalStreams ?? 0).toLocaleString(),
    [dashboardMetrics]
  );

  const topTrackTitle = dashboardMetrics?.topTrack?.title ?? '-';

  /* Row 1 — left: monthly revenue trend (area/monotone line) */
  const revenueTrendData = useMemo(
    () =>
      (dashboardMetrics?.revenueByMonth ?? []).map((m) => ({
        label: m.label,
        value: m.revenue ?? 0,
      })),
    [dashboardMetrics]
  );

  /* Row 1 — right: streams per DSP (donut) */
  const dspDonutData: DonutSlice[] = useMemo(
    () =>
      (trackStreamsDsp?.dspSummary ?? [])
        .slice(0, 6)
        .map((dsp, i) => ({
          name: dsp.dsp,
          value: dsp.streams,
          color: DSP_COLORS[i % DSP_COLORS.length],
        })),
    [trackStreamsDsp]
  );

  /* Row 2 — left: top tracks by streams (bar) */
  const topTracksBarData = useMemo(
    () =>
      (tracksStreams?.tracks ?? []).slice(0, 6).map((t) => ({
        label: t.title.length > 14 ? `${t.title.substring(0, 14)}…` : t.title,
        value: t.totalStreams,
      })),
    [tracksStreams]
  );

  /* Row 2 — right: monthly streams trend (area/monotone line) */
  const streamsTrendData = useMemo(
    () =>
      (dashboardMetrics?.streamsByMonth ?? []).map((m) => ({
        label: m.label,
        value: m.streams ?? 0,
      })),
    [dashboardMetrics]
  );

  /* Row 3 — left: album performance over time (line/monotone) */
  const albumPerformanceData = useMemo(
    () => (albumPerformance ?? []).map((item) => ({ label: item.day, value: item.streams })),
    [albumPerformance]
  );

  /* Row 3 — right: revenue by album (bar) */
  const albumRevenueData = useMemo(
    () => (albumRevenue ?? []).map((item) => ({ label: item.day, value: item.revenue })),
    [albumRevenue]
  );

  return (
    <div>
      <Topbar />

      {/* ── Stats ── */}
      <div className="mt-6 flex flex-nowrap xl:grid xl:grid-cols-3 gap-4 overflow-x-auto xl:overflow-x-visible pb-2">
        <StatCard
          className="min-w-[280px] xl:min-w-0 flex-shrink-0"
          title="Total revenue"
          value={totalRevenueValue}
          icon={<Image src="/svgs/dollar-sign.svg" width={48} height={48} alt="haudit" />}
          spark={{ data: sparkUp }}
        />
        <StatCard
          className="min-w-[280px] xl:min-w-0 flex-shrink-0"
          title="Total streams"
          value={totalStreamsValue}
          icon={<Image src="/svgs/users.svg" width={48} height={48} alt="haudit" />}
          spark={{ data: sparkDown }}
        />
        <StatCard
          className="min-w-[280px] xl:min-w-0 flex-shrink-0"
          title="Top performing track"
          value={topTrackTitle}
          icon={<Image src="/svgs/music.svg" width={48} height={48} alt="haudit" />}
          spark={{ data: sparkUp }}
        />
      </div>

      {/* ── Row 1: Revenue Trend (area/monotone) + Streams per DSP (donut) ── */}
      <div className="mt-6 flex flex-col xl:flex-row gap-4">
        <div className="w-full xl:flex-1">
          <ChartCard
            title="Revenue Trend"
            variant="line"
            data={revenueTrendData}
            xKey="label"
            yKey="value"
            color={BRAND.purple}
            lineType="monotone"
          />
        </div>
        <div className="w-full xl:w-[35%]">
          <ChartCard
            title="Streams per DSP"
            variant="donut"
            data={dspDonutData}
            donutInnerText={'Total\nStreams'}
          />
        </div>
      </div>

      {/* ── Row 2: Top Tracks by streams (bar) + Streams Trend (area/monotone) ── */}
      <div className="mt-6 flex flex-col xl:flex-row gap-4">
        <div className="w-full xl:w-[45%]">
          <ChartCard
            title="Top tracks by streams"
            variant="bar"
            data={topTracksBarData}
            xKey="label"
            yKey="value"
            color={BRAND.green}
          />
        </div>
        <div className="w-full xl:flex-1">
          <ChartCard
            title="Streams Trend"
            variant="line"
            data={streamsTrendData}
            xKey="label"
            yKey="value"
            lineType="monotone"
          />
        </div>
      </div>

      {/* ── Row 3: Album Performance (monotone line) + Revenue by Album (bar) ── */}
      <div className="mt-6 flex flex-col xl:flex-row gap-4">
        <div className="w-full xl:flex-1">
          <ChartCard
            title="Album performance"
            variant="line"
            data={albumPerformanceData}
            xKey="label"
            yKey="value"
            lineType="monotone"
          />
        </div>
        <div className="w-full xl:w-[45%]">
          <ChartCard
            title="Revenue by album"
            variant="bar"
            data={albumRevenueData}
            xKey="label"
            yKey="value"
          />
        </div>
      </div>
    </div>
  );
}
