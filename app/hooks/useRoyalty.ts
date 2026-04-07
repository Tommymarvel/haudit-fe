import useSWR, { mutate } from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import { AxiosError } from 'axios';
import {
  AlbumInteractionItem,
  RoyaltyDashboardMetrics,
  RoyaltyUploadResponse,
  RoyaltyUploadsResponse,
  TerritoryAnalysisItem,
  TrackStreamsDsp,
} from '@/lib/types/royalty';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { appendQueryParam } from '@/lib/utils/query';

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
const listFetcher = <T,>(url: string) =>
  axiosInstance.get(url).then((res) => {
    const payload = res.data;
    if (Array.isArray(payload)) return payload as T[];
    if (payload?.data && Array.isArray(payload.data)) return payload.data as T[];
    return [] as T[];
  });

export function useRoyalty() {
  const searchParams = useSearchParams();
  const artistId = (searchParams.get('artistId') || '').trim();

  const dashboardEndpoint = useMemo(
    () => appendQueryParam('/royalties/dashboard', 'artistId', artistId),
    [artistId]
  );
  const uploadsEndpoint = useMemo(
    () => appendQueryParam('/royalties/uploads?limit=10&page=1', 'artistId', artistId),
    [artistId]
  );
  const albumPerformanceEndpoint = useMemo(
    () => appendQueryParam('/royalties/album-performance', 'artistId', artistId),
    [artistId]
  );
  const albumRevenueEndpoint = useMemo(
    () => appendQueryParam('/royalties/album-revenue', 'artistId', artistId),
    [artistId]
  );
  const albumInteractionsEndpoint = useMemo(
    () => appendQueryParam('/royalties/album-interactions', 'artistId', artistId),
    [artistId]
  );
  const trackRevenueDspEndpoint = useMemo(
    () => appendQueryParam('/royalties/track-revenue-dsp', 'artistId', artistId),
    [artistId]
  );
  const trackStreamsDspEndpoint = useMemo(
    () => appendQueryParam('/royalties/track-streams-dsp?monthly=false', 'artistId', artistId),
    [artistId]
  );
  const territoryAnalysisEndpoint = useMemo(
    () => appendQueryParam('/royalties/territory-analysis', 'artistId', artistId),
    [artistId]
  );

  const { data: dashboardMetrics, error: dashboardError, isLoading: isDashboardLoading } = useSWR<RoyaltyDashboardMetrics>(dashboardEndpoint, fetcher);

  const { data: uploads, error: uploadsError, isLoading: isUploadsLoading } = useSWR<RoyaltyUploadsResponse>(uploadsEndpoint, fetcher);

  const { data: albumPerformance, error: albumPerformanceError, isLoading: isAlbumPerformanceLoading } = useSWR<Array<{ streams: number; day: string }>>(albumPerformanceEndpoint, fetcher);

  const { data: albumRevenue, error: albumRevenueError, isLoading: isAlbumRevenueLoading } = useSWR<Array<{ revenue: number; day: string }>>(albumRevenueEndpoint, fetcher);

  const { data: albumInteractions, error: albumInteractionsError, isLoading: isAlbumInteractionsLoading } = useSWR<AlbumInteractionItem[]>(albumInteractionsEndpoint, fetcher);

  const { data: trackRevenueDsp, error: trackRevenueDspError, isLoading: isTrackRevenueDspLoading } = useSWR<Array<{ assetId: string; assetTitle: string; dsps: Array<{ dsp: string; revenue: number }> }>>(trackRevenueDspEndpoint, fetcher);

  const { data: trackStreamsDsp, error: trackStreamsDspError, isLoading: isTrackStreamsDspLoading } = useSWR<TrackStreamsDsp>(trackStreamsDspEndpoint, fetcher);

  const { data: territoryAnalysis, error: territoryAnalysisError, isLoading: isTerritoryAnalysisLoading } =
    useSWR<TerritoryAnalysisItem[]>(territoryAnalysisEndpoint, listFetcher<TerritoryAnalysisItem>);

  const uploadRoyaltyFile = async (
    file: File,
    source: string,
    onProgress?: (message: string) => void,
    artistIds?: string[],
  ): Promise<RoyaltyUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', source);
    if (artistIds && artistIds.length > 0) {
      artistIds.forEach((artistId) => formData.append('artistIds', artistId));
    }

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
      mutate('/royalties/uploads?limit=10&page=1');
      mutate('/royalties/dashboard');
      if (uploadsEndpoint !== '/royalties/uploads?limit=10&page=1') mutate(uploadsEndpoint);
      if (dashboardEndpoint !== '/royalties/dashboard') mutate(dashboardEndpoint);
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
    territoryAnalysis,
    isTerritoryAnalysisLoading,
    territoryAnalysisError,
    uploadRoyaltyFile,
  };
}
