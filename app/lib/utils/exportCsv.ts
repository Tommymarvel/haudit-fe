import axiosInstance from '@/lib/axiosinstance';

/** Triggers a browser download for CSV blob data. */
export function downloadCsvBlob(data: BlobPart, filename: string) {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Serialises rows to a CSV string, quoting/escaping values as needed. */
export function toCsv(headers: string[], rows: Array<Array<string | number>>): string {
  const escape = (value: string | number) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

/** Builds a CSV from rows and downloads it. */
export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  downloadCsvBlob(toCsv(headers, rows), filename);
}

/**
 * Downloads the advances CSV from the server-side `/advance/export` endpoint,
 * which is the only export endpoint the API exposes. Returns nothing; the caller
 * handles loading/error state.
 */
export async function downloadAdvanceCsv(
  params: Record<string, string | number>,
  filename: string
) {
  const response = await axiosInstance.get('/advance/export', { params, responseType: 'blob' });
  downloadCsvBlob(response.data as BlobPart, filename);
}
