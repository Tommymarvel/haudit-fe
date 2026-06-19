'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Select } from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import YearFilterCalendar from '@/components/ui/YearFilterCalendar';
import Image from 'next/image';
import {
  ArrowUpDown,
  CheckCheck,
  FileText,
  FileUp,
  Hourglass,
  MoreVertical,
  Search,
  Upload,
  WalletCards,
  X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import axiosInstance from '@/lib/axiosinstance';
import { useAdvance } from '@/hooks/useAdvance';
import { useExpenses } from '@/hooks/useExpenses';
import { Advance } from '@/lib/types/advance';
import { useRecordLabelArtists } from '@/hooks/useRecordLabelArtists';
import { getRecordLabelArtistName } from '@/lib/utils/recordLabelArtist';
import { deriveSingleCurrency, formatCurrencyAmount } from '@/lib/utils/currency';
import { Pagination } from '@/components/ui/Pagination';
import { toast } from 'react-toastify';

type AdvanceTab = 'analytics' | 'request';
type AdvanceType = 'Personal' | 'Marketing';
type AdvanceStatus = 'Paid' | 'Pending' | 'Approved' | 'Rejected';
type UpdateStatusValue = 'pending' | 'approved' | 'rejected';

type AdvanceRow = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  type: AdvanceType;
  status: AdvanceStatus;
  initiatedBy: string;
  artist: string;
  purpose: string;
  rawDateIso: string;
  repaidAmount: number;
};

function getStatusLabel(status: AdvanceStatus, initiatedBy: string): string {
  if (status === 'Pending') {
    return initiatedBy === 'label' ? 'Awaiting Artist' : 'Awaiting Approval';
  }
  return status;
}

const UPDATE_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const CATEGORY_FILTER_OPTIONS = [
  { label: 'All categories', value: 'all' },
  { label: 'Personal', value: 'Personal' },
  { label: 'Marketing', value: 'Marketing' },
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type ChartPoint = { label: string; date: string; value: number };

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
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/ /g, '-');
}


function mapApiTrendToSeries(trend: Array<{ date: string; totalUSD: number }> | undefined): ChartPoint[] {
  if (!trend?.length) return [];
  return trend.map((point) => ({
    label: new Date(point.date).toLocaleDateString('en-US', { month: 'short' }),
    date: point.date,
    value: Number(point.totalUSD) || 0,
  }));
}

function MetricCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#D5D5D5] bg-white p-4">
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
  const { advances = [], marketingTrend, personalTrend, updateAdvanceStatus } = useAdvance();
  const { expenses } = useExpenses();
  const { artists } = useRecordLabelArtists();
  const searchParams = useSearchParams();
  const selectedArtistId = (searchParams.get('artistId') || '').trim();
  const hasSelectedArtist = selectedArtistId.length > 0;
  const selectedArtistName = useMemo(() => {
    if (!selectedArtistId) return '';
    const artist = artists.find((item) => (item.id || item._id || '').toString().trim() === selectedArtistId);
    return getRecordLabelArtistName(artist || {}) || 'selected artist';
  }, [artists, selectedArtistId]);

  const [tab, setTab] = useState<AdvanceTab>('analytics');
  const [q, setQ] = useState('');
  const [loggedByFilter, setLoggedByFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [detailsRow, setDetailsRow] = useState<AdvanceRow | null>(null);
  const [expandedPurpose, setExpandedPurpose] = useState(false);
  const [statusRow, setStatusRow] = useState<AdvanceRow | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<UpdateStatusValue>('pending');
  const [statusDescription, setStatusDescription] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [rowStatusOverrides, setRowStatusOverrides] = useState<Record<string, AdvanceStatus>>({});

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
    const menuWidth = 200;
    const vp = 8;
    const left = Math.max(vp, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - vp));
    setMenuPosition({ top: rect.bottom + 6, left });
    setMenuOpenForId((prev) => (prev === rowId ? null : rowId));
  };

  const rows = useMemo<AdvanceRow[]>(() => {
    return advances.map((advance: Advance, index) => {
      const rawDate = (advance.createdAt || advance.created_at || new Date().toISOString()).toString();
      const id = advance._id || `ADV-${index + 1}`;
      const approvalStatus = normalizeStatus(advance.status || advance.repayment_status || '');
      return {
        id,
        date: displayDate(rawDate),
        amount: Number(advance.amount) || 0,
        currency: (advance.currency || 'USD').toUpperCase(),
        type: normalizeType(advance.advance_type || ''),
        status: rowStatusOverrides[id] || approvalStatus,
        initiatedBy: advance.initiated_by || 'artist',
        artist: advance.advance_source_name?.trim() || 'Unknown Artist',
        purpose: advance.purpose?.trim() || 'No purpose provided.',
        rawDateIso: rawDate,
        repaidAmount: Number(advance.repaid_amount) || 0,
      };
    });
  }, [advances, rowStatusOverrides]);

  const rowCurrency = useMemo(() => deriveSingleCurrency(rows.map((r) => r.currency), 'USD'), [rows]);

  const scopedRows = useMemo(() => rows, [rows]);

  const scopedSummary = useMemo(() => {
    const totalRequests = scopedRows.length;
    const pendingRequests = scopedRows.filter((r) => r.status === 'Pending').length;
    const approvedRows = scopedRows.filter((r) => r.status === 'Approved');
    const totalAmount = approvedRows.reduce((sum, r) => sum + r.amount, 0);
    const personalTotal = approvedRows.filter((r) => r.type === 'Personal').reduce((s, r) => s + r.amount, 0);
    const marketingTotal = approvedRows.filter((r) => r.type === 'Marketing').reduce((s, r) => s + r.amount, 0);
    return { totalRequests, pendingRequests, totalAmount, personalTotal, marketingTotal };
  }, [scopedRows]);

  // Trend endpoints are already artistId-scoped — always use their totalUSD values
  const personalTotalUSD = useMemo(
    () => (personalTrend ?? []).reduce((s, p) => s + Number(p.totalUSD || 0), 0),
    [personalTrend],
  );
  const marketingTotalUSD = useMemo(
    () => (marketingTrend ?? []).reduce((s, m) => s + Number(m.totalUSD || 0), 0),
    [marketingTrend],
  );
  const totalAdvance = personalTotalUSD + marketingTotalUSD;

  const metrics = [
    { value: scopedSummary.totalRequests.toLocaleString(), label: 'Total request', icon: <CheckCheck className="h-4 w-4" /> },
    { value: scopedSummary.pendingRequests.toLocaleString(), label: 'Pending request', icon: <Hourglass className="h-4 w-4" /> },
    { value: formatCurrencyAmount(totalAdvance, 'USD'), label: 'Given Advance', icon: <WalletCards className="h-4 w-4" /> },
  ];

  const personalSeries = useMemo(() => mapApiTrendToSeries(personalTrend), [personalTrend]);
  const marketingSeries = useMemo(() => mapApiTrendToSeries(marketingTrend), [marketingTrend]);

  // Build dual-line expenses trend (recoupable vs non-recoupable)
  const expensesTrendData = useMemo(() => {
    const rec = new Array<number>(12).fill(0);
    const nonRec = new Array<number>(12).fill(0);
    (expenses ?? []).forEach((exp) => {
      const month = new Date((exp as { expense_date?: string }).expense_date || (exp as { createdAt?: string }).createdAt || Date.now()).getMonth();
      const amt = Number((exp as { amount?: number }).amount) || 0;
      const recoupable = ((exp as { recoupable?: string }).recoupable || '').toLowerCase();
      if (recoupable === 'yes') rec[month] += amt;
      else nonRec[month] += amt;
    });
    const year = new Date().getFullYear();
    return MONTH_LABELS.map((label, i) => ({
      label,
      date: `${year}-${String(i + 1).padStart(2, '0')}-01`,
      recoupable: rec[i],
      nonRecoupable: nonRec[i],
    }));
  }, [expenses]);

  const totalRecoupable = useMemo(() => expensesTrendData.reduce((s, d) => s + d.recoupable, 0), [expensesTrendData]);
  const totalNonRecoupable = useMemo(() => expensesTrendData.reduce((s, d) => s + d.nonRecoupable, 0), [expensesTrendData]);

  // Logged-by options derived from row artists
  const loggedByOptions = useMemo(() => {
    const unique = Array.from(new Set(scopedRows.map((r) => r.artist)));
    return [{ label: 'Logged by', value: 'all' }, ...unique.map((a) => ({ label: a, value: a }))];
  }, [scopedRows]);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return scopedRows.filter((row) => {
      const categoryOk = categoryFilter === 'all' || row.type === categoryFilter;
      const loggedOk = loggedByFilter === 'all' || row.artist === loggedByFilter;
      const keywordOk =
        keyword === '' ||
        row.id.toLowerCase().includes(keyword) ||
        row.artist.toLowerCase().includes(keyword) ||
        row.type.toLowerCase().includes(keyword) ||
        row.purpose.toLowerCase().includes(keyword);
      return categoryOk && loggedOk && keywordOk;
    });
  }, [q, scopedRows, categoryFilter, loggedByFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedFiltered = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetStatusModal = () => {
    setStatusUpdate('pending');
    setStatusDescription('');
    setReceiptFile(null);
  };

  const openStatusModal = (row: AdvanceRow) => {
    setStatusRow(row);
    setStatusUpdate(row.status.toLowerCase() as UpdateStatusValue);
    setStatusDescription('');
    setMenuOpenForId(null);
  };

  const submitStatusUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!statusRow || isUpdatingStatus) return;
    if (!statusDescription.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!receiptFile) {
      toast.error('Receipt is required');
      return;
    }
    try {
      setIsUpdatingStatus(true);
      let receiptUrl: string | undefined;
      if (receiptFile) {
        const fd = new FormData();
        fd.append('file', receiptFile);
        fd.append('folderType', 'advance');
        const { data } = await axiosInstance.post('/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        receiptUrl = data?.secure_url;
      }
      await updateAdvanceStatus(statusRow.id, {
        status: statusUpdate,
        status_desc: statusDescription.trim(),
        ...(receiptUrl && { advance_paid_receipt: receiptUrl }),
      });
      const newStatus: AdvanceStatus =
        statusUpdate === 'approved' ? 'Approved' :
        statusUpdate === 'rejected' ? 'Rejected' : 'Pending';
      setRowStatusOverrides((prev) => ({ ...prev, [statusRow.id]: newStatus }));
      setStatusRow(null);
      resetStatusModal();
    } catch {
      // toast already shown by hook
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-medium text-[#3C3C3C]">Welcome to Advance-O-Meter</h1>
          <p className="text-base text-[#777777]">
            Track and get more info on{' '}
            {hasSelectedArtist ? (
              <span className="font-medium text-[#7B00D4]">{selectedArtistName}&rsquo;s</span>
            ) : 'your'}{' '}
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

      {/* Metric cards — always visible above tabs */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {metrics.map((m) => (
          <MetricCard key={m.label} value={m.value} label={m.label} icon={m.icon} />
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-5 border-b border-[#DFDFDF]">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setTab('analytics')}
            className={`pb-2 font-bold ${tab === 'analytics' ? 'border-b-2 border-[#7B00D4] text-[#7B00D4]' : 'text-[#999999]'}`}
          >
            Analytics
          </button>
          <button
            type="button"
            onClick={() => setTab('request')}
            className={`pb-2 font-bold ${tab === 'request' ? 'border-b-2 border-[#7B00D4] text-[#7B00D4]' : 'text-[#999999]'}`}
          >
            Advance Request{' '}
            <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[#E53935] align-top" />
          </button>
        </div>
      </div>

      {tab === 'analytics' && (
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
                  <div className="flex items-center gap-1 text-[12px] text-[#AAAAAA]">
                    <span className="h-2 w-[2px] rounded bg-[#7B00D4]" />
                    Total personal advance
                  </div>
                  <p className="mt-1 text-[20px] font-medium text-[#3C3C3C]">
                    {formatCurrencyAmount(personalTotalUSD, 'USD')}
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
                  <div className="flex items-center gap-1 text-[12px] text-[#AAAAAA]">
                    <span className="h-2 w-[2px] rounded bg-[#00AA39]" />
                    Total marketing advance
                  </div>
                  <p className="mt-1 text-[20px] font-medium text-[#3C3C3C]">
                    {formatCurrencyAmount(marketingTotalUSD, 'USD')}
                  </p>
                </div>
              }
            />
          </div>

          <ChartCard
            title="Expenses Trend"
            variant="line"
            data={expensesTrendData}
            xKey="label"
            series={[
              { key: 'nonRecoupable', label: 'Non Recoupable Expenses', color: '#7B00D4' },
              { key: 'recoupable', label: 'Recoupable Expenses', color: '#00AA39' },
            ]}
            bandFill="#F4F4F4"
            lineType="monotone"
            chartMarginTop={48}
            chartOverlay={
              <div className="flex items-center gap-8 leading-none">
                <div>
                  <div className="flex items-center gap-1 text-[12px] text-[#AAAAAA]">
                    <span className="h-2 w-[2px] rounded bg-[#7B00D4]" />
                    Non Recoupable Expenses
                  </div>
                  <p className="mt-1 text-[20px] font-medium text-[#3C3C3C]">
                    {formatCurrencyAmount(totalNonRecoupable, rowCurrency)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[12px] text-[#AAAAAA]">
                    <span className="h-2 w-[2px] rounded bg-[#00AA39]" />
                    Recoupable Expenses
                  </div>
                  <p className="mt-1 text-[20px] font-medium text-[#3C3C3C]">
                    {formatCurrencyAmount(totalRecoupable, rowCurrency)}
                  </p>
                </div>
              </div>
            }
          />
        </div>
      )}

      {/* Advance Request tab */}
      {tab === 'request' && (
        <Card className="mt-5 overflow-hidden">
          <CardBody className="p-0!">
            <div className="flex flex-col items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3 lg:flex-row lg:items-center">
              <div className="text-sm font-semibold text-[#3C3C3C]">Advance Request</div>
              <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
                <div className="relative w-full sm:w-[220px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0B0B0]" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search expense"
                    className="h-8 w-full rounded-xl border border-neutral-200 bg-[#F6F6F6] pl-9 pr-3 text-xs text-[#6C6C6C] outline-none"
                  />
                </div>
                <Select
                  value={loggedByFilter}
                  onChange={setLoggedByFilter}
                  className="h-8 min-w-[130px] bg-white text-xs"
                  options={loggedByOptions}
                />
                <Select
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  className="h-8 min-w-[140px] bg-white text-xs"
                  options={CATEGORY_FILTER_OPTIONS}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="bg-[#F4F4F4] text-[14px] font-medium text-[#6F6F6F]">
                  <tr>
                    <th className="px-4 py-3">Transaction</th>
                    <th className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        Date <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA] text-sm text-[#4E4E4E]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-sm text-[#8A8A8A]">
                        No advance requests found.
                      </td>
                    </tr>
                  ) : (
                    pagedFiltered.map((row, index) => (
                      <tr key={`${row.id}-${index}`}>
                        <td className="px-4 py-3 whitespace-nowrap">{row.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.type}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusPill label={getStatusLabel(row.status, row.initiatedBy)} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatCurrencyAmount(row.amount, row.currency)}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3" title={row.purpose}>
                          {row.purpose}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            data-advance-action-trigger="true"
                            onClick={(e) => openRowActionsMenu(e, row.id)}
                            className="text-[#9C9C9C] hover:text-[#7B00D4]"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </CardBody>
        </Card>
      )}

      {/* Row actions menu portal */}
      {menuOpenForId && menuPosition
        ? createPortal(
            <div
              data-advance-action-menu="true"
              style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left }}
              className="z-[130] w-[200px] rounded-xl border border-[#E2E2E2] bg-white p-2 shadow-lg"
            >
              {(() => {
                const menuRow = filtered.find((r) => r.id === menuOpenForId);
                if (!menuRow) return null;
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => { setDetailsRow(menuRow); setMenuOpenForId(null); setMenuPosition(null); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#494F59] hover:bg-[#F6F7F9]"
                    >
                      <span className="font-medium">View details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { openStatusModal(menuRow); setMenuPosition(null); }}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#494F59] hover:bg-[#F6F7F9]"
                    >
                      <span className="font-medium">Update status</span>
                    </button>
                  </>
                );
              })()}
            </div>,
            document.body
          )
        : null}

      {/* Funding request details modal */}
      <Modal
        open={Boolean(detailsRow)}
        onClose={() => { setDetailsRow(null); setExpandedPurpose(false); }}
        headerVariant="none"
        closeVariant="island"
        size="md"
      >
        {detailsRow && (
          <div className="overflow-hidden rounded-3xl border border-[#DBDBDB] bg-white">
            <div className="flex items-center justify-between border-b border-[#DBDBDB] bg-[#FAFAFA] px-4 py-3">
              <p className="text-sm text-[#3F3F3F]">Funding request / {detailsRow.id}</p>
              <button
                type="button"
                onClick={() => { openStatusModal(detailsRow); setDetailsRow(null); }}
                className="rounded-full bg-[#7B00D4] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#6A00B8]"
              >
                Update status
              </button>
            </div>

            <div className="p-5">
              <p className="text-[40px] font-semibold leading-none text-[#2F2F2F]">
                {formatCurrencyAmount(detailsRow.amount, detailsRow.currency)}
              </p>

              <div className="mt-5 space-y-3">
                {[
                  { label: 'Transaction Id', value: detailsRow.id },
                  { label: 'Date', value: detailsRow.date },
                ].map(({ label, value }) => (
                  <div key={label} className="grid grid-cols-2 gap-4">
                    <p className="text-[14px] text-[#808080]">{label}</p>
                    <p className="text-[14px] text-[#3C3C3C]">{value}</p>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-4">
                  <p className="text-[14px] text-[#808080]">Status</p>
                  <div><StatusPill label={getStatusLabel(detailsRow.status, detailsRow.initiatedBy)} /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <p className="text-[14px] text-[#808080]">Advance Type</p>
                  <p className="text-[14px] text-[#3C3C3C]">{detailsRow.type}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <p className="text-[14px] text-[#808080]">Purpose</p>
                  <div>
                    <p className={`text-[14px] text-[#3C3C3C] ${expandedPurpose ? '' : 'line-clamp-3'}`}>
                      {detailsRow.purpose}
                    </p>
                    {detailsRow.purpose.length > 120 && (
                      <button
                        type="button"
                        onClick={() => setExpandedPurpose((p) => !p)}
                        className="mt-0.5 text-xs font-medium text-[#7B00D4]"
                      >
                        {expandedPurpose ? 'See less' : 'See more'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Update modal */}
      <Modal
        open={Boolean(statusRow)}
        onClose={() => { setStatusRow(null); resetStatusModal(); }}
        headerVariant="none"
        closeVariant="island"
        size="md"
      >
        <div className="m-5 rounded-3xl border border-[#DBDBDB] bg-white p-6">
          <div className="flex justify-center">
            <Image src="/haudit-logo.svg" alt="Haudit" width={44} height={44} />
          </div>
          <h3 className="mt-3 text-center text-2xl font-medium text-[#222222]">Status Update</h3>
          <p className="mt-1 text-center text-sm text-[#9C9C9C]">
            Fill out form to update artist advance request.
          </p>

          <form className="mt-5 space-y-4" onSubmit={submitStatusUpdate}>
            <div>
              <label className="text-sm font-medium text-[#2D2D2D]">Status</label>
              <div className="mt-1.5">
                <Select
                  value={statusUpdate}
                  onChange={(v) => setStatusUpdate(v as UpdateStatusValue)}
                  options={UPDATE_STATUS_OPTIONS}
                  placeholder="Select status"
                  className="h-11 rounded-xl border border-[#B9B9B9] bg-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#2D2D2D]">Receipt</label>
              {receiptFile ? (
                <div className="mt-1.5 flex items-center justify-between rounded-xl border border-[#B9B9B9] bg-[#F9F9F9] px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-[#7B00D4]" />
                    <span className="truncate text-sm text-[#3C3C3C]">{receiptFile.name}</span>
                  </div>
                  <button type="button" onClick={() => setReceiptFile(null)} className="ml-2 shrink-0 text-[#B0B0B0] hover:text-rose-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D5D5D5] py-4 text-sm text-[#9C9C9C] transition hover:border-[#7B00D4] hover:text-[#7B00D4]">
                  <Upload className="h-4 w-4" />
                  Click to upload receipt
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)} />
                </label>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-[#2D2D2D]">Description</label>
              <textarea
                rows={4}
                placeholder="Enter expenses description"
                className="mt-1.5 w-full resize-none rounded-xl border border-[#B9B9B9] bg-white px-3 py-2.5 text-sm text-[#3C3C3C] outline-none placeholder:text-[#B0B0B0]"
                value={statusDescription}
                onChange={(e) => setStatusDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingStatus}
              className="h-11 w-full rounded-xl bg-[#7B00D4] text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdatingStatus ? 'Updating…' : 'Submit'}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default RecordLabelAdvance;
