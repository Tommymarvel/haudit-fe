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
  const availableBalanceEndpoint = useMemo(
    () => appendQueryParam('/advance/dashboard/available', 'artistId', artistId),
    [artistId]
  );

  // Approving/creating/updating an expense changes the advance "available" balance,
  // so revalidate that endpoint too (both the base key and the artist-scoped key).
  const revalidateAvailableBalance = () => {
    mutate('/advance/dashboard/available');
    if (availableBalanceEndpoint !== '/advance/dashboard/available') {
      mutate(availableBalanceEndpoint);
    }
  };

  const POLL_INTERVAL = 30_000;

  const { data, error, isLoading } = useSWR<Expense[]>(expensesEndpoint, fetcher, { refreshInterval: POLL_INTERVAL });
  const { data: trendData } = useSWR<{ trend: ExpenseTrendItem[]; netTotal: number }>(trendEndpoint, trendFetcher, { refreshInterval: POLL_INTERVAL });

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
      revalidateAvailableBalance();
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
      revalidateAvailableBalance();
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
      revalidateAvailableBalance();
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
      revalidateAvailableBalance();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update expense status'));
      throw error;
    }
  };

  const bulkUploadExpenses = async (file: File, uploadArtistId?: string): Promise<{ rowsProcessed?: number; count?: number }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resolvedArtistId = uploadArtistId ?? artistId;
      if (resolvedArtistId) formData.append('artistId', resolvedArtistId);
      const response = await axiosInstance.post<{ rowsProcessed?: number; count?: number }>('/expenses/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Expenses uploaded successfully');
      mutate('/expenses');
      mutate('/expenses/trend');
      if (expensesEndpoint !== '/expenses') mutate(expensesEndpoint);
      if (trendEndpoint !== '/expenses/trend') mutate(trendEndpoint);
      revalidateAvailableBalance();
      return response.data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to upload expenses'));
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
    bulkUploadExpenses,
    approveExpense,
    rejectExpense,
    updateExpenseStatus,
  };
}
