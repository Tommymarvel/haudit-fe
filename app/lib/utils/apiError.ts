export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const error = err as { response?: { data?: { message?: string | string[] } } };
  const msg = error?.response?.data?.message;
  if (!msg) return fallback;
  if (Array.isArray(msg)) return msg[0] ?? fallback;
  return msg || fallback;
}
