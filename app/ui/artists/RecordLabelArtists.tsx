'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronsUpDown,
  CircleDollarSign,
  Info,
  Loader2,
  MoreVertical,
  Music2,
  Receipt,
  RefreshCcw,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { ChartCard } from '@/components/dashboard/ChartCard';
import Modal from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { TagInput } from '@/components/ui/TagInput';
import YearFilterCalendar from '@/components/ui/YearFilterCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { useAdvance } from '@/hooks/useAdvance';
import { useExpenses } from '@/hooks/useExpenses';
import { useRecordLabelArtists } from '@/hooks/useRecordLabelArtists';
import { useRoyalty } from '@/hooks/useRoyalty';
import { Advance } from '@/lib/types/advance';
import type { RecordLabelArtist } from '@/lib/types/record-label';
import { getRecordLabelArtistName } from '@/lib/utils/recordLabelArtist';
import { toast } from 'react-toastify';
import axiosInstance from '@/lib/axiosinstance';
import { uploadFile } from '@/lib/utils/upload';
import AddExpensesModal from '../expenses/AddExpensesModal';

type ArtistRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateAdded: string;
  tracks: number;
  status: ArtistStatus;
};

type ArtistStatus = 'active' | 'inactive' | 'archived';

type ArtistView = 'list' | 'performance' | 'profile';

type AddArtistPayload = {
  name: string;
  email: string;
  otherNames: string[];
  phone: string;
  accountNumber: string;
  bank: string;
  accountName: string;
  personalAmount: string;
  personalCurrency: string;
  marketingAmount: string;
  marketingCurrency: string;
};

const ARTISTS_PAGE_SIZE = 8;

function formatCurrency(amount: number) {
  if (!Number.isFinite(amount)) return '$0';
  return `$${amount.toLocaleString()}`;
}

function getAdvanceRepaidAmount(advance: Advance) {
  const amount = Number(advance.amount) || 0;
  const repaid = Number(advance.repaid_amount) || 0;
  if (repaid > 0) return Math.min(repaid, amount);
  const status = (advance.repayment_status || '').trim().toLowerCase();
  if (status === 'paid' || status === 'repaid' || status === 'approved') return amount;
  return 0;
}

function aggregateDailySeriesByMonth(
  points: Array<{ day: string; value: number }>
): Array<{ label: string; value: number }> {
  const monthMap = new Map<string, { label: string; value: number }>();

  points.forEach((point) => {
    const parsed = new Date(point.day);
    if (Number.isNaN(parsed.getTime())) return;
    const key = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}`;
    const current = monthMap.get(key);
    if (current) {
      current.value += Number(point.value || 0);
      return;
    }
    monthMap.set(key, {
      label: parsed.toLocaleDateString('en-US', { month: 'short' }),
      value: Number(point.value || 0),
    });
  });

  return Array.from(monthMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value);
}

function formatDateAdded(value?: string) {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--';
  return parsed.toLocaleDateString('en-GB');
}

const normalizeArtistStatus = (value?: string): ArtistStatus => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'inactive') return 'inactive';
  if (normalized === 'archived') return 'archived';
  return 'active';
};

function mapArtistRow(artist: RecordLabelArtist, index: number): ArtistRow {
  return {
    id: artist.id || artist._id || `artist-${index}`,
    name: getRecordLabelArtistName(artist) || 'Unknown Artist',
    email: artist.email?.trim() || '--',
    phone: artist.phn_no?.trim() || '--',
    dateAdded: formatDateAdded(artist.date_added),
    tracks: Number.isFinite(artist.no_of_tracks) ? Number(artist.no_of_tracks) : 0,
    status: normalizeArtistStatus(artist.status),
  };
}

function getPaginationTokens(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 1) return [1];
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const tokens: Array<number | 'ellipsis'> = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);

  if (left > 2) tokens.push('ellipsis');
  for (let page = left; page <= right; page += 1) {
    tokens.push(page);
  }
  if (right < totalPages - 1) tokens.push('ellipsis');
  tokens.push(totalPages);

  return tokens;
}

function addArtistQueryState(
  pathname: string,
  current: URLSearchParams,
  artistId?: string,
  view?: Exclude<ArtistView, 'list'>,
) {
  const next = new URLSearchParams(current.toString());
  next.delete('artist');
  if (!artistId) {
    next.delete('artistId');
    next.delete('view');
  } else {
    next.set('artistId', artistId);
    if (view) {
      next.set('view', view);
    } else {
      next.delete('view');
    }
  }
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

const PHONE_CODES = [
  { label: '🇳🇬 +234', value: '+234' },
  { label: '🇺🇸 +1',   value: '+1'   },
  { label: '🇬🇧 +44',  value: '+44'  },
  { label: '🇬🇭 +233', value: '+233' },
  { label: '🇿🇦 +27',  value: '+27'  },
  { label: '🇰🇪 +254', value: '+254' },
];

const CURRENCIES = [
  { label: 'USD', value: 'USD' },
  { label: 'NGN', value: 'NGN' },
];

function InlineDropdown({
  value,
  onChange,
  options,
  menuWidth = 'w-32',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  menuWidth?: string;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        zIndex: 9999,
      });
    }
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={triggerRef} className="shrink-0 border-r border-[#B6B6B6]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 items-center gap-1.5 rounded-l-xl bg-[#F9F9F9] px-3 text-sm text-[#4A4A4A] outline-none"
      >
        <span>{selected.label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#4A4A4A]" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className={`${menuWidth} overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg`}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                opt.value === value
                  ? 'bg-[#7B00D4] text-white'
                  : 'text-neutral-700 hover:bg-[#EDE1FF] hover:text-[#7B00D4]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

function AddArtistModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AddArtistPayload) => Promise<void>;
}) {
  const [form, setForm] = useState<AddArtistPayload>({
    name: '',
    email: '',
    otherNames: [],
    phone: '',
    accountNumber: '',
    bank: '',
    accountName: '',
    personalAmount: '',
    personalCurrency: 'USD',
    marketingAmount: '',
    marketingCurrency: 'USD',
  });
  const [bankCode, setBankCode] = useState('');
  const [banks, setBanks] = useState<{ label: string; value: string; code: string }[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+234');
  const [phoneError, setPhoneError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    axiosInstance
      .get('/payments/listbanks', { params: { currency: 'NGN' } })
      .then((res) => {
        const raw = res.data;
        const list: Array<{ name: string; code: string }> = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.result)
            ? raw.result
            : Array.isArray(raw?.data)
              ? raw.data
              : [];
        setBanks(list.map((b) => ({ label: b.name, value: b.name, code: b.code })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (form.accountNumber.length !== 10 || !bankCode) return;

    debounceRef.current = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await axiosInstance.get('/payments/validateacc', {
          params: { acc_no: form.accountNumber, bank_code: bankCode, currency: 'NGN' },
        });
        const raw = res.data;
        const name: string = raw?.result?.account_name ?? raw?.account_name ?? '';
        setForm((prev) => ({ ...prev, accountName: name }));
      } catch {
        setForm((prev) => ({ ...prev, accountName: '' }));
      } finally {
        setVerifying(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.accountNumber, bankCode]);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const isValidPhone = (digits: string) => /^\d{7,11}$/.test(digits.replace(/^0/, ''));

  const canSubmit =
    form.name.trim() !== '' &&
    form.email.trim() !== '' &&
    isValidEmail(form.email) &&
    form.phone.trim() !== '' &&
    isValidPhone(form.phone) &&
    form.accountNumber.trim() !== '' &&
    form.bank.trim() !== '' &&
    form.accountName.trim() !== '';

  const handleChange = (key: keyof AddArtistPayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    const normalizedDigits = form.phone.replace(/^0/, '');
    const fullPhone = `${phoneCountryCode}${normalizedDigits}`;
    try {
      setIsSubmitting(true);
      await onSubmit({ ...form, phone: fullPhone });
      onClose();
      setForm({
        name: '',
        email: '',
        otherNames: [],
        phone: '',
        accountNumber: '',
        bank: '',
        accountName: '',
        personalAmount: '',
        personalCurrency: 'USD',
        marketingAmount: '',
        marketingCurrency: 'USD',
      });
      setBankCode('');
      setPhoneCountryCode('+234');
      setPhoneError('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} headerVariant="none" closeVariant="island" size="md">
      <div className="px-6 py-7">
        <div className="mb-6 text-center">
          <div className="flex justify-center">
            <Image src="/haudit-logo.svg" alt="Haudit" width={32} height={32} />
          </div>
          <h3 className="mt-2 text-[26px] font-semibold text-[#1F1F1F]">Onboard Artist</h3>
          <p className="text-sm text-[#9A9A9A]">Fill in all necessary details to onboard new artists.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#5A5A5A]">Name</label>
            <input
              value={form.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="Enter artist fullname"
              className="h-11 w-full rounded-xl border border-[#B6B6B6] px-3 text-sm outline-none focus:border-[#7B00D4]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#5A5A5A]">Email Address</label>
            <input
              value={form.email}
              onChange={(event) => {
                handleChange('email', event.target.value);
                if (emailError) setEmailError(isValidEmail(event.target.value) ? '' : 'Enter a valid email address');
              }}
              onBlur={() => setEmailError(form.email.trim() && !isValidEmail(form.email) ? 'Enter a valid email address' : '')}
              placeholder="Enter artist email address"
              className={`h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-[#7B00D4] ${emailError ? 'border-rose-500' : 'border-[#B6B6B6]'}`}
            />
            {emailError && <p className="mt-1 text-xs text-rose-600">{emailError}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#5A5A5A]">Other names Artist is known by</label>
            <TagInput
              value={form.otherNames}
              onChange={(next) => setForm((prev) => ({ ...prev, otherNames: next }))}
              placeholder="Enter artist other names"
            />
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-[#FFF3D6] px-3 py-2 text-[11px] text-[#D39A16]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Include artist stage names, and any other AKAs and alias. For example (Wizkid, Starboy, Machala)</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#5A5A5A]">Phone Number</label>
            <div className={`flex h-11 w-full rounded-xl border focus-within:border-[#7B00D4] ${phoneError ? 'border-rose-500' : 'border-[#B6B6B6]'}`}>
              <InlineDropdown value={phoneCountryCode} onChange={setPhoneCountryCode} options={PHONE_CODES} menuWidth="w-36" />
              <input
                value={form.phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                  handleChange('phone', digits);
                  if (phoneError) setPhoneError(digits && !isValidPhone(digits) ? 'Enter a valid phone number' : '');
                }}
                onBlur={() => setPhoneError(form.phone && !isValidPhone(form.phone) ? 'Enter a valid phone number' : '')}
                inputMode="numeric"
                placeholder="08012345678"
                className="h-full flex-1 bg-transparent px-3 text-sm outline-none"
              />
            </div>
            {phoneError && <p className="mt-1 text-xs text-rose-600">{phoneError}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#5A5A5A]">Account Number</label>
            <input
              value={form.accountNumber}
              onChange={(event) => handleChange('accountNumber', event.target.value)}
              placeholder="Enter your account number"
              className="h-11 w-full rounded-xl border border-[#B6B6B6] px-3 text-sm outline-none focus:border-[#7B00D4]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#5A5A5A]">Bank</label>
            <Select
              value={form.bank}
              onChange={(value) => {
                handleChange('bank', value);
                const found = banks.find((b) => b.value === value);
                setBankCode(found?.code ?? '');
                handleChange('accountName', '');
              }}
              className="h-11 rounded-xl border-[#B6B6B6] bg-white text-sm text-[#4A4A4A] focus:border-[#7B00D4] focus:ring-1 focus:ring-[#7B00D4]"
              options={banks}
              placeholder={banks.length === 0 ? 'Loading banks...' : 'Select bank'}
              disabled={banks.length === 0}
              searchable
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#5A5A5A]">Account Name</label>
            <div className="relative">
              <input
                value={form.accountName}
                readOnly
                placeholder={verifying ? 'Verifying...' : 'Auto-filled after verification'}
                className="h-11 w-full rounded-xl border border-[#B6B6B6] bg-[#F5F5F5] px-3 pr-10 text-sm outline-none cursor-not-allowed"
              />
              {verifying && (
                <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#5A5A5A]">Personal Advance (optional)</label>
            <div className="flex h-11 w-full rounded-xl border border-[#B6B6B6] focus-within:border-[#7B00D4]">
              <InlineDropdown value={form.personalCurrency} onChange={(v) => handleChange('personalCurrency', v)} options={CURRENCIES} menuWidth="w-20" />
              <input
                value={form.personalAmount}
                onChange={(event) => handleChange('personalAmount', event.target.value)}
                placeholder="Enter amount"
                type="number"
                min="0"
                className="h-full flex-1 bg-transparent px-3 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#5A5A5A]">Marketing Advance (optional)</label>
            <div className="flex h-11 w-full rounded-xl border border-[#B6B6B6] focus-within:border-[#7B00D4]">
              <InlineDropdown value={form.marketingCurrency} onChange={(v) => handleChange('marketingCurrency', v)} options={CURRENCIES} menuWidth="w-20" />
              <input
                value={form.marketingAmount}
                onChange={(event) => handleChange('marketingAmount', event.target.value)}
                placeholder="Enter amount"
                type="number"
                min="0"
                className="h-full flex-1 bg-transparent px-3 text-sm outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="mt-6 h-10 w-full rounded-xl bg-[#7B00D4] text-sm font-medium text-white transition hover:bg-[#6900B5] disabled:cursor-not-allowed disabled:bg-[#B5B5B5]"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </Modal>
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
    <div className="min-w-[240px] shrink-0 rounded-2xl border border-[#D5D5D5] bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[30px] font-semibold leading-none text-[#3C3C3C]">{value}</p>
          <p className="mt-2 text-xs text-[#8B8B8B]">{label}</p>
        </div>
        <div className="rounded-full border border-[#E6D6F8] p-2 text-[#7B00D4]">{icon}</div>
      </div>
    </div>
  );
}

function EligibleAdvanceCard({
  value,
  label,
  balanceValue,
  balanceColor,
  onBalance,
}: {
  value: string;
  label: string;
  balanceValue: string;
  balanceColor: string;
  onBalance: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#D5D5D5] bg-white p-4">
      <p className="text-[26px] font-semibold leading-none text-[#3C3C3C]">{value}</p>
      <p className="mt-1 text-xs text-[#8B8B8B]">{label}</p>
      <button
        type="button"
        onClick={onBalance}
        style={{ color: balanceColor }}
        className="mt-3 text-xs font-medium underline-offset-2 hover:underline"
      >
        Balance Advance: {balanceValue}
      </button>
    </div>
  );
}

function UpdateEligibleAdvanceModal({
  open,
  onClose,
  type,
  artistId,
}: {
  open: boolean;
  onClose: () => void;
  type: 'personal' | 'marketing';
  artistId: string;
}) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!amount.trim() || !artistId || isSubmitting) return;
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    try {
      setIsSubmitting(true);
      const field = type === 'personal' ? 'eligible_personal_advance' : 'eligible_marketing_advance';
      await axiosInstance.patch(`/record-label/artists/${artistId}`, { [field]: parsed });
      toast.success(`Eligible ${type} advance updated`);
      handleClose();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update advance limit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} headerVariant="none" closeVariant="island" size="md">
      <div className="px-6 py-7">
        <div className="mb-6 text-center">
          <div className="flex justify-center">
            <Image src="/haudit-logo.svg" alt="Haudit" width={32} height={32} />
          </div>
          <h3 className="mt-2 text-[22px] font-semibold text-[#1F1F1F]">
            Update Eligible {type === 'personal' ? 'Personal' : 'Marketing'} Advance
          </h3>
          <p className="text-sm text-[#9A9A9A]">
            Set the maximum {type} advance limit for this artist
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#5A5A5A]">Amount (USD)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            placeholder="Enter amount"
            className="h-11 w-full rounded-xl border border-[#B6B6B6] px-3 text-sm outline-none focus:border-[#7B00D4]"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!amount.trim() || isSubmitting}
          className="mt-6 h-10 w-full rounded-xl bg-[#7B00D4] text-sm font-medium text-white transition hover:bg-[#6900B5] disabled:cursor-not-allowed disabled:bg-[#B5B5B5]"
        >
          {isSubmitting ? 'Updating...' : 'Update'}
        </button>
      </div>
    </Modal>
  );
}

export default function RecordLabelArtists() {
  const { user } = useAuth();
  const { dashboardMetrics, albumPerformance, albumRevenue } = useRoyalty();
  const { advances = [], overview } = useAdvance();
  const { expenses = [] } = useExpenses();
  const {
    artists: artistsResponse,
    isLoading: artistsLoading,
    inviteArtist,
    archiveArtist,
    unarchiveArtist,
  } = useRecordLabelArtists();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuRootRef = useRef<HTMLDivElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; placement: 'up' | 'down' } | null>(null);

  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
  const [openAddArtist, setOpenAddArtist] = useState(false);
  const [openPersonalAdvanceModal, setOpenPersonalAdvanceModal] = useState(false);
  const [openMarketingAdvanceModal, setOpenMarketingAdvanceModal] = useState(false);
  const [openRecordExpense, setOpenRecordExpense] = useState(false);
  const [profileMoreOpen, setProfileMoreOpen] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseLoggedBy, setExpenseLoggedBy] = useState('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [pendingArtistActionId, setPendingArtistActionId] = useState<string | null>(null);
  const [nameSortDirection, setNameSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | ArtistStatus>('all');

  const artists = useMemo(
    () => artistsResponse.map((artist, index) => mapArtistRow(artist, index)),
    [artistsResponse],
  );

  const sortedArtists = useMemo(() => {
    const filtered = statusFilter === 'all'
      ? artists
      : artists.filter((a) => a.status === statusFilter);
    return [...filtered].sort((a, b) => {
      const nameComparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      if (nameComparison !== 0) {
        return nameSortDirection === 'asc' ? nameComparison : -nameComparison;
      }
      const idComparison = a.id.localeCompare(b.id, undefined, { sensitivity: 'base' });
      return nameSortDirection === 'asc' ? idComparison : -idComparison;
    });
  }, [artists, nameSortDirection, statusFilter]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedArtists.length / ARTISTS_PAGE_SIZE)),
    [sortedArtists.length],
  );

  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStartIndex = sortedArtists.length === 0 ? 0 : (currentPageSafe - 1) * ARTISTS_PAGE_SIZE;
  const paginatedArtists = useMemo(
    () => sortedArtists.slice(pageStartIndex, pageStartIndex + ARTISTS_PAGE_SIZE),
    [pageStartIndex, sortedArtists],
  );
  const paginationTokens = useMemo(
    () => getPaginationTokens(currentPageSafe, totalPages),
    [currentPageSafe, totalPages],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!menuOpenForId) return;

    const updateMenuPosition = () => {
      if (!menuAnchorEl) return;
      const rect = menuAnchorEl.getBoundingClientRect();
      const menuWidth = 170;
      const estimatedMenuHeight = 180;
      const gap = 6;
      const viewportPadding = 8;

      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const placement: 'up' | 'down' =
        spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow ? 'up' : 'down';

      const top = placement === 'down' ? rect.bottom + gap : rect.top - gap;
      const left = Math.max(viewportPadding, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - viewportPadding));

      setMenuPosition({ top, left, placement });
    };

    updateMenuPosition();

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRootRef.current?.contains(target)) return;
      if (menuAnchorEl?.contains(target)) return;
      setMenuOpenForId(null);
      setMenuAnchorEl(null);
      setMenuPosition(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpenForId(null);
        setMenuAnchorEl(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [menuOpenForId, menuAnchorEl]);

  useEffect(() => {
    if (!profileMoreOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setProfileMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileMoreOpen]);

  const selectedArtistId = (searchParams.get('artistId') || searchParams.get('id') || '').trim();
  const selectedViewParam = searchParams.get('view');
  const activeView: ArtistView = !selectedArtistId
    ? 'list'
    : selectedViewParam === 'performance'
      ? 'performance'
      : selectedViewParam === 'profile'
        ? 'profile'
        : 'list';

  const activeArtist = useMemo(
    () =>
      artists.find((artist) => artist.id === selectedArtistId) ?? {
        id: 'external',
        name: `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Artist',
        email: user?.email ?? 'artist@haudit.io',
        phone: '+234 000 000 0000',
        dateAdded: '01/01/2025',
        tracks: 0,
        status: 'active' as ArtistStatus,
      },
    [artists, selectedArtistId, user],
  );

  const selectedArtistRecord = useMemo(
    () => artistsResponse.find((artist) => (artist.id || artist._id) === selectedArtistId),
    [artistsResponse, selectedArtistId],
  );

  const eligiblePersonal = useMemo(
    () => advances
      .filter((a) => (a.status === 'approved') && (a.advance_type === 'personal'))
      .reduce((s, a) => s + Number(a.amount || 0), 0),
    [advances],
  );
  const eligibleMarketing = useMemo(
    () => advances
      .filter((a) => (a.status === 'approved') && (a.advance_type === 'marketting'))
      .reduce((s, a) => s + Number(a.amount || 0), 0),
    [advances],
  );
  const balancePersonal = useMemo(
    () => advances
      .filter((a) => (a.status === 'approved') && (a.advance_type === 'personal') && (a.repayment_status !== 'repaid'))
      .reduce((s, a) => s + Number(a.amount || 0), 0),
    [advances],
  );
  const balanceMarketing = useMemo(
    () => advances
      .filter((a) => (a.status === 'approved') && (a.advance_type === 'marketting') && (a.repayment_status !== 'repaid'))
      .reduce((s, a) => s + Number(a.amount || 0), 0),
    [advances],
  );

  const totalExpenses = useMemo(
    () => (expenses ?? []).reduce((sum, e) => sum + Number(e.amount ?? 0), 0),
    [expenses],
  );

  const artistInitials = activeArtist.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const artistOtherNames = useMemo(() => {
    const namesField = selectedArtistRecord?.names;
    if (!namesField) return '';
    const entries = Array.isArray(namesField) ? namesField : [namesField];
    return entries
      .filter((e) => e?.name_type === 'other_names' && e?.name)
      .map((e) => e.name)
      .join(', ');
  }, [selectedArtistRecord]);

  const filteredProfileExpenses = useMemo(() => {
    return (expenses ?? []).filter((expense) => {
      const expRecord = expense as unknown as Record<string, unknown>;
      if (expenseSearch) {
        const searchLower = expenseSearch.toLowerCase();
        const ref = String(expense.ref_id || expense._id || '').toLowerCase();
        const category = String(expense.category || '').toLowerCase();
        if (!ref.includes(searchLower) && !category.includes(searchLower)) return false;
      }
      if (expenseLoggedBy !== 'all') {
        const loggedBy = String(expRecord.logged_by || '').toLowerCase();
        if (expenseLoggedBy === 'admin' && loggedBy !== 'admin') return false;
        if (expenseLoggedBy === 'user' && loggedBy === 'admin') return false;
      }
      if (expenseCategoryFilter !== 'all' && expense.category !== expenseCategoryFilter) return false;
      return true;
    });
  }, [expenses, expenseSearch, expenseLoggedBy, expenseCategoryFilter]);

  const chartTrackRevenueData = useMemo(
    () =>
      (dashboardMetrics?.revenueByMonth ?? []).map((item) => ({
        label: item.label || '-',
        value: Number(item.revenue ?? 0),
      })),
    [dashboardMetrics],
  );
  const chartAlbumRevenueData = useMemo(
    () =>
      aggregateDailySeriesByMonth(
        (albumRevenue ?? []).map((item) => ({
          day: item.day,
          value: Number(item.revenue ?? 0),
        })),
      ),
    [albumRevenue],
  );
  const chartTrackInteractionData = useMemo(
    () =>
      (dashboardMetrics?.streamsByMonth ?? []).map((item) => ({
        label: item.label || '-',
        streams: Number(item.streams ?? 0),
      })),
    [dashboardMetrics],
  );
  const chartAlbumInteractionData = useMemo(
    () =>
      aggregateDailySeriesByMonth(
        (albumPerformance ?? []).map((item) => ({
          day: item.day,
          value: Number(item.streams ?? 0),
        })),
      ).map((item) => ({
        label: item.label,
        streams: item.value,
      })),
    [albumPerformance],
  );
  const chartRepaymentData = useMemo(
    () => {
      const monthMap = new Map<string, { label: string; value: number }>();
      advances.forEach((advance) => {
        const rawDate = (advance.createdAt || advance.created_at || '').toString();
        const parsed = new Date(rawDate);
        if (Number.isNaN(parsed.getTime())) return;
        const key = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}`;
        const current = monthMap.get(key);
        const repaidValue = getAdvanceRepaidAmount(advance);
        if (current) {
          current.value += repaidValue;
          return;
        }
        monthMap.set(key, {
          label: parsed.toLocaleDateString('en-US', { month: 'short' }),
          value: repaidValue,
        });
      });

      return Array.from(monthMap.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([, value]) => value);
    },
    [advances],
  );

  const performanceMetrics = useMemo(
    () => [
      {
        label: 'Total revenue',
        value: formatCurrency(Number(dashboardMetrics?.totalRevenue ?? 0)),
        icon: <Music2 className="h-4 w-4" />,
      },
      {
        label: 'Repaid Advance',
        value: formatCurrency(Number(overview?.totalRepaidUSD ?? 0)),
        icon: <UserRound className="h-4 w-4" />,
      },
      {
        label: 'Total interactions',
        value: Number(dashboardMetrics?.totalStreams ?? 0).toLocaleString(),
        icon: <CalendarDays className="h-4 w-4" />,
      },
    ],
    [dashboardMetrics, overview?.totalRepaidUSD],
  );

  const goToArtistView = (artistId: string, view: Exclude<ArtistView, 'list'>) => {
    const href = addArtistQueryState(pathname, new URLSearchParams(searchParams.toString()), artistId, view);
    router.replace(href, { scroll: false });
    setMenuOpenForId(null);
    setMenuAnchorEl(null);
    setMenuPosition(null);
  };

  const goBackToArtistList = () => {
    const href = addArtistQueryState(pathname, new URLSearchParams(searchParams.toString()));
    router.replace(href, { scroll: false });
    setMenuOpenForId(null);
    setMenuAnchorEl(null);
    setMenuPosition(null);
  };


  const handleArchiveOrUnarchiveArtist = async (artist: ArtistRow) => {
    try {
      setPendingArtistActionId(artist.id);
      if (artist.status === 'archived') {
        await unarchiveArtist(artist.id);
      } else {
        await archiveArtist(artist.id);
      }
      setMenuOpenForId(null);
      setMenuAnchorEl(null);
      setMenuPosition(null);
    } finally {
      setPendingArtistActionId(null);
    }
  };

  const openedMenuArtist = useMemo(
    () => artists.find((artist) => artist.id === menuOpenForId) ?? null,
    [artists, menuOpenForId],
  );

  const handleAddArtist = async (payload: AddArtistPayload) => {
    const cleanedName = payload.name.trim();
    const [firstName, ...lastNameParts] = cleanedName.split(/\s+/).filter(Boolean);
    if (!firstName) return;

    await inviteArtist({
      email: payload.email.trim(),
      first_name: firstName,
      last_name: lastNameParts.join(' ') || firstName,
      phn_no: payload.phone.trim(),
      other_names: payload.otherNames
        .map((name) => name.trim())
        .filter(Boolean),
      bank: payload.bank,
      acc_no: payload.accountNumber.trim(),
      acc_name: payload.accountName.trim(),
      ...(payload.personalAmount.trim() && {
        personal_advance: { amount: Number(payload.personalAmount), currency: payload.personalCurrency as 'USD' | 'NGN' },
      }),
      ...(payload.marketingAmount.trim() && {
        marketing_advance: { amount: Number(payload.marketingAmount), currency: payload.marketingCurrency as 'USD' | 'NGN' },
      }),
    });
  };


  return (
    <div className="pb-6">

      {activeView === 'list' && (
        <div className="mt-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-medium leading-none text-[#3C3C3C]">Artist</h2>
              <p className="mt-1 text-base text-[#8A8A8A]">
                You are now on the page to manage Record Label artists.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpenAddArtist(true)}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#7B00D4] px-10 text-base font-medium text-white transition hover:bg-[#6900B5]"
            >
              Add new Artist
            </button>
          </div>

          <div className="mt-6 overflow-visible">
            {/* Status filter tabs */}
            <div className="mb-4 flex gap-1 border-b border-neutral-200">
              {(['all', 'active', 'inactive', 'archived'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                  className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                    statusFilter === status
                      ? 'border-b-2 border-[#7B00D4] text-[#7B00D4]'
                      : 'text-[#8A8A8A] hover:text-[#3C3C3C]'
                  }`}
                >
                  {status === 'inactive' ? 'Deactivated' : status === 'all' ? 'All Artists' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full min-w-[880px] text-sm ">
                <thead className="bg-[#F4F4F4] text-left text-[#666666]">
                  <tr>
                    <th className="px-4 py-4 font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          setNameSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                          setCurrentPage(1);
                        }}
                        className="inline-flex items-center gap-2"
                      >
                        Name
                        <ChevronsUpDown className="h-3 w-3 text-[#B1B1B1]" />
                      </button>
                    </th>
                    <th className="px-4 py-4 font-medium">Email address</th>
                    <th className="px-4 py-4 font-medium">Phone number</th>
                    <th className="px-4 py-4 font-medium">Date added</th>
                    <th className="px-4 py-4 font-medium">No of Track</th>
                    <th className="px-4 py-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEFEF] text-base">
                  {artistsLoading ? (
                    <tr className="bg-white text-[#8A8A8A]">
                      <td colSpan={6} className="px-4 py-8 text-center">
                        Loading artists...
                      </td>
                    </tr>
                  ) : sortedArtists.length === 0 ? (
                    <tr className="bg-white text-[#8A8A8A]">
                      <td colSpan={6} className="px-4 py-8 text-center">
                        No artists yet. Add a new artist to get started.
                      </td>
                    </tr>
                  ) : (
                    paginatedArtists.map((artist) => (
                    <tr key={artist.id} className="bg-white text-[#3C3C3C]">
                      <td className="px-4 py-4">{artist.name}</td>
                      <td className="px-4 py-4">{artist.email}</td>
                      <td className="px-4 py-4">{artist.phone}</td>
                      <td className="px-4 py-4">{artist.dateAdded}</td>
                      <td className="px-4 py-4">{artist.tracks}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="relative inline-flex">
                          <button
                            type="button"
                            onClick={(event) => {
                              setMenuOpenForId((prev) => (prev === artist.id ? null : artist.id));
                              if (menuOpenForId === artist.id) {
                                setMenuAnchorEl(null);
                                setMenuPosition(null);
                              } else {
                                setMenuAnchorEl(event.currentTarget);
                              }
                            }}
                            aria-haspopup="menu"
                            aria-expanded={menuOpenForId === artist.id}
                            className="rounded-md p-1 text-[#5A5A5A] hover:bg-[#F1F1F1]"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[#EFEFEF] px-1 py-4 text-base text-[#8A8A8A]">
              <span>
                Showing {sortedArtists.length === 0 ? 0 : pageStartIndex + 1}-
                {pageStartIndex + paginatedArtists.length} of {sortedArtists.length}
              </span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPageSafe <= 1 || sortedArtists.length === 0}
                  className="inline-flex items-center rounded-md border border-[#DFDFDF] bg-white px-3 py-1 text-[#8A8A8A] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="mr-1 text-[#B3B3B3]">&lt;</span>Prev
                </button>
                {paginationTokens.map((token, index) =>
                  token === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className="text-[#8A8A8A]">
                      ...
                    </span>
                  ) : (
                    <button
                      type="button"
                      key={token}
                      onClick={() => setCurrentPage(token)}
                      className={`px-2 py-0.5 ${
                        token === currentPageSafe
                          ? 'rounded bg-[#F2F2F2] text-[#8A8A8A]'
                          : 'text-[#8A8A8A]'
                      }`}
                    >
                      {token}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPageSafe >= totalPages || sortedArtists.length === 0}
                  className="inline-flex items-center rounded-md border border-[#DFDFDF] bg-white px-3 py-1 text-[#8A8A8A] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next<span className="ml-1 text-[#B3B3B3]">&gt;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {menuOpenForId && openedMenuArtist && menuPosition
        ? createPortal(
            <div
              ref={menuRootRef}
              role="menu"
              className="fixed z-[120] w-[170px] overflow-hidden rounded-lg bg-[#242427] py-1 text-left text-xs text-white shadow-xl"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                transform: menuPosition.placement === 'up' ? 'translateY(-100%)' : undefined,
              }}
            >
              <button
                type="button"
                onClick={() => goToArtistView(openedMenuArtist.id, 'profile')}
                className="block w-full px-3 py-2 text-left hover:bg-white/10"
              >
                View profile
              </button>
              <button
                type="button"
                onClick={() => goToArtistView(openedMenuArtist.id, 'performance')}
                className="block w-full px-3 py-2 text-left hover:bg-white/10"
              >
                View performance
              </button>
              <button
                type="button"
                onClick={() => handleArchiveOrUnarchiveArtist(openedMenuArtist)}
                disabled={pendingArtistActionId === openedMenuArtist.id}
                className="block w-full px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {openedMenuArtist.status === 'archived' ? 'Unarchive artist' : 'Archive artist'}
              </button>
            </div>,
            document.body,
          )
        : null}

      {activeView === 'performance' && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={goBackToArtistList}
              className="inline-flex items-center gap-2 text-left"
            >
              <ArrowLeft className="h-5 w-5 text-[#3C3C3C]" />
              <div>
                <h2 className="text-2xl font-medium text-[#3C3C3C]">{activeArtist.name} Performance</h2>
                <p className="text-sm text-[#8A8A8A]">
                  You are now on the page to manage Record Label artists.
                </p>
              </div>
            </button>

            <div className="flex w-full gap-2 sm:w-auto">
              <YearFilterCalendar
                value={selectedYear}
                onChange={setSelectedYear}
                showYear
                align="right"
                buttonClassName="h-10 w-full rounded-2xl bg-[#EAEAEA] px-3 text-sm font-medium text-[#5A5A5A] sm:w-auto"
              />
              <button
                type="button"
                onClick={() => setOpenAddArtist(true)}
                className="h-10 w-full rounded-full bg-[#7B00D4] px-5 text-sm font-medium text-white transition hover:bg-[#6900B5] sm:w-auto"
              >
                Add new Artist
              </button>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {performanceMetrics.map((metric) => (
              <MetricCard key={metric.label} value={metric.value} label={metric.label} icon={metric.icon} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard
              title="Track revenue trend"
              variant="bar"
              data={chartTrackRevenueData}
              xKey="label"
              yKey="value"
              color="#C39AE7"
            />
            <ChartCard
              title="Track Interaction Trend"
              variant="line"
              data={chartTrackInteractionData}
              xKey="label"
              series={[
                { key: 'streams', label: 'Streams', color: '#00C853' },
              ]}
              lineType="monotone"
              showDots
            />
            <ChartCard
              title="Album revenue trend"
              variant="bar"
              data={chartAlbumRevenueData}
              xKey="label"
              yKey="value"
              color="#C39AE7"
            />
            <ChartCard
              title="Album interaction Trend"
              variant="line"
              data={chartAlbumInteractionData}
              xKey="label"
              series={[
                { key: 'streams', label: 'Streams', color: '#00C853' },
              ]}
              lineType="monotone"
              showDots
            />
          </div>

          <ChartCard
            title="Advance repayment trend"
            variant="line"
            data={chartRepaymentData}
            xKey="label"
            yKey="value"
            lineType="monotone"
            color="#7B00D4"
            showDots
          />
        </div>
      )}

      {/* ── Artist Profile / Details View ── */}
      {activeView === 'profile' && (
        <div className="mt-4 space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={goBackToArtistList}
              className="inline-flex items-center gap-2 text-left"
            >
              <ArrowLeft className="h-5 w-5 text-[#3C3C3C]" />
              <div>
                <h2 className="text-2xl font-medium text-[#3C3C3C]">Artist Details</h2>
                <p className="text-sm text-[#8A8A8A]">Manage artist information, finances, and activity</p>
              </div>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <YearFilterCalendar
                value={selectedYear}
                onChange={setSelectedYear}
                showYear
                align="right"
                buttonClassName="h-9 rounded-full border border-[#DFDFDF] bg-white px-4 text-sm font-medium text-[#5A5A5A]"
              />
              <button
                type="button"
                onClick={() => setOpenRecordExpense(true)}
                className="h-9 rounded-full bg-[#7B00D4] px-5 text-sm font-medium text-white transition hover:bg-[#6900B5]"
              >
                Record Expense
              </button>
              <div ref={moreMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMoreOpen((v) => !v)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#DFDFDF] bg-white px-4 text-sm font-medium text-[#3C3C3C] hover:bg-[#F8F8F8]"
                >
                  More <ChevronDown className="h-4 w-4 text-[#8A8A8A]" />
                </button>
                {profileMoreOpen && (
                  <div className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-xl border border-[#EFEFEF] bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => { setProfileMoreOpen(false); goToArtistView(selectedArtistId, 'performance'); }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-[#3C3C3C] hover:bg-[#F8F8F8]"
                    >
                      View performance
                    </button>
                    <button
                      type="button"
                      onClick={() => { setProfileMoreOpen(false); handleArchiveOrUnarchiveArtist(activeArtist); }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-[#3C3C3C] hover:bg-[#F8F8F8]"
                    >
                      {activeArtist.status === 'archived' ? 'Unarchive artist' : 'Archive artist'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Artist info card — grey bg, rectangular photo, horizontal info */}
          <div className="rounded-xl bg-[#F5F5F5] p-4">
            <div className="flex gap-5">
              {/* Photo area */}
              <div className="relative shrink-0">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg bg-[#E0D4F5] text-2xl font-bold text-[#7B00D4]">
                  {artistInitials}
                </div>
                <span className={`absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  activeArtist.status === 'active' ? 'bg-[#D4F7E3] text-[#00B241]' :
                  activeArtist.status === 'archived' ? 'bg-[#F0F0F0] text-[#8A8A8A]' :
                  'bg-[#FFF3E0] text-[#F59E0B]'
                }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {activeArtist.status === 'active' ? 'Active' : activeArtist.status === 'archived' ? 'Archived' : 'Inactive'}
                </span>
              </div>

              {/* Info area */}
              <div className="min-w-0 flex-1">
                {/* Row 1: Full name | Other name | Phone number */}
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  <div>
                    <p className="text-xs text-[#9A9A9A]">Full name</p>
                    <p className="text-sm font-medium text-[#1F1F1F]">{activeArtist.name}</p>
                  </div>
                  {artistOtherNames && (
                    <div>
                      <p className="text-xs text-[#9A9A9A]">Other name</p>
                      <p className="text-sm font-medium text-[#1F1F1F]">{artistOtherNames}</p>
                    </div>
                  )}
                  {activeArtist.phone !== '--' && (
                    <div>
                      <p className="text-xs text-[#9A9A9A]">Phone number</p>
                      <p className="text-sm font-medium text-[#1F1F1F]">{activeArtist.phone}</p>
                    </div>
                  )}
                </div>
                {/* Row 2: Email */}
                <div className="mt-3">
                  <p className="text-xs text-[#9A9A9A]">Email address</p>
                  <p className="text-sm font-medium text-[#1F1F1F]">{activeArtist.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Metric cards — Row 1: 3 cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <EligibleAdvanceCard
              label="Personal Advance"
              value={formatCurrency(eligiblePersonal)}
              balanceValue={formatCurrency(balancePersonal)}
              balanceColor="#7B00D4"
              onBalance={() => setOpenPersonalAdvanceModal(true)}
            />
            <EligibleAdvanceCard
              label="Marketing Advance"
              value={formatCurrency(eligibleMarketing)}
              balanceValue={formatCurrency(balanceMarketing)}
              balanceColor="#00B241"
              onBalance={() => setOpenMarketingAdvanceModal(true)}
            />
            <div className="rounded-xl border border-[#D5D5D5] bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[26px] font-semibold leading-none text-[#3C3C3C]">
                    {formatCurrency(Number(dashboardMetrics?.totalRevenue ?? 0))}
                  </p>
                  <p className="mt-2 text-xs text-[#8B8B8B]">Total Revenue</p>
                </div>
                <div className="rounded-full border border-[#E6D6F8] p-2 text-[#7B00D4]">
                  <Music2 className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Metric cards — Row 2: 4 cards */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-xl border border-[#D5D5D5] bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[22px] font-semibold leading-none text-[#3C3C3C]">
                    {formatCurrency(Number(overview?.totalAdvanceUSD ?? 0))}
                  </p>
                  <p className="mt-2 text-xs text-[#8B8B8B]">Total Funds Received</p>
                </div>
                <div className="rounded-full border border-[#E6D6F8] p-2 text-[#7B00D4]">
                  <CircleDollarSign className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#D5D5D5] bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[22px] font-semibold leading-none text-[#3C3C3C]">
                    {formatCurrency(Number(overview?.totalRepaidUSD ?? 0))}
                  </p>
                  <p className="mt-2 text-xs text-[#8B8B8B]">Recouped Advance</p>
                </div>
                <div className="rounded-full border border-[#E6D6F8] p-2 text-[#7B00D4]">
                  <RefreshCcw className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#D5D5D5] bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[22px] font-semibold leading-none text-[#3C3C3C]">
                    {formatCurrency(Number(overview?.outstandingUSD ?? 0))}
                  </p>
                  <p className="mt-2 text-xs text-[#8B8B8B]">Outstanding Advance</p>
                </div>
                <div className="rounded-full border border-[#E6D6F8] p-2 text-[#7B00D4]">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#D5D5D5] bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[22px] font-semibold leading-none text-[#3C3C3C]">
                    {formatCurrency(totalExpenses)}
                  </p>
                  <p className="mt-2 text-xs text-[#8B8B8B]">Total Expenses</p>
                </div>
                <div className="rounded-full border border-[#E6D6F8] p-2 text-[#7B00D4]">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Expenses table */}
          <div className="overflow-hidden rounded-xl border border-[#DFDFDF] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFEFEF] px-5 py-4">
              <h3 className="text-base font-semibold text-[#1F1F1F]">Expenses</h3>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  placeholder="Search transaction..."
                  className="h-9 w-44 rounded-lg border border-[#DFDFDF] bg-white px-3 text-sm outline-none focus:border-[#7B00D4]"
                />
                <select
                  value={expenseLoggedBy}
                  onChange={(e) => setExpenseLoggedBy(e.target.value)}
                  className="h-9 rounded-lg border border-[#DFDFDF] bg-white px-3 text-sm text-[#5A5A5A] outline-none focus:border-[#7B00D4]"
                >
                  <option value="all">Logged by</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="h-9 rounded-lg border border-[#DFDFDF] bg-white px-3 text-sm text-[#5A5A5A] outline-none focus:border-[#7B00D4]"
                >
                  <option value="all">All categories</option>
                  <option value="marketting">Marketing</option>
                  <option value="production">Production</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-[#F9F9F9] text-left text-[#666666]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Transaction</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Logged by</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEFEF]">
                  {filteredProfileExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-[#8A8A8A]">
                        No expenses recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredProfileExpenses.slice(0, 8).map((expense) => {
                      const expRecord = expense as unknown as Record<string, unknown>;
                      const status = String(expRecord.status || '').trim();
                      const loggedBy = String(expRecord.logged_by || '').trim();
                      const statusLower = status.toLowerCase();
                      const statusStyle =
                        statusLower === 'paid' ? 'bg-[#D4F7E3] text-[#00B241]' :
                        statusLower === 'approved' ? 'bg-[#EDE1FF] text-[#7B00D4]' :
                        statusLower === 'pending' ? 'bg-[#FFF3E0] text-[#F59E0B]' :
                        statusLower === 'rejected' ? 'bg-[#FFE5E5] text-[#D14343]' :
                        'bg-[#F5F5F5] text-[#8A8A8A]';
                      return (
                        <tr key={expense._id} className="text-[#3C3C3C]">
                          <td className="px-5 py-3.5 font-medium">
                            TRX-{(expense.ref_id || expense._id || '').toString().slice(-8).toUpperCase()}
                          </td>
                          <td className="px-5 py-3.5 text-[#8A8A8A]">
                            {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString('en-GB') : '--'}
                          </td>
                          <td className="px-5 py-3.5 capitalize">{expense.category || '--'}</td>
                          <td className="px-5 py-3.5">
                            {status ? (
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                              </span>
                            ) : (
                              <span className="text-[#8A8A8A]">--</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-medium">
                            ${Number(expense.amount ?? 0).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-[#8A8A8A]">
                            {loggedBy ? (loggedBy.toLowerCase() === 'admin' ? 'Admin' : loggedBy) : '--'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <AddArtistModal
        open={openAddArtist}
        onClose={() => setOpenAddArtist(false)}
        onSubmit={handleAddArtist}
      />

      <UpdateEligibleAdvanceModal
        open={openPersonalAdvanceModal}
        onClose={() => setOpenPersonalAdvanceModal(false)}
        type="personal"
        artistId={selectedArtistId}
      />

      <UpdateEligibleAdvanceModal
        open={openMarketingAdvanceModal}
        onClose={() => setOpenMarketingAdvanceModal(false)}
        type="marketing"
        artistId={selectedArtistId}
      />

      <AddExpensesModal
        open={openRecordExpense}
        onClose={() => setOpenRecordExpense(false)}
        onSubmit={async (data) => {
          try {
            let receiptUrl = '';
            if (data.proofs && data.proofs.length > 0) {
              receiptUrl = await uploadFile(data.proofs[0], 'expense');
            }
            await axiosInstance.post('/expenses', {
              artistId: selectedArtistId || data.artistId,
              expense_date: data.expense_date,
              advance_type: data.advance_type,
              currency: data.currency,
              amount: data.amount,
              recoupable: data.recoupable,
              description: data.description,
              receipt_url: receiptUrl,
            });
            toast.success('Expense recorded successfully');
            setOpenRecordExpense(false);
          } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || 'Failed to record expense');
            throw err;
          }
        }}
        initialArtistId={selectedArtistId}
        recordLabelFields={false}
        personalEligibleAmount={formatCurrency(eligiblePersonal)}
        marketingEligibleAmount={formatCurrency(eligibleMarketing)}
      />
    </div>
  );
}

