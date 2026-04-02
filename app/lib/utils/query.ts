export function appendQueryParam(endpoint: string, key: string, value?: string | null) {
  const normalizedValue = (value || '').trim();
  if (!normalizedValue) return endpoint;
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}${encodeURIComponent(key)}=${encodeURIComponent(normalizedValue)}`;
}

