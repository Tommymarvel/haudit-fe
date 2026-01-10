import useSWR, { mutate } from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import { RoyaltyDashboardMetrics, RoyaltyUploadsResponse } from '@/lib/types/royalty';
import { toast } from 'react-toastify';

const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

export function useRoyalty() {
  const { data: dashboardMetrics, error: dashboardError, isLoading: isDashboardLoading } = useSWR<RoyaltyDashboardMetrics>('/royalties/dashboard', fetcher);
  
  const { data: uploads, error: uploadsError, isLoading: isUploadsLoading } = useSWR<RoyaltyUploadsResponse>('/royalties/uploads?limit=10&page=1', fetcher);

  const uploadRoyaltyFile = async (file: File, source: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', source);

    try {
      await axiosInstance.post('/royalties/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Royalty file uploaded successfully');
      mutate('/royalties/uploads?limit=10&page=1'); // Revalidate uploads list
      mutate('/royalties/dashboard'); // Revalidate dashboard metrics
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to upload royalty file');
      throw err;
    }
  };

  return {
    dashboardMetrics,
    isDashboardLoading,
    dashboardError,
    uploads,
    isUploadsLoading,
    uploadsError,
    uploadRoyaltyFile,
  };
}
