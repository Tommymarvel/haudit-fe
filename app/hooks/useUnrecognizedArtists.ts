import useSWR, { mutate } from 'swr';
import axiosInstance from '@/lib/axiosinstance';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';

const PENDING_ARTISTS_ENDPOINT = '/royalties/royalties/pending-artists';
const CREATE_USER_NAME_ENDPOINT = '/auth/user-names';

export type PendingArtistEntry = {
  name: string;
  createdAt?: string;
  willBeDeletedAt?: string;
};

const pendingArtistsFetcher = (url: string) =>
  axiosInstance.get(url).then((res) => {
    const payload = res.data;

    const normalize = (items: unknown[]): PendingArtistEntry[] => {
      if (items.length === 0) return [];

      if (typeof items[0] === 'string') {
        return (items as string[]).map((name) => ({ name }));
      }

      return items
        .filter(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as { name?: unknown }).name === 'string',
        )
        .map((item) => {
          const typed = item as PendingArtistEntry;
          return {
            name: typed.name,
            createdAt: typed.createdAt,
            willBeDeletedAt: typed.willBeDeletedAt,
          };
        });
    };

    if (Array.isArray(payload)) return normalize(payload);
    if (Array.isArray(payload?.data)) return normalize(payload.data);
    return [] as PendingArtistEntry[];
  });

export function useUnrecognizedArtists() {
  const { data, error, isLoading } = useSWR<PendingArtistEntry[]>(
    PENDING_ARTISTS_ENDPOINT,
    pendingArtistsFetcher
  );

  const assignPendingArtists = async (mappings: Record<string, string>) => {
    try {
      const groupedByArtistId = new Map<string, Set<string>>();

      Object.entries(mappings).forEach(([name, artistId]) => {
        const normalizedName = name.trim();
        const normalizedArtistId = (artistId || '').trim();
        if (!normalizedName || !normalizedArtistId) return;

        const existing = groupedByArtistId.get(normalizedArtistId) ?? new Set<string>();
        existing.add(normalizedName);
        groupedByArtistId.set(normalizedArtistId, existing);
      });

      await Promise.all(
        Array.from(groupedByArtistId.entries()).map(([artistId, namesSet]) =>
          axiosInstance.post(
            CREATE_USER_NAME_ENDPOINT,
            {
              names: Array.from(namesSet),
              name_type: 'other_names',
            },
            {
              params: { artistId },
            },
          ),
        ),
      );

      toast.success('Unrecognized artists mapped successfully');
      mutate(PENDING_ARTISTS_ENDPOINT);
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast.error(err.response?.data?.message || 'Failed to map unrecognized artists');
      throw error;
    }
  };

  return {
    pendingArtistEntries: data || [],
    pendingArtists: (data || []).map((entry) => entry.name),
    isPendingArtistsLoading: isLoading,
    pendingArtistsError: error,
    assignPendingArtists,
    refreshPendingArtists: () => mutate(PENDING_ARTISTS_ENDPOINT),
  };
}
