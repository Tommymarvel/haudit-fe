// app/(dashboard)/advance/page.tsx
'use client';

import AppShell from '@/components/layout/AppShell';
import SoloArtistAdvance from '@/ui/advance/SoloArtistAdvance';
import LabelArtistAdvance from '@/ui/advance/LabelArtistAdvance';
import { useAuth } from '@/contexts/AuthContext';

export default function AdvancePage() {
  const { user } = useAuth();

  return (
    <AppShell>
      {user?.user_type === 'label_artist' ? <LabelArtistAdvance /> : <SoloArtistAdvance />}
    </AppShell>
  );
}
