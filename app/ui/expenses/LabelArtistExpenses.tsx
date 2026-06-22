'use client';

import React, { useMemo, useState, useRef } from 'react';
import { exportToPdf } from '@/lib/utils/exportPdf';
import {
  ArrowUpDown,
  CalendarDays,
  CheckCheck,
  Download,
  FileText,
  MoreVertical,
  Paperclip,
  Search,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { StatusPill } from '@/components/ui/StatusPill';
import YearFilterCalendar from '@/components/ui/YearFilterCalendar';
import AddExpensesModal, { NewExpensesPayload } from './AddExpensesModal';
import { useExpenses } from '@/hooks/useExpenses';
import { useAdvance } from '@/hooks/useAdvance';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile } from '@/lib/utils/upload';
import { BRAND } from '@/lib/brand';
import Modal from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrencyAmount } from '@/lib/utils/currency';

type ExpenseStatus = 'Approved' | 'Pending' | 'Rejected';

type ExpenseRow = {
  id: string;
  docId: string;
  date: string;
  year: number;
  advanceType: string;
  status: ExpenseStatus;
  amount: number;
  currency: string;
  loggedBy: string;
  artistName: string;
  approvedBy: string;
  attachment: string;
  receiptUrl: string;
  description: string;
  recoupable: 'Yes' | 'No';
  detailStatus: 'Paid' | ExpenseStatus;
};

const CATEGORY_DISPLAY: Record<string, string> = {
  marketting: 'Marketing',
  production: 'Production',
  personal: 'Personal',
};

function normalizeExpenseStatus(value?: string): ExpenseStatus {
  const key = (value || '').trim().toLowerCase();
  if (key === 'approved' || key === 'paid' || key === 'repaid') return 'Approved';
  if (key === 'rejected') return 'Rejected';
  return 'Pending';
}

function normalizeDetailStatus(value?: string): ExpenseRow['detailStatus'] {
  const key = (value || '').trim().toLowerCase();
  if (key === 'paid' || key === 'repaid') return 'Paid';
  if (key === 'approved') return 'Approved';
  if (key === 'rejected') return 'Rejected';
  return 'Pending';
}

/* ── Detail grid row ── */
function DetailPair({
  leftIcon, leftLabel, leftValue,
  rightIcon, rightLabel, rightValue,
}: {
  leftIcon: React.ReactNode; leftLabel: string; leftValue: React.ReactNode;
  rightIcon?: React.ReactNode; rightLabel?: string; rightValue?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 text-[#ABABAB]">{leftIcon}</span>
        <div className="min-w-0">
          <p className="text-[12px] text-[#999]">{leftLabel}</p>
          <p className="mt-0.5 text-[13px] font-medium text-[#2F2F2F]">{leftValue}</p>
        </div>
      </div>
      {rightLabel && (
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-[#ABABAB]">{rightIcon}</span>
          <div className="min-w-0">
            <p className="text-[12px] text-[#999]">{rightLabel}</p>
            <p className="mt-0.5 text-[13px] font-medium text-[#2F2F2F]">{rightValue}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LabelArtistExpenses() {
  const { user } = useAuth();
  const { expenses, createExpense, approveExpense, rejectExpense } = useExpenses();
  const { typePercentage } = useAdvance();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [q, setQ] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
  const [advanceTypeFilter, setAdvanceTypeFilter] = useState('all');
  const [loggedByFilter, setLoggedByFilter] = useState('all');
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRow | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [declineMode, setDeclineMode] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const titleName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || '';

  const personalEligibleAmount = useMemo(
    () => formatCurrencyAmount(typePercentage?.personal?.totalUSD ?? 0, 'USD'),
    [typePercentage],
  );

  const marketingEligibleAmount = useMemo(
    () => formatCurrencyAmount(typePercentage?.marketting?.totalUSD ?? 0, 'USD'),
    [typePercentage],
  );

  const mappedApiRows = useMemo<ExpenseRow[]>(() => {
    if (!expenses?.length) return [];
    return expenses.map((item, index) => ({
      id: item.ref_id || item._id || `EXP-${index + 1}`,
      docId: item._id || '',
      date: new Date(item.expense_date || item.createdAt)
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        .replace(/ /g, '-'),
      year: new Date(item.expense_date || item.createdAt).getFullYear(),
      advanceType:
        CATEGORY_DISPLAY[(item as { advance_type?: string }).advance_type || item.category || ''] ||
        (item as { advance_type?: string }).advance_type || item.category || '-',
      status: normalizeExpenseStatus((item as { status?: string }).status),
      detailStatus: normalizeDetailStatus((item as { status?: string }).status),
      amount: Number(item.amount) || 0,
      currency: (item.currency || 'USD').toUpperCase(),
      loggedBy:
        (item as { initiated_by?: string; logged_by?: string; paid_by?: string }).initiated_by ||
        (item as { initiated_by?: string; logged_by?: string; paid_by?: string }).logged_by ||
        (item as { initiated_by?: string; logged_by?: string; paid_by?: string }).paid_by ||
        '-',
      artistName:
        (item as { artist_name?: string; artistName?: string }).artist_name ||
        (item as { artist_name?: string; artistName?: string }).artistName ||
        titleName,
      approvedBy:
        (item as { approved_by?: string; approvedBy?: string }).approved_by ||
        (item as { approved_by?: string; approvedBy?: string }).approvedBy ||
        '-',
      attachment: item.receipt_url ? 'Transaction Receipt' : '',
      receiptUrl: item.receipt_url || '',
      description: item.description || 'No description was provided.',
      recoupable:
        ((item as { recoupable?: string }).recoupable || '').toLowerCase() === 'yes' ? 'Yes' : 'No',
    }));
  }, [expenses, titleName]);

  const rows = mappedApiRows;

  const advanceTypeOptions = [
    { label: 'All types', value: 'all' },
    { label: 'Personal', value: 'personal' },
    { label: 'Marketing', value: 'marketting' },
  ];

  const filteredRows = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return rows.filter((row) => {
      const yearMatch = !selectedYear || row.year === selectedYear;
      const advanceTypeMatch = advanceTypeFilter === 'all' || row.advanceType.toLowerCase() === advanceTypeFilter;
      const loggedByMatch =
        loggedByFilter === 'all' ||
        row.loggedBy.toLowerCase().includes(loggedByFilter.toLowerCase());
      const keywordMatch =
        keyword === '' ||
        row.id.toLowerCase().includes(keyword) ||
        row.advanceType.toLowerCase().includes(keyword) ||
        row.loggedBy.toLowerCase().includes(keyword);
      return yearMatch && advanceTypeMatch && loggedByMatch && keywordMatch;
    });
  }, [rows, q, advanceTypeFilter, loggedByFilter, selectedYear]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExportPdf = async () => {
    if (!contentRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await exportToPdf(contentRef.current!, `expenses-${selectedYear ?? 'all'}.pdf`);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedExpense(null);
    setDeclineMode(false);
    setDeclineReason('');
  };

  return (
    <div ref={contentRef}>
      {/* ── Header ── */}
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-[30px] font-medium leading-[120%] text-[#3C3C3C]">
            {titleName} Expenses
          </h1>
          <p className="mt-1 text-[14px] leading-[120%] text-[#777777]">
            You are now on the page to manage Record Label artists.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <YearFilterCalendar
            value={selectedYear}
            onChange={setSelectedYear}
            label="Year"
            showYear
            buttonClassName="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#EAEAEA] px-4 text-sm font-medium text-[#5A5A5A]"
          />
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            data-pdf-exclude="true"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#EAEAEA] px-4 text-sm font-medium text-[#5A5A5A] disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          <Button
            variant="primary"
            className="h-10 rounded-2xl px-6 text-sm"
            style={{ backgroundColor: BRAND.purple }}
            onClick={() => setOpenAdd(true)}
          >
            Add New Expenses
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <Card className="mt-6 overflow-hidden">
        <CardBody className="p-0!">
          <div className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm font-semibold text-[#3C3C3C]">Expenses</div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search expense"
                  className="h-9 w-[220px] rounded-xl border border-neutral-200 bg-[#F4F4F4] pl-9 pr-3 text-[13px] text-neutral-700 outline-none"
                />
              </div>
              <Select
                value={loggedByFilter}
                onChange={setLoggedByFilter}
                className="h-9 min-w-[120px] bg-[#F8F8F8] text-[13px] text-[#5A5A5A]"
                options={[
                  { label: 'Logged by', value: 'all' },
                  { label: 'Artist', value: 'artist' },
                  { label: 'Label', value: 'record_label' },
                ]}
              />
              <Select
                value={advanceTypeFilter}
                onChange={setAdvanceTypeFilter}
                className="h-9 min-w-[140px] bg-[#F8F8F8] text-[13px] text-[#5A5A5A]"
                options={advanceTypeOptions}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-[#ECECEC] text-left text-[13px] font-medium text-[#5F5F5F]">
                <tr>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      Date <ArrowUpDown className="h-3.5 w-3.5" />
                    </span>
                  </th>
                  <th className="px-4 py-3">Advance Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Logged by</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA] text-[13px] text-[#4C4C4C]">
                {pagedRows.map((row, index) => (
                  <tr key={`${row.id}-${index}`} className="bg-white hover:bg-neutral-50">
                    <td className="px-4 py-3 whitespace-nowrap max-w-[120px] truncate font-medium" title={row.id}>
                      {row.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3 capitalize whitespace-nowrap">{row.advanceType === 'marketting' ? 'Marketing' : row.advanceType}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusPill label={row.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatCurrencyAmount(row.amount, row.currency)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap max-w-[120px] truncate capitalize">{row.loggedBy}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="rounded-lg p-1 text-[#5A5A5A] hover:bg-neutral-100"
                        onClick={() => { setSelectedExpense(row); setDeclineMode(false); setDeclineReason(''); }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-[#777777]">
                      No expenses match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={(p) => setPage(p)} />
        </CardBody>
      </Card>

      {/* ── Add Expense Modal ── */}
      <AddExpensesModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        submitLabel="Submit request"
        personalEligibleAmount={personalEligibleAmount}
        marketingEligibleAmount={marketingEligibleAmount}

        onSubmit={async (payload: NewExpensesPayload) => {
          let receiptUrl = '';
          if (payload.proofs && payload.proofs.length > 0) {
            receiptUrl = await uploadFile(payload.proofs[0], 'expense');
          }
          await createExpense({
            artistId: user?.id,
            expense_date: payload.expense_date,
            advance_type: payload.advance_type,
            currency: payload.currency,
            amount: payload.amount,
            recoupable: payload.recoupable,
            description: payload.description,
            receipt_url: receiptUrl,
          });
        }}
      />

      {/* ── Expense Detail Modal ── */}
      <Modal
        open={Boolean(selectedExpense)}
        onClose={closeDetailModal}
        headerVariant="none"
        closeVariant="island"
        size="md"
      >
        {selectedExpense && (
          <div className="overflow-hidden rounded-2xl">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-[#EBEBEB] bg-[#FAFAFA] px-4 py-2.5">
              <p className="text-xs text-[#6F6F6F]">
                Expenses / <span className="font-medium">{selectedExpense.id}</span>
              </p>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-[#7B00D4]" style={{ backgroundColor: '#F3E8FF' }}>
                <FileText className="h-3 w-3" />
                Logged by {selectedExpense.loggedBy === 'record_label' || selectedExpense.loggedBy === 'admin' ? 'Label' : 'Artist'}
              </span>
            </div>

            <div className="p-5">
              {/* Transaction ID */}
              <p className="text-[28px] font-semibold leading-none text-[#2F2F2F]">
                {selectedExpense.id}
              </p>

              {/* Detail grid */}
              <div className="mt-5 space-y-4">
                <DetailPair
                  leftIcon={<CalendarDays className="h-3.5 w-3.5" />}
                  leftLabel="Date"
                  leftValue={selectedExpense.date}
                  rightIcon={<UserRound className="h-3.5 w-3.5" />}
                  rightLabel="Artist Name"
                  rightValue={selectedExpense.artistName}
                />
                <DetailPair
                  leftIcon={<FileText className="h-3.5 w-3.5" />}
                  leftLabel="Amount"
                  leftValue={formatCurrencyAmount(selectedExpense.amount, selectedExpense.currency)}
                  {...(selectedExpense.approvedBy && selectedExpense.approvedBy !== '-' ? {
                    rightIcon: <CheckCheck className="h-3.5 w-3.5" />,
                    rightLabel: 'Approved by',
                    rightValue: selectedExpense.approvedBy,
                  } : {})}
                />
                <DetailPair
                  leftIcon={<FileText className="h-3.5 w-3.5" />}
                  leftLabel="Advance Type"
                  leftValue={selectedExpense.advanceType === 'marketting' ? 'Marketing' : selectedExpense.advanceType}
                  {...(selectedExpense.recoupable ? {
                    rightIcon: <FileText className="h-3.5 w-3.5" />,
                    rightLabel: 'Recoupable',
                    rightValue: (
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          selectedExpense.recoupable === 'Yes'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {selectedExpense.recoupable}
                      </span>
                    ),
                  } : {})}
                />
                <DetailPair
                  leftIcon={<FileText className="h-3.5 w-3.5" />}
                  leftLabel="Status"
                  leftValue={<StatusPill label={selectedExpense.detailStatus} />}
                />
              </div>

              {/* Attachments */}
              {selectedExpense.attachment && (
                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#6F6F6F]">
                    <Paperclip className="h-3.5 w-3.5" />
                    Attachment
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[selectedExpense.attachment].map((name, i) => (
                      <a
                        key={i}
                        href={selectedExpense.receiptUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-[#4E4E4E] hover:bg-neutral-100"
                      >
                        {name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mt-4">
                <p className="mb-1.5 text-xs font-medium text-[#6F6F6F]">Description</p>
                <p className="text-[13px] leading-5 text-[#4E4E4E]">{selectedExpense.description}</p>
              </div>

              {/* Actions */}
              {selectedExpense.detailStatus === 'Pending' && (
                <div className="mt-5">
                  {declineMode ? (
                    <>
                      <div>
                        <label className="text-xs font-medium text-[#2D2D2D]">Reasons for declining</label>
                        <textarea
                          rows={3}
                          placeholder="State reasons for declining this loan"
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          className="mt-1 w-full resize-none rounded-xl border border-[#B9B9B9] bg-white px-3 py-2 text-sm text-[#3C3C3C] outline-none placeholder:text-[#B0B0B0]"
                        />
                      </div>
                      <div className="mt-3 flex gap-3">
                        <button
                          type="button"
                          onClick={() => { setDeclineMode(false); setDeclineReason(''); }}
                          disabled={rejecting}
                          className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-neutral-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={rejecting}
                          onClick={async () => {
                            setRejecting(true);
                            try {
                              await rejectExpense(selectedExpense.docId);
                              closeDetailModal();
                            } finally {
                              setRejecting(false);
                            }
                          }}
                          className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-50"
                          style={{ backgroundColor: BRAND.purple }}
                        >
                          {rejecting ? 'Declining...' : 'Finish'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={approving || rejecting}
                        onClick={() => setDeclineMode(true)}
                        className="flex-1 rounded-xl border py-2.5 text-sm font-medium disabled:opacity-50"
                        style={{ borderColor: BRAND.purple, color: BRAND.purple }}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        disabled={approving || rejecting}
                        onClick={async () => {
                          setApproving(true);
                          try {
                            await approveExpense(selectedExpense.docId);
                            closeDetailModal();
                          } finally {
                            setApproving(false);
                          }
                        }}
                        className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white disabled:opacity-50"
                        style={{ backgroundColor: BRAND.purple }}
                      >
                        {approving ? 'Approving…' : 'Approve'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
