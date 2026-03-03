'use client';
import { useMemo } from 'react';
import Image from 'next/image';
import Topbar from '@/components/layout/Topbar';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartCard, DonutSlice } from '@/components/dashboard/ChartCard';
import { useRoyalty } from '@/hooks/useRoyalty';
import { BRAND } from '@/lib/brand';

export default function RecordLabelDashboard() {
  const { dashboardMetrics, albumPerformance, albumRevenue, albumInteractions } = useRoyalty();

  const sparkUp = [{ v: 20 }, { v: 35 }, { v: 30 }, { v: 55 }, { v: 52 }, { v: 70 }];
  const sparkDown = [{ v: 65 }, { v: 40 }, { v: 45 }, { v: 38 }, { v: 42 }, { v: 35 }];

  const interactionData: DonutSlice[] = [
    { name: 'Download', value: 244, color: BRAND.green },
    { name: 'Stream', value: 500, color: BRAND.purple },
  ];

  const totalRevenueValue = useMemo(
    () => `$${Math.floor((dashboardMetrics?.totalRevenue ?? 0) * 1000) / 1000}`,
    [dashboardMetrics]
  );

  const totalStreamsValue = useMemo(
    () => (dashboardMetrics?.totalStreams ?? 0).toLocaleString(),
    [dashboardMetrics]
  );

  const topTrackTitle = dashboardMetrics?.topTrack?.title ?? '-';

  const revenueByTrackData = useMemo(
    () =>
      (dashboardMetrics?.revenueByMonth ?? []).map((m) => ({
        label: m.label,
        value: m.revenue ?? 0,
      })),
    [dashboardMetrics]
  );

  const allTracksPerformanceData = useMemo(
    () =>
      (dashboardMetrics?.streamsByMonth ?? []).map((m) => ({
        label: m.label,
        value: m.streams ?? 0,
      })),
    [dashboardMetrics]
  );

  const albumPerformanceData = useMemo(
    () => (albumPerformance ?? []).map((item) => ({ label: item.day, value: item.streams })),
    [albumPerformance]
  );

  const albumRevenueData = useMemo(
    () => (albumRevenue ?? []).map((item) => ({ label: item.day, value: item.revenue })),
    [albumRevenue]
  );

  const albumInteractionData: DonutSlice[] = useMemo(
    () => [{ name: 'Stream', value: albumInteractions?.totalStreams ?? 0, color: BRAND.purple }],
    [albumInteractions]
  );

  return (
    <div>
      <Topbar />

      {/* Stats */}
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

      {/* Charts row 1 */}
      <div className="mt-6 flex flex-col xl:flex-row gap-4">
        <div className="w-full xl:w-[45.11%]">
          <ChartCard
            title="Revenue by track"
            variant="bar"
            data={revenueByTrackData}
            xKey="label"
            yKey="value"
          />
        </div>
        <div className="w-full xl:flex-1">
          <ChartCard
            title="All tracks performance"
            variant="line"
            data={allTracksPerformanceData}
            xKey="label"
            yKey="value"
            lineType="monotone"
          />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="mt-6 flex flex-col xl:flex-row gap-4">
        <div className="w-full xl:flex-1">
          <ChartCard
            title="All album performance"
            variant="line"
            data={albumPerformanceData}
            xKey="label"
            yKey="value"
            lineType="monotone"
          />
        </div>
        <div className="w-full xl:w-[45.11%]">
          <ChartCard
            title="Revenue by album"
            variant="bar"
            data={albumRevenueData}
            xKey="label"
            yKey="value"
          />
        </div>
      </div>

      {/* Charts row 3 */}
      <div className="mt-6 flex flex-col xl:flex-row gap-4">
        <div className="w-full xl:w-[45.11%]">
          <ChartCard
            title="Track Interaction Type"
            variant="donut"
            data={interactionData}
            donutInnerText={'Total\nInteraction'}
          />
        </div>
        <div className="w-full xl:flex-1">
          <ChartCard
            title="Album Interaction Type"
            variant="donut"
            data={albumInteractionData}
            donutInnerText={'Total\nInteraction'}
          />
        </div>
      </div>
    </div>
  );
}
