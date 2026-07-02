import useSWR, { mutate } from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import { Advance, AvailableBalance, CreateAdvancePayload, CreateRepaymentPayload, Repayment, AdvanceOverview, AdvanceTrendItem, TypePercentage } from '@/lib/types/advance';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { appendQueryParam } from '@/lib/utils/query';
import { getApiErrorMessage } from '@/lib/utils/apiError';

const listFetcher = <T,>(url: string) =>
  axiosInstance.get(url).then((res) => {
    const payload = res.data;
    if (Array.isArray(payload)) return payload as T[];
    if (payload?.data && Array.isArray(payload.data)) return payload.data as T[];
    return [] as T[];
  });

const objectFetcher = <T,>(url: string) =>
  axiosInstance.get(url).then((res) => {
    const payload = res.data;
    if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      return payload.data as T;
    }
    return payload as T;
  });

export function useAdvance() {
  const searchParams = useSearchParams();
  const artistId = (searchParams.get('artistId') || '').trim();

  const advancesEndpoint = useMemo(() => appendQueryParam('/advance', 'artistId', artistId), [artistId]);
  const overviewEndpoint = useMemo(
    () => appendQueryParam('/advance/overview', 'artistId', artistId),
    [artistId]
  );
  const marketingTrendEndpoint = useMemo(
    () => appendQueryParam('/advance/trend/marketting', 'artistId', artistId),
    [artistId]
  );
  const personalTrendEndpoint = useMemo(
    () => appendQueryParam('/advance/trend/personal', 'artistId', artistId),
    [artistId]
  );
  const typePercentageEndpoint = useMemo(
    () => appendQueryParam('/advance/type-percentage', 'artistId', artistId),
    [artistId]
  );
  const availableBalanceEndpoint = useMemo(
    () => appendQueryParam('/advance/dashboard/available', 'artistId', artistId),
    [artistId]
  );

  const POLL_INTERVAL = 30_000;

  const { data: advances, error, isLoading } = useSWR<Advance[]>(advancesEndpoint, listFetcher<Advance>, { refreshInterval: POLL_INTERVAL });
  const { data: overview } = useSWR<AdvanceOverview>(overviewEndpoint, objectFetcher<AdvanceOverview>, { refreshInterval: POLL_INTERVAL });
  const { data: marketingTrend } = useSWR<AdvanceTrendItem[]>(
    marketingTrendEndpoint,
    listFetcher<AdvanceTrendItem>,
    { refreshInterval: POLL_INTERVAL }
  );
  const { data: personalTrend } = useSWR<AdvanceTrendItem[]>(
    personalTrendEndpoint,
    listFetcher<AdvanceTrendItem>,
    { refreshInterval: POLL_INTERVAL }
  );
  const { data: typePercentage } = useSWR<TypePercentage>(
    typePercentageEndpoint,
    objectFetcher<TypePercentage>,
    { refreshInterval: POLL_INTERVAL }
  );
  const { data: availableBalance } = useSWR<AvailableBalance>(
    availableBalanceEndpoint,
    objectFetcher<AvailableBalance>,
    { refreshInterval: POLL_INTERVAL }
  );

  const revalidateAdvanceEndpoints = () => {
    const pairs: Array<[string, string]> = [
      ['/advance', advancesEndpoint],
      ['/advance/overview', overviewEndpoint],
      ['/advance/trend/marketting', marketingTrendEndpoint],
      ['/advance/trend/personal', personalTrendEndpoint],
      ['/advance/type-percentage', typePercentageEndpoint],
      ['/advance/dashboard/available', availableBalanceEndpoint],
    ];

    pairs.forEach(([baseKey, scopedKey]) => {
      mutate(baseKey);
      if (scopedKey !== baseKey) mutate(scopedKey);
    });
  };

  const createAdvance = async (payload: CreateAdvancePayload) => {
    try {
      const response = await axiosInstance.post('/advance/create-advance', payload);
      toast.success('Advance created successfully');
      revalidateAdvanceEndpoints();
      return response.data;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to create advance'));
      throw err;
    }
  };

  const createRepayment = async (payload: CreateRepaymentPayload) => {
    try {
      const response = await axiosInstance.post('/advance/create-repayment', payload);
      toast.success('Repayment created successfully');
      revalidateAdvanceEndpoints();
      return response.data;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to create repayment'));
      throw err;
    }
  };

  const getRepayments = async (advanceId: string) => {
    try {
      const response = await axiosInstance.get(`/advance/repayment/${advanceId}`);
      return response.data as Repayment[];
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to fetch repayments'));
      throw err;
    }
  };

  const updateAdvanceStatus = async (
    id: string,
    payload: { status: string; status_desc: string; advance_paid_receipt?: string },
  ) => {
    try {
      const response = await axiosInstance.patch(`/advance/${id}/status`, payload);
      toast.success('Advance status updated');
      revalidateAdvanceEndpoints();
      return response.data;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to update advance status'));
      throw err;
    }
  };

  const approveAdvance = async (id: string) => {
    try {
      const response = await axiosInstance.patch(`/advance/${id}/approve`);
      toast.success('Advance approved');
      revalidateAdvanceEndpoints();
      return response.data;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to approve advance'));
      throw err;
    }
  };

  const rejectAdvance = async (id: string) => {
    try {
      const response = await axiosInstance.patch(`/advance/${id}/reject`);
      toast.success('Advance rejected');
      revalidateAdvanceEndpoints();
      return response.data;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to reject advance'));
      throw err;
    }
  };

  return {
    advances,
    isLoading,
    isError: error,
    overview,
    marketingTrend,
    personalTrend,
    typePercentage,
    availableBalance,
    createAdvance,
    createRepayment,
    getRepayments,
    updateAdvanceStatus,
    approveAdvance,
    rejectAdvance,
  };
}
