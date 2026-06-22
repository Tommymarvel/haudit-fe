'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { StatusPill } from '@/components/ui/StatusPill';
import { useExpenses } from '@/hooks/useExpenses';
import { useRecordLabelArtists } from '@/hooks/useRecordLabelArtists';
import { getRecordLabelArtistName } from '@/lib/utils/recordLabelArtist';
import { uploadFile } from '@/lib/utils/upload';
import { formatCurrencyAmount } from '@/lib/utils/currency';
import {
  ArrowUpDown,
  CalendarDays,
  CircleDollarSign,
  FileText,
  MoreVertical,
  Search,
  UserRound,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import AddExpensesModal, { NewExpensesPayload } from './AddExpensesModal';
import YearFilterCalendar from '@/components/ui/YearFilterCalendar';
import Modal from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import Image from 'next/image';
import { toast } from 'react-toastify';

type ExpenseStatus = 'Paid' | 'Approved' | 'Pending' | 'Rejected';
type StatusUpdateValue = 'paid' | 'approved' | 'pending' | 'rejected';

type ExpenseRow = {
  id: string;
  docId: string;
  date: string;
  year: number;
  artistId: string;
  artistName: string;
  advanceType: string;
  status: ExpenseStatus;
  amount: number;
  currency: string;
  loggedBy: string;
  receiptUrl: string;
  description: string;
  recoupable: string;
  approvedBy: string;
};

const STATUS_UPDATE_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Paid', value: 'paid' },
];

function normalizeStatus(value?: string): ExpenseStatus {
  const key = (value || '').trim().toLowerCase();
  if (key === 'paid' || key === 'repaid') return 'Paid';
  if (key === 'approved') return 'Approved';
  if (key === 'rejected') return 'Rejected';
  return 'Pending';
}


const advanceTypeOptions = [
  { label: 'All types', value: 'all' },
  { label: 'Personal', value: 'personal' },
  { label: 'Marketing', value: 'marketting' },
];

function LoggedByBadge({ loggedBy }: { loggedBy: string }) {
  const normalized = loggedBy.toLowerCase();
  const isLabel = normalized === 'record_label' || normalized === 'admin' || normalized === 'label';
  if (isLabel) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3E8FF] px-3 py-1 text-xs font-medium text-[#7B00D4]">
        <FileText className="h-3.5 w-3.5" />
        Logged by Label
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF3E0] px-3 py-1 text-xs font-medium text-[#F59E0B]">
      <UserRound className="h-3.5 w-3.5" />
      Logged by Artist
    </span>
  );
}

const RecordLabelExpenses = () => {
  const [q, setQ] = useState('');
  const [advanceTypeFilter, setAdvanceTypeFilter] = useState('all');
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRow | null>(null);
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [statusRow, setStatusRow] = useState<ExpenseRow | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<StatusUpdateValue>('pending');
  const [statusDescription, setStatusDescription] = useState('');
  const [rowStatusOverrides, setRowStatusOverrides] = useState<Record<string, ExpenseStatus>>({});
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { expenses, createExpense, updateExpenseStatus } = useExpenses();
  const { artists } = useRecordLabelArtists();
  const searchParams = useSearchParams();

  const artistFromSidebarId = searchParams.get('artistId') || 'all';

  const rows = useMemo<ExpenseRow[]>(() => {
    const artistById = new Map<string, string>();
    (artists ?? []).forEach((artist) => {
      const artistId = (artist.id || artist._id || '').toString().trim();
      const name = getRecordLabelArtistName(artist);
      if (artistId && name) artistById.set(artistId, name);
    });

    return (expenses ?? []).map((item, index) => {
      const id = (item as { ref_id?: string }).ref_id || item._id || `EXP-${index + 1}`;
      const docId = item._id || '';
      const raw = item as unknown as Record<string, unknown>;
      return {
        id,
        docId,
        date: new Date((raw.expense_date as string) || (raw.createdAt as string))
          .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          .replace(/ /g, '-'),
        year: new Date((raw.expense_date as string) || (raw.createdAt as string)).getFullYear(),
        artistId: ((raw.artist_id || raw.artistId || raw.user || '') as string).toString(),
        artistName:
          (raw.user ? artistById.get(raw.user as string) : undefined) ||
          (raw.artist_name as string) ||
          (raw.artistName as string) || '-',
        advanceType: (raw.advance_type as string) || (raw.category as string) || '-',
        status: rowStatusOverrides[docId] || normalizeStatus((raw.status as string) || ''),
        amount: Number(raw.amount ?? 0),
        currency: ((raw.currency as string) || 'USD').toUpperCase(),
        loggedBy: (raw.initiated_by as string) || (raw.logged_by as string) || (raw.paid_by as string) || '-',
        receiptUrl: (raw.receipt_url as string) || '',
        description: (raw.description as string) || '',
        recoupable: (raw.recoupable as string) || '',
        approvedBy: (raw.approved_by as string) || (raw.approvedBy as string) || '',
      };
    });
  }, [expenses, artists, rowStatusOverrides]);

  const artistSelectOptions = useMemo(() => {
    const uniqueById = new Map<string, string>();
    artists.forEach((artist) => {
      const artistId = (artist.id || artist._id || '').toString().trim();
      const artistName = getRecordLabelArtistName(artist);
      if (artistId && artistName) uniqueById.set(artistId, artistName);
    });
    return Array.from(uniqueById.entries()).map(([id, name]) => ({ id, name }));
  }, [artists]);

  // "Logged by" filter options derived from rows
  const loggedByOptions = useMemo(() => {
    const unique = Array.from(new Set(rows.map((r) => r.loggedBy)));
    return [{ label: 'Logged by', value: 'all' }, ...unique.map((v) => ({ label: v, value: v }))];
  }, [rows]);

  const [loggedByFilter, setLoggedByFilter] = useState('all');

  const filteredExpenses = useMemo(() => {
    const search = q.trim().toLowerCase();
    return rows.filter((item) => {
      const matchesYear = !selectedYear || item.year === selectedYear;
      const matchesArtist = artistFromSidebarId === 'all' || item.artistId === '' || item.artistId === artistFromSidebarId;
      const matchesAdvanceType = advanceTypeFilter === 'all' || item.advanceType.toLowerCase() === advanceTypeFilter;
      const matchesLoggedBy = loggedByFilter === 'all' || item.loggedBy === loggedByFilter;
      const matchesSearch =
        search === '' ||
        item.id.toLowerCase().includes(search) ||
        item.artistName.toLowerCase().includes(search) ||
        item.advanceType.toLowerCase().includes(search) ||
        item.loggedBy.toLowerCase().includes(search);
      return matchesYear && matchesArtist && matchesAdvanceType && matchesLoggedBy && matchesSearch;
    });
  }, [artistFromSidebarId, advanceTypeFilter, loggedByFilter, q, rows, selectedYear]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const pagedExpenses = filteredExpenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (!menuOpenForId) return;
    const close = () => { setMenuOpenForId(null); setMenuPosition(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpenForId]);

  // Menu portal helpers
  const openRowMenu = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mw = 180;
    const vp = 8;
    const left = Math.max(vp, Math.min(rect.right - mw, window.innerWidth - mw - vp));
    setMenuPosition({ top: rect.bottom + 6, left });
    setMenuOpenForId((prev) => (prev === id ? null : id));
  };

  // Status update logic
  const openStatusModal = (row: ExpenseRow) => {
    setStatusRow(row);
    setStatusUpdate(row.status.toLowerCase() as StatusUpdateValue);
    setStatusDescription('');
    setMenuOpenForId(null);
  };

  const submitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusRow) return;
    if (!statusDescription.trim()) { toast.error('Description is required'); return; }

    try {
      await updateExpenseStatus(statusRow.docId, {
        status: statusUpdate,
        status_desc: statusDescription.trim(),
      });
      const newStatus: ExpenseStatus =
        statusUpdate === 'approved' ? 'Approved' :
        statusUpdate === 'rejected' ? 'Rejected' :
        statusUpdate === 'paid' ? 'Paid' : 'Pending';
      setRowStatusOverrides((prev) => ({ ...prev, [statusRow.docId]: newStatus }));
      setStatusRow(null);
    } catch {
      // error already toasted by hook
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-[24px] font-medium leading-[120%] text-[#3C3C3C]">Artist Expenses</h1>
          <p className="mt-1 text-[16px] leading-[120%] text-[#6E6E6E]">
            Manage and add expenses for artists on your roster
          </p>
        </div>
        <div className="flex w-full gap-3 lg:w-auto">
          <YearFilterCalendar
            value={selectedYear}
            onChange={setSelectedYear}
            label="Year"
            showYear={true}
            buttonClassName="inline-flex items-center gap-2 rounded-2xl bg-[#E9E9E9] px-3 py-2 text-[14px] font-medium text-[#5A5A5A]"
          />
          <button
            type="button"
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#7B00D4] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#6A00B8]"
          >
            Add New Expenses
          </button>
        </div>
      </div>

      {/* Table card */}
      <Card className="mt-8 overflow-hidden">
        <CardBody className="p-0!">
          <div className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-[14px] font-semibold text-[#3C3C3C]">Expenses</div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search expense"
                  className="h-9 w-[240px] rounded-xl border border-neutral-200 bg-[#F4F4F4] pl-9 pr-3 text-[13px] text-neutral-700 outline-none"
                />
              </div>
              <Select
                value={loggedByFilter}
                onChange={setLoggedByFilter}
                className="h-9 min-w-[130px] bg-white text-[13px]"
                options={loggedByOptions}
              />
              <Select
                value={advanceTypeFilter}
                onChange={setAdvanceTypeFilter}
                className="h-9 min-w-[150px] bg-white text-[13px]"
                options={advanceTypeOptions}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-[#F4F4F4] text-left text-[14px] font-medium text-[#5F5F5F]">
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
              <tbody className="divide-y divide-[#EAEAEA] text-[14px] text-[#4C4C4C]">
                {pagedExpenses.map((item, index) => (
                  <tr key={`${item.id}-${index}`} className="bg-white">
                    <td className="max-w-[140px] truncate px-4 py-3 whitespace-nowrap" title={item.id}>{item.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.date}</td>
                    <td className="px-4 py-3 capitalize whitespace-nowrap">{item.advanceType === 'marketting' ? 'Marketing' : item.advanceType}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusPill label={item.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatCurrencyAmount(item.amount, item.currency)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap capitalize">{item.loggedBy}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => openRowMenu(e, item.id)}
                        className="text-[#9C9C9C] hover:text-[#7B00D4]"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-[#777777]">
                      No expenses match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </CardBody>
      </Card>

      {/* Row actions menu portal */}
      {menuOpenForId && menuPosition
        ? createPortal(
            <div
              style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left }}
              className="z-[130] w-[180px] rounded-xl border border-[#E2E2E2] bg-white p-2 shadow-lg"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {(() => {
                const menuRow = filteredExpenses.find((r) => r.id === menuOpenForId);
                if (!menuRow) return null;
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => { setSelectedExpense(menuRow); setMenuOpenForId(null); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#494F59] hover:bg-[#F6F7F9]"
                    >
                      <span className="font-medium">View details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openStatusModal(menuRow)}
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

      {/* Add Expenses Modal */}
      <AddExpensesModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        recordLabelFields
        artistOptions={artistSelectOptions}
        onSubmit={async (payload: NewExpensesPayload) => {
          let receiptUrl = '';
          if (payload.proofs && payload.proofs.length > 0) {
            receiptUrl = await uploadFile(payload.proofs[0], 'expense');
          }
          await createExpense({
            artistId: payload.artistId,
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

      {/* Expense Details Modal */}
      <Modal
        open={Boolean(selectedExpense)}
        onClose={() => setSelectedExpense(null)}
        headerVariant="none"
        closeVariant="island"
        size="lg"
      >
        {selectedExpense && (
          <div className="overflow-hidden rounded-3xl border border-[#DBDBDB] bg-white">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-[#DBDBDB] bg-[#FAFAFA] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#3F3F3F]">Expenses / {selectedExpense.id}</span>
                <LoggedByBadge loggedBy={selectedExpense.loggedBy} />
              </div>
              <button
                type="button"
                onClick={() => { openStatusModal(selectedExpense); setSelectedExpense(null); }}
                className="rounded-full bg-[#7B00D4] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#6A00B8]"
              >
                Update status
              </button>
            </div>

            <div className="p-5">
              <p className="text-xl font-bold text-[#2F2F2F]">{selectedExpense.id}</p>

              {/* Detail grid */}
              <div className="mt-4 grid grid-cols-1 gap-x-10 gap-y-3 md:grid-cols-2">
                {/* Left column */}
                <div className="space-y-3">
                  <DetailRow icon={<CalendarDays className="h-4 w-4" />} label="Date" value={selectedExpense.date} />
                  <DetailRow icon={<CircleDollarSign className="h-4 w-4" />} label="Amount" value={<span className="font-semibold">{formatCurrencyAmount(selectedExpense.amount, selectedExpense.currency)}</span>} />
                  <DetailRow icon={<FileText className="h-4 w-4" />} label="Advance Type" value={selectedExpense.advanceType === 'marketting' ? 'Marketing' : selectedExpense.advanceType} />
                  <DetailRow icon={<FileText className="h-4 w-4" />} label="Status" value={<StatusPill label={selectedExpense.status} />} />
                </div>
                {/* Right column */}
                <div className="space-y-3">
                  <DetailRow icon={<UserRound className="h-4 w-4" />} label="Artist Name" value={selectedExpense.artistName} />
                  {selectedExpense.approvedBy && (
                    <DetailRow
                      icon={<UserRound className="h-4 w-4" />}
                      label="Approved by"
                      value={selectedExpense.approvedBy}
                    />
                  )}
                  {selectedExpense.recoupable && (
                    <DetailRow
                      icon={<FileText className="h-4 w-4" />}
                      label="Recoupable"
                      value={
                        <span className="rounded-md bg-[#ECFDF5] px-2.5 py-0.5 text-xs font-medium text-[#065F46]">
                          {selectedExpense.recoupable}
                        </span>
                      }
                    />
                  )}
                </div>
              </div>

              {/* Attachment */}
              {selectedExpense.receiptUrl && (
                <div className="mt-5">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-[#5A5A5A]">
                    <span className="text-[#B0B0B0]">🔗</span> Attachment
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href={selectedExpense.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-[#D5D5D5] px-3 py-1.5 text-xs text-[#4E4E4E] hover:bg-[#F5F5F5]"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#9C9C9C]" />
                      View receipt
                    </a>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedExpense.description && (
                <div className="mt-5 border-t border-[#F0F0F0] pt-4">
                  <p className="text-sm font-medium text-[#8A8A8A]">Description</p>
                  <p className="mt-1.5 text-[13px] leading-6 text-[#4E4E4E]">
                    {selectedExpense.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal
        open={Boolean(statusRow)}
        onClose={() => setStatusRow(null)}
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
            Fill out form to update Expenses logged.
          </p>

          <form className="mt-5 space-y-4" onSubmit={submitStatus}>
            <div>
              <label className="text-sm font-medium text-[#2D2D2D]">Status</label>
              <div className="mt-1.5">
                <Select
                  value={statusUpdate}
                  onChange={(v) => setStatusUpdate(v as StatusUpdateValue)}
                  options={STATUS_UPDATE_OPTIONS}
                  placeholder="Select status"
                  className="h-11 rounded-xl border border-[#B9B9B9] bg-white text-sm"
                />
              </div>
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
              className="h-11 w-full rounded-xl bg-[#7B00D4] text-sm font-medium text-white"
            >
              Submit
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[18px_1fr] items-start gap-2">
      <span className="mt-0.5 text-[#8E8E8E]">{icon}</span>
      <div className="flex items-start justify-between gap-3">
        <span className="shrink-0 text-[13px] text-[#777777]">{label}</span>
        <span className="text-right text-[13px] font-medium text-[#2F2F2F]">{value}</span>
      </div>
    </div>
  );
}

export default RecordLabelExpenses;
