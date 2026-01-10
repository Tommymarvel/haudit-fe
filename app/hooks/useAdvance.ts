import useSWR, { mutate } from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import { Advance, CreateAdvancePayload, CreateRepaymentPayload, Repayment, AdvanceOverview, AdvanceTrendItem, TypePercentage } from '@/lib/types/advance';
import { toast } from 'react-toastify';

const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

export function useAdvance() {
  const { data: advances, error, isLoading } = useSWR<Advance[]>('/advance', fetcher);
  const { data: overview } = useSWR<AdvanceOverview>('/advance/overview', fetcher);
  const { data: marketingTrend } = useSWR<AdvanceTrendItem[]>('/advance/trend/marketting', fetcher);
  const { data: personalTrend } = useSWR<AdvanceTrendItem[]>('/advance/trend/personal', fetcher);
  const { data: typePercentage } = useSWR<TypePercentage>('/advance/type-percentage', fetcher);

  const createAdvance = async (payload: CreateAdvancePayload) => {
    try {
      const response = await axiosInstance.post('/advance/create-advance', payload);
      toast.success('Advance created successfully');
      mutate('/advance');
      mutate('/advance/overview');
      mutate('/advance/trend/marketting');
      mutate('/advance/trend/personal');
      mutate('/advance/type-percentage');
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
      mutate('/advance');
      mutate('/advance/overview');
      mutate('/advance/trend/marketting');
      mutate('/advance/trend/personal');
      mutate('/advance/type-percentage');
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
