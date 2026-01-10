
import QuickActionsBar from '@/components/dashboard/QuickActionsBar';
import { Menu } from '@/components/ui/Menu';
import { Button } from '@/components/ui/Button';
import { ChevronDown } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartCard, DonutSlice } from '@/components/dashboard/ChartCard';

import { performanceAllTracks, revenueByMonth as mockRevenueByMonth } from '@/lib/data/mockDashboard';
import Image from 'next/image';
import Topbar from '@/components/layout/Topbar';
import { useMemo } from 'react';
import { useRoyalty } from '@/hooks/useRoyalty';

export default function SoloArtistDashboard() {
  const { dashboardMetrics } = useRoyalty();

  const sparkUp = [
    { v: 20 },
    { v: 35 },
    { v: 30 },
    { v: 55 },
    { v: 52 },
    { v: 70 },
  ];
  const sparkDown = [
    { v: 65 },
    { v: 40 },
    { v: 45 },
    { v: 38 },
    { v: 42 },
    { v: 35 },
  ];

  const interactionData: DonutSlice[] = [
    { name: 'Download', value: 244, color: '#00D447' }, // emerald
    { name: 'Stream', value: 500, color: '#7B00D4' }, // violet
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
  return (
    <div>
      <div className="">
        {' '}
        <Topbar />
      </div>

      {/* Quick actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mt-6">
        <p className="text-lg font-medium text-neutral-700 hidden lg:block">Quick actions</p>
        
        <div className="hidden lg:block">
          <QuickActionsBar
            onAddFile={() => console.log('Add file')}
            onAddAdvance={() => console.log('Add advance')}
            onMore={(key) => console.log('More:', key)}
          />
        </div>

        <div className="block lg:hidden w-full mt-4">
          <Menu
            trigger={
              <Button variant="outline" className="w-full justify-between">
                  <p className="text-lg font-medium text-neutral-700">Quick actions</p> <ChevronDown className="h-4 w-4" />
              </Button>
            }
            items={[
              { label: 'Add new royalty record', onClick: () => console.log('Add file') },
              { label: 'Add Advance', onClick: () => console.log('Add advance') },
              { label: 'Add Expense', onClick: () => console.log('More:', 'expense') },
              { label: 'Export Table', onClick: () => console.log('More:', 'export-table') },
              { label: 'Export Analytics', onClick: () => console.log('More:', 'export-analytics') },
            ]}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5 flex flex-nowrap xl:grid xl:grid-cols-3 gap-4 overflow-x-auto xl:overflow-x-visible pb-2">
        <StatCard
          className="min-w-[280px] xl:min-w-0 flex-shrink-0"
          title="Total revenue"
          value={totalRevenueValue}
          icon={
            <Image
              src="/svgs/dollar-sign.svg"
              width={48}
              height={48}
              alt="haudit"
            />
          }
          spark={{ data: sparkUp }}
        />
        <StatCard
          className="min-w-[280px] xl:min-w-0 flex-shrink-0"
          title="Total streams"
          value={totalStreamsValue}
          icon={
            <Image src="/svgs/users.svg" width={48} height={48} alt="haudit" />
          }
          spark={{ data: sparkDown }}
        />
        <StatCard
          className="min-w-[280px] xl:min-w-0 flex-shrink-0"
          title="Top performing track"
          value={topTrackTitle}
          icon={
            <Image src="/svgs/music.svg" width={48} height={48} alt="haudit" />
          }
          spark={{ data: sparkUp }}
        />
      </div>

      {/* Charts */}
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
      {/* Charts */}
      <div className="mt-6 flex flex-col xl:flex-row gap-4">
        <div className="w-full xl:flex-1">
          <ChartCard
            title="All album performance"
            variant="line"
            data={performanceAllTracks}
            xKey="label"
            yKey="value"
            lineType="monotone"
          />
        </div>
        <div className="w-full xl:w-[45.11%]">
          <ChartCard
            title="Revenue by album"
            variant="bar"
            data={mockRevenueByMonth}
            xKey="label"
            yKey="value"
          />
        </div>
      </div>
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
            data={interactionData}
            donutInnerText={'Total\nInteraction'}
          />
        </div>
      </div>
    </div>
  );
}
