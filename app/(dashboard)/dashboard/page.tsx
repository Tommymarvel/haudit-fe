'use client';
import AppShell from '@/components/layout/AppShell';
import SoloArtistDashboard from '@/ui/dashboard/SoloArtistDashboard';
import RecordLabelDashboard from '@/ui/dashboard/RecordLabelDashboard';
import LabelArtistDashboard from '@/ui/dashboard/LabelArtistDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  const DashboardComponent =
    user?.user_type === 'record_label'
      ? RecordLabelDashboard
      : user?.user_type === 'label_artist'
      ? LabelArtistDashboard
      : SoloArtistDashboard;

  return (
    <AppShell>
      <DashboardComponent />
    </AppShell>
  );
}

