
import QuickActionsBar from '@/components/dashboard/QuickActionsBar';
import { Menu } from '@/components/ui/Menu';
import { Button } from '@/components/ui/Button';
import { ChevronDown } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartCard, DonutSlice } from '@/components/dashboard/ChartCard';
import UploadFileModal from '@/components/ui/UploadFileModal';
import AddAdvanceModal, { NewAdvancePayload } from '@/ui/advance/AddAdvanceModal';
import AddExpensesModal, { NewExpensesPayload } from '@/ui/expenses/AddExpensesModal';
import SoloUnrecognizedArtistsModal from '@/components/ui/SoloUnrecognizedArtistsModal';
import IgnoreUnrecognizedConfirmModal from '@/components/ui/IgnoreUnrecognizedConfirmModal';

import Image from 'next/image';
import Topbar from '@/components/layout/Topbar';
import { useMemo, useState } from 'react';
import { useRoyalty } from '@/hooks/useRoyalty';
import { useAdvance } from '@/hooks/useAdvance';
import { useExpenses } from '@/hooks/useExpenses';
import { useUnrecognizedArtists } from '@/hooks/useUnrecognizedArtists';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile } from '@/lib/utils/upload';

export default function SoloArtistDashboard() {
  const { user } = useAuth();
  const { dashboardMetrics, albumPerformance, albumRevenue, albumInteractions, uploadRoyaltyFile } = useRoyalty();
  const { createAdvance } = useAdvance();
  const { createExpense } = useExpenses();
  const { assignPendingArtists, refreshPendingArtists } = useUnrecognizedArtists();
  const [openUpload, setOpenUpload] = useState(false);
  const [openAdvance, setOpenAdvance] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);
  const [openUnrecognizedModal, setOpenUnrecognizedModal] = useState(false);
  const [openIgnoreConfirm, setOpenIgnoreConfirm] = useState(false);
  const [pendingUnmatchedArtists, setPendingUnmatchedArtists] = useState<string[]>([]);

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

  const handleResolveUnrecognizedArtists = async (mappings: Record<string, string>) => {
    if (Object.keys(mappings).length === 0) return;
    await assignPendingArtists(mappings);
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
        description: payload.description,
        receipt_url: receiptUrl,
      });
      setOpenExpense(false);
    } catch (error) {
      console.error('Create expense failed', error);
    }
  };

  // API endpoint for track interaction type is not connected yet.
  const interactionData: DonutSlice[] = [];

  const totalRevenueValue = useMemo(
    () => `$${Math.floor((dashboardMetrics?.totalRevenue ?? 0) * 1000) / 1000}`,
    [dashboardMetrics]
  );

  const totalStreamsValue = useMemo(
    () => (dashboardMetrics?.totalStreams ?? 0).toLocaleString(),
    [dashboardMetrics]
  );

  const topTrackTitle = dashboardMetrics?.topTrack?.title ?? '-';
  const revenueSpark = useMemo(
    () =>
      (dashboardMetrics?.revenueByMonth ?? []).map((m) => ({
        v: m.revenue ?? 0,
      })),
    [dashboardMetrics]
  );
  const streamsSpark = useMemo(
    () =>
      (dashboardMetrics?.streamsByMonth ?? []).map((m) => ({
        v: m.streams ?? 0,
      })),
    [dashboardMetrics]
  );

  const revenueByTrackData = useMemo(
    () =>
      (dashboardMetrics?.revenueByMonth ?? []).map((m) => ({
        label: m.label,
        value: m.revenue ?? 0,
      })),
    [dashboardMetrics]
  );

  const allTracksPerformanceData = useMemo(
    () =>
      (dashboardMetrics?.streamsByMonth ?? []).map((m) => ({
        label: m.label,
        value: m.streams ?? 0,
      })),
    [dashboardMetrics]
  );

  const albumPerformanceData = useMemo(
    () =>
      (albumPerformance ?? []).map((item) => ({
        label: item.day,
        value: item.streams,
      })),
    [albumPerformance]
  );

  const albumRevenueData = useMemo(
    () =>
      (albumRevenue ?? []).map((item) => ({
        label: item.day,
        value: item.revenue,
      })),
    [albumRevenue]
  );

  const albumInteractionData: DonutSlice[] = useMemo(
    () => [
      { 
        name: 'Stream', 
        value: albumInteractions?.totalStreams ?? 0, 
        color: '#7B00D4' 
      },
    ],
    [albumInteractions]
  );

  return (
    <div>
      <div className="">
        {' '}
        <Topbar />
      </div>

      {/* Quick actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mt-6">
        <p className="text-lg font-medium text-neutral-700 hidden lg:block">Quick actions</p>
        
        <div className="hidden lg:block">
          <QuickActionsBar
            onAddFile={() => setOpenUpload(true)}
            onAddAdvance={() => setOpenAdvance(true)}
            onAddExpense={() => setOpenExpense(true)}
            onMore={() => {}}
          />
        </div>

        <div className="block lg:hidden w-full mt-4">
          <Menu
            trigger={
              <Button variant="outline" className="w-full justify-between">
                  <p className="text-lg font-medium text-neutral-700">Quick actions</p> <ChevronDown className="h-4 w-4" />
              </Button>
            }
            items={[
              { label: 'Add new royalty record', onClick: () => setOpenUpload(true) },
              { label: 'Add Advance', onClick: () => setOpenAdvance(true) },
              { label: 'Add Expense', onClick: () => setOpenExpense(true) },
              { label: 'Export Table', onClick: () => {} },
              { label: 'Export Analytics', onClick: () => {} },
            ]}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5 flex flex-nowrap xl:grid xl:grid-cols-3 gap-4 overflow-x-auto xl:overflow-x-visible pb-2">
        <StatCard
          className="min-w-[280px] xl:min-w-0 flex-shrink-0"
          title="Total revenue"
          value={totalRevenueValue}
          icon={
            <Image
              src="/svgs/dollar-sign.svg"
              width={48}
              height={48}
              alt="haudit"
            />
          }
          spark={{ data: revenueSpark }}
        />
        <StatCard
          className="min-w-[280px] xl:min-w-0 flex-shrink-0"
          title="Total streams"
          value={totalStreamsValue}
          icon={
            <Image src="/svgs/users.svg" width={48} height={48} alt="haudit" />
          }
          spark={{ data: streamsSpark }}
        />
        <StatCard
          className="min-w-[280px] xl:min-w-0 flex-shrink-0"
          title="Top performing track"
          value={topTrackTitle}
          icon={
            <Image src="/svgs/music.svg" width={48} height={48} alt="haudit" />
          }
        />
      </div>

      {/* Charts */}
      <div className="mt-6 flex flex-col xl:flex-row gap-4">
        <div className="w-full xl:w-[45.11%]">
          <ChartCard
            title="Revenue by track"
            variant="bar"
            data={revenueByTrackData}
            xKey="label"
            yKey="value"
          />
        </div>
        <div className="w-full xl:flex-1">
          <ChartCard
            title="All tracks performance"
            variant="line"
            data={allTracksPerformanceData}
            xKey="label"
            yKey="value"
            lineType="monotone"
          />
        </div>
      </div>
      {/* Charts */}
      <div className="mt-6 flex flex-col xl:flex-row gap-4">
        <div className="w-full xl:flex-1">
          <ChartCard
            title="All album performance"
            variant="line"
            data={albumPerformanceData}
            xKey="label"
            yKey="value"
            lineType="monotone"
          />
        </div>
        <div className="w-full xl:w-[45.11%]">
          <ChartCard
            title="Revenue by album"
            variant="bar"
            data={albumRevenueData}
            xKey="label"
            yKey="value"
          />
        </div>
      </div>
      <div className="mt-6 flex flex-col xl:flex-row gap-4">
        <div className="w-full xl:w-[45.11%]">
          <ChartCard
            title="Track Interaction Type"
            variant="donut"
            data={interactionData}
            donutInnerText={'Total\nInteraction'}
            emptyStateTitle="No track interaction data"
            emptyStateDescription="This graph is not connected to an API endpoint yet."
          />
        </div>
        <div className="w-full xl:flex-1">
          <ChartCard
            title="Album Interaction Type"
            variant="donut"
            data={albumInteractionData}
            donutInnerText={'Total\nInteraction'}
          />
        </div>
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
      <SoloUnrecognizedArtistsModal
        isOpen={openUnrecognizedModal}
        onClose={() => setOpenUnrecognizedModal(false)}
        unrecognizedNames={pendingUnmatchedArtists}
        currentArtistId={user?.id || ''}
        onFinish={handleResolveUnrecognizedArtists}
        onIgnore={() => setOpenIgnoreConfirm(true)}
      />
      <IgnoreUnrecognizedConfirmModal
        open={openIgnoreConfirm}
        onClose={() => setOpenIgnoreConfirm(false)}
        onConfirm={async () => {
          setOpenIgnoreConfirm(false);
          setOpenUnrecognizedModal(false);
          setPendingUnmatchedArtists([]);
          await refreshPendingArtists();
        }}
      />
    </div>
  );
}
