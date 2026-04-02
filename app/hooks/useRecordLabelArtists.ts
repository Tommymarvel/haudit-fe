import useSWR, { mutate } from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import { toast } from 'react-toastify';
import {
  InviteRecordLabelArtistPayload,
  RecordLabelArtist,
} from '@/lib/types/record-label';

const ARTISTS_ENDPOINT = '/record-label/artists';

const artistsFetcher = (url: string) =>
  axiosInstance.get(url).then((res) => {
    const payload = res.data;
    if (payload?.data && Array.isArray(payload.data)) return payload.data as RecordLabelArtist[];
    if (Array.isArray(payload)) return payload as RecordLabelArtist[];
    return [] as RecordLabelArtist[];
  });

export function useRecordLabelArtists() {
  const { data, error, isLoading } = useSWR<RecordLabelArtist[]>(
    ARTISTS_ENDPOINT,
    artistsFetcher
  );

  const inviteArtist = async (payload: InviteRecordLabelArtistPayload) => {
    try {
      const response = await axiosInstance.post('/record-label/invite', payload);
      toast.success(response.data?.message || 'Artist invited successfully');
      mutate(ARTISTS_ENDPOINT);
      return response.data;
    } catch (err: unknown) {
      const errorPayload = err as { response?: { data?: { message?: string } } };
      toast.error(errorPayload.response?.data?.message || 'Failed to invite artist');
      throw err;
    }
  };

  const updateArtistStatus = async ({
    artistId,
    action,
    successMessage,
    errorMessage,
  }: {
    artistId: string;
    action: 'activate' | 'deactivate' | 'archive' | 'unarchive';
    successMessage: string;
    errorMessage: string;
  }) => {
    try {
      const response = await axiosInstance.patch(`/record-label/artists/${artistId}/${action}`);
      toast.success(response.data?.message || successMessage);
      mutate(ARTISTS_ENDPOINT);
      return response.data;
    } catch (err: unknown) {
      const errorPayload = err as { response?: { data?: { message?: string } } };
      toast.error(errorPayload.response?.data?.message || errorMessage);
      throw err;
    }
  };

  const activateArtist = (artistId: string) =>
    updateArtistStatus({
      artistId,
      action: 'activate',
      successMessage: 'Artist activated successfully',
      errorMessage: 'Failed to activate artist',
    });

  const deactivateArtist = (artistId: string) =>
    updateArtistStatus({
      artistId,
      action: 'deactivate',
      successMessage: 'Artist deactivated successfully',
      errorMessage: 'Failed to deactivate artist',
    });

  const archiveArtist = (artistId: string) =>
    updateArtistStatus({
      artistId,
      action: 'archive',
      successMessage: 'Artist archived successfully',
      errorMessage: 'Failed to archive artist',
    });

  const unarchiveArtist = (artistId: string) =>
    updateArtistStatus({
      artistId,
      action: 'unarchive',
      successMessage: 'Artist unarchived successfully',
      errorMessage: 'Failed to unarchive artist',
    });

  return {
    artists: data ?? [],
    isLoading,
    isError: error,
    inviteArtist,
    activateArtist,
    deactivateArtist,
    archiveArtist,
    unarchiveArtist,
  };
}
