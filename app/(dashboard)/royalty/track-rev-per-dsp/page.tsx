// TrackRevenuePerDSPPanel.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import axiosInstance from "@/lib/axiosinstance";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Download, Table2 } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { exportToPdf } from "@/lib/utils/exportPdf";
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
} from "recharts";
import { ReportInsightDropdown } from "@/components/report-insight/ReportInsightDropdown";
import { ChartEmptyState } from "@/components/dashboard/ChartEmptyState";
import YearFilterCalendar from "@/components/ui/YearFilterCalendar";
import { useSearchParams } from "next/navigation";
import { appendQueryParam } from "@/lib/utils/query";

type Row = {
  track: string;
  values: number[]; // per DSP index 0..6
};

const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);
const EMPTY_COLUMN_LABELS = ["DSP 1", "DSP 2", "DSP 3", "DSP 4", "DSP 5", "DSP 6", "DSP 7", "DSP 8"];
const PAGE_SIZE = 10;

type PaginationItem = number | "ellipsis";

function buildPagination(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, "ellipsis", totalPages - 1, totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, 2, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

export default function TrackRevenuePerDSPPanel() {
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const searchParams = useSearchParams();
  const selectedArtistId = (searchParams.get("artistId") || searchParams.get("id") || "").trim();

  const { data: trackRevenueDsp, isLoading: isTrackRevenueDspLoading } = useSWR<Array<{ assetId: string; assetTitle: string; dsps: Array<{ dsp: string; revenue: number }> }>>(
    appendQueryParam(
      `/royalties/track-revenue-dsp?${(() => {
        const params = new URLSearchParams();
        params.set('monthly', 'false');
        if (typeof selectedYear === 'number') {
          params.set('year', String(selectedYear));
        }
        return params.toString();
      })()}`,
      "artistId",
      selectedArtistId,
    ),
    fetcher
  );

  // Extract unique DSP names and transform API data to rows
  const { dspLabels, rows } = useMemo(() => {
    if (!trackRevenueDsp || trackRevenueDsp.length === 0) {
      return { dspLabels: [], rows: [] };
    }

    // Collect all unique DSP names
    const dspSet = new Set<string>();
    trackRevenueDsp.forEach((track) => {
      track.dsps.forEach((dspData) => {
        dspSet.add(dspData.dsp);
      });
    });
    const dspLabels = Array.from(dspSet);

    // Transform to rows format
    const rows: Row[] = trackRevenueDsp.map((track) => {
      const values = dspLabels.map((dspName) => {
        const dspData = track.dsps.find((d) => d.dsp === dspName);
        return dspData?.revenue ?? 0;
      });
      return {
        track: track.assetTitle,
        values,
      };
    });

    return { dspLabels, rows };
  }, [trackRevenueDsp]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Auto-select first track when data loads
  useEffect(() => {
    if (rows.length > 0 && selected.size === 0) {
      setSelected(new Set([rows[0].track]));
    }
  }, [rows, selected.size]);
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

  const allChecked = rows.length > 0 && selected.size === rows.length;
  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.track))
    );

  // Transform to chart data: [{ x:'DSP 1', 'Track A':500, 'Track B':... }, ...]
  const chartData = useMemo(() => {
    return dspLabels.map((label, idx) => {
      const point: Record<string, unknown> = { x: label };
      rows.forEach((r) => {
        if (selected.has(r.track)) point[r.track] = r.values[idx] ?? null;
      });
      return point;
    });
  }, [dspLabels, rows, selected]);

  const tableColumnLabels = dspLabels.length > 0 ? dspLabels : EMPTY_COLUMN_LABELS;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginationItems = useMemo(
    () => buildPagination(currentPage, rows.length === 0 ? 10 : totalPages),
    [currentPage, rows.length, totalPages]
  );
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [currentPage, rows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length, selectedYear]);

  const handleExportPdf = async () => {
    if (!contentRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await exportToPdf(contentRef.current, `track-revenue-per-dsp-${selectedYear ?? 'all'}.pdf`);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppShell>
      <div ref={contentRef}>
        {/* Header row */}
        <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center justify-between">
          <div>
            <ReportInsightDropdown currentLabel="Track revenue per DSP" />
            <p className="text-base text-[#777777] mt-1">
              Dashboard / Royalty /{" "}
              <span className="text-[#7B00D4] font-bold">
                Track revenue per DSP
              </span>
            </p>
          </div>
          <div className="w-full lg:w-fit flex gap-2">
            <YearFilterCalendar
              value={selectedYear}
              onChange={setSelectedYear}
              showYear={true}
              buttonClassName="w-full rounded-2xl bg-[#EAEAEA] px-3 py-2 text-sm font-medium text-neutral-800 lg:w-auto"
            />
            <Button
              variant="primary"
              disabled={isExporting}
              onClick={handleExportPdf}
              className="w-full rounded-2xl lg:w-auto gap-2"
              style={{ backgroundColor: BRAND.purple }}
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>

        {isTrackRevenueDspLoading ? (
          <div className="mt-7 text-center py-12 text-neutral-500">
            Loading track revenue data...
          </div>
        ) : (
          <div className="mt-7 space-y-4">
            {/* Chart without ChartCard wrapper */}
            <div className="h-[400px] w-full bg-white rounded-xl">
              {rows.length === 0 ? (
                <ChartEmptyState
                  title="No data to display yet"
                  description="This graph will visualize your financial activity as soon as royalty file is added by your label."
                />
              ) : selected.size === 0 ? (
                <ChartEmptyState
                  title="No track selected"
                  description="Select at least one track from the table to visualize this chart."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ left: 0, right: 10, top: 6, bottom: 24 }}
                  >
                    <defs>
                      <linearGradient
                        id="trackAGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#7B00D4" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#7B00D4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient
                        id="trackBGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#00AA39" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#00AA39" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient
                        id="trackCGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
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
                      tick={{ fill: "#AAAAAA", fontSize: 14 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#AAAAAA", fontSize: 14 }}
                      padding={{ bottom: 8 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "none",
                        borderRadius: "12px",
                        color: "white",
                      }}
                    />
                    {Array.from(selected).map((trackName) => (
                      <Line
                        key={trackName}
                        type="linear"
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
              )}
            </div>

            {/* Table */}
            <div className="mt-8 rounded-xl border border-neutral-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-base">
                  <thead className="text-left text-neutral-500 bg-[#F4F4F4]">
                    <tr>
                      <th className="py-3 pl-3 pr-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          disabled={rows.length === 0}
                          onChange={toggleAll}
                          className="h-4 w-4 rounded accent-black disabled:opacity-50"
                        />
                      </th>
                      <th className="py-3 pr-4 whitespace-nowrap">Track</th>
                      {tableColumnLabels.map((d) => (
                        <th
                          key={d}
                          className="py-3 pr-4 whitespace-nowrap text-center"
                        >
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA]">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={tableColumnLabels.length + 2} className="py-20">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Table2 className="h-5 w-5 text-[#7B00D4]" />
                            <p className="mt-2 text-sm font-medium text-neutral-700">No records yet</p>
                            <p className="mt-1 max-w-xs text-xs text-neutral-500">
                              Entries will appear here once financial data is added by your label.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((r) => {
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
                              <div className="flex items-center gap-2">{r.track}</div>
                            </td>
                            {r.values.map((v, i) => (
                              <td
                                key={i}
                                className="py-3 pr-4 whitespace-nowrap text-center tabular-nums"
                              >
                                ${v.toLocaleString()}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-3">
                <button
                  type="button"
                  disabled={rows.length === 0 || currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {paginationItems.map((item, index) =>
                    item === "ellipsis" ? (
                      <span key={`ellipsis-${index}`} className="px-1 text-xs text-neutral-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={`page-${item}`}
                        type="button"
                        onClick={() => setCurrentPage(item)}
                        className={`h-7 min-w-7 rounded-md px-2 text-xs ${
                          currentPage === item
                            ? "bg-neutral-100 text-neutral-900"
                            : "text-neutral-500 hover:bg-neutral-50"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
                <button
                  type="button"
                  disabled={rows.length === 0 || currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function colorFor(name: string) {
  const colors = [
    "#7B00D4",
    "#00AA39",
    "#F59E0B",
    "#EF4444",
    "#3B82F6",
    "#14B8A6",
    "#8B5CF6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length];
}
