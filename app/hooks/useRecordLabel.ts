import useSWR from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import {
  RecordLabelDashboardSummary,
  RecordLabelTopAdvance,
  RecordLabelTopAlbum,
  RecordLabelTopExpense,
  RecordLabelTopTrack,
} from '@/lib/types/record-label';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { appendQueryParam } from '@/lib/utils/query';

const dashboardFetcher = (url: string) =>
  axiosInstance.get(url).then((res) => (res.data ?? {}) as RecordLabelDashboardSummary);

const listFetcher = <T,>(url: string) =>
  axiosInstance.get(url).then((res) => {
    const payload = res.data;
    if (payload?.data && Array.isArray(payload.data)) return payload.data as T[];
    if (Array.isArray(payload)) return payload as T[];
    return [] as T[];
  });

export function useRecordLabel() {
  const searchParams = useSearchParams();
  const artistId = (searchParams.get('artistId') || '').trim();

  const dashboardEndpoint = useMemo(
    () => appendQueryParam('/record-label/dashboard', 'artistId', artistId),
    [artistId]
  );
  const topTracksEndpoint = useMemo(
    () => appendQueryParam('/top-performance/top-tracks?limit=5', 'artistId', artistId),
    [artistId]
  );
  const topAlbumsEndpoint = useMemo(
    () => appendQueryParam('/top-performance/top-albums?limit=5', 'artistId', artistId),
    [artistId]
  );
  const topAdvancesEndpoint = useMemo(
    () => appendQueryParam('/record-label/top-advances', 'artistId', artistId),
    [artistId]
  );
  const topExpensesEndpoint = useMemo(
    () => appendQueryParam('/record-label/top-expenses', 'artistId', artistId),
    [artistId]
  );

  const { data: dashboard, error: dashboardError, isLoading: dashboardLoading } =
    useSWR<RecordLabelDashboardSummary>(dashboardEndpoint, dashboardFetcher);
  const { data: topTracks, error: topTracksError, isLoading: topTracksLoading } =
    useSWR<RecordLabelTopTrack[]>(topTracksEndpoint, listFetcher<RecordLabelTopTrack>);
  const { data: topAlbums, error: topAlbumsError, isLoading: topAlbumsLoading } =
    useSWR<RecordLabelTopAlbum[]>(topAlbumsEndpoint, listFetcher<RecordLabelTopAlbum>);
  const { data: topAdvances, error: topAdvancesError, isLoading: topAdvancesLoading } =
    useSWR<RecordLabelTopAdvance[]>(topAdvancesEndpoint, listFetcher<RecordLabelTopAdvance>);
  const { data: topExpenses, error: topExpensesError, isLoading: topExpensesLoading } =
    useSWR<RecordLabelTopExpense[]>(topExpensesEndpoint, listFetcher<RecordLabelTopExpense>);

  return {
    dashboard,
    topTracks,
    topAlbums,
    topAdvances,
    topExpenses,
    isLoading:
      dashboardLoading ||
      topTracksLoading ||
      topAlbumsLoading ||
      topAdvancesLoading ||
      topExpensesLoading,
    isError:
      dashboardError ||
      topTracksError ||
      topAlbumsError ||
      topAdvancesError ||
      topExpensesError,
  };
}
