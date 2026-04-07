'use client';

import { useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { BRAND } from '@/lib/brand';
import { ReportInsightDropdown } from '@/components/report-insight/ReportInsightDropdown';
import YearFilterCalendar from '@/components/ui/YearFilterCalendar';
import { ChartEmptyState } from '@/components/dashboard/ChartEmptyState';
import { useRoyalty } from '@/hooks/useRoyalty';
import TerritoryWorldMap from '@/components/royalty/TerritoryWorldMap';
import { getCountryDisplayName } from '@/lib/utils/country';

type TerritoryRow = {
  name: string;
  displayName: string;
  streams: number;
  revenue: number;
};

export default function StreamsAndRevenuePerTerritory() {
  const { territoryAnalysis, isTerritoryAnalysisLoading } = useRoyalty();

  const rows = useMemo<TerritoryRow[]>(
    () =>
      (territoryAnalysis ?? [])
        .map((entry) => ({
          name: entry.territory || '-',
          displayName: getCountryDisplayName(entry.territory || '-'),
          streams: Number(entry.streams ?? 0),
          revenue: Number(entry.totalRevenueUSD ?? 0),
        }))
        .sort((a, b) => b.streams - a.streams),
    [territoryAnalysis]
  );

  const maxStreams = useMemo(() => Math.max(...rows.map((row) => row.streams), 1), [rows]);
  const maxRevenue = useMemo(() => Math.max(...rows.map((row) => row.revenue), 1), [rows]);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <ReportInsightDropdown currentLabel="Streams and revenue per Territory" />
            <p className="text-base text-[#777777]">
              Dashboard / Royalty /{' '}
              <span className="font-bold text-[#7B00D4]">Streams and revenue per Territory</span>
            </p>
          </div>
          <div className="flex w-full gap-2 lg:w-fit">
            <YearFilterCalendar buttonClassName="w-full rounded-2xl bg-[#EAEAEA] text-sm font-medium text-neutral-600 lg:w-auto" />
            <Button variant="primary" className="w-full rounded-2xl lg:w-auto" style={{ backgroundColor: BRAND.purple }}>
              Export as PDF
            </Button>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold text-neutral-900">{rows.length}</span>
          <span className="text-sm text-neutral-500">Total Territory</span>
        </div>

        <div className="h-[440px] w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
          <TerritoryWorldMap territories={rows} maxMarkers={20} className="h-full w-full" />
        </div>

        {isTerritoryAnalysisLoading ? (
          <div className="rounded-2xl bg-white p-6">
            <ChartEmptyState
              title="Loading territory analysis"
              description="Please wait while we fetch territory records."
            />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl bg-white p-6">
            <ChartEmptyState
              title="No territory analysis yet"
              description="Data will appear here once royalty records are available."
            />
          </div>
        ) : (
          <div className="mx-auto max-w-5xl space-y-4">
            {rows.map((row) => (
              <div key={row.name} className="grid grid-cols-[1fr_140px_1fr] items-center gap-4">
                <div className="flex justify-end">
                  <div
                    className="flex items-center justify-end rounded-md bg-[#6B00B0] px-3 py-1.5 text-xs font-medium text-white transition-all duration-500"
                    style={{
                      width: `${(row.streams / maxStreams) * 100}%`,
                      minWidth: 'fit-content',
                    }}
                  >
                    {row.streams.toLocaleString()}
                  </div>
                </div>

                <div className="text-center text-sm font-medium text-neutral-700">{row.displayName}</div>

                <div className="flex justify-start">
                  <div
                    className="flex items-center justify-start rounded-md bg-[#C084FC] px-3 py-1.5 text-xs font-medium text-neutral-900 transition-all duration-500"
                    style={{
                      width: `${(row.revenue / maxRevenue) * 100}%`,
                      minWidth: 'fit-content',
                    }}
                  >
                    ${row.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
