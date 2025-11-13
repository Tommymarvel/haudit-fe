'use client';
import AppShell from '@/components/layout/AppShell';
import SoloArtistExpenses from '@/ui/expenses/SoloArtistExpenses';

export default function Expenses() {
  return (
    <AppShell>
      <SoloArtistExpenses />
    </AppShell>
  );
}
