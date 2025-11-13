'use client';
import AppShell from '@/components/layout/AppShell';
import SoloArtistDashboard from '@/ui/dashboard/SoloArtistDashboard';

export default function DashboardPage() {
  return (
    <AppShell>
      <SoloArtistDashboard />
    </AppShell>
  );
}
