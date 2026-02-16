"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, Download, Calendar } from "lucide-react";
import { Card } from "@/components/ui/Card";

import { useRouter } from "next/navigation";

import { ChartCard } from "@/components/dashboard/ChartCard";
import UploadFileModal from "@/components/ui/UploadFileModal";
import { useRoyalty } from "@/hooks/useRoyalty";

const PURPLE = "#7B00D4";

const FILTER_OPTIONS = [
  { key: "all_months", label: "All months" },
  { key: "last_30_days", label: "Last 30 days" },
  { key: "this_year", label: "This year" },
];

/* ---------- Shared UI ---------- */

type FilterKey = "all_months" | "last_30_days" | "this_year";

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
function FilterPill({ label = "All months" }: { label?: string }) {
  return (
    <button className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-600">
      {label} <ChevronDown className="h-3.5 w-3.5" />
    </button>
  );
}


const PRIMARY = "#000";
const PRIMARY_SOFT = "#CA98EE";


type Territory = {
  name: string;
  streams: number;
  revenue: number;
};

const TERRITORY_DATA: Record<FilterKey, Territory[]> = {
  all_months: [
    { name: "Denmark", streams: 1500, revenue: 300 },
    { name: "United States", streams: 2460, revenue: 730 },
    { name: "Japan", streams: 8320, revenue: 703 },
    { name: "Brazil", streams: 11800, revenue: 740 },
    { name: "Nigeria", streams: 950, revenue: 705 },
  ],
  last_30_days: [
    { name: "Denmark", streams: 1200, revenue: 520 },
    { name: "United States", streams: 18000, revenue: 610 },
    { name: "Japan", streams: 7100, revenue: 460 },
    { name: "Brazil", streams: 9300, revenue: 530 },
    { name: "Nigeria", streams: 2200, revenue: 340 },
  ],
  this_year: [
    { name: "Denmark", streams: 9800, revenue: 3100 },
    { name: "United States", streams: 99000, revenue: 8120 },
    { name: "Japan", streams: 4000, revenue: 5100 },
    { name: "Brazil", streams: 6000, revenue: 4600 },
    { name: "Nigeria", streams: 500, revenue: 2100 },
  ],
};


export default function SoloArtistRoyalty() {
  const { 
    dashboardMetrics, 
    uploads, 
    isUploadsLoading, 
    uploadRoyaltyFile,
    albumPerformance 
  } = useRoyalty();

  const [activeTab, setActiveTab] = useState<"analytics" | "files">(
    "analytics"
  );
  const [year] = useState(2024);
  const [filter1, setFilter1] = useState("all_months");
  const [filter2, setFilter2] = useState("all_months");
  const [filter3, setFilter3] = useState("all_months");
  const [filter4, setFilter4] = useState("all_months");
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const [showDropdown3, setShowDropdown3] = useState(false);
  const [showDropdown4, setShowDropdown4] = useState(false);

  const [filter, setFilter] = useState<FilterKey>("all_months");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const router = useRouter();

  const data = [...TERRITORY_DATA[filter]].sort(
    (a, b) => b.streams - a.streams
  );
  const totalTerritories = data.length;

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const handleAddNewRecord = () => {
    setIsUploadModalOpen(true);
  };

  const handleUpload = async (file: File, organization: string) => {
    try {
      await uploadRoyaltyFile(file, organization);
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  // Prepare chart data from dashboardMetrics
  const revenueTrend = useMemo(() => {
    if (!dashboardMetrics?.revenueByMonth) return [];
    return dashboardMetrics.revenueByMonth.map(m => ({
      x: m.label,
      v: m.revenue || 0
    }));
  }, [dashboardMetrics]);

  const streamsTrend = useMemo(() => {
    if (!dashboardMetrics?.streamsByMonth) return [];
    return dashboardMetrics.streamsByMonth.map(m => ({
      x: m.label,
      v: m.streams || 0
    }));
  }, [dashboardMetrics]);

  const donutParts = useMemo(() => {
    // TODO: Update when revenueBySource endpoint is available
    return [];
  }, []);

  const topTracksData = useMemo((): { legend: Array<{ label: string; color: string; value: number }> } => {
    if (!dashboardMetrics?.topTrack) return { legend: [] };
    const colors = [PURPLE, "#00C853", "#FFC24D", "#E9D7FE", "#FFDFAF"];
    // API returns single topTrack, convert to array format for consistency
    return {
      legend: [{
        label: dashboardMetrics.topTrack.title,
        color: colors[0],
        value: dashboardMetrics.topTrack.totalStreams
      }]
    };
  }, [dashboardMetrics]);

  const revenueBySourceData = useMemo((): { legend: Array<{ label: string; color: string; value: number }> } => {
    // TODO: Update when revenueBySource endpoint is available
    return { legend: [] };
  }, []);

  const albumPerformanceData = useMemo(() => {
    if (!albumPerformance) return [];
    return albumPerformance.map(item => ({
      x: item.day,
      v: item.streams
    }));
  }, [albumPerformance]);

  const activeFilter = FILTER_OPTIONS.find((f) => f.key === filter)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {activeTab === "files" ? "My Files" : "Analytics"}
          </h1>
          <p className="text-sm text-neutral-500">
            Monitor your music performance and royalty earnings.
          </p>
        </div>
        {activeTab === "analytics" ? (
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
        ) : (
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search file by name"
                className="w-64 rounded-xl border border-neutral-200 bg-white px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B00D4]"
              />
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <button
              onClick={handleAddNewRecord}
              className="rounded-xl bg-[#7B00D4] px-4 py-2 text-sm font-medium text-white hover:bg-[#6A00B8] transition-colors inline-flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <g clip-path="url(#clip0_486_12947)">
                  <path
                    d="M13.586 2C14.0556 2.00011 14.5101 2.16543 14.87 2.467L15 2.586L19.414 7C19.746 7.33202 19.9506 7.77028 19.992 8.238L20 8.414V20C20.0002 20.5046 19.8096 20.9906 19.4665 21.3605C19.1234 21.7305 18.6532 21.9572 18.15 21.995L18 22H6C5.49542 22.0002 5.00943 21.8096 4.63945 21.4665C4.26947 21.1234 4.04284 20.6532 4.005 20.15L4 20V4C3.99984 3.49542 4.19041 3.00943 4.5335 2.63945C4.87659 2.26947 5.34684 2.04284 5.85 2.005L6 2H13.586ZM12 4H6V20H18V10H13.5C13.1022 10 12.7206 9.84196 12.4393 9.56066C12.158 9.27936 12 8.89782 12 8.5V4ZM12 11.5C12.2652 11.5 12.5196 11.6054 12.7071 11.7929C12.8946 11.9804 13 12.2348 13 12.5V14H14.5C14.7652 14 15.0196 14.1054 15.2071 14.2929C15.3946 14.4804 15.5 14.7348 15.5 15C15.5 15.2652 15.3946 15.5196 15.2071 15.7071C15.0196 15.8946 14.7652 16 14.5 16H13V17.5C13 17.7652 12.8946 18.0196 12.7071 18.2071C12.5196 18.3946 12.2652 18.5 12 18.5C11.7348 18.5 11.4804 18.3946 11.2929 18.2071C11.1054 18.0196 11 17.7652 11 17.5V16H9.5C9.23478 16 8.98043 15.8946 8.79289 15.7071C8.60536 15.5196 8.5 15.2652 8.5 15C8.5 14.7348 8.60536 14.4804 8.79289 14.2929C8.98043 14.1054 9.23478 14 9.5 14H11V12.5C11 12.2348 11.1054 11.9804 11.2929 11.7929C11.4804 11.6054 11.7348 11.5 12 11.5ZM14 4.414V8H17.586L14 4.414Z"
                    fill="white"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_486_12947">
                    <rect width="24" height="24" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              Add new royalty record
            </button>
          </div>
        )}
      </div>
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`relative py-2 text-sm font-medium ${
            activeTab === "analytics"
              ? "text-black after:absolute after:-bottom-px after:left-0 after:h-[2px] after:w-full after:bg-[#7B00D4]"
              : "text-neutral-500"
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab("files")}
          className={`relative py-2 text-sm ${
            activeTab === "files"
              ? "font-medium text-black after:absolute after:-bottom-px after:left-0 after:h-[2px] after:w-full after:bg-[#7B00D4]"
              : "text-neutral-500"
          }`}
        >
          Files({uploads?.total || 0})
        </button>
      </div>

      {/* ===== FILES TAB ===== */}
      {activeTab === "files" && (
        <div className="mt-6 space-y-3">
          {isUploadsLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7B00D4]"></div>
            </div>
          ) : !uploads?.data || uploads.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 text-neutral-400">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mx-auto"
                >
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
              </div>
              <p className="text-sm text-neutral-500">No files uploaded yet</p>
            </div>
          ) : (
            uploads.data.map((file) => (
              <div
                key={file.hash}
                className="flex items-center justify-between bg-white  border border-[#EAEAEA] rounded-2xl px-4 py-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0">
                    <svg
                      width="17"
                      height="20"
                      viewBox="0 0 17 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M11.586 0C12.1164 0.000113275 12.625 0.210901 13 0.586L16.414 4C16.7891 4.37499 16.9999 4.88361 17 5.414V14C17 14.5304 16.7893 15.0391 16.4142 15.4142C16.0391 15.7893 15.5304 16 15 16H13V18C13 18.5304 12.7893 19.0391 12.4142 19.4142C12.0391 19.7893 11.5304 20 11 20H2C1.46957 20 0.960859 19.7893 0.585786 19.4142C0.210714 19.0391 0 18.5304 0 18V6C0 5.46957 0.210714 4.96086 0.585786 4.58579C0.960859 4.21071 1.46957 4 2 4H4V2C4 1.46957 4.21071 0.960859 4.58579 0.585786C4.96086 0.210714 5.46957 0 6 0H11.586ZM4 6H2V18H11V16H6C5.46957 16 4.96086 15.7893 4.58579 15.4142C4.21071 15.0391 4 14.5304 4 14V6ZM10 2H6V14H15V7H11.5C11.1271 6.99998 10.7676 6.86108 10.4916 6.61038C10.2156 6.35968 10.0428 6.01516 10.007 5.644L10 5.5V2ZM12 2.414V5H14.586L12 2.414Z"
                        fill="#09244B"
                      />
                    </svg>
                  </div>
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

      {/* ===== ANALYTICS TAB ===== */}
      {activeTab === "analytics" && (
        <>
          {/* ===== GRID A (4 cards) ===== */}
          <div className="flex flex-col xl:flex-row gap-4 mt-6">
            {/* 1) Track revenue per DSP */}
            <div className="flex-1 relative">
              <ChartCard
                title="Revenue Trend"
                variant="line"
                data={revenueTrend}
                showDots={true}
                xKey="x"
                yKey="v"
                color="#7B00D4"
                lineType="linear"
                headerFilterLabel={
                  FILTER_OPTIONS.find((f) => f.key === filter1)?.label ||
                  "All months"
                }
                onHeaderFilterClick={() => setShowDropdown1(!showDropdown1)}
                footerActionLabel="View all report insight"
                onFooterActionClick={() => {
                  router.push("/royalty/track-rev-per-dsp");
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
                title="Revenue by Source"
                variant="donut"
                data={donutParts}
                donutInnerText={"Total\nRevenue"}
                headerFilterLabel={
                  FILTER_OPTIONS.find((f) => f.key === filter2)?.label ||
                  "All months"
                }
                onHeaderFilterClick={() => setShowDropdown2(!showDropdown2)}
                footerActionLabel="View all report insight"
                onFooterActionClick={() => {
                  router.push("/royalty/track-streams-per-dsp");
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
            <Card className="overflow-hidden xl:w-[30%] relative">
              <SoftHeader title="Streams per Track" right={<FilterPill />} />
              <div className="bg-white p-4 pb-12">
                <div className="mb-3 flex items-baseline gap-2">
                  <div className="text-4xl font-semibold">{(dashboardMetrics?.totalStreams ?? 0).toLocaleString()}</div>
                  <div className="text-sm text-neutral-500">Total Stream</div>
                </div>
                {topTracksData.legend.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-2 rounded-xl bg-neutral-50 p-3">
                      {/* Two rows of proportional bars with tiny pills inside each color section */}
                      <div className="flex gap-0.5 h-5">
                        {topTracksData.legend.map((l, idx) => (
                          <div
                            key={`row1-${idx}`}
                            className="flex gap-0.5"
                            style={{ flex: l.value }}
                          >
                            {/* Fill this section with tiny pills of the same color */}
                            {new Array(Math.ceil(l.value / 35))
                              .fill(0)
                              .map((_, i) => (
                                <div
                                  key={i}
                                  className="flex-1 rounded-sm"
                                  style={{ background: l.color }}
                                />
                              ))}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-0.5 h-5">
                        {topTracksData.legend.map((l, idx) => (
                          <div
                            key={`row2-${idx}`}
                            className="flex gap-0.5"
                            style={{ flex: l.value }}
                          >
                            {/* Fill this section with tiny pills of the same color */}
                            {new Array(Math.ceil(l.value / 35))
                              .fill(0)
                              .map((_, i) => (
                                <div
                                  key={i}
                                  className="flex-1 rounded-sm"
                                  style={{ background: l.color }}
                                />
                              ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      {topTracksData.legend.map((l, idx) => (
                        <div
                          key={`legend-${idx}`}
                          className="flex items-center border-b  last:border-b-0 pb-2 justify-between"
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
                  </>
                ) : (
                  <div className="mt-4 flex items-center justify-center rounded-xl bg-neutral-50 py-8 text-sm text-neutral-400">
                    No track data available
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => router.push("/royalty/stream-per-track")}
                  className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#7B00D4] shadow-md hover:shadow-lg"
                >
                  <span>View all report insight</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>

            {/* 4) Revenue per Track */}
            {/* <SoftHeader title="Revenue per Track" right={<FilterPill />} /> */}
            <div className="flex-1 relative">
              <ChartCard
                title="All album performance"
                variant="line"
                data={albumPerformanceData}
                xKey="x"
                yKey="v"
                lineType="monotone"
                headerFilterLabel={
                  FILTER_OPTIONS.find((f) => f.key === filter3)?.label ||
                  "All months"
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
                title="Streams Trend"
                variant="line"
                data={streamsTrend}
                xKey="x"
                yKey="v"
                lineType="monotone"
                headerFilterLabel={
                  FILTER_OPTIONS.find((f) => f.key === filter4)?.label ||
                  "All months"
                }
                onHeaderFilterClick={() => setShowDropdown4(!showDropdown4)}
                footerActionLabel="View all report insight"
                onFooterActionClick={() => {
                  router.push("/royalty/stream-per-dsp");
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
            <Card className="overflow-hidden xl:w-[30%] relative">
              <SoftHeader title="Revenue per Source" right={<FilterPill />} />
              <div className="bg-white p-4 pb-12">
                <div className="mb-3 flex items-baseline gap-2">
                  <div className="text-4xl font-semibold">
                    ${Math.floor((dashboardMetrics?.totalRevenue ?? 0) * 1000) / 1000}
                  </div>
                  <div className="text-sm text-neutral-500">Total Revenue</div>
                </div>
                {revenueBySourceData.legend.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-2 rounded-xl bg-neutral-50 p-3">
                      {/* Two rows of proportional bars with tiny pills inside each color section */}
                      <div className="flex gap-0.5 h-5">
                        {revenueBySourceData.legend.map((l, idx) => (
                          <div
                            key={`row1-${idx}`}
                            className="flex gap-0.5"
                            style={{ flex: l.value }}
                          >
                            {/* Fill this section with tiny pills of the same color */}
                            {new Array(Math.ceil(l.value / 35))
                              .fill(0)
                              .map((_, i) => (
                                <div
                                  key={i}
                                  className="flex-1 rounded-sm"
                                  style={{ background: l.color }}
                                />
                              ))}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-0.5 h-5">
                        {revenueBySourceData.legend.map((l, idx) => (
                          <div
                            key={`row2-${idx}`}
                            className="flex gap-0.5"
                            style={{ flex: l.value }}
                          >
                            {/* Fill this section with tiny pills of the same color */}
                            {new Array(Math.ceil(l.value / 35))
                              .fill(0)
                              .map((_, i) => (
                                <div
                                  key={i}
                                  className="flex-1 rounded-sm"
                                  style={{ background: l.color }}
                                />
                              ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      {revenueBySourceData.legend.map((l, idx) => (
                        <div
                          key={`legend-${idx}`}
                          className="flex items-center border-b  last:border-b-0 pb-2 justify-between"
                        >
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded"
                              style={{ background: l.color }}
                            />
                            {l.label}
                          </span>
                          <span className="text-neutral-500">
                            ${l.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-4 flex items-center justify-center rounded-xl bg-neutral-50 py-8 text-sm text-neutral-400">
                    No revenue source data available
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => router.push("/royalty/stream-per-dsp?view=revenue")}
                  className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#7B00D4] shadow-md hover:shadow-lg"
                >
                  <span>View all report insight</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          </div>
          <div className="relative">
            <Card className="overflow-hidden">
              {/* Header: title + filter */}
              <div className="flex items-center justify-between bg-neutral-100 px-4 py-3">
                <div className="text-sm font-semibold text-[#3C3C3C]">
                  Territory Analysis
                </div>

                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
                >
                  <span>{activeFilter.label}</span>
                  <span className="text-[10px] leading-none">▾</span>
                </button>
              </div>

              {/* Body */}
              <div className="bg-neutral-100 px-4 pb-4 pt-3">
                <div className="grid gap-4 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.8fr)]">
                  {/* LEFT: horizontal bar chart x2 (streams + revenue) */}
                  <div className="rounded-2xl bg-white p-4">
                    {/* Total label */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-semibold text-neutral-900">
                        {totalTerritories}
                      </span>
                      <span className="text-xs font-medium text-neutral-500">
                        Total Territory
                      </span>
                    </div>

                    {/* Custom HTML/CSS Bar Chart Implementation */}
                    <div className="mt-4 flex flex-col gap-3 h-[157px] justify-center">
                      {(() => {
                        // Calculate max values for scaling bars once
                        const maxStreams = Math.max(
                          ...data.map((d) => d.streams)
                        );
                        const maxRevenue = Math.max(
                          ...data.map((d) => d.revenue)
                        );

                        return data.map((t) => {
                          // Calculate percentages
                          const streamsWidth = (t.streams / maxStreams) * 100;
                          const revenueWidth = (t.revenue / maxRevenue) * 100;

                          return (
                            <div
                              key={t.name}
                              className="grid grid-cols-[1fr_auto_1fr] items-center gap-4"
                            >
                              {/* Left: Streams (Right aligned, growing left) */}
                              <div className="flex justify-end items-center">
                                <div
                                  className="flex items-center justify-end rounded-[4px] px-2 py-1 h-6 min-w-[2px]"
                                  style={{
                                    width: `${streamsWidth}%`,
                                    backgroundColor: PRIMARY,
                                  }}
                                >
                                  <span className="text-[11px] font-semibold text-white whitespace-nowrap">
                                    {t.streams.toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              {/* Center: Country Name */}
                              <div
                                className="w-[100px] text-center text-xs text-neutral-700 truncate"
                                title={t.name}
                              >
                                {t.name}
                              </div>

                              {/* Right: Revenue (Left aligned, growing right) */}
                              <div className="flex justify-start items-center">
                                <div
                                  className="flex items-center justify-start rounded-[4px] px-2 py-1 h-6 min-w-[2px]"
                                  style={{
                                    width: `${revenueWidth}%`,
                                    backgroundColor: PRIMARY_SOFT,
                                  }}
                                >
                                  <span className="text-[11px] font-semibold text-[#7B00D4] whitespace-nowrap">
                                    ${t.revenue.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* RIGHT: total + map + footer pill */}
                  <div className="rounded-2xl bg-white p-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-semibold text-neutral-900">
                        {totalTerritories}
                      </span>
                      <span className="text-xs font-medium text-neutral-500">
                        Total Territory
                      </span>
                    </div>

                    {/* Map placeholder – swap with real map/image when ready */}
                    <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-[11px] text-neutral-400">
                      World map with territory markers
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full bg-[rgba(123,0,212,0.06)] px-3 py-1 text-[11px] font-medium text-[#7B00D4] hover:bg-[rgba(123,0,212,0.12)]"
                      >
                        <span>View report insight</span>
                        <span className="text-[10px] leading-none">▾</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Filter dropdown */}
            {menuOpen && (
              <div className="absolute right-6 top-11 z-20 w-40 rounded-lg border border-neutral-200 bg-white py-1 text-xs shadow-lg">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setFilter(opt.key as FilterKey);
                      setMenuOpen(false);
                    }}
                    className={`block w-full px-3 py-2 text-left hover:bg-neutral-50 ${
                      opt.key === filter
                        ? "font-semibold text-neutral-900"
                        : "text-neutral-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Upload Modal */}
      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}
