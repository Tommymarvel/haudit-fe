import useSWR, { mutate } from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import { CreateExpensePayload, Expense, ExpenseTrendItem } from '@/lib/types/expenses';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { appendQueryParam } from '@/lib/utils/query';
import { getApiErrorMessage } from '@/lib/utils/apiError';

const fetcher = (url: string) =>
  axiosInstance.get(url).then((res) => {
    // Handle { message, data: [...] } or just [...]
    const d = res.data;
    if (d.data && Array.isArray(d.data)) return d.data;
    if (Array.isArray(d)) return d;
    return [];
  });

const trendFetcher = (url: string) =>
  axiosInstance.get(url).then((res) => {
    const d = res.data;
    if (d.trend && Array.isArray(d.trend)) return { trend: d.trend as ExpenseTrendItem[], netTotal: Number(d.netTotal ?? 0) };
    return { trend: [] as ExpenseTrendItem[], netTotal: 0 };
  });

export function useExpenses() {
  const searchParams = useSearchParams();
  const artistId = (searchParams.get('artistId') || '').trim();

  const expensesEndpoint = useMemo(() => appendQueryParam('/expenses', 'artistId', artistId), [artistId]);
  const trendEndpoint = useMemo(
    () => appendQueryParam('/expenses/trend', 'artistId', artistId),
    [artistId]
  );

  const { data, error, isLoading } = useSWR<Expense[]>(expensesEndpoint, fetcher);
  const { data: trendData } = useSWR<{ trend: ExpenseTrendItem[]; netTotal: number }>(trendEndpoint, trendFetcher);

  const createExpense = async (payload: CreateExpensePayload) => {
    try {
      await axiosInstance.post('/expenses', {
        artistId: payload.artistId,
        expense_date: payload.expense_date,
        ...(payload.category && { category: payload.category }),
        ...(payload.advance_type && { advance_type: payload.advance_type }),
        currency: payload.currency,
        amount: payload.amount,
        recoupable: payload.recoupable,
        description: payload.description,
        receipt_url: payload.receipt_url || '',
      });
      toast.success('Expense created successfully');
      mutate('/expenses');
      mutate('/expenses/trend');
      if (expensesEndpoint !== '/expenses') mutate(expensesEndpoint);
      if (trendEndpoint !== '/expenses/trend') mutate(trendEndpoint);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create expense'));
      throw error;
    }
  };

  const approveExpense = async (docId: string) => {
    try {
      await axiosInstance.patch(`/expenses/${docId}/approve`);
      toast.success('Expense approved successfully');
      mutate(expensesEndpoint);
      mutate(trendEndpoint);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to approve expense'));
      throw error;
    }
  };

  const rejectExpense = async (docId: string) => {
    try {
      await axiosInstance.patch(`/expenses/${docId}/reject`);
      toast.success('Expense rejected successfully');
      mutate(expensesEndpoint);
      mutate(trendEndpoint);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to reject expense'));
      throw error;
    }
  };

  const updateExpenseStatus = async (docId: string, payload: { status: string; status_desc: string }) => {
    try {
      await axiosInstance.patch(`/expenses/${docId}/status`, payload);
      toast.success('Expense status updated');
      mutate(expensesEndpoint);
      mutate(trendEndpoint);
      if (expensesEndpoint !== '/expenses') mutate(expensesEndpoint);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update expense status'));
      throw error;
    }
  };

  return {
    expenses: data,
    trend: trendData?.trend,
    netTotal: trendData?.netTotal ?? 0,
    isLoading,
    isError: error,
    createExpense,
    approveExpense,
    rejectExpense,
    updateExpenseStatus,
  };
}
