'use client';

import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronRight,
  DollarSign,
  FileMusic,
  FilePlus2,
  MessageSquare,
  MoreVertical,
  Search,
  Table2,
  Users,
  WalletCards,
} from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { ChartCard, DonutSlice } from '@/components/dashboard/ChartCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { Select } from '@/components/ui/Select';
import AddAdvanceModal, { NewAdvancePayload } from '@/ui/advance/AddAdvanceModal';
import AddExpensesModal, { NewExpensesPayload } from '@/ui/expenses/AddExpensesModal';
import { Pagination } from '@/components/ui/Pagination';
import { uploadFile } from '@/lib/utils/upload';
import { useAdvance } from '@/hooks/useAdvance';
import { useExpenses } from '@/hooks/useExpenses';
import { useRoyalty } from '@/hooks/useRoyalty';
import { useTopPerformance } from '@/hooks/useTopPerformance';
import { Expense } from '@/lib/types/expenses';
import { BRAND } from '@/lib/brand';
import { deriveSingleCurrency, formatCurrencyAmount } from '@/lib/utils/currency';

const ALBUM_INTERACTION_COLORS = ['#00D447', '#7B00D4', '#3B82F6', '#F59E0B', '#EF4444'];

type DashboardTab = 'Track' | 'Album' | 'Advance' | 'Expenses';

type PerformanceRow = {
  name: string;
  money: string;
  stream: string;
};

type AdvanceStatus = 'Approved' | 'Pending' | 'Rejected' | 'Paid' | 'Repaid' | 'Outstanding';
type ExpenseStatus = 'Approved' | 'Pending' | 'Rejected' | 'Paid' | 'Repaid' | 'Outstanding';

type AdvanceRow = {
  id: string;
  date: string;
  amount: string;
  type: string;
  status: AdvanceStatus;
  purpose: string;
};

type ExpenseRow = {
  id: string;
  date: string;
  category: string;
  status: ExpenseStatus;
  amount: string;
  loggedBy: string;
};

function formatDate(dateLike?: string) {
  if (!dateLike) return '-';
  const parsed = new Date(dateLike);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .replace(/ /g, '-');
}

function toTitleCase(value?: string) {
  if (!value) return '-';
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function normalizeStatus(value?: string): AdvanceStatus {
  const key = (value || '').trim().toLowerCase();
  if (key === 'repaid') return 'Repaid';
  if (key === 'paid') return 'Paid';
  if (key === 'outstanding') return 'Outstanding';
  if (key === 'approved') return 'Approved';
  if (key === 'rejected') return 'Rejected';
  return 'Pending';
}

function metricTrendLabel(values: number[]) {
  if (values.length < 2) return null;
  const current = Number(values[values.length - 1] || 0);
  const previous = Number(values[values.length - 2] || 0);
  if (previous === 0) {
    if (current === 0) return null;
    return { label: '100%', positive: true };
  }
  const diff = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(Math.abs(diff));
  return { label: `${rounded}%`, positive: diff >= 0 };
}

function aggregateSeriesByMonth(points: Array<{ date: string; value: number }>) {
  const monthMap = new Map<string, { label: string; date: string; value: number }>();

  points.forEach((point) => {
    const parsed = new Date(point.date);
    if (Number.isNaN(parsed.getTime())) return;

    const key = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}`;
    const existing = monthMap.get(key);
    if (existing) {
      existing.value += Number(point.value || 0);
      return;
    }

    monthMap.set(key, {
      label: parsed.toLocaleDateString('en-US', { month: 'short' }),
      date: point.date,
      value: Number(point.value || 0),
    });
  });

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);
}

function MetricCard({
  value,
  label,
  trend,
  icon,
  valueClassName,
}: {
  value: string;
  label: string;
  trend: { label: string; positive: boolean } | null;
  icon: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-[250px] rounded-2xl border border-[#D8D8D8] bg-white px-4 py-3">
      <div className="flex items-start justify-between">
        <div className={valueClassName ?? 'text-[36px] font-semibold leading-none text-[#3C3C3C]'}>
          {value}
        </div>
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E8E8] text-[#7B00D4]">
          {icon}
        </div>
      </div>
      <p className="mt-1.5 text-[14px] leading-[120%] text-[#7A7A7A]">{label}</p>
      <div className="mt-3 flex items-center justify-between">
        {trend ? (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
              trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d={
                  trend.positive
                    ? 'M8.5 3.5L3.5 8.5M8.5 3.5H4.5M8.5 3.5V7.5'
                    : 'M3.5 3.5L8.5 8.5M8.5 8.5V4.5M8.5 8.5H4.5'
                }
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {trend.label}
          </span>
        ) : (
          <span className="inline-flex rounded-md bg-[#F5F5F5] px-2 py-0.5 text-[11px] font-medium text-[#9A9A9A]">
            No trend
          </span>
        )}
        <button className="text-[9px] text-[#7A7A7A] underline underline-offset-2 hover:text-[#3C3C3C]">
          Go to royalty
        </button>
      </div>
    </div>
  );
}

export default function LabelArtistDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('Track');
  const [openAdvance, setOpenAdvance] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);
  const [advanceSearch, setAdvanceSearch] = useState('');
  const [advanceStatus, setAdvanceStatus] = useState('all');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('all');
  const [advancePage, setAdvancePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const DASH_PAGE_SIZE = 10;

  const {
    dashboardMetrics,
    albumPerformance,
    albumRevenue,
    albumInteractions,
    trackStreamsDsp,
  } = useRoyalty();
  const { topTracks, topAlbums } = useTopPerformance(5);
  const { advances, marketingTrend, personalTrend, createAdvance } = useAdvance();
  const { expenses, trend: expensesTrend, createExpense } = useExpenses();

  const totalRevenueValue = useMemo(
    () => formatCurrencyAmount(Number(dashboardMetrics?.totalRevenue ?? 0), 'USD'),
    [dashboardMetrics]
  );
  const totalStreamsValue = useMemo(
    () => Number(dashboardMetrics?.totalStreams ?? 0).toLocaleString(),
    [dashboardMetrics]
  );
  const topTrackTitle = dashboardMetrics?.topTrack?.title ?? '-';

  const revenueTrend = useMemo(
    () => metricTrendLabel((dashboardMetrics?.revenueByMonth ?? []).map((item) => Number(item.revenue ?? 0))),
    [dashboardMetrics]
  );
  const streamsTrend = useMemo(
    () => metricTrendLabel((dashboardMetrics?.streamsByMonth ?? []).map((item) => Number(item.streams ?? 0))),
    [dashboardMetrics]
  );

  const trackRevenueSeries = useMemo(
    () =>
      (dashboardMetrics?.revenueByMonth ?? []).map((item) => ({
        label: item.label || '-',
        date: item.label || '-',
        value: Number(item.revenue ?? 0),
      })),
    [dashboardMetrics]
  );
  const trackPerformanceSeries = useMemo(
    () =>
      (dashboardMetrics?.streamsByMonth ?? []).map((item) => ({
        label: item.label || '-',
        date: item.label || '-',
        value: Number(item.streams ?? 0),
      })),
    [dashboardMetrics]
  );

  const albumRevenueSeries = useMemo(
    () =>
      aggregateSeriesByMonth(
        (albumRevenue ?? []).map((item) => ({
          date: item.day,
          value: Number(item.revenue ?? 0),
        }))
      ),
    [albumRevenue]
  );
  const albumPerformanceSeries = useMemo(
    () =>
      aggregateSeriesByMonth(
        (albumPerformance ?? []).map((item) => ({
          date: item.day,
          value: Number(item.streams ?? 0),
        }))
      ),
    [albumPerformance]
  );

  const trackTopRows = useMemo<PerformanceRow[]>(
    () =>
      (topTracks ?? []).map((track, index) => ({
        name: track.trackName || track.isrc || `Track ${index + 1}`,
        money: formatCurrencyAmount(Number(track.totalRevenueUSD ?? 0), 'USD'),
        stream: Number(track.totalStreams ?? 0).toLocaleString(),
      })),
    [topTracks]
  );

  const albumTopRows = useMemo<PerformanceRow[]>(
    () =>
      (topAlbums ?? []).map((album, index) => ({
        name: album.albumName || `Album ${index + 1}`,
        money: formatCurrencyAmount(Number(album.totalRevenueUSD ?? 0), 'USD'),
        stream: Number(album.totalStreams ?? 0).toLocaleString(),
      })),
    [topAlbums]
  );

  const trackInteractionSeries = useMemo<DonutSlice[]>(() => {
    const totalStreams =
      trackStreamsDsp?.dspSummary?.reduce((sum, item) => sum + Number(item.streams ?? 0), 0) ?? 0;
    if (totalStreams <= 0) return [];
    return [{ name: 'Stream', value: totalStreams, color: '#00D447' }];
  }, [trackStreamsDsp]);

  const albumInteractionSeries = useMemo<DonutSlice[]>(() => {
    return (albumInteractions ?? [])
      .map((item, index) => ({
        name: item.saleType,
        value: Number(item.count ?? 0),
        color: ALBUM_INTERACTION_COLORS[index % ALBUM_INTERACTION_COLORS.length],
      }))
      .filter((item) => item.value > 0);
  }, [albumInteractions]);

  const advanceRows = useMemo<AdvanceRow[]>(
    () =>
      (advances ?? []).map((row, index) => ({
        id: row._id || `ADV-${index + 1}`,
        date: formatDate((row.createdAt || row.created_at || '').toString()),
        amount: formatCurrencyAmount(Number(row.amount ?? 0), row.currency || 'USD'),
        type: toTitleCase(row.advance_type),
        status: normalizeStatus(row.repayment_status),
        purpose: row.purpose || '-',
      })),
    [advances]
  );

  const advanceTrendSeries = useMemo(
    () =>
      aggregateSeriesByMonth([
        ...(marketingTrend ?? []).map((point) => ({
          date: point.date,
          value: Number(point.totalUSD ?? 0),
        })),
        ...(personalTrend ?? []).map((point) => ({
          date: point.date,
          value: Number(point.totalUSD ?? 0),
        })),
      ]),
    [marketingTrend, personalTrend]
  );

  const filteredAdvanceRows = useMemo(() => {
    const keyword = advanceSearch.trim().toLowerCase();
    return advanceRows.filter((row) => {
      const matchStatus = advanceStatus === 'all' || row.status.toLowerCase() === advanceStatus;
      const matchKeyword =
        keyword === '' ||
        row.id.toLowerCase().includes(keyword) ||
        row.type.toLowerCase().includes(keyword) ||
        row.purpose.toLowerCase().includes(keyword);
      return matchStatus && matchKeyword;
    });
  }, [advanceRows, advanceSearch, advanceStatus]);

  const advanceTotalPages = Math.max(1, Math.ceil(filteredAdvanceRows.length / DASH_PAGE_SIZE));
  const pagedAdvanceRows = filteredAdvanceRows.slice((advancePage - 1) * DASH_PAGE_SIZE, advancePage * DASH_PAGE_SIZE);

  const expenseRows = useMemo<ExpenseRow[]>(
    () =>
      (expenses ?? []).map((row, index) => {
        const rawStatus = (row as Expense & { status?: string }).status;
        const rawArtistName =
          (row as Expense & { artist_name?: string; artistName?: string }).artist_name ||
          (row as Expense & { artist_name?: string; artistName?: string }).artistName;

        return {
          id: row.ref_id || row._id || `EXP-${index + 1}`,
          date: formatDate(row.expense_date || row.createdAt),
          category: toTitleCase(row.category),
          status: normalizeStatus(rawStatus),
          amount: formatCurrencyAmount(Number(row.amount ?? 0), row.currency || 'USD'),
          loggedBy: rawArtistName || 'Admin',
        };
      }),
    [expenses]
  );

  const expenseTrendSeries = useMemo(
    () =>
      aggregateSeriesByMonth(
        (expensesTrend ?? []).map((point) => ({
          date: point.day,
          value: Number(point.amount ?? 0),
        }))
      ),
    [expensesTrend]
  );

  const totalExpensesValue = useMemo(
    () => (expenses ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
    [expenses]
  );
  const totalExpensesCurrency = useMemo(
    () => deriveSingleCurrency((expenses ?? []).map((row) => row.currency), 'USD'),
    [expenses]
  );

  const filteredExpenseRows = useMemo(() => {
    const keyword = expenseSearch.trim().toLowerCase();
    return expenseRows.filter((row) => {
      const matchCategory = expenseCategory === 'all' || row.category === expenseCategory;
      const matchKeyword =
        keyword === '' ||
        row.id.toLowerCase().includes(keyword) ||
        row.category.toLowerCase().includes(keyword) ||
        row.loggedBy.toLowerCase().includes(keyword);
      return matchCategory && matchKeyword;
    });
  }, [expenseRows, expenseCategory, expenseSearch]);

  const expenseTotalPages = Math.max(1, Math.ceil(filteredExpenseRows.length / DASH_PAGE_SIZE));
  const pagedExpenseRows = filteredExpenseRows.slice((expensePage - 1) * DASH_PAGE_SIZE, expensePage * DASH_PAGE_SIZE);

  const expenseCategoryOptions = useMemo(() => {
    const categories = Array.from(new Set(expenseRows.map((row) => row.category)));
    return [{ label: 'All categories', value: 'all' }].concat(
      categories.map((category) => ({ label: category, value: category }))
    );
  }, [expenseRows]);

  const revenueSeries = activeTab === 'Track' ? trackRevenueSeries : albumRevenueSeries;
  const performanceSeries = activeTab === 'Track' ? trackPerformanceSeries : albumPerformanceSeries;
  const topRows = activeTab === 'Track' ? trackTopRows : albumTopRows;
  const interactionSeries = activeTab === 'Track' ? trackInteractionSeries : albumInteractionSeries;

  const handleAddAdvance = async (payload: NewAdvancePayload) => {
    try {
      let proofUrl = '';
      if (payload.proofs && payload.proofs.length > 0) {
        proofUrl = await uploadFile(payload.proofs[0], 'advance');
      }

      await createAdvance({
        amount: payload.amount,
        currency: payload.currency,
        advance_source_name: payload.sourceName,
        advance_source_phn: payload.phone,
        advance_source_email: payload.email,
        advance_type: payload.advanceType,
        repayment_status: payload.repaymentStatus,
        proof_of_payment: proofUrl,
        purpose: payload.purpose || '',
      });
      setOpenAdvance(false);
    } catch (error) {
      console.error('Create advance failed', error);
    }
  };

  const handleAddExpense = async (payload: NewExpensesPayload) => {
    try {
      let receiptUrl = '';
      if (payload.proofs && payload.proofs.length > 0) {
        receiptUrl = await uploadFile(payload.proofs[0], 'expense');
      }

      await createExpense({
        expense_date: payload.expense_date,
        category: payload.category,
        currency: payload.currency,
        amount: payload.amount,
        recoupable: payload.recoupable,
        description: payload.description,
        receipt_url: receiptUrl,
      });
      setOpenExpense(false);
    } catch (error) {
      console.error('Create expense failed', error);
    }
  };

  return (
    <div>
      <Topbar />

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-base text-[#5A5A5A]">Quick actions</p>
        <div className="flex w-full flex-wrap gap-3 lg:w-auto lg:flex-nowrap">
          <Button
            variant="primary"
            className="h-10 rounded-full px-6 text-xs"
            onClick={() => setOpenExpense(true)}
          >
            <FilePlus2 className="h-4 w-4" />
            Add Expenses
          </Button>
          <Button
            className="h-10 rounded-full bg-[#00D447] px-6 text-xs text-white hover:bg-[#00BF3F]"
            onClick={() => setOpenAdvance(true)}
          >
            <WalletCards className="h-4 w-4" />
            Request Advance
          </Button>
          <Menu
            trigger={
              <Button variant="greyy" className="h-10 rounded-full px-8 text-xs">
                More
                <ChevronRight className="h-4 w-4" />
              </Button>
            }
            items={[
              { label: 'Go to Track tab', onClick: () => setActiveTab('Track') },
              { label: 'Go to Advance tab', onClick: () => setActiveTab('Advance') },
              { label: 'Go to Expenses tab', onClick: () => setActiveTab('Expenses') },
            ]}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-nowrap gap-3 overflow-x-auto pb-2">
        <MetricCard
          value={totalRevenueValue}
          label="Total revenue"
          trend={revenueTrend}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          value={totalStreamsValue}
          label="Total streams"
          trend={streamsTrend}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          value={topTrackTitle}
          label="Top performing track"
          trend={null}
          icon={<FileMusic className="h-4 w-4" />}
          valueClassName="text-[34px] font-semibold leading-none text-[#3C3C3C]"
        />
      </div>

      <div className="mt-5 border-b border-neutral-200">
        <nav className="-mb-px flex gap-4">
          {(['Track', 'Album', 'Advance', 'Expenses'] as DashboardTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 px-1 py-1 text-sm font-bold ${
                activeTab === tab
                  ? 'border-[#7B00D4] text-[#7B00D4]'
                  : 'border-transparent text-[#AAAAAA] hover:border-neutral-300 hover:text-neutral-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-4">
        {(activeTab === 'Track' || activeTab === 'Album') && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <ChartCard
                title={activeTab === 'Track' ? 'Track Revenue trend' : 'Album Revenue trend'}
                variant="bar"
                data={revenueSeries}
                xKey="label"
                yKey="value"
                color="#BE8DE6"
              />
              <ChartCard
                title={activeTab === 'Track' ? 'All tracks performance' : 'All album performance'}
                variant="line"
                data={performanceSeries}
                xKey="label"
                yKey="value"
                color="#00B241"
                lineType="monotone"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <div className="border-b border-neutral-200 px-4 py-3 text-sm font-semibold text-[#3C3C3C]">
                  Top Performing {activeTab === 'Track' ? 'tracks' : 'albums'}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-[#F4F4F4] text-[#6F6F6F]">
                      <tr>
                        <th className="px-4 py-3 font-medium">
                          <span className="inline-flex items-center gap-1">
                            {activeTab === 'Track' ? 'Track' : 'Album'}
                            <ArrowUpDown className="h-3 w-3" />
                          </span>
                        </th>
                        <th className="px-4 py-3 font-medium">Money</th>
                        <th className="px-4 py-3 font-medium">Stream</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA] text-[#3C3C3C]">
                      {topRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-20">
                            <div className="flex flex-col items-center justify-center text-center">
                              <Table2 className="h-5 w-5 text-[#7B00D4]" />
                              <p className="mt-2 text-sm font-medium text-neutral-700">No records yet</p>
                              <p className="mt-1 max-w-xs text-xs text-[#3C3C3C]">
                                Entries will appear here once financial data is added.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        topRows.map((row) => (
                          <tr key={row.name}>
                            <td className="px-4 py-3">{row.name}</td>
                            <td className="px-4 py-3">{row.money}</td>
                            <td className="px-4 py-3">{row.stream}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <ChartCard
                title={activeTab === 'Track' ? 'Track Interaction Type' : 'Album Interaction Type'}
                variant="donut"
                data={interactionSeries}
                donutInnerText={'Total\nInteraction'}
                isHalfDonut
              />
            </div>
          </div>
        )}

        {activeTab === 'Advance' && (
          <div className="space-y-4">
            <ChartCard
              title="Advance Request trend"
              variant="line"
              data={advanceTrendSeries}
              xKey="label"
              yKey="value"
              color={BRAND.purple}
              lineType="linear"
              showDots
            />

            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <div className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm font-semibold text-[#3C3C3C]">Top Advance requests</div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      value={advanceSearch}
                      onChange={(event) => setAdvanceSearch(event.target.value)}
                      placeholder="Search advance request"
                      className="h-8 w-[230px] rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-xs text-[#5A5A5A] outline-none"
                    />
                  </div>
                  <Select
                    value={advanceStatus}
                    onChange={setAdvanceStatus}
                    className="h-8 min-w-[120px] bg-white text-xs"
                    options={[
                      { label: 'All Status', value: 'all' },
                      { label: 'Approved', value: 'approved' },
                      { label: 'Pending', value: 'pending' },
                      { label: 'Rejected', value: 'rejected' },
                      { label: 'Paid', value: 'paid' },
                    ]}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-[#F4F4F4] text-[#6F6F6F]">
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
                      <th className="px-4 py-3 font-medium">Purpose</th>
                      <th className="px-4 py-3 font-medium">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA] text-[#3C3C3C]">
                    {filteredAdvanceRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Table2 className="h-5 w-5 text-[#7B00D4]" />
                            <p className="mt-2 text-sm font-medium text-neutral-700">No records yet</p>
                            <p className="mt-1 max-w-xs text-xs text-[#3C3C3C]">
                              Entries will appear here once advance requests are created.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pagedAdvanceRows.map((row, index) => (
                        <tr key={`${row.id}-${index}`}>
                          <td className="px-4 py-3">{row.id}</td>
                          <td className="px-4 py-3">{row.date}</td>
                          <td className="px-4 py-3">{row.amount}</td>
                          <td className="px-4 py-3">{row.type}</td>
                          <td className="px-4 py-3">
                            <StatusPill label={row.status} />
                          </td>
                          <td className="max-w-[280px] truncate px-4 py-3">{row.purpose}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-neutral-500">
                              <button type="button" aria-label="Comments" className="hover:text-[#7B00D4]">
                                <MessageSquare className="h-4 w-4" />
                              </button>
                              <button type="button" aria-label="More actions" className="hover:text-[#7B00D4]">
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

              <Pagination page={advancePage} totalPages={advanceTotalPages} onChange={setAdvancePage} />
            </div>
          </div>
        )}

        {activeTab === 'Expenses' && (
          <div className="space-y-4">
            <ChartCard
              title="Expenses Trend"
              variant="line"
              data={expenseTrendSeries}
              xKey="label"
              yKey="value"
              color={BRAND.purple}
              lineType="monotone"
              chartMarginTop={48}
              chartOverlay={
                <div className="leading-none">
                  <div className=" flex items-center gap-1 text-[12px] font-normal leading-[120%] text-[#AAAAAA]">
                    <span className="h-2 w-[2px] rounded bg-[#7B00D4]" />
                    Total Expenses
                  </div>
                  <p className=" mt-1 text-[20px] font-medium leading-[120%] tracking-[0] text-[#3C3C3C]">
                    {formatCurrencyAmount(totalExpensesValue, totalExpensesCurrency)}
                  </p>
                </div>
              }
            />

            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <div className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm font-semibold text-[#3C3C3C]">Top Expenses</div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      value={expenseSearch}
                      onChange={(event) => setExpenseSearch(event.target.value)}
                      placeholder="Search expense"
                      className="h-8 w-[230px] rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-xs text-[#5A5A5A] outline-none"
                    />
                  </div>
                  <Select
                    value={expenseCategory}
                    onChange={setExpenseCategory}
                    className="h-8 min-w-[140px] bg-white text-xs"
                    options={expenseCategoryOptions}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-[#F4F4F4] text-[#6F6F6F]">
                    <tr>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">
                        <span className="inline-flex items-center gap-1">
                          Date
                          <ArrowUpDown className="h-3 w-3" />
                        </span>
                      </th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Logged by</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEA] text-[#3C3C3C]">
                    {filteredExpenseRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Table2 className="h-5 w-5 text-[#7B00D4]" />
                            <p className="mt-2 text-sm font-medium text-neutral-700">No records yet</p>
                            <p className="mt-1 max-w-xs text-xs text-[#3C3C3C]">
                              Entries will appear here once expenses are logged.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pagedExpenseRows.map((row, index) => (
                        <tr key={`${row.id}-${index}`}>
                          <td className="px-4 py-3">{row.id}</td>
                          <td className="px-4 py-3">{row.date}</td>
                          <td className="px-4 py-3">{row.category}</td>
                          <td className="px-4 py-3">
                            <StatusPill label={row.status} />
                          </td>
                          <td className="px-4 py-3">{row.amount}</td>
                          <td className="px-4 py-3">{row.loggedBy}</td>
                          <td className="px-4 py-3 text-right">
                            <button type="button" className="text-neutral-500 hover:text-[#7B00D4]">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination page={expensePage} totalPages={expenseTotalPages} onChange={setExpensePage} />
            </div>
          </div>
        )}
      </div>

      <AddAdvanceModal open={openAdvance} onClose={() => setOpenAdvance(false)} onSubmit={handleAddAdvance} />
      <AddExpensesModal open={openExpense} onClose={() => setOpenExpense(false)} onSubmit={handleAddExpense} />
    </div>
  );
}
