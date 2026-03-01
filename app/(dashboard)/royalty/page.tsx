'use client';
import AppShell from '@/components/layout/AppShell';
import SoloArtistRoyalty from '@/ui/royalty/SoloArtistRoyalty';
import LabelArtistRoyalty from '@/ui/royalty/LabelArtistRoyalty';
import { useAuth } from '@/contexts/AuthContext';

export default function Royalty() {
  const { user } = useAuth();
  return (
    <AppShell>
      {user?.user_type === 'label_artist' ? <LabelArtistRoyalty /> : <SoloArtistRoyalty />}
    </AppShell>
  );
}
