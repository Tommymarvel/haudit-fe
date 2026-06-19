'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Calendar,
  ChevronDown,
  CircleDollarSign,
  Download,
  DollarSign,
  FileText,
  MoreVertical,
  RefreshCcw,
  Search,
  TrendingUp,
  Upload,
  WalletCards,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { Select } from '@/components/ui/Select';
import YearFilterCalendar from '@/components/ui/YearFilterCalendar';
import Modal from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { useAdvance } from '@/hooks/useAdvance';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND } from '@/lib/brand';
import { toast } from 'react-toastify';
import axiosInstance from '@/lib/axiosinstance';
import {
  deriveSingleCurrency,
  formatAmountInput,
  formatCurrencyAmount,
  parseAmountInput,
} from '@/lib/utils/currency';

type LabelAdvanceStatus = 'Paid' | 'Pending' | 'Approved' | 'Rejected';
type LabelAdvanceType = 'Personal' | 'Marketing';

type AdvanceRow = {
  id: string;
  refId: string;
  date: string;
  amount: number;
  currency: string;
  type: LabelAdvanceType;
  status: LabelAdvanceStatus;
  initiatedBy: string;
  purpose: string;
  accountNumber: string;
  bank: string;
  accountName: string;
  adminInCharge: string;
  adminMessage: string;
  receiptRef: string;
};

function getStatusLabel(status: LabelAdvanceStatus, initiatedBy: string): string {
  if (status === 'Pending') {
    return initiatedBy === 'label' ? 'Awaiting Artist' : 'Awaiting Approval';
  }
  return status;
}

type RequestFormState = {
  date: string;
  amount: string;
  currency: 'USD' | 'NGN';
  advanceType: 'personal' | 'marketting';
  purpose: string;
};

const CATEGORY_OPTIONS = [
  { label: 'All categories', value: 'all' },
  { label: 'Personal', value: 'personal' },
  { label: 'Marketing', value: 'marketing' },
];

const ADVANCE_TYPE_OPTIONS = [
  { label: 'Personal', value: 'personal' },
  { label: 'Marketing', value: 'marketting' },
];


const CURRENCY_OPTIONS = [
  { label: 'NGN', value: 'NGN' },
  { label: 'USD', value: 'USD' },
];

function normalizeStatus(rawStatus: string): LabelAdvanceStatus {
  const key = rawStatus.trim().toLowerCase();
  if (key === 'repaid' || key === 'paid') return 'Paid';
  if (key === 'approved') return 'Approved';
  if (key === 'rejected') return 'Rejected';
  return 'Pending';
}

function normalizeType(rawType: string): LabelAdvanceType {
  const key = rawType.trim().toLowerCase();
  return key === 'marketting' || key === 'marketing' ? 'Marketing' : 'Personal';
}

function buildInitialRequestForm(): RequestFormState {
  return {
    date: '',
    amount: '',
    currency: 'NGN',
    advanceType: 'personal',
    purpose: '',
  };
}

function AdvanceDualCard({
  personalValue,
  marketingValue,
}: {
  personalValue: string;
  marketingValue: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#D8D8D8] bg-white">
      <div className="flex items-center gap-4 px-5 py-5">
        {/* Personal */}
        <div className="flex-1 min-w-0">
          <p className="text-[32px] font-semibold leading-none text-[#3C3C3C]">{personalValue}</p>
          <div className="mt-2 flex items-center gap-2 text-[13px] text-[#7A7A7A]">
            <span className="h-4 w-[3px] shrink-0 rounded-full bg-[#7B00D4]" />
            Available Personal Advance
          </div>
        </div>

        {/* Center icon */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ECECEC] bg-[#FBFBFB] text-[#7B00D4]">
          <WalletCards className="h-5 w-5" />
        </div>

        {/* Marketing */}
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[32px] font-semibold leading-none text-[#3C3C3C]">{marketingValue}</p>
          <div className="mt-2 flex items-center justify-end gap-2 text-[13px] text-[#7A7A7A]">
            Available Marketing Advance
            <span className="h-4 w-[3px] shrink-0 rounded-full bg-[#00B241]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SmallMetricCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#D8D8D8] bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[26px] font-semibold leading-none text-[#3C3C3C]">{value}</p>
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E8E8E8] text-[#7B00D4]">
          {icon}
        </div>
      </div>
      <p className="mt-2 text-[13px] leading-[120%] text-[#7A7A7A]">{label}</p>
    </div>
  );
}

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[#F2F2F2] last:border-0">
      <div className="flex items-center gap-2 text-[13px] text-[#888]">
        <span className="text-[#ABABAB]">{icon}</span>
        {label}
      </div>
      <span className="text-[13px] font-medium text-[#2F2F2F] text-right max-w-[55%]">{value}</span>
    </div>
  );
}

const INPUT_CLASS =
  'h-10 w-full rounded-xl border border-[#B9B9B9] bg-white px-3 text-sm text-[#3C3C3C] outline-none placeholder:text-[#B0B0B0]';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function LabelArtistAdvance() {
  const { user } = useAuth();
  const { advances, overview, marketingTrend, personalTrend, createAdvance, updateAdvanceStatus } = useAdvance();
  const { expenses } = useExpenses();

  const [activeTab, setActiveTab] = useState<'analytics' | 'advance_request'>('analytics');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [openRequestModal, setOpenRequestModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AdvanceRow | null>(null);
  const [expandPurpose, setExpandPurpose] = useState(false);
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [statusRow, setStatusRow] = useState<AdvanceRow | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [statusDescription, setStatusDescription] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-advance-row-menu="true"]')) return;
      if (target.closest('[data-advance-portal-menu="true"]')) return;
      setMenuOpenForId(null);
      setMenuPosition(null);
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  const artistName = user?.first_name?.trim() || 'Diamond';

  const [requestForm, setRequestForm] = useState<RequestFormState>(() =>
    buildInitialRequestForm(),
  );

  const apiRows = useMemo<AdvanceRow[]>(() => {
    if (!advances?.length) return [];
    return advances.map((advance, index) => {
      const rowId = advance._id || `ADV-${index + 1}`;
      const refId = (advance as { ref_id?: string; transaction_id?: string }).ref_id ||
        (advance as { ref_id?: string; transaction_id?: string }).transaction_id ||
        rowId;
      return {
        id: rowId,
        refId,
        date: new Date((advance.createdAt || advance.created_at || new Date()).toString())
          .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          .replace(/ /g, '-'),
        amount: Number(advance.amount) || 0,
        currency: (advance.currency || 'USD').toUpperCase(),
        type: normalizeType(advance.advance_type || ''),
        status: normalizeStatus(advance.status || advance.repayment_status || ''),
        initiatedBy: advance.initiated_by || 'artist',
        purpose: advance.purpose || 'No purpose was provided for this request.',
        accountNumber: '0432568913',
        bank: 'GTBank',
        accountName: displayName || 'Samuel Oyebowo',
        adminInCharge: 'Joseph Nasiu',
        adminMessage: 'Request approved. The payment will be initiated within 24 hours after compliance checks.',
        receiptRef: 'Transaction Receipt',
      };
    });
  }, [advances, displayName]);

  const rows = apiRows;
  const rowCurrency = useMemo(
    () => deriveSingleCurrency(rows.map((r) => r.currency), 'USD'),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return rows.filter((row) => {
      const statusMatch = statusFilter === 'all' || row.status.toLowerCase() === statusFilter;
      const categoryMatch =
        categoryFilter === 'all' || row.type.toLowerCase() === categoryFilter.toLowerCase();
      const keywordMatch =
        keyword === '' ||
        row.refId.toLowerCase().includes(keyword) ||
        row.type.toLowerCase().includes(keyword) ||
        row.purpose.toLowerCase().includes(keyword);
      return statusMatch && categoryMatch && keywordMatch;
    });
  }, [rows, search, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const marketingSeries = useMemo(() => {
    if (!marketingTrend?.length) return [];
    return marketingTrend.map((p) => ({
      label: new Date(p.date).toLocaleDateString('en-US', { month: 'short' }),
      date: p.date,
      value: p.totalUSD,
    }));
  }, [marketingTrend]);

  const personalSeries = useMemo(() => {
    if (!personalTrend?.length) return [];
    return personalTrend.map((p) => ({
      label: new Date(p.date).toLocaleDateString('en-US', { month: 'short' }),
      date: p.date,
      value: p.totalUSD,
    }));
  }, [personalTrend]);


  const expensesTrendData = useMemo(() => {
    const rec = new Array<number>(12).fill(0);
    const nonRec = new Array<number>(12).fill(0);
    (expenses ?? []).forEach((exp) => {
      const month = new Date((exp as { expense_date?: string }).expense_date || exp.createdAt || Date.now()).getMonth();
      const amt = Number(exp.amount) || 0;
      const recoupable = ((exp as { recoupable?: string }).recoupable || '').toLowerCase();
      if (recoupable === 'yes') rec[month] += amt; else nonRec[month] += amt;
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

  // Trend endpoints return totalUSD (currency-normalized) — always use them
  const personalTotalUSD = useMemo(
    () => (personalTrend ?? []).reduce((s, p) => s + Number(p.totalUSD || 0), 0),
    [personalTrend],
  );
  const marketingTotalUSD = useMemo(
    () => (marketingTrend ?? []).reduce((s, m) => s + Number(m.totalUSD || 0), 0),
    [marketingTrend],
  );

  const topMetrics = useMemo(() => {
    const totalAdvance = personalTotalUSD + marketingTotalUSD;
    const repaidAdvance = Number(overview?.totalRepaidUSD ?? 0);
    const outstanding = Math.max(totalAdvance - repaidAdvance, 0);
    return { totalAdvance, repaidAdvance, outstanding };
  }, [personalTotalUSD, marketingTotalUSD, overview]);

  const openRequestForm = () => {
    setRequestForm(buildInitialRequestForm());
    setOpenRequestModal(true);
  };

  const handleRequestSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = parseAmountInput(requestForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (!requestForm.purpose.trim()) { toast.error('Purpose is required'); return; }
    try {
      setIsSubmitting(true);
      await createAdvance({
        amount,
        currency: requestForm.currency,
        advance_source_name: displayName || 'Label Artist',
        advance_source_phn: 'N/A',
        advance_source_email: user?.email || 'labelartist@haudit.dev',
        advance_type: requestForm.advanceType,
        repayment_status: 'outstanding',
        purpose: requestForm.purpose.trim(),
      });
      setOpenRequestModal(false);
      toast.success('Advance request submitted successfully');
    } catch (error) {
      console.error('Failed to submit advance request', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openStatusModal = (row: AdvanceRow) => {
    setStatusRow(row);
    setStatusUpdate(row.status.toLowerCase() as 'pending' | 'approved' | 'rejected');
    setStatusDescription('');
    setMenuOpenForId(null);
  };

  const submitStatusUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!statusRow || isUpdatingStatus) return;
    if (!statusDescription.trim()) { toast.error('Description is required'); return; }
    if (!receiptFile) { toast.error('Receipt is required'); return; }
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
      setStatusRow(null);
      setStatusDescription('');
      setReceiptFile(null);
    } catch {
      // toast shown by hook
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-medium text-[#3C3C3C]">
            Welcome to Advance-O-Meter {artistName}
          </h1>
          <p className="text-sm text-[#777777]">Track and get more info on your advance request</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <YearFilterCalendar buttonClassName="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#EAEAEA] px-4 text-sm font-medium text-[#3C3C3C]" />
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#EAEAEA] px-4 text-sm font-medium text-[#3C3C3C]"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            type="button"
            onClick={openRequestForm}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#7B00D4] px-4 text-sm font-medium text-white"
          >
            Request Advance
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="mt-5 border-b border-[#E8E8E8]">
        <div className="flex gap-6">
          {(['analytics', 'advance_request'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-[#7B00D4] text-[#7B00D4]'
                  : 'text-[#888] hover:text-[#3C3C3C]'
              }`}
            >
              {tab === 'analytics' ? 'Analytics' : 'Advance Request'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Analytics Tab ── */}
      {activeTab === 'analytics' && (
        <>
          {/* Top metric card */}
          <div className="mt-5">
            <AdvanceDualCard
              personalValue={formatCurrencyAmount(personalTotalUSD, 'USD')}
              marketingValue={formatCurrencyAmount(marketingTotalUSD, 'USD')}
            />
          </div>

          {/* Small stat cards */}
          <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <SmallMetricCard
              value={formatCurrencyAmount(topMetrics.totalAdvance, 'USD')}
              label="Total Funds Received"
              icon={<CircleDollarSign className="h-4 w-4" />}
            />
            <SmallMetricCard
              value={formatCurrencyAmount(topMetrics.repaidAdvance, 'USD')}
              label="Recouped Advance"
              icon={<RefreshCcw className="h-4 w-4" />}
            />
            <SmallMetricCard
              value={formatCurrencyAmount(topMetrics.outstanding, 'USD')}
              label="Unspent Advance"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <SmallMetricCard
              value="---"
              label="Total Expenses"
              icon={<DollarSign className="h-4 w-4" />}
            />
          </div>

          {/* Expenses Trend (dual line) */}
          <div className="mt-4">
            <ChartCard
              title="Expenses Trend"
              variant="line"
              data={expensesTrendData}
              xKey="label"
              series={[
                { key: 'nonRecoupable', label: 'Non-Recoupable', color: BRAND.purple },
                { key: 'recoupable', label: 'Recoupable', color: '#00D447' },
              ]}
              lineType="monotone"
              chartMarginTop={48}
              chartOverlay={
                <div className="flex gap-6 leading-none">
                  <div>
                    <div className="flex items-center gap-1 text-[12px] text-[#AAAAAA]">
                      <span className="h-2 w-[2px] rounded" style={{ backgroundColor: BRAND.purple }} />
                      Non-Recoupable
                    </div>
                    <p className="text-[20px] font-medium text-[#3C3C3C]">
                      {formatCurrencyAmount(totalNonRecoupable, rowCurrency)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[12px] text-[#AAAAAA]">
                      <span className="h-2 w-[2px] rounded bg-[#00D447]" />
                      Recoupable
                    </div>
                    <p className="text-[20px] font-medium text-[#3C3C3C]">
                      {formatCurrencyAmount(totalRecoupable, rowCurrency)}
                    </p>
                  </div>
                </div>
              }
            />
          </div>

          {/* Mini trend charts */}
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard
              title="Marketing advance trend"
              variant="line"
              data={marketingSeries}
              xKey="label"
              yKey="value"
              color={BRAND.purple}
              lineType="monotone"
              chartMarginTop={48}
              chartOverlay={
                <div className="flex gap-6 leading-none">
                  <div>
                    <div className="flex items-center gap-1 text-[12px] text-[#AAAAAA]">
                      <span className="h-2 w-[2px] rounded bg-[#7B00D4]" />
                      Total advance
                    </div>
                    <p className="text-[20px] font-medium text-[#3C3C3C]">
                      {formatCurrencyAmount(marketingTotalUSD, 'USD')}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[12px] text-[#AAAAAA]">
                      <span className="h-2 w-[2px] rounded bg-[#7B00D4]" />
                      Balance
                    </div>
                    <p className="text-[20px] font-medium text-[#3C3C3C]">
                      {formatCurrencyAmount(marketingTotalUSD, 'USD')}
                    </p>
                  </div>
                </div>
              }
            />
            <ChartCard
              title="Personal advance trend"
              variant="line"
              data={personalSeries}
              xKey="label"
              yKey="value"
              color="#00B241"
              lineType="monotone"
              chartMarginTop={48}
              chartOverlay={
                <div className="flex gap-6 leading-none">
                  <div>
                    <div className="flex items-center gap-1 text-[12px] text-[#AAAAAA]">
                      <span className="h-2 w-[2px] rounded bg-[#00B241]" />
                      Total advance
                    </div>
                    <p className="text-[20px] font-medium text-[#3C3C3C]">
                      {formatCurrencyAmount(personalTotalUSD, 'USD')}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[12px] text-[#AAAAAA]">
                      <span className="h-2 w-[2px] rounded bg-[#00B241]" />
                      Balance
                    </div>
                    <p className="text-[20px] font-medium text-[#3C3C3C]">
                      {formatCurrencyAmount(personalTotalUSD, 'USD')}
                    </p>
                  </div>
                </div>
              }
            />
          </div>
        </>
      )}

      {/* ── Advance Request Tab ── */}
      {activeTab === 'advance_request' && (
        <div className="mt-5">
          {/* Table header + filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-[#3C3C3C]">Advance Request</p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0B0B0]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search expense"
                  className="h-9 w-[220px] rounded-xl border border-neutral-200 bg-[#F6F6F6] pl-9 pr-3 text-xs text-[#6C6C6C] outline-none"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="h-9 min-w-[120px] bg-white text-xs"
                options={[{ label: 'Logged by', value: 'all' }]}
              />
              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
                className="h-9 min-w-[130px] bg-white text-xs"
                options={CATEGORY_OPTIONS}
              />
            </div>
          </div>

          {/* Table */}
          <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-[#F4F4F4] text-[#6F6F6F]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Transaction</th>
                    <th className="px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-1">
                        Date <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Purpose</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0] text-[#3C3C3C]">
                  {pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-sm text-[#8A8A8A]">
                        No advance requests found.
                      </td>
                    </tr>
                  ) : (
                    pagedRows.map((row, index) => (
                      <tr key={`${row.id}-${index}`} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">{row.refId}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">{row.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">{row.type}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusPill label={getStatusLabel(row.status, row.initiatedBy)} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          {formatCurrencyAmount(row.amount, row.currency)}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#5A5A5A] max-w-[180px] truncate">
                          {row.purpose}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            data-advance-row-menu="true"
                            aria-label="Row menu"
                            className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const menuWidth = 176;
                              const vp = 8;
                              const left = Math.max(vp, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - vp));
                              setMenuPosition({ top: rect.bottom + 4, left });
                              setMenuOpenForId((prev) => (prev === row.id ? null : row.id));
                            }}
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
          </div>
        </div>
      )}

      {/* ── Row actions portal ── */}
      {menuOpenForId && menuPosition
        ? createPortal(
            <div
              data-advance-portal-menu="true"
              style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left }}
              className="z-[130] w-44 rounded-xl border border-[#E3E3E3] bg-white p-1.5 shadow-lg"
            >
              {(() => {
                const menuRow = pagedRows.find((r) => r.id === menuOpenForId);
                if (!menuRow) return null;
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => { setSelectedRow(menuRow); setMenuOpenForId(null); setMenuPosition(null); }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#4A4A4A] hover:bg-[#F5F5F5]"
                    >
                      View details
                    </button>
                    <button
                      type="button"
                      onClick={() => { openStatusModal(menuRow); setMenuPosition(null); }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#4A4A4A] hover:bg-[#F5F5F5]"
                    >
                      Update status
                    </button>
                  </>
                );
              })()}
            </div>,
            document.body,
          )
        : null}

      {/* ── Request Advance Modal ── */}
      <Modal
        open={openRequestModal}
        onClose={() => setOpenRequestModal(false)}
        headerVariant="none"
        closeVariant="island"
        size="md"
      >
        <div className="px-6 py-6 sm:px-8">
          <div className="flex flex-col items-center text-center">
            <Image src="/haudit-logo.svg" alt="Haudit" width={40} height={40} />
            <p className="mt-2 text-[24px] font-semibold text-[#2D2D2D]">Advance Request Form</p>
            <p className="mt-1 text-xs text-[#959595]">
              Explain why you need an increase to your eligible advance.
            </p>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleRequestSubmit}>
            {/* Date */}
            <div>
              <label className="text-xs font-medium text-[#2D2D2D]">Date</label>
              <div className="relative mt-1">
                <input
                  type="date"
                  className={INPUT_CLASS + ' pr-9'}
                  value={requestForm.date}
                  onChange={(e) => setRequestForm((p) => ({ ...p, date: e.target.value }))}
                />
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#B0B0B0]" />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-[#2D2D2D]">Category</label>
              <div className="mt-1">
                <Select
                  value={requestForm.advanceType}
                  onChange={(v) =>
                    setRequestForm((p) => ({ ...p, advanceType: v as RequestFormState['advanceType'] }))
                  }
                  options={ADVANCE_TYPE_OPTIONS}
                  placeholder="Select a category"
                  className="h-10 rounded-xl border border-[#B9B9B9] bg-white text-sm"
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-medium text-[#2D2D2D]">Amount</label>
              <div className="mt-1 flex overflow-hidden rounded-xl border border-[#B9B9B9] bg-white">
                <Select
                  value={requestForm.currency}
                  onChange={(v) => setRequestForm((p) => ({ ...p, currency: v as RequestFormState['currency'] }))}
                  options={CURRENCY_OPTIONS}
                  className="h-10 w-20 shrink-0 rounded-none border-0 border-r border-[#B9B9B9] bg-neutral-50 text-xs"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[#3C3C3C] outline-none placeholder:text-[#B0B0B0]"
                  value={requestForm.amount}
                  onChange={(e) =>
                    setRequestForm((p) => ({ ...p, amount: formatAmountInput(e.target.value) }))
                  }
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="text-xs font-medium text-[#2D2D2D]">Purpose</label>
              <textarea
                rows={4}
                placeholder="Enter expenses description"
                className="mt-1 w-full resize-none rounded-xl border border-[#B9B9B9] bg-white px-3 py-2 text-sm text-[#3C3C3C] outline-none placeholder:text-[#B0B0B0]"
                value={requestForm.purpose}
                onChange={(e) => setRequestForm((p) => ({ ...p, purpose: e.target.value }))}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl bg-[#7B00D4] text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </Modal>

      {/* ── Details Modal ── */}
      <Modal
        open={Boolean(selectedRow)}
        onClose={() => { setSelectedRow(null); setExpandPurpose(false); }}
        headerVariant="none"
        closeVariant="island"
        size="sm"
      >
        {selectedRow && (
          <div className="px-5 py-6">
            <p className="text-base font-semibold text-[#1F1F1F]">
              Funding request details (Label Admin)
            </p>
            <div className="mt-4 rounded-2xl border border-[#E5E5E5] bg-white p-4">
              <p className="text-xs text-[#8A8A8A]">
                Advance request / {selectedRow.refId}
              </p>
              <p className="mt-2 text-[32px] font-semibold leading-none text-[#2F2F2F]">
                {formatCurrencyAmount(selectedRow.amount, selectedRow.currency)}
              </p>
              <div className="mt-4 space-y-0">
                <FieldRow
                  icon={<FileText className="h-3.5 w-3.5" />}
                  label="Transaction Id"
                  value={selectedRow.refId}
                />
                <FieldRow
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Date"
                  value={selectedRow.date}
                />
                <FieldRow
                  icon={<RefreshCcw className="h-3.5 w-3.5" />}
                  label="Status"
                  value={<StatusPill label={getStatusLabel(selectedRow.status, selectedRow.initiatedBy)} />}
                />
                <FieldRow
                  icon={<ChevronDown className="h-3.5 w-3.5" />}
                  label="Advance Type"
                  value={selectedRow.type}
                />
                <FieldRow
                  icon={<FileText className="h-3.5 w-3.5" />}
                  label="Purpose"
                  value={
                    <span>
                      {expandPurpose || selectedRow.purpose.length <= 60
                        ? selectedRow.purpose
                        : `${selectedRow.purpose.slice(0, 60)}… `}
                      {!expandPurpose && selectedRow.purpose.length > 60 && (
                        <button
                          type="button"
                          onClick={() => setExpandPurpose(true)}
                          className="text-[#7B00D4] underline"
                        >
                          See more
                        </button>
                      )}
                    </span>
                  }
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Status Update Modal ── */}
      <Modal
        open={Boolean(statusRow)}
        onClose={() => { setStatusRow(null); setStatusDescription(''); }}
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
            Fill out form to update advance request status.
          </p>

          <form className="mt-5 space-y-4" onSubmit={submitStatusUpdate}>
            <div>
              <label className="text-sm font-medium text-[#2D2D2D]">Status</label>
              <div className="mt-1.5">
                <Select
                  value={statusUpdate}
                  onChange={(v) => setStatusUpdate(v as 'pending' | 'approved' | 'rejected')}
                  options={[
                    { label: 'Pending', value: 'pending' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Rejected', value: 'rejected' },
                  ]}
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
                placeholder="Enter a description"
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
}
