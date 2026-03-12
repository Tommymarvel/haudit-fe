// app/(dashboard)/advance/page.tsx
'use client';

import AppShell from '@/components/layout/AppShell';
import SoloArtistAdvance from '@/ui/advance/SoloArtistAdvance';
import RecordLabelAdvance from '@/ui/advance/RecordLabelAdvance';
import LabelArtistAdvance from '@/ui/advance/LabelArtistAdvance';
import { useAuth } from '@/contexts/AuthContext';

export default function AdvancePage() {
  const { user } = useAuth();

  const AdvanceComponent =
    user?.user_type === 'record_label'
      ? RecordLabelAdvance
      : user?.user_type === 'label_artist'
      ? LabelArtistAdvance
      : SoloArtistAdvance;

  return (
    <AppShell>
      <AdvanceComponent />
    </AppShell>
  );
}

