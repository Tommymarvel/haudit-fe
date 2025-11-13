// app/(dashboard)/advance/page.tsx
'use client';

import AppShell from '@/components/layout/AppShell';
import SoloArtistAdvance from '@/ui/advance/SoloArtistAdvance';

export default function AdvancePage() {


  return (
    <AppShell>
      <SoloArtistAdvance />
    </AppShell>
  );
}
