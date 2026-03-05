'use client';
import AppShell from '@/components/layout/AppShell';
import SoloArtistExpenses from '@/ui/expenses/SoloArtistExpenses';
import RecordLabelExpenses from '@/ui/expenses/RecordLabelExpenses';
import LabelArtistExpenses from '@/ui/expenses/LabelArtistExpenses';
import { useAuth } from '@/contexts/AuthContext';

export default function Expenses() {
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
        <RecordLabelExpenses />
      </AppShell>
    );
  }

  if (user?.user_type === 'label_artist') {
    return (
      <AppShell>
        <LabelArtistExpenses />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SoloArtistExpenses />
    </AppShell>
  );
}
