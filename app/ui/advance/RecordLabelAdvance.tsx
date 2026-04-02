'use client';

import React, { useMemo, useState } from 'react';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Select } from '@/components/ui/Select';
import YearFilterCalendar from '@/components/ui/YearFilterCalendar';
import {
  ArrowUpDown,
  CheckCheck,
  CircleDollarSign,
  FileUp,
  Hourglass,
  MessageSquare,
  MoreVertical,
  Search,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAdvance } from '@/hooks/useAdvance';
import { Advance } from '@/lib/types/advance';
import { useRecordLabelArtists } from '@/hooks/useRecordLabelArtists';
import { getRecordLabelArtistName } from '@/lib/utils/recordLabelArtist';
import { deriveSingleCurrency, formatCurrencyAmount } from '@/lib/utils/currency';

type AdvanceTab = 'request' | 'analytics';
type AdvanceType = 'Personal' | 'Marketing';
type AdvanceStatus = 'Paid' | 'Pending' | 'Approved' | 'Rejected';

type AdvanceRow = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  type: AdvanceType;
  status: AdvanceStatus;
  artist: string;
  rawDateIso: string;
  repaidAmount: number;
};

type ChartPoint = {
  label: string;
  date: string;
  value: number;
};

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const STATUS_OPTIONS = [
  { label: 'All status', value: 'all' },
  { label: 'Approved', value: 'approved' },
  { label: 'Pending', value: 'pending' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Paid', value: 'paid' },
];

function normalizeStatus(rawStatus: string): AdvanceStatus {
  const key = rawStatus.trim().toLowerCase();
  if (key === 'repaid' || key === 'paid') return 'Paid';
  if (key === 'approved') return 'Approved';
  if (key === 'rejected') return 'Rejected';
  return 'Pending';
}

function normalizeType(rawType: string): AdvanceType {
  const key = rawType.trim().toLowerCase();
  return key === 'marketting' || key === 'marketing' ? 'Marketing' : 'Personal';
}

function parseDate(value?: string) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function displayDate(value?: string) {
  return parseDate(value)
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .replace(/ /g, '-');
}

function getRepaidAmount(row: AdvanceRow) {
  if (row.repaidAmount > 0) return Math.min(row.repaidAmount, row.amount);
  return row.status === 'Paid' || row.status === 'Approved' ? row.amount : 0;
}

function buildMonthlySeriesFromRows(
  rows: AdvanceRow[],
  predicate: (row: AdvanceRow) => boolean,
  valueSelector: (row: AdvanceRow) => number
): ChartPoint[] {
  if (!rows.length) return [];

  const totalsByMonth = new Array<number>(12).fill(0);
  rows.forEach((row) => {
    if (!predicate(row)) return;
    const date = parseDate(row.rawDateIso);
    const month = date.getMonth();
    totalsByMonth[month] += valueSelector(row);
  });

  const year = new Date().getFullYear();
  return MONTH_LABELS.map((label, index) => ({
    label,
    date: `${year}-${String(index + 1).padStart(2, '0')}-01`,
    value: totalsByMonth[index],
  }));
}

function mapApiTrendToSeries(
  trend: Array<{ date: string; totalUSD: number }> | undefined
): ChartPoint[] {
  if (!trend?.length) return [];
  return trend.map((point) => ({
    label: new Date(point.date).toLocaleDateString('en-US', { month: 'short' }),
    date: point.date,
    value: Number(point.totalUSD) || 0,
  }));
}

function MetricCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#D5D5D5] bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[34px] font-semibold leading-none text-[#3C3C3C]">{value}</p>
          <p className="mt-2 text-[14px] text-[#7A7A7A]">{label}</p>
        </div>
        <div className="text-[#7B00D4]">{icon}</div>
      </div>
    </div>
  );
}

const RecordLabelAdvance = () => {
  const { advances = [], overview, marketingTrend, personalTrend } = useAdvance();
  const { artists } = useRecordLabelArtists();
  const searchParams = useSearchParams();
  const selectedArtistId = (searchParams.get('artistId') || '').trim();
  const hasSelectedArtist = selectedArtistId.length > 0;
  const selectedArtistName = useMemo(() => {
    if (!selectedArtistId) return '';
    const artist = artists.find(
      (item) => (item.id || item._id || '').toString().trim() === selectedArtistId
    );
    return getRecordLabelArtistName(artist || {}) || 'selected artist';
  }, [artists, selectedArtistId]);

  const [tab, setTab] = useState<AdvanceTab>('request');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  const rows = useMemo<AdvanceRow[]>(() => {
    return advances.map((advance: Advance, index) => {
      const rawDate = (advance.createdAt || advance.created_at || new Date().toISOString()).toString();
      return {
        id: advance._id || `ADV-${index + 1}`,
        date: displayDate(rawDate),
        amount: Number(advance.amount) || 0,
        currency: (advance.currency || 'USD').toUpperCase(),
        type: normalizeType(advance.advance_type || ''),
        status: normalizeStatus(advance.repayment_status || ''),
        artist: advance.advance_source_name?.trim() || 'Unknown Artist',
        rawDateIso: rawDate,
        repaidAmount: Number(advance.repaid_amount) || 0,
      };
    });
  }, [advances]);

  const scopedRows = useMemo(() => {
    return rows;
  }, [rows]);
  const rowCurrency = useMemo(
    () => deriveSingleCurrency(scopedRows.map((row) => row.currency), 'USD'),
    [scopedRows]
  );

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return scopedRows.filter((row) => {
      const statusOk = status === 'all' || row.status.toLowerCase() === status;
      const keywordOk =
        keyword === '' ||
        row.id.toLowerCase().includes(keyword) ||
        row.artist.toLowerCase().includes(keyword) ||
        row.type.toLowerCase().includes(keyword);
      return statusOk && keywordOk;
    });
  }, [q, scopedRows, status]);

  const scopedSummary = useMemo(() => {
    const totalRequests = scopedRows.length;
    const pendingRequests = scopedRows.filter((row) => row.status === 'Pending').length;
    const approvedRequests = scopedRows.filter((row) => row.status === 'Approved').length;
    const rejectedRequests = scopedRows.filter((row) => row.status === 'Rejected').length;
    const totalAmount = scopedRows.reduce((sum, row) => sum + row.amount, 0);
    const repaidAmount = scopedRows.reduce((sum, row) => sum + getRepaidAmount(row), 0);
    const personalTotal = scopedRows
      .filter((row) => row.type === 'Personal')
      .reduce((sum, row) => sum + row.amount, 0);
    const marketingTotal = scopedRows
      .filter((row) => row.type === 'Marketing')
      .reduce((sum, row) => sum + row.amount, 0);

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalAmount,
      repaidAmount,
      personalTotal,
      marketingTotal,
    };
  }, [scopedRows]);

  const topAmounts = useMemo(() => {
    const overviewTotalAdvance = Number(overview?.totalAdvanceUSD) || 0;
    const overviewRepaidAdvance = Number(overview?.totalRepaidUSD) || 0;

    return {
      totalAdvance: hasSelectedArtist ? scopedSummary.totalAmount : overviewTotalAdvance || scopedSummary.totalAmount,
      repaidAdvance: hasSelectedArtist ? scopedSummary.repaidAmount : overviewRepaidAdvance || scopedSummary.repaidAmount,
    };
  }, [hasSelectedArtist, overview?.totalAdvanceUSD, overview?.totalRepaidUSD, scopedSummary.repaidAmount, scopedSummary.totalAmount]);
  const metricCurrency = hasSelectedArtist ? rowCurrency : 'USD';

  const requestMetrics = hasSelectedArtist
    ? [
        { value: scopedSummary.totalRequests.toLocaleString(), label: 'Total request', icon: <CheckCheck className="h-4 w-4" /> },
        { value: scopedSummary.pendingRequests.toLocaleString(), label: 'Pending request', icon: <Hourglass className="h-4 w-4" /> },
        { value: scopedSummary.rejectedRequests.toLocaleString(), label: 'Rejected request', icon: <XCircle className="h-4 w-4" /> },
        { value: scopedSummary.approvedRequests.toLocaleString(), label: 'Approved request', icon: <CheckCheck className="h-4 w-4" /> },
      ]
    : [
        { value: scopedSummary.totalRequests.toLocaleString(), label: 'Total request', icon: <CheckCheck className="h-4 w-4" /> },
        { value: scopedSummary.pendingRequests.toLocaleString(), label: 'Pending request', icon: <Hourglass className="h-4 w-4" /> },
        { value: formatCurrencyAmount(topAmounts.totalAdvance, metricCurrency), label: 'Given Advance', icon: <WalletCards className="h-4 w-4" /> },
        { value: formatCurrencyAmount(topAmounts.repaidAdvance, metricCurrency), label: 'Repaid Advance', icon: <CircleDollarSign className="h-4 w-4" /> },
      ];

  const analyticsMetrics = [
    { value: scopedSummary.totalRequests.toLocaleString(), label: 'Total request', icon: <CheckCheck className="h-4 w-4" /> },
    { value: scopedSummary.pendingRequests.toLocaleString(), label: 'Pending request', icon: <Hourglass className="h-4 w-4" /> },
    { value: formatCurrencyAmount(topAmounts.totalAdvance, metricCurrency), label: 'Given Advance', icon: <WalletCards className="h-4 w-4" /> },
    { value: formatCurrencyAmount(topAmounts.repaidAdvance, metricCurrency), label: 'Repaid Advance', icon: <CircleDollarSign className="h-4 w-4" /> },
  ];

  const topMetrics = tab === 'request' ? requestMetrics : analyticsMetrics;

  const personalSeries = useMemo(() => {
    if (hasSelectedArtist) {
      return buildMonthlySeriesFromRows(
        scopedRows,
        (row) => row.type === 'Personal',
        (row) => row.amount
      );
    }
    return mapApiTrendToSeries(personalTrend);
  }, [hasSelectedArtist, personalTrend, scopedRows]);

  const marketingSeries = useMemo(() => {
    if (hasSelectedArtist) {
      return buildMonthlySeriesFromRows(
        scopedRows,
        (row) => row.type === 'Marketing',
        (row) => row.amount
      );
    }
    return mapApiTrendToSeries(marketingTrend);
  }, [hasSelectedArtist, marketingTrend, scopedRows]);

  const repaymentSeries = useMemo(
    () => buildMonthlySeriesFromRows(scopedRows, () => true, (row) => getRepaidAmount(row)),
    [scopedRows]
  );

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-medium text-[#3C3C3C]">Welcome to Advance-O-Meter</h1>
          <p className="text-base text-[#777777]">
            Track and get more info on{' '}
            {hasSelectedArtist ? (
              <span className="font-medium text-[#7B00D4]">{selectedArtistName}&rsquo;s</span>
            ) : (
              'your'
            )}{' '}
            advance request
          </p>
        </div>

        <div className="flex w-full gap-2 lg:w-auto">
          <YearFilterCalendar buttonClassName="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#EAEAEA] px-3 py-2 text-sm font-medium text-neutral-800" />
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#7B00D4] px-6 text-sm font-medium text-white"
          >
            <FileUp className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {topMetrics.map((metric) => (
          <MetricCard key={metric.label} value={metric.value} label={metric.label} icon={metric.icon} />
        ))}
      </div>

      <div className="mt-5 border-b border-[#DFDFDF]">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setTab('request')}
            className={`pb-2 font-bold ${
              tab === 'request'
                ? 'border-b-2 border-[#7B00D4] text-[#7B00D4]'
                : 'text-[#999999]'
            }`}
          >
            Advance request <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[#E53935] align-top" />
          </button>
          <button
            type="button"
            onClick={() => setTab('analytics')}
            className={`pb-2 font-bold ${
              tab === 'analytics'
                ? 'border-b-2 border-[#7B00D4] text-[#7B00D4]'
                : 'text-[#999999]'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {tab === 'request' ? (
        <Card className="mt-5 overflow-hidden">
          <CardBody className="p-0!">
            <div className="flex flex-col items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3 lg:flex-row lg:items-center">
              <div className="text-sm font-semibold text-[#3C3C3C]">
                {hasSelectedArtist ? 'Top Advance requests' : 'Advance request'}
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
                <div className="relative w-full sm:w-[260px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0B0B0]" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search advance request"
                    className="h-8 w-full rounded-xl border border-neutral-200 bg-[#F6F6F6] pl-9 pr-3 text-xs text-[#6C6C6C] outline-none"
                  />
                </div>
                <Select
                  value={status}
                  onChange={setStatus}
                  className="h-8 min-w-[120px] bg-[#FFFFFF] text-xs"
                  options={STATUS_OPTIONS}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="bg-[#F4F4F4] text-[14px] font-medium text-[#6F6F6F]">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        Date
                        <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Advance type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Artist</th>
                    <th className="px-4 py-3 text-right">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA] text-base text-[#4E4E4E]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-sm text-[#8A8A8A]">
                        No advance requests found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row, index) => (
                      <tr key={`${row.id}-${index}`}>
                        <td className="px-4 py-3 whitespace-nowrap">{row.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatCurrencyAmount(row.amount, row.currency)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.type}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusPill label={row.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.artist}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2 text-[#9C9C9C]">
                            <button
                              type="button"
                              className="hover:text-[#7B00D4]"
                              aria-label="Comments"
                            >
                              <MessageSquare
                                className={`h-4 w-4 ${
                                  row.status === 'Approved' ? 'text-[#00B241]' : ''
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              className="hover:text-[#7B00D4]"
                              aria-label="More actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard
              title="Personal advance trend"
              variant="line"
              data={personalSeries}
              xKey="label"
              yKey="value"
              color="#7B00D4"
              bandFill="#F4F4F4"
              lineType="monotone"
              chartMarginTop={48}
              chartOverlay={
                <div className="leading-none">
                  <div className="flex items-center gap-1 text-[12px] font-normal leading-[120%] text-[#AAAAAA]">
                    <span className="h-2 w-[2px] rounded bg-[#7B00D4]" />
                    Total personal advance
                  </div>
                  <p className="mt-1 text-[20px] font-medium leading-[120%] tracking-[0] text-[#3C3C3C]">
                    {formatCurrencyAmount(scopedSummary.personalTotal, rowCurrency)}
                  </p>
                </div>
              }
            />
            <ChartCard
              title="Marketing advance trend"
              variant="line"
              data={marketingSeries}
              xKey="label"
              yKey="value"
              color="#00AA39"
              bandFill="#F4F4F4"
              lineType="monotone"
              chartMarginTop={48}
              chartOverlay={
                <div className="leading-none">
                  <div className="flex items-center gap-1 text-[12px] font-normal leading-[120%] text-[#AAAAAA]">
                    <span className="h-2 w-[2px] rounded bg-[#00AA39]" />
                    Total marketing advance
                  </div>
                  <p className="mt-1 text-[20px] font-medium leading-[120%] tracking-[0] text-[#3C3C3C]">
                    {formatCurrencyAmount(scopedSummary.marketingTotal, rowCurrency)}
                  </p>
                </div>
              }
            />
          </div>

          <ChartCard
            title="Advance repayment trend"
            variant="line"
            data={repaymentSeries}
            xKey="label"
            yKey="value"
            color="#7B00D4"
            bandFill="#F4F4F4"
            lineType="monotone"
            chartMarginTop={48}
            chartOverlay={
              <div className="leading-none">
                <div className="flex items-center gap-1 text-[12px] font-normal leading-[120%] text-[#AAAAAA]">
                  <span className="h-2 w-[2px] rounded bg-[#7B00D4]" />
                  Total repayment
                </div>
                <p className="mt-1 text-[20px] font-medium leading-[120%] tracking-[0] text-[#3C3C3C]">
                  {formatCurrencyAmount(topAmounts.repaidAdvance, metricCurrency)}
                </p>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
};

export default RecordLabelAdvance;
