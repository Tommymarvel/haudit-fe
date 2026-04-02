'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Calendar,
  CircleDollarSign,
  Download,
  DollarSign,
  FileText,
  MessageSquare,
  MoreVertical,
  RefreshCcw,
  Search,
  User,
  WalletCards,
} from 'lucide-react';
import Image from 'next/image';
import { Card, CardBody } from '@/components/ui/Card';
import { ChartCard, DonutSlice } from '@/components/dashboard/ChartCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { Select } from '@/components/ui/Select';
import YearFilterCalendar from '@/components/ui/YearFilterCalendar';
import Modal from '@/components/ui/Modal';
import { useAdvance } from '@/hooks/useAdvance';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND } from '@/lib/brand';
import { toast } from 'react-toastify';
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
  date: string;
  amount: number;
  currency: string;
  type: LabelAdvanceType;
  status: LabelAdvanceStatus;
  purpose: string;
  accountNumber: string;
  bank: string;
  accountName: string;
  adminInCharge: string;
  adminMessage: string;
  receiptRef: string;
};

type RequestFormState = {
  amount: string;
  currency: 'USD' | 'NGN';
  accountNumber: string;
  bank: string;
  accountName: string;
  advanceType: 'personal' | 'marketting';
  purpose: string;
};

const INPUT_CLASSNAME =
  'mt-1 h-10 w-full rounded-xl border border-[#B9B9B9] bg-white px-3 text-sm text-[#3C3C3C] outline-none placeholder:text-[#B0B0B0]';

const STATUS_OPTIONS = [
  { label: 'All status', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const ADVANCE_TYPE_OPTIONS = [
  { label: 'Personal', value: 'personal' },
  { label: 'Marketing', value: 'marketting' },
];

const BANK_OPTIONS = [
  { label: 'GTBank', value: 'GTBank' },
  { label: 'First Bank', value: 'First Bank' },
  { label: 'Access Bank', value: 'Access Bank' },
  { label: 'UBA', value: 'UBA' },
  { label: 'Zenith Bank', value: 'Zenith Bank' },
];

const CURRENCY_OPTIONS = [
  { label: 'USD', value: 'USD' },
  { label: 'NGN', value: 'NGN' },
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

function buildInitialRequestForm(name: string): RequestFormState {
  return {
    amount: '',
    currency: 'USD',
    accountNumber: '0432568913',
    bank: 'GTBank',
    accountName: name || 'Samuel Oyebowo',
    advanceType: 'personal',
    purpose: '',
  };
}

function SplitAdvanceMetricCard({
  eligibleValue,
  balanceValue,
}: {
  eligibleValue: string;
  balanceValue: string;
}) {
  return (
    <div className="rounded-2xl border border-[#D8D8D8] bg-white px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[14px] text-[#7A7A7A]">
            <span className="h-4 w-[3px] rounded-full bg-[#7B00D4]" />
            Eligible Advance
          </div>
          <p className="mt-0.5 text-[30px] font-semibold leading-none text-[#3C3C3C]">
            {eligibleValue}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#ECECEC] bg-[#FBFBFB] text-[#7B00D4]">
          <WalletCards className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[14px] text-[#7A7A7A]">
            <span className="h-4 w-[3px] rounded-full bg-[#00D447]" />
            Advance Balance
          </div>
          <p className="mt-0.5 text-[30px] font-semibold leading-none text-[#3C3C3C]">
            {balanceValue}
          </p>
        </div>
      </div>
    </div>
  );
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
    <div className="rounded-2xl border border-[#D8D8D8] bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[38px] font-semibold leading-none text-[#3C3C3C]">{value}</div>
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E8E8E8] text-[#7B00D4]">
          {icon}
        </div>
      </div>
      <p className="mt-1.5 text-[14px] leading-[120%] text-[#7A7A7A]">{label}</p>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[16px_1fr] items-start gap-2">
      <span className="mt-0.5 text-[#8E8E8E]">{icon}</span>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[14px] text-[#777777]">{label}</span>
        <span className="text-[14px] font-medium text-[#2F2F2F]">{value}</span>
      </div>
    </div>
  );
}

export default function LabelArtistAdvance() {
  const { user } = useAuth();
  const { advances, overview, marketingTrend, personalTrend, createAdvance } = useAdvance();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openRequestModal, setOpenRequestModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AdvanceRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  const artistName = user?.first_name?.trim() || 'Diamond';

  const [requestForm, setRequestForm] = useState<RequestFormState>(() =>
    buildInitialRequestForm(displayName)
  );

  const apiRows = useMemo<AdvanceRow[]>(() => {
    if (!advances?.length) return [];

    return advances.map((advance, index) => ({
      id: advance._id || `ADV-${index + 1}`,
      date: new Date((advance.createdAt || advance.created_at || new Date()).toString())
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        .replace(/ /g, '-'),
      amount: Number(advance.amount) || 0,
      currency: (advance.currency || 'USD').toUpperCase(),
      type: normalizeType(advance.advance_type || ''),
      status: normalizeStatus(advance.repayment_status || ''),
      purpose: advance.purpose || 'No purpose was provided for this request.',
      accountNumber: '0432568913',
      bank: 'GTBank',
      accountName: displayName || 'Samuel Oyebowo',
      adminInCharge: 'Joseph Nasiu',
      adminMessage:
        'Request approved. The payment will be initiated within 24 hours after compliance checks.',
      receiptRef: 'Transaction Receipt',
    }));
  }, [advances, displayName]);

  const rows = apiRows;
  const rowCurrency = useMemo(
    () => deriveSingleCurrency(rows.map((row) => row.currency), 'USD'),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return rows.filter((row) => {
      const statusMatch = statusFilter === 'all' || row.status.toLowerCase() === statusFilter;
      const keywordMatch =
        keyword === '' ||
        row.id.toLowerCase().includes(keyword) ||
        row.type.toLowerCase().includes(keyword) ||
        row.purpose.toLowerCase().includes(keyword);

      return statusMatch && keywordMatch;
    });
  }, [rows, search, statusFilter]);

  const marketingSeries = useMemo(() => {
    if (!marketingTrend?.length) return [];
    return marketingTrend.map((point) => ({
      label: new Date(point.date).toLocaleDateString('en-US', { month: 'short' }),
      date: point.date,
      value: point.totalUSD,
    }));
  }, [marketingTrend]);

  const personalSeries = useMemo(() => {
    if (!personalTrend?.length) return [];
    return personalTrend.map((point) => ({
      label: new Date(point.date).toLocaleDateString('en-US', { month: 'short' }),
      date: point.date,
      value: point.totalUSD,
    }));
  }, [personalTrend]);

  const advanceTypeData = useMemo<DonutSlice[]>(() => {
    const totals = rows.reduce(
      (acc, row) => {
        if (row.type === 'Marketing') {
          acc.marketing += row.amount;
        } else {
          acc.personal += row.amount;
        }
        return acc;
      },
      { marketing: 0, personal: 0 }
    );

    if (totals.marketing === 0 && totals.personal === 0) return [];

    return [
      { name: 'Marketing', value: totals.marketing, color: '#00D447' },
      { name: 'Personal', value: totals.personal, color: BRAND.purple },
    ];
  }, [rows]);

  const marketingTotals = useMemo(() => {
    const total = rows
      .filter((row) => row.type === 'Marketing')
      .reduce((sum, row) => sum + row.amount, 0);
    const paid = rows
      .filter((row) => row.type === 'Marketing' && (row.status === 'Paid' || row.status === 'Approved'))
      .reduce((sum, row) => sum + row.amount, 0);
    return { total, balance: Math.max(total - paid, 0) };
  }, [rows]);

  const personalTotals = useMemo(() => {
    const total = rows
      .filter((row) => row.type === 'Personal')
      .reduce((sum, row) => sum + row.amount, 0);
    const paid = rows
      .filter((row) => row.type === 'Personal' && (row.status === 'Paid' || row.status === 'Approved'))
      .reduce((sum, row) => sum + row.amount, 0);
    return { total, balance: Math.max(total - paid, 0) };
  }, [rows]);

  const topMetrics = useMemo(() => {
    const totalAdvance = Number(overview?.totalAdvanceUSD ?? 0);
    const repaidAdvance = Number(overview?.totalRepaidUSD ?? 0);
    const outstanding = Number(overview?.outstandingUSD ?? 0);

    if (totalAdvance > 0 || repaidAdvance > 0 || outstanding > 0) {
      return {
        payableAdvance: outstanding,
        advanceBalance: Math.max(totalAdvance - repaidAdvance, 0),
        totalAdvance,
        repaidAdvance,
      };
    }

    const totalFromRows = rows.reduce((sum, row) => sum + row.amount, 0);
    const repaidFromRows = rows
      .filter((row) => row.status === 'Paid' || row.status === 'Approved')
      .reduce((sum, row) => sum + row.amount, 0);
    const outstandingFromRows = Math.max(totalFromRows - repaidFromRows, 0);

    return {
      payableAdvance: outstandingFromRows,
      advanceBalance: outstandingFromRows,
      totalAdvance: totalFromRows,
      repaidAdvance: repaidFromRows,
    };
  }, [overview, rows]);

  const openRequestForm = () => {
    setRequestForm(buildInitialRequestForm(displayName));
    setOpenRequestModal(true);
  };

  const handleRequestSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = parseAmountInput(requestForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!requestForm.accountNumber.trim()) {
      toast.error('Account number is required');
      return;
    }
    if (!requestForm.accountName.trim()) {
      toast.error('Account name is required');
      return;
    }
    if (!requestForm.purpose.trim()) {
      toast.error('Purpose is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await createAdvance({
        amount,
        currency: requestForm.currency,
        advance_source_name: displayName || 'Label Artist',
        advance_source_phn: 'N/A',
        advance_source_email: user?.email || 'labelartist@haudit.dev',
        advance_type: requestForm.advanceType,
        repayment_status: 'pending',
        purpose: requestForm.purpose.trim(),
      });
      setOpenRequestModal(false);
    } catch (error) {
      console.error('Failed to submit advance request', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const metricCurrency =
    Number(overview?.totalAdvanceUSD ?? 0) > 0 ||
    Number(overview?.totalRepaidUSD ?? 0) > 0 ||
    Number(overview?.outstandingUSD ?? 0) > 0
      ? 'USD'
      : rowCurrency;

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-3xl font-medium text-[#3C3C3C]">Welcome to Advance-O-Meter {artistName}</h1>
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

      <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <SplitAdvanceMetricCard
          eligibleValue={formatCurrencyAmount(topMetrics.payableAdvance, metricCurrency)}
          balanceValue={formatCurrencyAmount(topMetrics.advanceBalance, metricCurrency)}
        />
        <MetricCard
          value={formatCurrencyAmount(topMetrics.totalAdvance, metricCurrency)}
          label="Total advance"
          icon={<CircleDollarSign className="h-4 w-4" />}
        />
        <MetricCard
          value={formatCurrencyAmount(topMetrics.repaidAdvance, metricCurrency)}
          label="Repaid Advance"
          icon={<RefreshCcw className="h-4 w-4" />}
        />
      </div>

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
                <div className=" flex items-center gap-1 text-[12px] font-normal leading-[120%] text-[#AAAAAA]">
                  <span className="h-2 w-[2px] rounded bg-[#7B00D4]" />
                  Total advance
                </div>
                <p className=" text-[20px] font-medium leading-[120%] tracking-[0] text-[#3C3C3C]">
                  {formatCurrencyAmount(marketingTotals.total, rowCurrency)}
                </p>
              </div>
              <div>
                <div className=" flex items-center gap-1 text-[12px] font-normal leading-[120%] text-[#AAAAAA]">
                  <span className="h-2 w-[2px] rounded bg-[#7B00D4]" />
                  Balance
                </div>
                <p className=" text-[20px] font-medium leading-[120%] tracking-[0] text-[#3C3C3C]">
                  {formatCurrencyAmount(marketingTotals.balance, rowCurrency)}
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
                <div className=" flex items-center gap-1 text-[12px] font-normal leading-[120%] text-[#AAAAAA]">
                  <span className="h-2 w-[2px] rounded bg-[#00B241]" />
                  Total advance
                </div>
                <p className=" text-[20px] font-medium leading-[120%] tracking-[0] text-[#3C3C3C]">
                  {formatCurrencyAmount(personalTotals.total, rowCurrency)}
                </p>
              </div>
              <div>
                <div className=" flex items-center gap-1 text-[12px] font-normal leading-[120%] text-[#AAAAAA]">
                  <span className="h-2 w-[2px] rounded bg-[#00B241]" />
                  Balance
                </div>
                <p className=" text-[20px] font-medium leading-[120%] tracking-[0] text-[#3C3C3C]">
                  {formatCurrencyAmount(personalTotals.balance, rowCurrency)}
                </p>
              </div>
            </div>
          }
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4   xl:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <CardBody className="p-0!">
            <div className="flex flex-col items-start gap-3 border-b border-neutral-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm font-semibold text-[#3C3C3C]">Advance request</div>
              <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
                <div className="relative w-full sm:w-[260px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0B0B0]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search advance request"
                    className="h-8 w-full rounded-xl border border-neutral-200 bg-[#F6F6F6] pl-9 pr-3 text-xs text-[#6C6C6C] outline-none"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  className="h-8 min-w-[120px] bg-[#FFFFFF] text-xs"
                  options={STATUS_OPTIONS}
                />
              </div>
            </div>

            <div className="max-h-[420px] overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#F4F4F4] text-[#6F6F6F]">
                  <tr>
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-1">
                        Date
                        <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Advance type</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA] text-[#3C3C3C]">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-16 text-center text-sm text-[#8A8A8A]"
                      >
                        No advance requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, index) => (
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
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2 text-neutral-500">
                            <button
                              type="button"
                              aria-label="View request details"
                              className="hover:text-[#7B00D4]"
                              onClick={() => setSelectedRow(row)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="View request details"
                              className="hover:text-[#7B00D4]"
                              onClick={() => setSelectedRow(row)}
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

        <ChartCard
          title="Advance type"
          variant="donut"
          data={advanceTypeData}
          donutStyle="advance"
          chartHeight={420}
        />
      </div>

      <Modal
        open={openRequestModal}
        onClose={() => setOpenRequestModal(false)}
        headerVariant="none"
        closeVariant="island"
        size="md"
      >
        <div className="">
          <div className=" rounded-[24px]  px-5 py-6 sm:px-7">
            <div className="flex flex-col items-center text-center">
              <Image src="/haudit-logo.svg" alt="Haudit" width={40} height={40} />
              <p className="mt-2 text-[28px] font-medium text-[#2D2D2D]">Advance request form</p>
              <p className="mt-1 text-xs text-[#959595]">
                Let us get to know why you are requesting for Advance.
              </p>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleRequestSubmit}>
              <div>
                <label className="text-xs font-medium text-[#2D2D2D]">Amount</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter request amount"
                  className={INPUT_CLASSNAME}
                  value={requestForm.amount}
                  onChange={(event) =>
                    setRequestForm((prev) => ({
                      ...prev,
                      amount: formatAmountInput(event.target.value),
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#2D2D2D]">Currency</label>
                <div className="mt-1">
                  <Select
                    value={requestForm.currency}
                    onChange={(value) =>
                      setRequestForm((prev) => ({
                        ...prev,
                        currency: value as RequestFormState['currency'],
                      }))
                    }
                    options={CURRENCY_OPTIONS}
                    className="h-10 rounded-xl border border-[#B9B9B9] bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#2D2D2D]">Account Number</label>
                <input
                  type="text"
                  placeholder="Enter account number"
                  className={INPUT_CLASSNAME}
                  value={requestForm.accountNumber}
                  onChange={(event) =>
                    setRequestForm((prev) => ({ ...prev, accountNumber: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#2D2D2D]">Bank</label>
                <div className="mt-1">
                  <Select
                    value={requestForm.bank}
                    onChange={(value) => setRequestForm((prev) => ({ ...prev, bank: value }))}
                    options={BANK_OPTIONS}
                    className="h-10 rounded-xl border border-[#B9B9B9] bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#2D2D2D]">Account Name</label>
                <input
                  type="text"
                  placeholder="Enter account name"
                  className={INPUT_CLASSNAME}
                  value={requestForm.accountName}
                  onChange={(event) =>
                    setRequestForm((prev) => ({ ...prev, accountName: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#2D2D2D]">Advance Type</label>
                <div className="mt-1">
                  <Select
                    value={requestForm.advanceType}
                    onChange={(value) =>
                      setRequestForm((prev) => ({
                        ...prev,
                        advanceType: value as RequestFormState['advanceType'],
                      }))
                    }
                    options={ADVANCE_TYPE_OPTIONS}
                    className="h-10 rounded-xl border border-[#B9B9B9] bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#2D2D2D]">Purpose</label>
                <textarea
                  rows={5}
                  placeholder="Give a detailed purpose of the request"
                  className="mt-1 w-full resize-none rounded-xl border border-[#B9B9B9] bg-white px-3 py-2 text-sm text-[#3C3C3C] outline-none placeholder:text-[#B0B0B0]"
                  value={requestForm.purpose}
                  onChange={(event) =>
                    setRequestForm((prev) => ({ ...prev, purpose: event.target.value }))
                  }
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 h-10 w-full rounded-xl bg-[#7B00D4] text-sm font-medium text-white disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : 'Submit request'}
              </button>
            </form>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(selectedRow)}
        onClose={() => setSelectedRow(null)}
        headerVariant="none"
        closeVariant="island"
        size="xl"
      >
        {selectedRow && (
          <div className="overflow-hidden rounded-2xl border border-[#D5D5D5]">
              <div className="border-b border-[#D5D5D5] bg-[#FAFAFA] px-4 py-2 text-xs text-[#6F6F6F]">
                Advance O Meter / {selectedRow.id}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1.9fr_1fr]">
                <div className="border-b border-[#D5D5D5] p-4 md:border-b-0 md:border-r">
                  <p className="text-[36px] font-semibold leading-none text-[#2F2F2F]">{selectedRow.id}</p>
                  <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
                    <DetailItem
                      icon={<Calendar className="h-3.5 w-3.5" />}
                      label="Date"
                      value={selectedRow.date}
                    />
                    <DetailItem
                      icon={<FileText className="h-3.5 w-3.5" />}
                      label="Account Number"
                      value={selectedRow.accountNumber}
                    />

                    <DetailItem
                      icon={<RefreshCcw className="h-3.5 w-3.5" />}
                      label="Status"
                      value={<StatusPill label={selectedRow.status} />}
                    />
                    <DetailItem
                      icon={<FileText className="h-3.5 w-3.5" />}
                      label="Bank"
                      value={selectedRow.bank}
                    />

                    <DetailItem
                      icon={<DollarSign className="h-3.5 w-3.5" />}
                      label="Amount"
                      value={formatCurrencyAmount(selectedRow.amount, selectedRow.currency)}
                    />
                    <DetailItem
                      icon={<User className="h-3.5 w-3.5" />}
                      label="Account Name"
                      value={selectedRow.accountName}
                    />

                    <DetailItem
                      icon={<FileText className="h-3.5 w-3.5" />}
                      label="Advance Type"
                      value={selectedRow.type}
                    />
                    <DetailItem
                      icon={<FileText className="h-3.5 w-3.5" />}
                      label="Receipt"
                      value={
                        <span className="rounded-md bg-[#EEEEEE] px-2 py-1 text-xs text-[#4E4E4E]">
                          {selectedRow.receiptRef}
                        </span>
                      }
                    />

                    <DetailItem
                      icon={<User className="h-3.5 w-3.5" />}
                      label="Admin in charge"
                      value={selectedRow.adminInCharge}
                    />
                  </div>

                  <div className="mt-5 rounded-lg border border-[#D5D5D5] px-3 py-3">
                    <p className="text-xs font-medium text-[#8A8A8A]">Purpose of Advance</p>
                    <p className="mt-1 text-[13px] leading-5 text-[#4E4E4E]">{selectedRow.purpose}</p>
                  </div>
                </div>

                <div className="bg-[#FAFAFA]">
                  <p className="border-b border-[#D5D5D5] px-4 py-2 text-sm font-medium text-[#3C3C3C]">
                    Admin Message
                  </p>
                  <div className="px-4 py-3">
                    <p className="text-sm font-semibold text-[#A0A0A0]">Request approved</p>
                    <p className="mt-2 text-[13px] leading-5 text-[#4E4E4E]">
                      • {selectedRow.adminMessage}
                    </p>
                  </div>
                </div>
              </div>
            </div>
        )}
      </Modal>
    </div>
  );
}
