// app/(dashboard)/advance/page.tsx
'use client';

import AppShell from '@/components/layout/AppShell';
import SoloArtistAdvance from '@/ui/advance/SoloArtistAdvance';
import RecordLabelAdvance from '@/ui/advance/RecordLabelAdvance';
import LabelArtistAdvance from '@/ui/advance/LabelArtistAdvance';
import { useAuth } from '@/contexts/AuthContext';

export default function AdvancePage() {
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
        <RecordLabelAdvance />
      </AppShell>
    );
  }

  if (user?.user_type === 'label_artist') {
    return (
      <AppShell>
        <LabelArtistAdvance />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SoloArtistAdvance />
    </AppShell>
  );
}

