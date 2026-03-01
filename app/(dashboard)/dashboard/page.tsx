'use client';
import AppShell from '@/components/layout/AppShell';
import SoloArtistDashboard from '@/ui/dashboard/SoloArtistDashboard';
import LabelArtistDashboard from '@/ui/dashboard/LabelArtistDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <AppShell>
      {user?.user_type === 'label_artist' ? <LabelArtistDashboard /> : <SoloArtistDashboard />}
    </AppShell>
  );
}
