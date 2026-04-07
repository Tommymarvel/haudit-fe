'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Select } from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import FileDropzone from '@/components/ui/FIleDropzone';
import YearFilterCalendar from '@/components/ui/YearFilterCalendar';
import {
  ArrowUpDown,
  CheckCheck,
  CircleDollarSign,
  FileUp,
  Hourglass,
  MessageSquare,
  MoreVertical,
  RefreshCcw,
  Search,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useAdvance } from '@/hooks/useAdvance';
import { Advance } from '@/lib/types/advance';
import { useRecordLabelArtists } from '@/hooks/useRecordLabelArtists';
import { getRecordLabelArtistName } from '@/lib/utils/recordLabelArtist';
import { deriveSingleCurrency, formatCurrencyAmount } from '@/lib/utils/currency';
import { toast } from 'react-toastify';

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
  purpose: string;
  accountNumber: string;
  bank: string;
  accountName: string;
  adminInCharge: string;
  adminMessage: string;
  receiptRef: string;
  rawDateIso: string;
  repaidAmount: number;
};

type UpdateStatusValue = 'approved' | 'rejected';

const UPDATE_STATUS_OPTIONS = [
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

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
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [detailsRow, setDetailsRow] = useState<AdvanceRow | null>(null);
  const [statusRow, setStatusRow] = useState<AdvanceRow | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<UpdateStatusValue | ''>('');
  const [statusDescription, setStatusDescription] = useState('');
  const [statusReceiptFiles, setStatusReceiptFiles] = useState<File[]>([]);
  const [rowStatusOverrides, setRowStatusOverrides] = useState<
    Record<string, { status: AdvanceStatus; adminMessage: string; receiptRef?: string }>
  >({});

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-advance-action-menu="true"]')) return;
      if (target.closest('[data-advance-action-trigger="true"]')) return;
      setMenuOpenForId(null);
      setMenuPosition(null);
    };

    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  const openRowActionsMenu = (event: React.MouseEvent<HTMLButtonElement>, rowId: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const viewportPadding = 8;
    const desiredLeft = rect.right - menuWidth;
    const clampedLeft = Math.max(
      viewportPadding,
      Math.min(desiredLeft, window.innerWidth - menuWidth - viewportPadding)
    );

    setMenuPosition({
      top: rect.bottom + 6,
      left: clampedLeft,
    });
    setMenuOpenForId((prev) => (prev === rowId ? null : rowId));
  };

  const rows = useMemo<AdvanceRow[]>(() => {
    return advances.map((advance: Advance, index) => {
      const rawDate = (advance.createdAt || advance.created_at || new Date().toISOString()).toString();
      return {
        id: advance._id || `ADV-${index + 1}`,
        date: displayDate(rawDate),
        amount: Number(advance.amount) || 0,
        currency: (advance.currency || 'USD').toUpperCase(),
        type: normalizeType(advance.advance_type || ''),
        status:
          rowStatusOverrides[advance._id || `ADV-${index + 1}`]?.status ||
          normalizeStatus(advance.repayment_status || ''),
        artist: advance.advance_source_name?.trim() || 'Unknown Artist',
        purpose: advance.purpose?.trim() || 'No purpose provided.',
        accountNumber: '0432568913',
        bank: 'GTBank',
        accountName: advance.advance_source_name?.trim() || 'N/A',
        adminInCharge: 'Record Label Admin',
        adminMessage:
          rowStatusOverrides[advance._id || `ADV-${index + 1}`]?.adminMessage ||
          'No admin message yet.',
        receiptRef:
          rowStatusOverrides[advance._id || `ADV-${index + 1}`]?.receiptRef ||
          (advance.proof_of_payment?.split('/').pop() || 'Transaction Rec..'),
        rawDateIso: rawDate,
        repaidAmount: Number(advance.repaid_amount) || 0,
      };
    });
  }, [advances, rowStatusOverrides]);

  const resetStatusModal = () => {
    setStatusUpdate('');
    setStatusDescription('');
    setStatusReceiptFiles([]);
  };

  const openStatusModal = (row: AdvanceRow) => {
    setStatusRow(row);
    setStatusUpdate(row.status === 'Rejected' ? 'rejected' : 'approved');
    setStatusDescription('');
    setStatusReceiptFiles([]);
    setMenuOpenForId(null);
  };

  const submitStatusUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!statusRow) return;
    if (!statusUpdate) {
      toast.error('Select a status to continue');
      return;
    }
    if (!statusDescription.trim()) {
      toast.error('Description is required');
      return;
    }
    if (statusUpdate === 'rejected' && statusReceiptFiles.length === 0) {
      toast.error('Upload receipt is required for rejected status');
      return;
    }

    const receiptRef = statusReceiptFiles[0]?.name;
    setRowStatusOverrides((prev) => ({
      ...prev,
      [statusRow.id]: {
        status: statusUpdate === 'approved' ? 'Approved' : 'Rejected',
        adminMessage: statusDescription.trim(),
        receiptRef,
      },
    }));
    toast.success('Status updated successfully');
    setStatusRow(null);
    resetStatusModal();
  };

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
                          <div className="relative flex items-center justify-end gap-2 text-[#9C9C9C]">
                            <button
                              type="button"
                              className="hover:text-[#7B00D4]"
                              aria-label="Comments"
                              onClick={() => setDetailsRow(row)}
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
                              data-advance-action-trigger="true"
                              onClick={(event) => openRowActionsMenu(event, row.id)}
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

      {menuOpenForId && menuPosition
        ? createPortal(
            <div
              data-advance-action-menu="true"
              style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left }}
              className="z-[130] w-[220px] rounded-xl border border-[#E2E2E2] bg-white p-2 shadow-lg"
            >
              {(() => {
                const menuRow = filtered.find((row) => row.id === menuOpenForId);
                if (!menuRow) return null;

                return (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsRow(menuRow);
                        setMenuOpenForId(null);
                        setMenuPosition(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#494F59] hover:bg-[#F6F7F9]"
                    >
                      <ArrowUpDown className="h-4 w-4 rotate-90 text-[#97A0AF]" />
                      <span className="font-medium">Advance details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        openStatusModal(menuRow);
                        setMenuPosition(null);
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#494F59] hover:bg-[#F6F7F9]"
                    >
                      <RefreshCcw className="h-4 w-4 text-[#97A0AF]" />
                      <span className="font-medium">Update status</span>
                    </button>
                  </>
                );
              })()}
            </div>,
            document.body,
          )
        : null}

      <Modal
        open={Boolean(statusRow)}
        onClose={() => {
          setStatusRow(null);
          resetStatusModal();
        }}
        headerVariant="none"
        closeVariant="island"
        size="md"
      >
        <div className="m-5 rounded-3xl border border-[#DBDBDB] bg-white p-6">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full bg-[#F3E6FF]" />
          <h3 className="text-center text-3xl font-medium text-[#222222]">Status Update</h3>
          <p className="mt-1 text-center text-sm text-[#9C9C9C]">
            Fill out form to update artist advance request.
          </p>

          <form className="mt-5 space-y-4" onSubmit={submitStatusUpdate}>
            <div>
              <label className="text-xs font-medium text-[#2D2D2D]">Status</label>
              <div className="mt-1">
                <Select
                  value={statusUpdate}
                  onChange={(value) => setStatusUpdate(value as UpdateStatusValue)}
                  options={UPDATE_STATUS_OPTIONS}
                  placeholder="Select status"
                  className="h-10 rounded-xl border border-[#B9B9B9] bg-white text-sm"
                />
              </div>
            </div>

            {statusUpdate === 'rejected' && (
              <div>
                <label className="text-xs font-medium text-[#2D2D2D]">Upload receipt</label>
                <div className="mt-1">
                  <FileDropzone onFiles={(files) => setStatusReceiptFiles(files)} className="bg-white" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-[#2D2D2D]">Description</label>
              <textarea
                rows={5}
                placeholder="Enter expenses description"
                className="mt-1 w-full resize-none rounded-xl border border-[#B9B9B9] bg-white px-3 py-2 text-sm text-[#3C3C3C] outline-none placeholder:text-[#B0B0B0]"
                value={statusDescription}
                onChange={(event) => setStatusDescription(event.target.value)}
              />
            </div>

            <button
              type="submit"
              className="mt-1 h-10 w-full rounded-xl bg-[#7B00D4] text-sm font-medium text-white"
            >
              Submit
            </button>
          </form>
        </div>
      </Modal>

      <Modal
        open={Boolean(detailsRow)}
        onClose={() => setDetailsRow(null)}
        headerVariant="none"
        closeVariant="island"
        size="xl"
      >
        {detailsRow && (
          <div className="overflow-hidden rounded-3xl border border-[#D5D5D5]">
            <div className="border-b border-[#D5D5D5] bg-[#FAFAFA] px-4 py-2 text-sm text-[#3F3F3F]">
              Advance details / {detailsRow.id}
            </div>

            <div className="p-4">
              <p className="text-[40px] font-semibold leading-none text-[#2F2F2F]">
                {formatCurrencyAmount(detailsRow.amount, detailsRow.currency)}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-[#4E4E4E]">
                <p className="text-[15px] text-[#808080]">Transaction Id</p>
                <p className="text-base">{detailsRow.id}</p>

                <p className="text-[15px] text-[#808080]">Date</p>
                <p className="text-base">{detailsRow.date}</p>

                <p className="text-[15px] text-[#808080]">Status</p>
                <div>
                  <StatusPill label={detailsRow.status} />
                </div>

                <p className="text-[15px] text-[#808080]">Advance Type</p>
                <p className="text-base">{detailsRow.type}</p>

                <p className="text-[15px] text-[#808080]">Account Number</p>
                <p className="text-base">{detailsRow.accountNumber}</p>

                <p className="text-[15px] text-[#808080]">Bank</p>
                <p className="text-base">{detailsRow.bank}</p>

                <p className="text-[15px] text-[#808080]">Account Name</p>
                <p className="text-base">{detailsRow.accountName}</p>

                <p className="text-[15px] text-[#808080]">Receipt</p>
                <p className="text-base">{detailsRow.receiptRef}</p>

                <p className="text-[15px] text-[#808080]">Purpose</p>
                <p className="text-base line-clamp-3">{detailsRow.purpose}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RecordLabelAdvance;
