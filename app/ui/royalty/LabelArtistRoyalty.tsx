'use client';
import React, { useMemo, useState } from 'react';
import { Download, Calendar } from 'lucide-react';
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

export default function LabelArtistRoyalty() {
  const {
    dashboardMetrics,
    uploads,
    isUploadsLoading,
    albumPerformance,
    albumRevenue,
    trackStreamsDsp,
    tracksStreams,
  } = useRoyalty();

  const [activeTab, setActiveTab] = useState<'analytics' | 'files'>('analytics');
  const currentYear = new Date().getFullYear();

  /* ── Chart data ── */

  const revenueTrendData = useMemo(
    () =>
      (dashboardMetrics?.revenueByMonth ?? []).map((m) => ({
        label: m.label,
        value: m.revenue ?? 0,
      })),
    [dashboardMetrics]
  );

  const streamsTrendData = useMemo(
    () =>
      (dashboardMetrics?.streamsByMonth ?? []).map((m) => ({
        label: m.label,
        value: m.streams ?? 0,
      })),
    [dashboardMetrics]
  );

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

  const topTracksBarData = useMemo(
    () =>
      (tracksStreams?.tracks ?? []).slice(0, 6).map((t) => ({
        label: t.title.length > 14 ? `${t.title.substring(0, 14)}…` : t.title,
        value: t.totalStreams,
      })),
    [tracksStreams]
  );

  const albumPerformanceData = useMemo(
    () => (albumPerformance ?? []).map((item) => ({ label: item.day, value: item.streams })),
    [albumPerformance]
  );

  const albumRevenueData = useMemo(
    () => (albumRevenue ?? []).map((item) => ({ label: item.day, value: item.revenue })),
    [albumRevenue]
  );

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {activeTab === 'files' ? 'My Files' : 'Analytics'}
          </h1>
          <p className="text-sm text-neutral-500">
            Monitor your music performance and royalty earnings.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex lg:w-fit">
          <button className="w-full rounded-2xl bg-[#EAEAEA] px-3 py-2 text-sm font-medium text-neutral-800 lg:w-auto">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Filter by: {currentYear}
            </span>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-6 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`relative py-2 text-sm font-medium ${
            activeTab === 'analytics'
              ? 'text-black after:absolute after:-bottom-px after:left-0 after:h-[2px] after:w-full after:bg-[#7B00D4]'
              : 'text-neutral-500'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`relative py-2 text-sm ${
            activeTab === 'files'
              ? 'font-medium text-black after:absolute after:-bottom-px after:left-0 after:h-[2px] after:w-full after:bg-[#7B00D4]'
              : 'text-neutral-500'
          }`}
        >
          Files ({uploads?.total ?? 0})
        </button>
      </div>

      {/* ── Files tab ── */}
      {activeTab === 'files' && (
        <div className="space-y-3">
          {isUploadsLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7B00D4]" />
            </div>
          ) : !uploads?.data || uploads.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mx-auto text-neutral-400"
              >
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
              <p className="mt-3 text-sm text-neutral-500">No files available yet</p>
            </div>
          ) : (
            uploads.data.map((file) => (
              <div
                key={file.hash}
                className="flex items-center justify-between bg-white border border-[#EAEAEA] rounded-2xl px-4 py-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <svg
                    width="17"
                    height="20"
                    viewBox="0 0 17 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M11.586 0C12.1164 0.000113275 12.625 0.210901 13 0.586L16.414 4C16.7891 4.37499 16.9999 4.88361 17 5.414V14C17 14.5304 16.7893 15.0391 16.4142 15.4142C16.0391 15.7893 15.5304 16 15 16H13V18C13 18.5304 12.7893 19.0391 12.4142 19.4142C12.0391 19.7893 11.5304 20 11 20H2C1.46957 20 0.960859 19.7893 0.585786 19.4142C0.210714 19.0391 0 18.5304 0 18V6C0 5.46957 0.210714 4.96086 0.585786 4.58579C0.960859 4.21071 1.46957 4 2 4H4V2C4 1.46957 4.21071 0.960859 4.58579 0.585786C4.96086 0.210714 5.46957 0 6 0H11.586ZM4 6H2V18H11V16H6C5.46957 16 4.96086 15.7893 4.58579 15.4142C4.21071 15.0391 4 14.5304 4 14V6ZM10 2H6V14H15V7H11.5C11.1271 6.99998 10.7676 6.86108 10.4916 6.61038C10.2156 6.35968 10.0428 6.01516 10.007 5.644L10 5.5V2ZM12 2.414V5H14.586L12 2.414Z"
                      fill="#09244B"
                    />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-[#3C3C3C] truncate">
                      {file.normalizedName}
                    </p>
                    <p className="text-xs text-[#3C3C3C] mt-0.5">
                      {new Date(file.uploadedAt).toLocaleDateString()} • {file.source}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(file.fileUrl)}
                  className="flex-shrink-0 ml-4 inline-flex items-center gap-2 rounded-2xl border border-[#3C3C3C] bg-white px-5 py-2 text-sm text-[#3c3c3c] hover:bg-neutral-50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Analytics tab ── */}
      {activeTab === 'analytics' && (
        <>
          {/* Row 1: Revenue Trend (area/monotone) + Streams per DSP (donut) */}
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 relative">
              <ChartCard
                title="Revenue Trend"
                variant="line"
                data={revenueTrendData}
                xKey="label"
                yKey="value"
                color={BRAND.purple}
                lineType="monotone"
                footerActionLabel="View all report insight"
              />
            </div>
            <div className="xl:w-[35%] relative">
              <ChartCard
                title="Streams per DSP"
                variant="donut"
                data={dspDonutData}
                donutInnerText={'Total\nStreams'}
                footerActionLabel="View all report insight"
              />
            </div>
          </div>

          {/* Row 2: Top tracks by streams (bar) + Streams Trend (area/monotone) */}
          <div className="flex flex-col xl:flex-row gap-4 mt-6">
            <div className="w-full xl:w-[45%]">
              <ChartCard
                title="Top tracks by streams"
                variant="bar"
                data={topTracksBarData}
                xKey="label"
                yKey="value"
                color={BRAND.green}
                footerActionLabel="View all report insight"
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
                footerActionLabel="View all report insight"
              />
            </div>
          </div>

          {/* Row 3: Album performance (line) + Revenue by album (bar) */}
          <div className="flex flex-col xl:flex-row gap-4 mt-6">
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
        </>
      )}
    </div>
  );
}
