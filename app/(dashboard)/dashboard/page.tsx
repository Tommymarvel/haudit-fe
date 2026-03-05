'use client';
import AppShell from '@/components/layout/AppShell';
import SoloArtistDashboard from '@/ui/dashboard/SoloArtistDashboard';
import RecordLabelDashboard from '@/ui/dashboard/RecordLabelDashboard';
import LabelArtistDashboard from '@/ui/dashboard/LabelArtistDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-[#7B00D4]" />
        </div>
      </AppShell>
    );
  }

  if (user?.user_type === 'record_label') {
    return (
      <AppShell>
        <RecordLabelDashboard />
      </AppShell>
    );
  }

  if (user?.user_type === 'label_artist') {
    return (
      <AppShell>
        <LabelArtistDashboard />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SoloArtistDashboard />
    </AppShell>
  );
}
