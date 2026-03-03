'use client';
import AppShell from '@/components/layout/AppShell';
import SoloArtistExpenses from '@/ui/expenses/SoloArtistExpenses';
import RecordLabelExpenses from '@/ui/expenses/RecordLabelExpenses';
import LabelArtistExpenses from '@/ui/expenses/LabelArtistExpenses';
import { useAuth } from '@/contexts/AuthContext';

export default function Expenses() {
  const { user } = useAuth();

  const ExpensesComponent =
    user?.user_type === 'record_label'
      ? RecordLabelExpenses
      : user?.user_type === 'label_artist'
      ? LabelArtistExpenses
      : SoloArtistExpenses;

  return (
    <AppShell>
      <ExpensesComponent />
    </AppShell>
  );
}

