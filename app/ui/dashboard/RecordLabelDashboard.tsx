'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import Topbar from '@/components/layout/Topbar';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartCard, DonutSlice } from '@/components/dashboard/ChartCard';
import { useRoyalty } from '@/hooks/useRoyalty';
import { useAdvance } from '@/hooks/useAdvance';
import { useExpenses } from '@/hooks/useExpenses';
import { useUnrecognizedArtists } from '@/hooks/useUnrecognizedArtists';
import { uploadFile } from '@/lib/utils/upload';
import { BRAND } from '@/lib/brand';
import { Button } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { StatusPill } from '@/components/ui/StatusPill';
import { ChevronRight, FileText, Search, ChevronDown, Download, Grid, MessageSquare, MoreVertical, Table2 } from 'lucide-react';
import QuickActionsBar from '@/components/dashboard/QuickActionsBar';
import UploadFileModal from '@/components/ui/UploadFileModal';
import AddAdvanceModal, { NewAdvancePayload } from '@/ui/advance/AddAdvanceModal';
import AddExpensesModal, { NewExpensesPayload } from '@/ui/expenses/AddExpensesModal';
import UnrecognizedArtistsModal from '@/components/ui/UnrecognizedArtistsModal';
import IgnoreUnrecognizedConfirmModal from '@/components/ui/IgnoreUnrecognizedConfirmModal';
import { useAuth } from '@/contexts/AuthContext';

type Tab = 'Track' | 'Album' | 'Advance' | 'Expenses';

export default function RecordLabelDashboard() {
  const { dashboardMetrics, albumPerformance, albumRevenue, albumInteractions, uploadRoyaltyFile } = useRoyalty();
  const { user } = useAuth();
  const { createAdvance } = useAdvance();
  const { createExpense } = useExpenses();
  const { assignPendingArtists, refreshPendingArtists } = useUnrecognizedArtists();
  const [activeTab, setActiveTab] = useState<Tab>('Track');
  const [openUpload, setOpenUpload] = useState(false);
  const [openAdvance, setOpenAdvance] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);
  const [pendingUnmatchedArtists, setPendingUnmatchedArtists] = useState<string[]>([]);
  const [openUnrecognizedModal, setOpenUnrecognizedModal] = useState(false);
  const [openIgnoreConfirm, setOpenIgnoreConfirm] = useState(false);

  const handleUpload = async (file: File, organization: string, onProgress: (msg: string) => void) => {
    try {
      const result = await uploadRoyaltyFile(file, organization, onProgress);
      setOpenUpload(false);

      if (result.unmatchedArtists && result.unmatchedArtists.length > 0) {
        setPendingUnmatchedArtists(result.unmatchedArtists);
        setOpenUnrecognizedModal(true);
      }
    } catch (error) {
      console.error('Upload failed', error);
    }
  };

  const recordLabelArtists = useMemo(
    () =>
      (user?.names ?? [])
        .filter((n) => n.name_type === 'other_names')
        .map((n) => ({ id: n._id, name: n.name })),
    [user]
  );

  const handleResolveUnrecognizedArtists = async (mappings: Record<string, string>) => {
    if (Object.keys(mappings).length === 0) return;
    await assignPendingArtists(mappings);
    setOpenUnrecognizedModal(false);
    setPendingUnmatchedArtists([]);
    await refreshPendingArtists();
  };

  const handleIgnoreFromModal = () => {
    setOpenIgnoreConfirm(true);
  };

  const handleConfirmIgnore = async () => {
    setOpenIgnoreConfirm(false);
    setOpenUnrecognizedModal(false);
    setPendingUnmatchedArtists([]);
    await refreshPendingArtists();
  };

  const handleAddAdvance = async (payload: NewAdvancePayload) => {
    try {
      let proofUrl = '';
      if (payload.proofs && payload.proofs.length > 0) {
        proofUrl = await uploadFile(payload.proofs[0], 'advance');
      }
      await createAdvance({
        amount: payload.amount,
        currency: 'NGN',
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
        description: payload.description,
        receipt_url: receiptUrl,
      });
      setOpenExpense(false);
    } catch (error) {
      console.error('Create expense failed', error);
    }
  };

  const interactionData: DonutSlice[] = [
    { name: 'Download', value: 244, color: BRAND.green },
    { name: 'Stream', value: 500, color: BRAND.purple },
  ];

  const totalRevenueValue = useMemo(
    () => `$${Math.floor((dashboardMetrics?.totalRevenue ?? 0) * 1000) / 1000}`,
    [dashboardMetrics]
  );

  const totalStreamsValue = useMemo(
    () => (dashboardMetrics?.totalStreams ?? 0).toLocaleString(),
    [dashboardMetrics]
  );

  const topTrackTitle = dashboardMetrics?.topTrack?.title ?? '-';

  // Shared Interaction Performance Mock Data (Track & Album)
  const interactionPerformanceData = [
    { label: 'Jan', value: 38 },
    { label: 'Feb', value: 20 },
    { label: 'Mar', value: 65 },
    { label: 'Apr', value: 82 },
    { label: 'May', value: 75 },
    { label: 'Jun', value: 58 },
    { label: 'Jul', value: 80 },
    { label: 'Aug', value: 60 },
    { label: 'Sep', value: 43 },
    { label: 'Oct', value: 55 },
    { label: 'Nov', value: 82 },
    { label: 'Dec', value: 100 },
  ];

  // Mock data for Top Tracks Table
  const topTracksData = [
    { track: 'Track A', artist: 'Wizkid', revenue: '$500', streams: '200', download: '400' },
    { track: 'Track B', artist: 'Sarkodie', revenue: '$1,000', streams: '2,000', download: '39' },
    { track: 'Track C', artist: 'Diamond Platnumz', revenue: '$750', streams: '1,500', download: '50' },
    { track: 'Track D', artist: 'Yemi Alade', revenue: '$1,200', streams: '3,000', download: '25' },
    { track: 'Track E', artist: 'Burna Boy', revenue: '$1,500', streams: '3,000', download: '25' },
  ];

  // Mock data for Top Albums Table
  const topAlbumsData = [
    { album: 'Album A', artist: 'Diamond Platnumz', revenue: '$500', streams: '200', download: '400' },
    { album: 'Album B', artist: 'Sarkodie', revenue: '$1,000', streams: '2,000', download: '39' },
    { album: 'Album C', artist: 'Wizkid', revenue: '$750', streams: '1,500', download: '50' },
    { album: 'Album D', artist: 'Davido', revenue: '$1,200', streams: '3,000', download: '25' },
    { album: 'Album E', artist: 'Tems', revenue: '$1,500', streams: '3,000', download: '25' },
  ];

  // Mock data for Advance Tab
  const advanceTrendData = [
    { label: 'Jan', value: 20 },
    { label: 'Feb', value: 18 },
    { label: 'Mar', value: 60 },
    { label: 'Apr', value: 46 },
    { label: 'May', value: 59 },
    { label: 'Jun', value: 51 },
    { label: 'Jul', value: 80 },
    { label: 'Aug', value: 61 },
    { label: 'Sep', value: 43 },
    { label: 'Oct', value: 53 },
    { label: 'Nov', value: 83 },
    { label: 'Dec', value: 100 },
  ];

  const advanceInteractionData: DonutSlice[] = [
    { name: 'Marketing', value: 1000, color: BRAND.green },
    { name: 'Personal', value: 1500, color: BRAND.purple },
  ];

  const topAdvanceData = [
    { id: 'TRK-2025-0045', date: '03-Jan-2024', amount: '$500', type: 'Personal', status: 'Pending', purpose: 'It is a long established fact that a reader will be distracted by the r...' },
    { id: 'TRK-2025-0045', date: '03-Jan-2024', amount: '$500', type: 'Marketing', status: 'Pending', purpose: 'It is a long established fact that a reader will be distracted by the r...' },
    { id: 'TRK-2025-0045', date: '03-Jan-2024', amount: '$500', type: 'Marketing', status: 'Approved', purpose: 'It is a long established fact that a reader will be distracted by the r...' },
    { id: 'TRK-2025-0045', date: '03-Jan-2024', amount: '$500', type: 'Personal', status: 'Rejected', purpose: 'It is a long established fact that a reader will be distracted by the r...' },
  ];

  // Mock data for Expenses Trend Chart
  const expensesTrendData = [
    { label: 'Jan', value: 1500 },
    { label: 'Feb', value: 1400 },
    { label: 'Mar', value: 3900 },
    { label: 'Apr', value: 3200 },
    { label: 'May', value: 2500 },
    { label: 'Jun', value: 3500 },
    { label: 'Jul', value: 4100 },
    { label: 'Aug', value: 3100 },
    { label: 'Sep', value: 3400 },
    { label: 'Oct', value: 2400 },
    { label: 'Nov', value: 3000 },
    { label: 'Dec', value: 4300 },
  ];

  const topExpensesData = [
    { id: 'TRK-2025-0045', date: '03-Jan-2024', artist: 'Diamond Platnumz', category: 'Category 1', status: 'Pending', amount: '$500' },
    { id: 'TRK-2025-0045', date: '03-Jan-2024', artist: 'Sho Madjozi', category: 'Category 2', status: 'Approved', amount: '$500' },
    { id: 'TRK-2025-0045', date: '03-Jan-2024', artist: 'Sarkodie', category: 'Category 3', status: 'Pending', amount: '$500' },
    { id: 'TRK-2025-0046', date: '04-Jan-2024', artist: 'Yemi Alade', category: 'Category 1', status: 'Approved', amount: '$600' },
    { id: 'TRK-2025-0047', date: '05-Jan-2024', artist: 'Burna Boy', category: 'Category 2', status: 'Pending', amount: '$700' },
  ];

  return (
    <div>
      <Topbar />

      {/* Quick actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mt-6">
        <p className="text-lg font-medium text-neutral-700 hidden lg:block">Quick actions</p>

        <div className="hidden lg:block">
          <div className="flex items-center gap-3">
            <Button variant="primary" className="py-3 w-full whitespace-nowrap bg-[#7B00D4] hover:bg-[#6A00B8] border-none" onClick={() => setOpenUpload(true)}>
              <Download className="h-4 w-4 rotate-180" /> Add Royalty File
            </Button>
            <Button className="bg-[#00D447] px-10 py-3 w-full inline-flex items-center gap-2 whitespace-nowrap hover:bg-emerald-700 text-white border-none" onClick={() => setOpenExpense(true)}>
              <Grid className="h-4 w-4" /> Add Expenses
            </Button>
            <Menu
              trigger={
                <Button variant="greyy" className="px-10 py-3 w-full hidden border-none lg:flex bg-[#4A4A4A] text-white hover:bg-[#3A3A3A]">
                  More <ChevronRight className="h-4 w-4" />
                </Button>
              }
              items={[
                { label: 'Add new file', onClick: () => setOpenUpload(true) },
                { label: 'Add new advance', onClick: () => setOpenAdvance(true) },
                { label: 'Add new expense', onClick: () => setOpenExpense(true) },
                { label: 'Export table', onClick: () => { } },
                { label: 'Export analytics', onClick: () => { } },
              ]}
            />
          </div>
        </div>

        <div className="block lg:hidden w-full mt-4">
          <Menu
            trigger={
              <Button variant="outline" className="w-full justify-between">
                <p className="text-lg font-medium text-neutral-700">Quick actions</p> <ChevronDown className="h-4 w-4" />
              </Button>
            }
            items={[
              { label: 'Add Royalty File', onClick: () => setOpenUpload(true) },
              { label: 'Add Expenses', onClick: () => setOpenExpense(true) },
              { label: 'More', onClick: () => { } },
            ]}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 flex flex-nowrap xl:grid xl:grid-cols-3 gap-6 overflow-x-auto xl:overflow-x-visible pb-2 items-stretch">
        <div className="min-w-[280px] xl:min-w-0 flex-shrink-0 bg-white rounded-3xl border border-neutral-200 p-6 flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-2">
              <Search className="h-6 w-6" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-semibold text-neutral-900">20</div>
            <div className="flex justify-between items-center w-full mt-2">
              <div className="text-sm text-neutral-500">Total Artist</div>
              <button className="text-xs text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full hover:bg-neutral-200 transition-colors">View Artist</button>
            </div>
          </div>
        </div>

        <div className="min-w-[280px] xl:min-w-0 flex-shrink-0 bg-white rounded-3xl border border-neutral-200 p-6 flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div className="text-5xl font-semibold text-neutral-900">100</div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-2">
              <FileText className="h-6 w-6" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center w-full">
              <div className="text-sm text-neutral-500">Total Tracks</div>
              <button className="text-xs text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full hover:bg-neutral-200 transition-colors">View report</button>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8.5 3.5L3.5 8.5M8.5 3.5H4.5M8.5 3.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              40%
            </div>
          </div>
        </div>

        <div className="min-w-[280px] xl:min-w-0 flex-shrink-0 bg-white rounded-3xl border border-neutral-200 p-6 flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div className="text-5xl font-semibold text-neutral-900">$50,749.00</div>
            <div className="text-purple-600 w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-2">
              <span className="text-xl font-bold">$</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center w-full">
              <div className="text-sm text-neutral-500">Advance repayment</div>
              <button className="text-xs text-neutral-700 bg-neutral-100 px-3 py-1 rounded-full hover:bg-neutral-200 transition-colors">View report</button>
            </div>
            <div className="mt-2 text-rose-500 mt-2 inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-xs font-medium">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3.5 3.5L8.5 8.5M8.5 8.5V4.5M8.5 8.5H4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              40%
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-neutral-200">
        <nav className="-mb-px flex gap-6">
          {['Track', 'Album', 'Advance', 'Expenses'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${activeTab === tab
                  ? 'border-[#7B00D4] text-[#7B00D4]'
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
                }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">

        {/* Track & Album Tabs */}
        {(activeTab === 'Track' || activeTab === 'Album') && (
          <div className="space-y-6">
            <div className="flex flex-col xl:flex-row gap-4">
              <div className="w-full xl:w-2/3">
                <ChartCard
                  title={activeTab === 'Track' ? 'Track Interaction Performance' : 'Album Interaction performance'}
                  variant="line"
                  data={interactionPerformanceData}
                  xKey="label"
                  yKey="value"
                  color={BRAND.purple}
                  lineType="monotone"
                  headerFilterLabel="Go to royalty"
                  onHeaderFilterClick={() => { }}
                />
              </div>
              <div className="w-full xl:w-1/3">
                <ChartCard
                  title={activeTab === 'Track' ? 'Track Interaction Type' : 'Album Interaction Type'}
                  variant="donut"
                  data={interactionData}
                  donutInnerText={'Total\nInteraction'}
                  isHalfDonut={true}
                />
              </div>
            </div>

            {/* Top Tracks/Albums Table */}
            <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
              <div className="p-5 border-b border-neutral-200">
                <h3 className="text-base font-semibold text-neutral-900">{activeTab === 'Track' ? 'Top Tracks' : 'Top Albums'}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-neutral-500 font-medium bg-neutral-50">
                    <tr>
                      <th className="px-6 py-4 font-medium flex items-center gap-1">{activeTab === 'Track' ? 'Track' : 'Albums'} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg></th>
                      <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1">Artist <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg></div></th>
                      <th className="px-6 py-4 font-medium">Revenue</th>
                      <th className="px-6 py-4 font-medium">Streams</th>
                      <th className="px-6 py-4 font-medium">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(activeTab === 'Track' ? topTracksData : topAlbumsData).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-20">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Table2 className="h-5 w-5 text-[#7B00D4]" />
                            <p className="mt-2 text-sm font-medium text-neutral-700">No records yet</p>
                            <p className="mt-1 max-w-xs text-xs text-neutral-500">
                              Entries will appear here once financial data is added by your label.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      (activeTab === 'Track' ? topTracksData : topAlbumsData).map((item, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/50">
                          <td className="px-6 py-4 text-neutral-900 font-medium">{activeTab === 'Track' ? (item as { track: string }).track : (item as { album: string }).album}</td>
                          <td className="px-6 py-4 text-neutral-600">{item.artist}</td>
                          <td className="px-6 py-4 text-neutral-900">{item.revenue}</td>
                          <td className="px-6 py-4 text-neutral-600">{item.streams}</td>
                          <td className="px-6 py-4 text-neutral-600">{item.download}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Advance Tab */}
        {activeTab === 'Advance' && (
          <div className="space-y-6">
            <div className="flex flex-col xl:flex-row gap-4">
              <div className="w-full xl:w-2/3">
                <ChartCard
                  title="All Advance request trend"
                  variant="line"
                  data={advanceTrendData}
                  xKey="label"
                  yKey="value"
                  color={BRAND.purple}
                  lineType="monotone"
                  headerFilterLabel="Go to advance"
                  onHeaderFilterClick={() => { }}
                />
              </div>
              <div className="w-full xl:w-1/3">
                <ChartCard
                  title="Advance request type"
                  variant="donut"
                  data={advanceInteractionData}
                  donutInnerText={'Total\nrequests'}
                />
              </div>
            </div>

            {/* Top Advance Table */}
            <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
              <div className="p-5 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-neutral-900">Top Advance requests</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-neutral-500 font-medium bg-neutral-50">
                    <tr>
                      <th className="px-6 py-4 font-medium">ID</th>
                      <th className="px-6 py-4 font-medium flex items-center gap-1">Date <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg></th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium">Advance type</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium w-1/4">Purpose</th>
                      <th className="px-6 py-4 font-medium">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {topAdvanceData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Table2 className="h-5 w-5 text-[#7B00D4]" />
                            <p className="mt-2 text-sm font-medium text-neutral-700">No records yet</p>
                            <p className="mt-1 max-w-xs text-xs text-neutral-500">
                              Entries will appear here once financial data is added by your label.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      topAdvanceData.map((advance, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/50">
                          <td className="px-6 py-4 text-neutral-900 font-medium">{advance.id}</td>
                          <td className="px-6 py-4 text-neutral-500">{advance.date}</td>
                          <td className="px-6 py-4 text-neutral-900 font-medium">{advance.amount}</td>
                          <td className="px-6 py-4 text-neutral-600">{advance.type}</td>
                          <td className="px-6 py-4">
                            <StatusPill label={advance.status as 'Repaid' | 'Outstanding' | 'Pending' | 'Approved'} />
                          </td>
                          <td className="px-6 py-4 text-neutral-600 truncate max-w-[200px]">{advance.purpose}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 text-neutral-400">
                              <button className="hover:text-[#7B00D4]"><MessageSquare className="h-4 w-4" /></button>
                              <button className="hover:text-[#7B00D4]"><MoreVertical className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'Expenses' && (
          <div className="space-y-6">
            <div className="w-full relative">
              <ChartCard
                title="Expenses Trend"
                variant="line"
                data={expensesTrendData}
                xKey="label"
                yKey="value"
                color={BRAND.purple}
                lineType="monotone"
                headerFilterLabel="Go to Expenses"
                onHeaderFilterClick={() => { }}
              />
            </div>

            {/* Top Expenses Table */}
            <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
              <div className="p-5 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-neutral-900">Top Expenses</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search advance request"
                      className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-700 hover:bg-neutral-50">
                      All categories <ChevronDown className="h-4 w-4 text-neutral-400" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-700 hover:bg-neutral-50">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      All artists <ChevronDown className="h-4 w-4 text-neutral-400" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-neutral-500 font-medium bg-neutral-50">
                    <tr>
                      <th className="px-6 py-4 font-medium">ID</th>
                      <th className="px-6 py-4 font-medium flex items-center gap-1">Date <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg></th>
                      <th className="px-6 py-4 font-medium">Artist Name</th>
                      <th className="px-6 py-4 font-medium">Category</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {topExpensesData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-20">
                          <div className="flex flex-col items-center justify-center text-center">
                            <Table2 className="h-5 w-5 text-[#7B00D4]" />
                            <p className="mt-2 text-sm font-medium text-neutral-700">No records yet</p>
                            <p className="mt-1 max-w-xs text-xs text-neutral-500">
                              Entries will appear here once financial data is added by your label.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      topExpensesData.map((expense, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/50">
                          <td className="px-6 py-4 text-neutral-900 font-medium">{expense.id}</td>
                          <td className="px-6 py-4 text-neutral-500">{expense.date}</td>
                          <td className="px-6 py-4 text-neutral-600">{expense.artist}</td>
                          <td className="px-6 py-4 text-neutral-600">{expense.category}</td>
                          <td className="px-6 py-4">
                            <StatusPill label={expense.status as 'Repaid' | 'Outstanding' | 'Pending' | 'Approved'} />
                          </td>
                          <td className="px-6 py-4 text-neutral-900 font-medium">{expense.amount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <UploadFileModal
        isOpen={openUpload}
        onClose={() => setOpenUpload(false)}
        onUpload={handleUpload}
      />
      <AddAdvanceModal
        open={openAdvance}
        onClose={() => setOpenAdvance(false)}
        onSubmit={handleAddAdvance}
      />
      <AddExpensesModal
        open={openExpense}
        onClose={() => setOpenExpense(false)}
        onSubmit={handleAddExpense}
      />
      <UnrecognizedArtistsModal
        isOpen={openUnrecognizedModal}
        onClose={() => setOpenUnrecognizedModal(false)}
        unrecognizedNames={pendingUnmatchedArtists}
        systemArtists={recordLabelArtists}
        onFinish={handleResolveUnrecognizedArtists}
        onIgnore={handleIgnoreFromModal}
      />
      <IgnoreUnrecognizedConfirmModal
        open={openIgnoreConfirm}
        onClose={() => setOpenIgnoreConfirm(false)}
        onConfirm={handleConfirmIgnore}
      />
    </div>
  );
}
