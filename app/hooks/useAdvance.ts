import useSWR, { mutate } from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import { Advance, CreateAdvancePayload, CreateRepaymentPayload, Repayment, AdvanceOverview, AdvanceTrendItem, TypePercentage } from '@/lib/types/advance';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { appendQueryParam } from '@/lib/utils/query';

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

  const { data: advances, error, isLoading } = useSWR<Advance[]>(advancesEndpoint, listFetcher<Advance>);
  const { data: overview } = useSWR<AdvanceOverview>(overviewEndpoint, objectFetcher<AdvanceOverview>);
  const { data: marketingTrend } = useSWR<AdvanceTrendItem[]>(
    marketingTrendEndpoint,
    listFetcher<AdvanceTrendItem>
  );
  const { data: personalTrend } = useSWR<AdvanceTrendItem[]>(
    personalTrendEndpoint,
    listFetcher<AdvanceTrendItem>
  );
  const { data: typePercentage } = useSWR<TypePercentage>(
    typePercentageEndpoint,
    objectFetcher<TypePercentage>
  );

  const revalidateAdvanceEndpoints = () => {
    const pairs: Array<[string, string]> = [
      ['/advance', advancesEndpoint],
      ['/advance/overview', overviewEndpoint],
      ['/advance/trend/marketting', marketingTrendEndpoint],
      ['/advance/trend/personal', personalTrendEndpoint],
      ['/advance/type-percentage', typePercentageEndpoint],
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
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create advance');
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
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create repayment');
      throw err;
    }
  };

  const getRepayments = async (advanceId: string) => {
    try {
      const response = await axiosInstance.get(`/advance/repayment/${advanceId}`);
      return response.data as Repayment[];
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to fetch repayments');
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
    createAdvance,
    createRepayment,
    getRepayments,
  };
}
