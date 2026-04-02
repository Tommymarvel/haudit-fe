import useSWR, { mutate } from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import { AxiosError } from 'axios';
import { CreateExpensePayload, Expense, ExpenseTrendItem } from '@/lib/types/expenses';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { appendQueryParam } from '@/lib/utils/query';

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
    if (d.trend && Array.isArray(d.trend)) return d.trend;
    return [];
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
  const { data: trend } = useSWR<ExpenseTrendItem[]>(trendEndpoint, trendFetcher);

  const createExpense = async (payload: CreateExpensePayload) => {
    try {
      await axiosInstance.post('/expenses', {
        artist_name: payload.artist_name,
        expense_date: payload.expense_date,
        category: payload.category,
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
      const err = error as AxiosError<{ message: string }>;
      toast.error(err.response?.data?.message || 'Failed to create expense');
      throw error;
    }
  };

  return {
    expenses: data,
    trend,
    isLoading,
    isError: error,
    createExpense,
  };
}
