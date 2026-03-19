import useSWR, { mutate } from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import { AxiosError } from 'axios';
import { RoyaltyDashboardMetrics, RoyaltyUploadResponse, RoyaltyUploadsResponse, TrackStreamsDsp } from '@/lib/types/royalty';
import { toast } from 'react-toastify';

type UnmatchedArtistApiItem = {
  name: string;
  createdAt?: string;
  willBeDeletedAt?: string;
};

const isUnmatchedArtistApiArray = (payload: unknown): payload is UnmatchedArtistApiItem[] =>
  Array.isArray(payload) &&
  payload.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as { name?: unknown }).name === 'string',
  );

const fetcher = (url: string) => axiosInstance.get(url).then((res) => res.data);

export function useRoyalty() {
  const { data: dashboardMetrics, error: dashboardError, isLoading: isDashboardLoading } = useSWR<RoyaltyDashboardMetrics>('/royalties/dashboard', fetcher);

  const { data: uploads, error: uploadsError, isLoading: isUploadsLoading } = useSWR<RoyaltyUploadsResponse>('/royalties/uploads?limit=10&page=1', fetcher);

  const { data: albumPerformance, error: albumPerformanceError, isLoading: isAlbumPerformanceLoading } = useSWR<Array<{ streams: number; day: string }>>('/royalties/album-performance', fetcher);

  const { data: albumRevenue, error: albumRevenueError, isLoading: isAlbumRevenueLoading } = useSWR<Array<{ revenue: number; day: string }>>('/royalties/album-revenue', fetcher);

  const { data: albumInteractions, error: albumInteractionsError, isLoading: isAlbumInteractionsLoading } = useSWR<{ totalStreams: number }>('/royalties/album-interactions', fetcher);

  const { data: trackRevenueDsp, error: trackRevenueDspError, isLoading: isTrackRevenueDspLoading } = useSWR<Array<{ assetId: string; assetTitle: string; dsps: Array<{ dsp: string; revenue: number }> }>>('/royalties/track-revenue-dsp', fetcher);

  const { data: trackStreamsDsp, error: trackStreamsDspError, isLoading: isTrackStreamsDspLoading } = useSWR<TrackStreamsDsp>('/royalties/track-streams-dsp?monthly=false', fetcher);

  const uploadRoyaltyFile = async (
    file: File,
    source: string,
    onProgress?: (message: string) => void,
  ): Promise<RoyaltyUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', source);

    const sseUrl = `${process.env.NEXT_PUBLIC_API_URL}royalties/upload-progress`;
    const eventSource = new EventSource(sseUrl, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onProgress?.(typeof data === 'string' ? data : JSON.stringify(data));
      } catch {
        onProgress?.(event.data);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    try {
      const response = await axiosInstance.post<RoyaltyUploadResponse>('/royalties/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Royalty file uploaded successfully');
      mutate('/royalties/uploads?limit=10&page=1'); // Revalidate uploads list
      mutate('/royalties/dashboard'); // Revalidate dashboard metrics
      return response.data;
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string } | UnmatchedArtistApiItem[]>;
      const payload = error.response?.data;

      // Backend may now return 400 with unmatched artist objects requiring user resolution.
      if (error.response?.status === 400 && isUnmatchedArtistApiArray(payload)) {
        const unmatchedArtists = payload.map((item) => item.name);
        toast.warning('Upload contains unrecognized artist names. Please resolve them.');
        return {
          message: 'Upload requires artist resolution',
          rowsUpserted: 0,
          rowsProcessed: 0,
          fileUrl: '',
          unmatchedArtists,
        };
      }

      const message =
        !Array.isArray(payload) && payload?.message
          ? payload.message
          : 'Failed to upload royalty file';
      toast.error(message);
      throw err;
    } finally {
      eventSource.close();
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
    uploadRoyaltyFile,
  };
}
