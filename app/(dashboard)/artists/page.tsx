'use client';

import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import RecordLabelArtists from '@/ui/artists/RecordLabelArtists';

export default function ArtistsPage() {
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

  if (user?.user_type !== 'record_label') {
    return (
      <AppShell>
        <div className="py-16 text-center text-sm text-[#777777]">
          Artists page is available for record label accounts only.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <RecordLabelArtists />
    </AppShell>
  );
}
