'use client';

import { AxiosError } from 'axios';
import useSWR from 'swr';
import { toast } from 'react-toastify';
import axiosInstance from '@/lib/axiosinstance';
import { useAuth } from '@/contexts/AuthContext';
import { PaginationMeta } from '@/lib/types/pagination';
import { extractPaginated } from '@/lib/utils/paginated';

const LABEL_DOCUMENTS_ENDPOINT = '/record-label/documents';
const RECEIVED_DOCUMENTS_ENDPOINT = '/record-label/documents/received';
const REPORT_UPLOAD_ENDPOINT = '/upload/report';
const DOCUMENTS_PAGE_SIZE = 10;

export type SplitDocument = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  artistIds: string[];
  status: 'draft' | 'shared';
  uploadedAt: string;
  sharedAt: string;
};

function normalizeSplitDocumentRecord(payload: unknown): SplitDocument | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const record = payload as Record<string, unknown>;

  const id = typeof record._id === 'string' ? record._id : '';
  if (!id) return null;

  const fileName = typeof record.normalizedName === 'string' ? record.normalizedName : '';
  const fileUrl = typeof record.fileUrl === 'string' ? record.fileUrl : '';
  const mimeType = typeof record.mimeType === 'string' ? record.mimeType : '';
  const artistIds = Array.isArray(record.artistIds)
    ? record.artistIds.filter((v): v is string => typeof v === 'string')
    : [];
  const status = record.status === 'shared' ? 'shared' : 'draft';
  const uploadedAt = typeof record.createdAt === 'string' ? record.createdAt : '';
  const sharedAt = typeof record.sharedAt === 'string' ? record.sharedAt : '';

  return { id, fileName, fileUrl, mimeType, artistIds, status, uploadedAt, sharedAt };
}

function documentsFetcher(url: string) {
  return axiosInstance.get(url).then((response) => {
    const { data, meta } = extractPaginated<unknown>(response.data);
    return {
      documents: data
        .map(normalizeSplitDocumentRecord)
        .filter((doc): doc is SplitDocument => doc !== null),
      meta,
    };
  });
}

async function uploadReportFile(
  file: File,
): Promise<{ fileUrl: string; fileName: string; mimeType: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axiosInstance.post(REPORT_UPLOAD_ENDPOINT, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const fileUrl =
    typeof data === 'string'
      ? data
      : (data?.secure_url ?? data?.url ?? data?.fileUrl ?? data?.link ?? '');

  if (!fileUrl) throw new Error('Upload succeeded but no document URL was returned.');

  return { fileUrl, fileName: file.name, mimeType: file.type };
}

export function useSplitDocuments(page: number = 1) {
  const { user } = useAuth();
  const isRecordLabel = user?.user_type === 'record_label';
  const isLabelArtist = user?.user_type === 'label_artist';
  // Both documents endpoints are server-paginated and default to limit=10
  // even without params, so page/limit must be passed explicitly.
  const baseEndpoint = isRecordLabel
    ? LABEL_DOCUMENTS_ENDPOINT
    : isLabelArtist
      ? RECEIVED_DOCUMENTS_ENDPOINT
      : null;
  const listEndpoint = baseEndpoint
    ? `${baseEndpoint}?page=${page}&limit=${DOCUMENTS_PAGE_SIZE}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<{
    documents: SplitDocument[];
    meta: PaginationMeta | null;
  }>(listEndpoint, documentsFetcher);

  const createDocument = async (file: File, artistIds: string[] = []) => {
    if (!isRecordLabel) throw new Error('Only record labels can create split documents.');

    try {
      const { fileUrl, fileName, mimeType } = await uploadReportFile(file);
      await axiosInstance.post(LABEL_DOCUMENTS_ENDPOINT, {
        documents: [{ fileUrl, fileName, mimeType }],
        ...(artistIds.length > 0 && { artistIds }),
      });
      await mutate();
      toast.success(
        artistIds.length > 0
          ? 'Split document uploaded and assigned successfully'
          : 'Split document uploaded successfully',
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          (error as Error).message ||
          'Failed to upload split document',
      );
      throw error;
    }
  };

  const assignArtists = async (documentId: string, artistIds: string[]) => {
    if (!isRecordLabel) throw new Error('Only record labels can assign artists.');

    try {
      await axiosInstance.patch(`${LABEL_DOCUMENTS_ENDPOINT}/${documentId}/assign`, { artistIds });
      await mutate();
      toast.success('Document artists updated successfully');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to update document artists');
      throw error;
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!isRecordLabel) throw new Error('Only record labels can delete split documents.');

    try {
      await axiosInstance.delete(`${LABEL_DOCUMENTS_ENDPOINT}/${documentId}`);
      await mutate();
      toast.success('Split document deleted successfully');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to delete split document');
      throw error;
    }
  };

  return {
    documents: data?.documents ?? [],
    documentsMeta: data?.meta ?? null,
    isLoading,
    error,
    isRecordLabel,
    isLabelArtist,
    createDocument,
    assignArtists,
    deleteDocument,
    refreshDocuments: mutate,
  };
}
