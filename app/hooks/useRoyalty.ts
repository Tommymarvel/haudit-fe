import useSWR, { mutate } from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import { RoyaltyDashboardMetrics, RoyaltyUploadsResponse, TrackStreamsDsp } from '@/lib/types/royalty';
import { toast } from 'react-toastify';

const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

export function useRoyalty() {
  const { data: dashboardMetrics, error: dashboardError, isLoading: isDashboardLoading } = useSWR<RoyaltyDashboardMetrics>('/royalties/dashboard', fetcher);

  const { data: uploads, error: uploadsError, isLoading: isUploadsLoading } = useSWR<RoyaltyUploadsResponse>('/royalties/uploads?limit=10&page=1', fetcher);

  const { data: albumPerformance, error: albumPerformanceError, isLoading: isAlbumPerformanceLoading } = useSWR<Array<{ streams: number; day: string }>>('/royalties/album-performance', fetcher);

  const { data: albumRevenue, error: albumRevenueError, isLoading: isAlbumRevenueLoading } = useSWR<Array<{ revenue: number; day: string }>>('/royalties/album-revenue', fetcher);

  const { data: albumInteractions, error: albumInteractionsError, isLoading: isAlbumInteractionsLoading } = useSWR<{ totalStreams: number }>('/royalties/album-interactions', fetcher);

  const { data: trackRevenueDsp, error: trackRevenueDspError, isLoading: isTrackRevenueDspLoading } = useSWR<Array<{ assetId: string; assetTitle: string; dsps: Array<{ dsp: string; revenue: number }> }>>('/royalties/track-revenue-dsp', fetcher);

  const { data: trackStreamsDsp, error: trackStreamsDspError, isLoading: isTrackStreamsDspLoading } = useSWR<TrackStreamsDsp>('/royalties/track-streams-dsp', fetcher);

  const { data: tracksStreams, error: tracksStreamsError, isLoading: isTracksStreamsLoading } = useSWR<{ collectiveTotalStreams: number; tracks: Array<{ title: string; totalStreams: number }> }>('/royalties/tracks-streams', fetcher);

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
    albumPerformance,
    isAlbumPerformanceLoading,
    albumPerformanceError,
    albumRevenue,
    isAlbumRevenueLoading,
    albumRevenueError,
    albumInteractions,
    isAlbumInteractionsLoading,
    albumInteractionsError,
    trackRevenueDsp,
    isTrackRevenueDspLoading,
    trackRevenueDspError,
    trackStreamsDsp,
    isTrackStreamsDspLoading,
    trackStreamsDspError,
    tracksStreams,
    isTracksStreamsLoading,
    tracksStreamsError,
    uploadRoyaltyFile,
  };
}
