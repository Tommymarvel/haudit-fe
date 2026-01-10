import useSWR, { mutate } from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import { AxiosError } from 'axios';
import { CreateExpensePayload, Expense, ExpenseTrendItem } from '@/lib/types/expenses';
import { toast } from 'react-toastify';

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
  const { data, error, isLoading } = useSWR<Expense[]>('/expenses', fetcher);
  const { data: trend } = useSWR<ExpenseTrendItem[]>('/expenses/trend', trendFetcher);

  const createExpense = async (payload: CreateExpensePayload) => {
    try {
      await axiosInstance.post('/expenses', {
        expense_date: payload.expense_date,
        category: payload.category,
        currency: payload.currency,
        amount: payload.amount,
        description: payload.description,
        receipt_url: payload.receipt_url || '',
      });
      toast.success('Expense created successfully');
      mutate('/expenses');
      mutate('/expenses/trend');
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
