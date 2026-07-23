import { PaginationMeta } from '@/lib/types/pagination';

export interface PaginatedList<T> {
  data: T[];
  meta: PaginationMeta | null;
}

// The API returns paginated lists either as { data, meta: {...} } or with the
// counters inlined next to data ({ data, page, limit, total, totalPages });
// older endpoints still return a bare array.
export function extractPaginated<T>(payload: unknown): PaginatedList<T> {
  if (Array.isArray(payload)) return { data: payload as T[], meta: null };
  const obj = (payload ?? {}) as Record<string, unknown>;
  if (!Array.isArray(obj.data)) return { data: [], meta: null };
  const data = obj.data as T[];
  const source = (
    obj.meta && typeof obj.meta === 'object' ? obj.meta : obj
  ) as Record<string, unknown>;
  const total = Number(source.total);
  const limit = Number(source.limit);
  const page = Number(source.page);
  let totalPages = Number(source.totalPages);
  if (!Number.isFinite(totalPages) && Number.isFinite(total) && limit > 0) {
    totalPages = Math.ceil(total / limit);
  }
  if (!Number.isFinite(totalPages)) return { data, meta: null };
  return {
    data,
    meta: {
      total: Number.isFinite(total) ? total : data.length,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : data.length,
      totalPages: Math.max(1, totalPages),
    },
  };
}
