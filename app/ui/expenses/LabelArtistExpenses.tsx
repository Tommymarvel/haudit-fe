'use client';

import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Download, FileText, MoreVertical, Search, UserRound, CalendarDays } from 'lucide-react';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { StatusPill } from '@/components/ui/StatusPill';
import YearFilterCalendar from '@/components/ui/YearFilterCalendar';
import AddExpensesModal, { NewExpensesPayload } from './AddExpensesModal';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile } from '@/lib/utils/upload';
import { BRAND } from '@/lib/brand';
import Modal from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { deriveSingleCurrency, formatCurrencyAmount } from '@/lib/utils/currency';

type ExpenseStatus = 'Approved' | 'Pending' | 'Rejected';

type ExpenseRow = {
  id: string;
  docId: string;
  date: string;
  category: string;
  status: ExpenseStatus;
  amount: number;
  currency: string;
  loggedBy: string;
  artistName: string;
  approvedBy: string;
  paidBy: string;
  attachment: string;
  receiptUrl: string;
  description: string;
  recoupable: 'Yes' | 'No';
  detailStatus: 'Paid' | ExpenseStatus;
};

const CATEGORY_DISPLAY: Record<string, string> = {
  marketting: 'Category 1',
  production: 'Category 2',
  personal: 'Category 3',
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

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
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

export default function LabelArtistExpenses() {
  const { user } = useAuth();
  const { expenses, trend, netTotal, createExpense, approveExpense, rejectExpense } = useExpenses();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRow | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const titleName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || 'Diamond Platnumz';

  const trendData = useMemo(() => {
    if (!trend?.length) return [];
    return trend.map((item) => ({
      label: new Date(item.day).toLocaleDateString('en-US', { month: 'short' }),
      date: item.day,
      value: item.amount,
    }));
  }, [trend]);

  const mappedApiRows = useMemo<ExpenseRow[]>(() => {
    if (!expenses?.length) return [];
    return expenses.map((item, index) => ({
      id: item.ref_id || item._id || `EXP-${index + 1}`,
      docId: item._id || '',
      date: new Date(item.expense_date || item.createdAt)
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        .replace(/ /g, '-'),
      category: CATEGORY_DISPLAY[item.category] || item.category || 'Category 1',
      status: normalizeExpenseStatus(
        (item as { status?: string }).status
      ),
      detailStatus: normalizeDetailStatus(
        (item as { status?: string }).status
      ),
      amount: Number(item.amount) || 0,
      currency: (item.currency || 'USD').toUpperCase(),
      loggedBy:
        (item as { logged_by?: string; paid_by?: string }).logged_by ||
        (item as { logged_by?: string; paid_by?: string }).paid_by ||
        'Admin',
      artistName:
        (item as { artist_name?: string; artistName?: string }).artist_name ||
        (item as { artist_name?: string; artistName?: string }).artistName ||
        titleName,
      approvedBy:
        (item as { approved_by?: string; approvedBy?: string }).approved_by ||
        (item as { approved_by?: string; approvedBy?: string }).approvedBy ||
        '-',
      paidBy:
        (item as { paid_by?: string; paidBy?: string }).paid_by ||
        (item as { paid_by?: string; paidBy?: string }).paidBy ||
        '-',
      attachment: item.receipt_url ? 'Transaction Receipt' : '-',
      receiptUrl: item.receipt_url || '',
      description: item.description || 'No description was provided.',
      recoupable:
        ((item as { recoupable?: string }).recoupable || '').toLowerCase() === 'yes'
          ? 'Yes'
          : 'No',
    }));
  }, [expenses, titleName]);

  const rows = mappedApiRows;
  const totalCurrency = useMemo(
    () => deriveSingleCurrency(rows.map((row) => row.currency), 'USD'),
    [rows]
  );

  const categoryOptions = [
    { label: 'All categories', value: 'all' },
    { label: 'Marketing', value: 'marketting' },
    { label: 'Production', value: 'production' },
    { label: 'Personal', value: 'personal' },
    { label: 'Recording costs', value: 'Recording costs' },
    { label: 'Production costs', value: 'Production costs' },
    { label: 'Mixing & mastering', value: 'Mixing & mastering' },
    { label: 'Marketing spend', value: 'Marketing spend' },
    { label: 'Promotion spend', value: 'Promotion spend' },
    { label: 'Digital ads', value: 'Digital ads' },
    { label: 'Radio', value: 'Radio' },
    { label: 'PR & media runs', value: 'PR & media runs' },
    { label: 'Content creation', value: 'Content creation' },
    { label: 'Music video production', value: 'Music video production' },
    { label: 'Artwork/Design', value: 'Artwork/Design' },
    { label: 'Distribution', value: 'Distribution' },
    { label: 'Management fees', value: 'Management fees' },
    { label: 'Legal fees', value: 'Legal fees' },
    { label: 'Travel & logistics', value: 'Travel & logistics' },
    { label: 'Accommodation', value: 'Accommodation' },
    { label: 'Show/tour costs', value: 'Show/tour costs' },
    { label: 'Styling', value: 'Styling' },
    { label: 'Photography', value: 'Photography' },
    { label: 'Social media management', value: 'Social media management' },
    { label: 'Branding', value: 'Branding' },
    { label: 'Equipment', value: 'Equipment' },
    { label: 'Miscellaneous', value: 'Miscellaneous' },
    { label: 'Food & Entertainment', value: 'Food & Entertainment' },
    { label: 'Accounting services fees', value: 'Accounting services fees' },
    { label: 'Marketing services fees', value: 'Marketing services fees' },
    { label: 'Agency fees', value: 'Agency fees' },
    { label: 'Health', value: 'Health' },
    { label: 'Insurance Fees', value: 'Insurance Fees' },
    { label: 'Cash at Hand', value: 'Cash at Hand' },
    { label: 'Others', value: 'others' },
  ];

  const filteredRows = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return rows.filter((row) => {
      const categoryMatch = category === 'all' || row.category === category;
      const keywordMatch =
        keyword === '' ||
        row.id.toLowerCase().includes(keyword) ||
        row.category.toLowerCase().includes(keyword) ||
        row.loggedBy.toLowerCase().includes(keyword);
      return categoryMatch && keywordMatch;
    });
  }, [rows, q, category]);

  const totalExpenses = netTotal;

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-[30px] font-medium leading-[120%] text-[#3C3C3C]">
            {titleName} Expenses
          </h1>
          <p className="mt-1 text-[16px] leading-[120%] text-[#777777]">
            You are now on the page to manage Record Label artists.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <YearFilterCalendar
            label="Year"
            showYear={false}
            buttonClassName="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#EAEAEA] px-4 text-sm font-medium text-[#5A5A5A]"
          />
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#EAEAEA] px-4 text-sm font-medium text-[#5A5A5A]"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <Button
            variant="primary"
            className="h-10 rounded-2xl px-6 text-sm"
            style={{ backgroundColor: BRAND.purple }}
            onClick={() => setOpenAdd(true)}
          >
            Add Expense
          </Button>
        </div>
      </div>

      <div className="mt-5">
        <ChartCard
          title="Expenses Trend"
          variant="line"
          data={trendData}
          xKey="label"
          yKey="value"
          color={BRAND.purple}
          lineType="monotone"
          chartMarginTop={48}
          chartOverlay={
            <div className="leading-none">
              <div className="flex items-center gap-1 text-[12px] font-normal leading-[120%] text-[#AAAAAA]">
                <span className="h-2 w-[2px] rounded bg-[#7B00D4]" />
                Total Expenses
              </div>
              <p className="mt-1 text-[20px] font-medium leading-[120%] tracking-[0] text-[#3C3C3C]">
                {formatCurrencyAmount(totalExpenses, totalCurrency, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          }
        />
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardBody className="p-0!">
          <div className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm font-semibold text-[#3C3C3C]">All expenses</div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Search expense"
                  className="h-10 w-[280px] rounded-xl border border-neutral-200 bg-[#F4F4F4] pl-9 pr-3 text-[14px] text-neutral-700 outline-none"
                />
              </div>
              <Select
                value={category}
                onChange={setCategory}
                className="h-10 min-w-[160px] bg-[#F8F8F8] text-[14px] text-[#5A5A5A]"
                options={categoryOptions}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-[#ECECEC] text-left text-[14px] font-medium text-[#5F5F5F]">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </span>
                  </th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Logged by</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA] text-[14px] text-[#4C4C4C]">
                {pagedRows.map((row, index) => (
                  <tr key={`${row.id}-${index}`} className="bg-white">
                    <td className="px-4 py-3 whitespace-nowrap max-w-[120px] truncate" title={row.id}>{row.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.category}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusPill label={row.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatCurrencyAmount(row.amount, row.currency)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.loggedBy}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="rounded-lg p-1 text-[#5A5A5A] hover:bg-neutral-100"
                        aria-label="Open expense details"
                        onClick={() => setSelectedExpense(row)}
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

          <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); }} />
        </CardBody>
      </Card>

      <AddExpensesModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        recordLabelFields
        initialArtistId={user?.id || ''}
        artistOptions={user?.id ? [{ id: user.id, name: titleName }] : []}
        submitLabel="Submit"
        onSubmit={async (payload: NewExpensesPayload) => {
          try {
            let receiptUrl = '';
            if (payload.proofs && payload.proofs.length > 0) {
              receiptUrl = await uploadFile(payload.proofs[0], 'expense');
            }

            await createExpense({
              artistId: payload.artistId,
              expense_date: payload.expense_date,
              category: payload.category,
              currency: payload.currency,
              amount: payload.amount,
              recoupable: payload.recoupable,
              description: payload.description,
              receipt_url: receiptUrl,
            });
            setOpenAdd(false);
          } catch (error) {
            console.error('Create expense failed', error);
          }
        }}
      />

      <Modal
        open={Boolean(selectedExpense)}
        onClose={() => setSelectedExpense(null)}
        headerVariant="none"
        closeVariant="island"
        size="lg"
      >
        {selectedExpense && (
          <div className="overflow-hidden rounded-2xl border border-[#D5D5D5]">
            <div className="border-b border-[#D5D5D5] bg-[#FAFAFA] px-4 py-2 text-xs text-[#6F6F6F]">
              Expenses / {selectedExpense.id}
            </div>

            <div className="p-4">
              <p className="text-[36px] font-semibold leading-none text-[#2F2F2F]">EXP-{selectedExpense.id.length > 8 ? `${selectedExpense.id.slice(0, 8)}…` : selectedExpense.id}</p>

              <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
                <DetailItem
                  icon={<CalendarDays className="h-3.5 w-3.5" />}
                  label="Date"
                  value={selectedExpense.date}
                />
                <DetailItem
                  icon={<UserRound className="h-3.5 w-3.5" />}
                  label="Artist Name"
                  value={selectedExpense.artistName}
                />

                <DetailItem
                  icon={<FileText className="h-3.5 w-3.5" />}
                  label="Status"
                  value={<StatusPill label={selectedExpense.detailStatus} />}
                />
                <DetailItem
                  icon={<UserRound className="h-3.5 w-3.5" />}
                  label="Approved by"
                  value={selectedExpense.approvedBy}
                />

                <DetailItem
                  icon={<FileText className="h-3.5 w-3.5" />}
                  label="Amount"
                  value={formatCurrencyAmount(selectedExpense.amount, selectedExpense.currency)}
                />
                <DetailItem
                  icon={<UserRound className="h-3.5 w-3.5" />}
                  label="Paid by"
                  value={selectedExpense.paidBy}
                />

                <DetailItem
                  icon={<FileText className="h-3.5 w-3.5" />}
                  label="Category"
                  value={selectedExpense.category}
                />
                <DetailItem
                  icon={<FileText className="h-3.5 w-3.5" />}
                  label="Attachment"
                  value={
                    selectedExpense.receiptUrl ? (
                      <a
                        href={selectedExpense.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-[#EEEEEE] px-2 py-1 text-xs text-[#4E4E4E] underline hover:bg-[#E0E0E0]"
                      >
                        View Document
                      </a>
                    ) : (
                      <span className="rounded-md bg-[#EEEEEE] px-2 py-1 text-xs text-[#4E4E4E]">-</span>
                    )
                  }
                />

                <DetailItem
                  icon={<FileText className="h-3.5 w-3.5" />}
                  label="Recoupable"
                  value={
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        selectedExpense.recoupable === 'Yes'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {selectedExpense.recoupable}
                    </span>
                  }
                />
              </div>

              <div className="mt-5 rounded-lg border border-[#D5D5D5] px-3 py-3">
                <p className="text-xs font-medium text-[#8A8A8A]">Description</p>
                <p className="mt-1 text-[13px] leading-5 text-[#4E4E4E]">
                  {selectedExpense.description}
                </p>
              </div>
              {selectedExpense.detailStatus === 'Pending' && (
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    disabled={approving || rejecting}
                    onClick={async () => {
                      setApproving(true);
                      try {
                        await approveExpense(selectedExpense.docId);
                        setSelectedExpense(null);
                      } finally {
                        setApproving(false);
                      }
                    }}
                    className="flex-1 rounded-xl py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: BRAND.purple }}>
                    {approving ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={approving || rejecting}
                    onClick={async () => {
                      setRejecting(true);
                      try {
                        await rejectExpense(selectedExpense.docId);
                        setSelectedExpense(null);
                      } finally {
                        setRejecting(false);
                      }
                    }}
                    className="flex-1 rounded-xl border py-2 text-sm font-medium hover:opacity-80 disabled:opacity-50"
                    style={{ borderColor: BRAND.purple, color: BRAND.purple }}>
                    {rejecting ? 'Rejecting…' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
