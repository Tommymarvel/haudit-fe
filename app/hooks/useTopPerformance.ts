import useSWR from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import { RecordLabelTopAlbum, RecordLabelTopTrack } from '@/lib/types/record-label';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { appendQueryParam } from '@/lib/utils/query';

const listFetcher = <T,>(url: string) =>
  axiosInstance.get(url).then((res) => {
    const payload = res.data;
    if (payload?.data && Array.isArray(payload.data)) return payload.data as T[];
    if (Array.isArray(payload)) return payload as T[];
    return [] as T[];
  });

export function useTopPerformance(limit = 5) {
  const searchParams = useSearchParams();
  const artistId = (searchParams.get('artistId') || '').trim();

  const tracksEndpoint = useMemo(
    () => appendQueryParam(`/top-performance/top-tracks?limit=${limit}`, 'artistId', artistId),
    [artistId, limit]
  );
  const albumsEndpoint = useMemo(
    () => appendQueryParam(`/top-performance/top-albums?limit=${limit}`, 'artistId', artistId),
    [artistId, limit]
  );

  const {
    data: topTracks,
    error: topTracksError,
    isLoading: topTracksLoading,
  } = useSWR<RecordLabelTopTrack[]>(tracksEndpoint, listFetcher<RecordLabelTopTrack>);

  const {
    data: topAlbums,
    error: topAlbumsError,
    isLoading: topAlbumsLoading,
  } = useSWR<RecordLabelTopAlbum[]>(albumsEndpoint, listFetcher<RecordLabelTopAlbum>);

  return {
    topTracks: topTracks ?? [],
    topAlbums: topAlbums ?? [],
    isLoading: topTracksLoading || topAlbumsLoading,
    isError: topTracksError || topAlbumsError,
  };
}
