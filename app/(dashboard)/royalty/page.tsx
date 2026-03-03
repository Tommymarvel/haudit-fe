'use client';
import AppShell from '@/components/layout/AppShell';
import SoloArtistRoyalty from '@/ui/royalty/SoloArtistRoyalty';
import RecordLabelRoyalty from '@/ui/royalty/RecordLabelRoyalty';
import LabelArtistRoyalty from '@/ui/royalty/LabelArtistRoyalty';
import { useAuth } from '@/contexts/AuthContext';

export default function Royalty() {
  const { user } = useAuth();

  const RoyaltyComponent =
    user?.user_type === 'record_label'
      ? RecordLabelRoyalty
      : user?.user_type === 'label_artist'
      ? LabelArtistRoyalty
      : SoloArtistRoyalty;

  return (
    <AppShell>
      <RoyaltyComponent />
    </AppShell>
  );
}

