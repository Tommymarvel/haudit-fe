
import QuickActionsBar from '@/components/dashboard/QuickActionsBar';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartCard, DonutSlice } from '@/components/dashboard/ChartCard';

import { performanceAllTracks, revenueByMonth } from '@/lib/data/mockDashboard';
import Image from 'next/image';
import Topbar from '@/components/layout/Topbar';

export default function SoloArtistDashboard() {
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
  return (
    <div>
      <div className="">
        {' '}
        <Topbar />
      </div>

      {/* Quick actions */}
      <div className="flex  flex-col lg:flex-row lg:items-center justify-between mt-6">
        <p className="text-lg font-medium text-neutral-700">Quick actions</p>
        <QuickActionsBar
          onAddFile={() => console.log('Add file')}
          onAddAdvance={() => console.log('Add advance')}
          onMore={(key) => console.log('More:', key)}
        />
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total revenue"
          value="2,420"
          delta={40}
          icon={
            <Image
              src="/svgs/dollar-sign.svg"
              width={48}
              height={48}
              alt="haudit"
            />
          }
          className="h-[160px]"
          spark={{ data: sparkUp }}
        />
        <StatCard
          title="Total streams"
          value="20,420"
          delta={-10}
          icon={
            <Image src="/svgs/users.svg" width={48} height={48} alt="haudit" />
          }
          spark={{ data: sparkDown }}
          className="h-[160px]"
        />
        <StatCard
          title="Top performing track"
          value="WON BUMI"
          delta={-10}
          icon={
            <Image src="/svgs/music.svg" width={48} height={48} alt="haudit" />
          }
          spark={{ data: sparkUp }}
          className="h-[160px]"
        />
      </div>

      {/* Charts */}
      <div className="mt-6 flex gap-4">
        <div className="w-[45.11%]">
          <ChartCard
            title="Revenue by track"
            variant="bar"
            data={revenueByMonth}
            xKey="label"
            yKey="value"
          />
        </div>
        <div className="flex-1">
          <ChartCard
            title="All tracks performance"
            variant="line"
            data={performanceAllTracks}
            xKey="label"
            yKey="value"
            lineType="monotone"
          />
        </div>
      </div>
      {/* Charts */}
      <div className="mt-6 flex gap-4">
        <div className="flex-1">
          <ChartCard
            title="All album performance"
            variant="line"
            data={performanceAllTracks}
            xKey="label"
            yKey="value"
            lineType="monotone"
          />
        </div>
        <div className="w-[45.11%]">
          <ChartCard
            title="Revenue by album"
            variant="bar"
            data={revenueByMonth}
            xKey="label"
            yKey="value"
          />
        </div>
      </div>
      <div className="mt-6 flex gap-4">
        <div className="w-[45.11%]">
          <ChartCard
            title="Track Interaction Type"
            variant="donut"
            data={interactionData}
            donutInnerText={'Total\nInteraction'}
          />
        </div>
        <div className="flex-1">
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
