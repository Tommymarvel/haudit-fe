'use client';

import { ChartCard } from '@/components/dashboard/ChartCard';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { useExpenses } from '@/hooks/useExpenses';
import { useRecordLabelArtists } from '@/hooks/useRecordLabelArtists';
import { BRAND } from '@/lib/brand';
import { getRecordLabelArtistName } from '@/lib/utils/recordLabelArtist';
import { uploadFile } from '@/lib/utils/upload';
import { deriveSingleCurrency, formatCurrencyAmount } from '@/lib/utils/currency';
import { ArrowUpDown, CalendarDays, FileText, Search, UserRound } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import AddExpensesModal, { NewExpensesPayload } from './AddExpensesModal';
import { StatusPill } from '@/components/ui/StatusPill';
import YearFilterCalendar from '@/components/ui/YearFilterCalendar';
import Modal from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';

type ExpenseStatus = 'Approved' | 'Pending' | 'Rejected';

type ExpenseRow = {
  id: string;
  docId: string;
  date: string;
  artistId: string;
  artistName: string;
  category: string;
  status: ExpenseStatus;
  amount: number;
  currency: string;
  loggedBy: string;
  receiptUrl: string;
  description: string;
};

function normalizeStatus(value?: string): ExpenseStatus {
  const key = (value || '').trim().toLowerCase();
  if (key === 'approved' || key === 'paid' || key === 'repaid') return 'Approved';
  if (key === 'rejected') return 'Rejected';
  return 'Pending';
}

function updateArtistQuery(
  pathname: string,
  searchParams: URLSearchParams,
  artistId: string,
  router: ReturnType<typeof useRouter>
) {
  const next = new URLSearchParams(searchParams.toString());
  next.delete('artist');
  if (artistId === 'all') {
    next.delete('artistId');
  } else {
    next.set('artistId', artistId);
  }
  const query = next.toString();
  router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
}

const RecordLabelExpenses = () => {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRow | null>(null);
  const { expenses, trend, netTotal, createExpense } = useExpenses();
  const { artists } = useRecordLabelArtists();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const artistFromSidebarId = searchParams.get('artistId') || 'all';

  const trendData = useMemo(
    () =>
      (trend ?? []).map((item) => ({
        label: new Date(item.day).toLocaleDateString('en-US', { month: 'short' }),
        date: item.day,
        value: Number(item.amount ?? 0),
      })),
    [trend]
  );

  const rows = useMemo<ExpenseRow[]>(() => {
    const artistById = new Map<string, string>();
    (artists ?? []).forEach((artist) => {
      const artistId = (artist.id || artist._id || '').toString().trim();
      if (!artistId) return;
      const name = getRecordLabelArtistName(artist);
      if (name) artistById.set(artistId, name);
    });

    return (expenses ?? []).map((item, index) => ({
      id: item.ref_id || item._id || `EXP-${index + 1}`,
      docId: item._id || '',
      date: new Date(item.expense_date || item.createdAt)
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        .replace(/ /g, '-'),
      artistId: ((item as { artist_id?: string; artistId?: string }).artist_id ||
        (item as { artist_id?: string; artistId?: string }).artistId ||
        item.user || '') + '',
      artistName:
        (item.user ? artistById.get(item.user) : undefined) ||
        (item as { artist_name?: string; artistName?: string }).artist_name ||
        (item as { artist_name?: string; artistName?: string }).artistName ||
        '-',
      category: item.category || '-',
      status: normalizeStatus((item as { status?: string }).status),
      amount: Number(item.amount ?? 0),
      currency: (item.currency || 'USD').toUpperCase(),
      loggedBy:
        (item as { logged_by?: string; paid_by?: string }).logged_by ||
        (item as { logged_by?: string; paid_by?: string }).paid_by ||
        'Admin',
      receiptUrl: item.receipt_url || '',
      description: item.description || '',
    }));
  }, [expenses, artists]);
  const totalCurrency = useMemo(
    () => deriveSingleCurrency(rows.map((item) => item.currency), 'USD'),
    [rows]
  );

  const artistOptions = useMemo(() => {
    const uniqueById = new Map<string, string>();
    artists.forEach((artist) => {
      const artistId = (artist.id || artist._id || '').toString().trim();
      const artistName = getRecordLabelArtistName(artist);
      if (!artistId || !artistName) return;
      uniqueById.set(artistId, artistName);
    });
    return [{ label: 'All artist', value: 'all' }].concat(
      Array.from(uniqueById.entries()).map(([id, name]) => ({ label: name, value: id }))
    );
  }, [artists]);
  const artistSelectOptions = useMemo(
    () =>
      artistOptions
        .filter((option) => option.value !== 'all')
        .map((option) => ({ id: option.value, name: option.label })),
    [artistOptions]
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

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filteredExpenses = useMemo(() => {
    const search = q.trim().toLowerCase();
    return rows.filter((item) => {
      const matchesArtist =
        artistFromSidebarId === 'all' ||
        item.artistId === '' ||
        item.artistId === artistFromSidebarId;
      const matchesCategory = category === 'all' || item.category === category;
      const matchesSearch =
        search === '' ||
        item.id.toLowerCase().includes(search) ||
        item.artistName.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        item.loggedBy.toLowerCase().includes(search);

      return matchesArtist && matchesCategory && matchesSearch;
    });
  }, [artistFromSidebarId, category, q, rows]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const pagedExpenses = filteredExpenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-[24px] font-medium leading-[120%] text-[#3C3C3C]">
            Artist Expenses
          </h1>
          <p className="mt-1 text-[16px] leading-[120%] text-[#6E6E6E]">
            You are now on the page to manage Record Label artists.
          </p>
        </div>

        <div className="flex w-full gap-3 lg:w-auto">
          <YearFilterCalendar
            value={selectedYear}
            onChange={setSelectedYear}
            label="Year"
            showYear={true}
            buttonClassName="inline-flex items-center gap-2 rounded-2xl bg-[#E9E9E9] px-3 py-2 text-[14px] font-medium text-[#5A5A5A] cursor-pointer hover:bg-[#DCDCDC] transition-colors"
          />

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#E9E9E9] px-3 py-2 text-[14px] font-medium text-[#5A5A5A] cursor-pointer hover:bg-[#DCDCDC] transition-colors"
          >
            Export
          </button>

          <Button
            variant="primary"
            className="rounded-2xl  text-[14px] px-4 font-medium"
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
          bandFill="#E8E8E8"
          lineType="monotone"
          chartMarginTop={48}
          chartOverlay={
            <div className="leading-none">
              <div className="leading-none">
                <div className=" flex items-center gap-2 text-[12px] font-normal leading-[120%] text-[#AAAAAA]">
                  <span className="h-3 w-[2px] rounded bg-[#7B00D4]" />
                  Total Expenses
                </div>
                <p className=" mt-1 text-[20px] font-medium leading-[120%] tracking-[0] text-[#3C3C3C]">
                  {formatCurrencyAmount(netTotal, totalCurrency, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          }
        />
      </div>

      <Card className="mt-8 overflow-hidden">
        <CardBody className="p-0!">
          <div className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-[14px] font-semibold text-[#3C3C3C]">All Expenses</div>

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

              <div className="relative min-w-[160px]">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#707070]" />
                <Select
                  value={artistFromSidebarId}
                  onChange={(value) =>
                    updateArtistQuery(pathname, new URLSearchParams(searchParams.toString()), value, router)
                  }
                  className="h-10 w-full bg-[#F8F8F8] pl-8 text-[14px] text-[#5A5A5A]"
                  options={artistOptions}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-[#ECECEC] text-left text-[16px] font-medium text-[#5F5F5F]">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </span>
                  </th>
                  <th className="px-4 py-3">Artist Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Logged by</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA] text-[16px] text-[#4C4C4C]">
                {pagedExpenses.map((item, index) => (
                  <tr key={`${item.id}-${index}`} className="bg-white">
                    <td className="px-4 py-3 whitespace-nowrap max-w-[120px] truncate" title={item.id}>{item.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.artistName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.category}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusPill label={item.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatCurrencyAmount(item.amount, item.currency)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.loggedBy}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="text-[#1A6FD4] underline text-[14px] hover:opacity-80"
                        onClick={() => setSelectedExpense(item)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-[#777777]">
                      No expenses match this artist/category filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </CardBody>
      </Card>

      <AddExpensesModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        recordLabelFields
        artistOptions={artistSelectOptions}

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
                <div className="grid grid-cols-[16px_1fr] items-start gap-2">
                  <span className="mt-0.5 text-[#8E8E8E]"><CalendarDays className="h-3.5 w-3.5" /></span>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[14px] text-[#777777]">Date</span>
                    <span className="text-[14px] font-medium text-[#2F2F2F]">{selectedExpense.date}</span>
                  </div>
                </div>
                <div className="grid grid-cols-[16px_1fr] items-start gap-2">
                  <span className="mt-0.5 text-[#8E8E8E]"><UserRound className="h-3.5 w-3.5" /></span>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[14px] text-[#777777]">Artist Name</span>
                    <span className="text-[14px] font-medium text-[#2F2F2F]">{selectedExpense.artistName}</span>
                  </div>
                </div>
                <div className="grid grid-cols-[16px_1fr] items-start gap-2">
                  <span className="mt-0.5 text-[#8E8E8E]"><FileText className="h-3.5 w-3.5" /></span>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[14px] text-[#777777]">Status</span>
                    <span className="text-[14px] font-medium text-[#2F2F2F]"><StatusPill label={selectedExpense.status} /></span>
                  </div>
                </div>
                <div className="grid grid-cols-[16px_1fr] items-start gap-2">
                  <span className="mt-0.5 text-[#8E8E8E]"><FileText className="h-3.5 w-3.5" /></span>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[14px] text-[#777777]">Amount</span>
                    <span className="text-[14px] font-medium text-[#2F2F2F]">{formatCurrencyAmount(selectedExpense.amount, selectedExpense.currency)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-[16px_1fr] items-start gap-2">
                  <span className="mt-0.5 text-[#8E8E8E]"><FileText className="h-3.5 w-3.5" /></span>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[14px] text-[#777777]">Category</span>
                    <span className="text-[14px] font-medium text-[#2F2F2F]">{selectedExpense.category}</span>
                  </div>
                </div>
                <div className="grid grid-cols-[16px_1fr] items-start gap-2">
                  <span className="mt-0.5 text-[#8E8E8E]"><FileText className="h-3.5 w-3.5" /></span>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[14px] text-[#777777]">Support Document</span>
                    <span className="text-[14px] font-medium text-[#2F2F2F]">
                      {selectedExpense.receiptUrl ? (
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
                      )}
                    </span>
                  </div>
                </div>
              </div>
              {selectedExpense.description && (
                <div className="mt-5 rounded-lg border border-[#D5D5D5] px-3 py-3">
                  <p className="text-xs font-medium text-[#8A8A8A]">Description</p>
                  <p className="mt-1 text-[13px] leading-5 text-[#4E4E4E]">{selectedExpense.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RecordLabelExpenses;
