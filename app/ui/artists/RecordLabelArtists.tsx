'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  CalendarDays,
  ChevronsUpDown,
  MoreVertical,
  Music2,
  UploadCloud,
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
import { useRecordLabelArtists } from '@/hooks/useRecordLabelArtists';
import { useRoyalty } from '@/hooks/useRoyalty';
import { Advance } from '@/lib/types/advance';
import type { RecordLabelArtist } from '@/lib/types/record-label';
import { getRecordLabelArtistName } from '@/lib/utils/recordLabelArtist';
import { toast } from 'react-toastify';
import axiosInstance from '@/lib/axiosinstance';

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
};

const BANK_OPTIONS = [
  'Select your bank',
  'Access Bank',
  'GTBank',
  'First Bank',
  'Zenith Bank',
  'UBA',
];

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

const normalizeName = (value: string) => value.trim().toLowerCase();
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
    bank: BANK_OPTIONS[0],
    accountName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    form.name.trim() !== '' &&
    form.email.trim() !== '' &&
    form.phone.trim() !== '' &&
    form.accountNumber.trim() !== '' &&
    form.bank !== BANK_OPTIONS[0] &&
    form.accountName.trim() !== '';

  const handleChange = (key: keyof AddArtistPayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onSubmit(form);
      onClose();
      setForm({
        name: '',
        email: '',
        otherNames: [],
        phone: '',
        accountNumber: '',
        bank: BANK_OPTIONS[0],
        accountName: '',
      });
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
          <p className="text-sm text-[#9A9A9A]">Fill in all necessary details to onboard</p>
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
              onChange={(event) => handleChange('email', event.target.value)}
              placeholder="Enter artist email address"
              className="h-11 w-full rounded-xl border border-[#B6B6B6] px-3 text-sm outline-none focus:border-[#7B00D4]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#5A5A5A]">Other names Artist is known by</label>
            <TagInput
              value={form.otherNames}
              onChange={(next) => setForm((prev) => ({ ...prev, otherNames: next }))}
              placeholder="Enter artist other names"
            />
            <div className="mt-2 rounded-full bg-[#FFF3D6] px-3 py-1 text-[11px] text-[#D39A16]">
Include artist stage names, and any other AKAs and alias. For example (Wizkid, Starboy, Machala)            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#5A5A5A]">Phone Number</label>
            <input
              value={form.phone}
              onChange={(event) => handleChange('phone', event.target.value)}
              placeholder="Enter artist phone number"
              className="h-11 w-full rounded-xl border border-[#B6B6B6] px-3 text-sm outline-none focus:border-[#7B00D4]"
            />
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
              onChange={(value) => handleChange('bank', value)}
              className="h-11 rounded-xl border-[#B6B6B6] bg-white text-sm text-[#4A4A4A] focus:border-[#7B00D4] focus:ring-1 focus:ring-[#7B00D4]"
              options={BANK_OPTIONS.map((option) => ({
                label: option,
                value: option,
              }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#5A5A5A]">Account Name</label>
            <input
              value={form.accountName}
              onChange={(event) => handleChange('accountName', event.target.value)}
              placeholder="Enter your account name"
              className="h-11 w-full rounded-xl border border-[#B6B6B6] px-3 text-sm outline-none focus:border-[#7B00D4]"
            />
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

function ProfileFormRow({
  label,
  required,
  children,
  helpText,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  helpText?: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 border-b border-neutral-200 py-5 last:border-0 md:grid-cols-[260px_1fr]">
      <div>
        <label className="block text-sm font-semibold text-[#414651]">
          {label} {required && <span className="text-[#7F56D9]">*</span>}
        </label>
        {helpText && <div className="mt-1 text-sm text-[#535862]">{helpText}</div>}
      </div>
      <div className="max-w-[500px]">{children}</div>
    </div>
  );
}

function ProfileInput({
  value,
  placeholder,
  type = 'text',
  onChange,
}: {
  value: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-3 pr-10 text-sm text-neutral-900 placeholder:text-neutral-500 outline-none focus:border-[#7B00D4] focus:ring-1 focus:ring-[#7B00D4]"
      />
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
        <Image src="/svgs/edit-pencil.svg" alt="Edit" width={20} height={20} />
      </div>
    </div>
  );
}

export default function RecordLabelArtists() {
  const { user, refreshUser } = useAuth();
  const { dashboardMetrics, albumPerformance, albumRevenue } = useRoyalty();
  const { advances = [], overview } = useAdvance();
  const {
    artists: artistsResponse,
    isLoading: artistsLoading,
    inviteArtist,
    activateArtist,
    deactivateArtist,
    archiveArtist,
    unarchiveArtist,
  } = useRecordLabelArtists();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuRootRef = useRef<HTMLDivElement | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; placement: 'up' | 'down' } | null>(null);

  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
  const [openAddArtist, setOpenAddArtist] = useState(false);
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [pendingArtistActionId, setPendingArtistActionId] = useState<string | null>(null);
  const [nameSortDirection, setNameSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | ArtistStatus>('all');
  const [profileOtherNames, setProfileOtherNames] = useState<string[]>([]);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

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

  const selectedArtistId = (searchParams.get('artistId') || searchParams.get('id') || '').trim();
  const selectedViewParam = searchParams.get('view');
  const activeView: ArtistView = !selectedArtistId
    ? 'list'
    : selectedViewParam === 'profile'
      ? 'profile'
      : 'performance';

  const activeArtist = useMemo(
    () =>
      artists.find((artist) => artist.id === selectedArtistId) ?? {
        id: 'external',
        name: `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Artist',
        email: user?.email ?? 'artist@haudit.io',
        phone: '+234 000 000 0000',
        dateAdded: '01/01/2025',
        tracks: 0,
        status: 'active',
      },
    [artists, selectedArtistId, user],
  );

  const selectedArtistRecord = useMemo(
    () => artistsResponse.find((artist) => (artist.id || artist._id) === selectedArtistId),
    [artistsResponse, selectedArtistId],
  );

  const selectedArtistNameEntries = useMemo(() => {
    const namesField = selectedArtistRecord?.names;
    if (!namesField) return [] as Array<{ _id?: string; name: string; name_type?: string }>;
    const entries = Array.isArray(namesField) ? namesField : [namesField];
    return entries
      .filter((entry) => !!entry && typeof entry.name === 'string')
      .map((entry) => ({
        _id: entry._id,
        name: (entry.name || '').trim(),
        name_type: entry.name_type,
      }));
  }, [selectedArtistRecord]);

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
    if (view === 'profile') {
      const params = new URLSearchParams();
      params.set('artistId', artistId);
      router.replace(`/settings?${params.toString()}`, { scroll: false });
      setMenuOpenForId(null);
      setMenuAnchorEl(null);
      setMenuPosition(null);
      return;
    }

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

  useEffect(() => {
    if (activeView !== 'profile' || !selectedArtistId) return;
    router.replace(`/settings?artistId=${encodeURIComponent(selectedArtistId)}`, {
      scroll: false,
    });
  }, [activeView, selectedArtistId, router]);

  const handleDeactivateOrActivateArtist = async (artist: ArtistRow) => {
    try {
      setPendingArtistActionId(artist.id);
      if (artist.status === 'inactive') {
        await activateArtist(artist.id);
      } else {
        await deactivateArtist(artist.id);
      }
      setMenuOpenForId(null);
      setMenuAnchorEl(null);
      setMenuPosition(null);
    } finally {
      setPendingArtistActionId(null);
    }
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
    });
  };

  useEffect(() => {
    if (activeView !== 'profile') return;

    const recordName = (selectedArtistRecord?.name || '').trim();
    const nameFromSelection = recordName || activeArtist.name?.trim() || '';
    const [fallbackFirstName = '', ...fallbackLastName] = nameFromSelection.split(/\s+/).filter(Boolean);

    const firstNameFromEntry =
      selectedArtistNameEntries.find((entry) => entry.name_type === 'first_name')?.name || '';
    const lastNameFromEntry =
      selectedArtistNameEntries.find((entry) => entry.name_type === 'last_name')?.name || '';
    const otherNamesFromEntry = selectedArtistNameEntries
      .filter((entry) => entry.name_type === 'other_names')
      .map((entry) => entry.name)
      .filter(Boolean);

    setProfileForm({
      firstName: firstNameFromEntry || fallbackFirstName || '',
      lastName: lastNameFromEntry || fallbackLastName.join(' ') || '',
      email:
        (selectedArtistRecord?.email || '').trim() ||
        (activeArtist.email && activeArtist.email !== '--' ? activeArtist.email : ''),
      phone:
        (selectedArtistRecord?.phn_no || '').trim() ||
        (activeArtist.phone && activeArtist.phone !== '--' ? activeArtist.phone : ''),
    });

    setProfileOtherNames(Array.from(new Set(otherNamesFromEntry)));
  }, [activeArtist, activeView, selectedArtistNameEntries, selectedArtistRecord]);

  const handleUpdateProfile = async () => {
    if (isUpdatingProfile) return;

    if (!selectedArtistId) {
      toast.error('Please select an artist to update');
      return;
    }

    const fallbackName = (selectedArtistRecord?.name || activeArtist.name || '').trim();
    const [fallbackFirst = '', ...fallbackLast] = fallbackName.split(/\s+/).filter(Boolean);

    const emailLocal = profileForm.email.trim().split('@')[0]?.trim() || '';
    const firstName = profileForm.firstName.trim() || fallbackFirst || emailLocal || 'Artist';
    const lastName = profileForm.lastName.trim() || fallbackLast.join(' ');
    const email = profileForm.email.trim();
    const phone = profileForm.phone.trim();

    try {
      setIsUpdatingProfile(true);

      const artistProfilePayload: { email?: string; phn_no?: string } = {};
      if (email) artistProfilePayload.email = email;
      if (phone) artistProfilePayload.phn_no = phone;

      if (Object.keys(artistProfilePayload).length > 0) {
        await axiosInstance.patch(`/record-label/artists/${selectedArtistId}`, artistProfilePayload);
      }

      const desiredOtherNames = Array.from(
        new Set(profileOtherNames.map((name) => name.trim()).filter(Boolean)),
      );
      const existingOtherNameEntries = selectedArtistNameEntries.filter(
        (entry) => entry.name_type === 'other_names',
      );

      const existingFirstNameEntry = selectedArtistNameEntries.find(
        (entry) => entry.name_type === 'first_name',
      );
      const existingLastNameEntry = selectedArtistNameEntries.find(
        (entry) => entry.name_type === 'last_name',
      );

      const existingByNormalized = new Map(
        existingOtherNameEntries.map((entry) => [normalizeName(entry.name), entry]),
      );
      const desiredByNormalized = new Map<string, string>();
      desiredOtherNames.forEach((name) => {
        const normalized = normalizeName(name);
        if (!desiredByNormalized.has(normalized)) desiredByNormalized.set(normalized, name);
      });

      const requests: Promise<unknown>[] = [];

      if (existingFirstNameEntry?._id) {
        if (existingFirstNameEntry.name !== firstName) {
          requests.push(
            axiosInstance.patch(
              `/auth/user-names/${existingFirstNameEntry._id}`,
              {
                name: firstName,
                name_type: 'first_name',
              },
              { params: { artistId: selectedArtistId } },
            ),
          );
        }
      } else if (firstName) {
        requests.push(
          axiosInstance.post(
            '/auth/user-names',
            {
              names: [firstName],
              name_type: 'first_name',
            },
            { params: { artistId: selectedArtistId } },
          ),
        );
      }

      if (existingLastNameEntry?._id) {
        if (existingLastNameEntry.name !== lastName) {
          requests.push(
            axiosInstance.patch(
              `/auth/user-names/${existingLastNameEntry._id}`,
              {
                name: lastName,
                name_type: 'last_name',
              },
              { params: { artistId: selectedArtistId } },
            ),
          );
        }
      } else if (lastName) {
        requests.push(
          axiosInstance.post(
            '/auth/user-names',
            {
              names: [lastName],
              name_type: 'last_name',
            },
            { params: { artistId: selectedArtistId } },
          ),
        );
      }

      existingOtherNameEntries.forEach((entry) => {
        const normalized = normalizeName(entry.name);
        if (!desiredByNormalized.has(normalized)) {
          requests.push(axiosInstance.delete(`/auth/user-names/${entry._id}`));
        }
      });
      desiredByNormalized.forEach((name, normalized) => {
        const existing = existingByNormalized.get(normalized);
        if (!existing) {
          requests.push(
            axiosInstance.post(
              '/auth/user-names',
              {
                names: [name],
                name_type: 'other_names',
              },
              { params: { artistId: selectedArtistId } },
            ),
          );
          return;
        }

        if (existing._id && existing.name !== name) {
          requests.push(
            axiosInstance.patch(
              `/auth/user-names/${existing._id}`,
              {
                name,
                name_type: 'other_names',
              },
              { params: { artistId: selectedArtistId } },
            ),
          );
        }
      });

      await Promise.all(requests);
      toast.success('Profile updated successfully');
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
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
              {openedMenuArtist.status !== 'archived' && (
                <button
                  type="button"
                  onClick={() => handleDeactivateOrActivateArtist(openedMenuArtist)}
                  disabled={pendingArtistActionId === openedMenuArtist.id}
                  className="block w-full px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {openedMenuArtist.status === 'inactive' ? 'Activate artist' : 'Deactivate artist'}
                </button>
              )}
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

      {activeView === 'profile' && (
        <div className="mt-4 px-1 pb-8">
          <button
            type="button"
            onClick={goBackToArtistList}
            className="inline-flex items-center gap-2 text-left"
          >
            <ArrowLeft className="h-5 w-5 text-[#3C3C3C]" />
            <div>
              <h2 className="text-2xl font-medium leading-none text-[#3C3C3C]">Artist Profile</h2>
              <p className="mt-1 text-sm text-[#8A8A8A]">
                Here you can update artist personal information.
              </p>
            </div>
          </button>

          <div className="mt-[30px]">
            <div className="mb-8">
              <div className="mb-5 flex items-center justify-between border-b border-neutral-200 pb-5">
                <div>
                  <h2 className="text-[18px] font-semibold text-[#181D27]">Personal Info</h2>
                  <p className="text-sm text-[#535862]">
                    Update artist profile photo and the names displayed on this account.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <ProfileFormRow
                  label="Your photo"
                  required
                  helpText="This will be displayed on your profile."
                >
                  <div className="flex items-start gap-6">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-200 ring-2 ring-white shadow-sm">
                      <div className="grid h-full w-full place-items-center text-sm font-semibold text-[#5A5A5A]">
                        {activeArtist.name
                          .split(' ')
                          .map((piece) => piece[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flex h-[120px] w-full max-w-[500px] items-center justify-center rounded-xl border border-[#7B00D4] bg-white px-4 text-center hover:bg-neutral-50"
                    >
                      <div className="space-y-1">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm">
                          <UploadCloud className="h-5 w-5" />
                        </div>
                        <p className="text-sm">
                          <span className="font-semibold text-[#7B00D4]">Click to upload</span>{' '}
                          <span className="text-neutral-600">or drag and drop</span>
                        </p>
                        <p className="text-xs text-neutral-500">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                      </div>
                    </button>
                  </div>
                </ProfileFormRow>

                <ProfileFormRow label="First name" required>
                  <ProfileInput
                    value={profileForm.firstName}
                    onChange={(value) =>
                      setProfileForm((prev) => ({ ...prev, firstName: value }))
                    }
                    placeholder="Enter artist first name"
                  />
                </ProfileFormRow>

                <ProfileFormRow label="Last name" required>
                  <ProfileInput
                    value={profileForm.lastName}
                    onChange={(value) =>
                      setProfileForm((prev) => ({ ...prev, lastName: value }))
                    }
                    placeholder="Enter artist last name"
                  />
                </ProfileFormRow>

                <ProfileFormRow
                  label="Other Names"
                  required
                  helpText="This will be displayed on your profile."
                >
                  <div className="space-y-2">
                    <TagInput
                      value={profileOtherNames}
                      onChange={setProfileOtherNames}
                      placeholder="Type artist name and press Enter"
                    />
                    <div className="flex gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <span className="mt-0.5 flex-shrink-0 text-yellow-600">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8 5.333V8M8 10.667H8.007M14.667 8C14.667 11.682 11.682 14.667 8 14.667C4.318 14.667 1.333 11.682 1.333 8C1.333 4.318 4.318 1.333 8 1.333C11.682 1.333 14.667 4.318 14.667 8Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <p className="text-sm text-yellow-800">
                        Manage artist alternate names, including stage names and aliases used in reporting files.
                      </p>
                    </div>
                  </div>
                </ProfileFormRow>

                <ProfileFormRow label="Email address" required>
                  <ProfileInput
                    value={profileForm.email}
                    onChange={(value) =>
                      setProfileForm((prev) => ({ ...prev, email: value }))
                    }
                    placeholder="Enter your email address"
                    type="email"
                  />
                </ProfileFormRow>

                <ProfileFormRow label="Phone number" required>
                  <ProfileInput
                    value={profileForm.phone}
                    onChange={(value) =>
                      setProfileForm((prev) => ({ ...prev, phone: value }))
                    }
                    placeholder="Enter artist phone number"
                  />
                </ProfileFormRow>
              </div>

              <div className="flex items-center justify-end gap-3 py-4">
                <button
                  type="button"
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50"
                  onClick={goBackToArtistList}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                  className="rounded-lg bg-[#7B00D4] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#6900B5]"
                >
                  {isUpdatingProfile ? 'Updating...' : 'Update details'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddArtistModal
        open={openAddArtist}
        onClose={() => setOpenAddArtist(false)}
        onSubmit={handleAddArtist}
      />
    </div>
  );
}

