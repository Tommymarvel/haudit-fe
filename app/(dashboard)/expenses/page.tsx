'use client';
import AppShell from '@/components/layout/AppShell';
import SoloArtistExpenses from '@/ui/expenses/SoloArtistExpenses';
import LabelArtistExpenses from '@/ui/expenses/LabelArtistExpenses';
import { useAuth } from '@/contexts/AuthContext';

export default function Expenses() {
  const { user } = useAuth();
  return (
    <AppShell>
      {user?.user_type === 'label_artist' ? <LabelArtistExpenses /> : <SoloArtistExpenses />}
    </AppShell>
  );
}
