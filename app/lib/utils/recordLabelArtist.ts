import type { RecordLabelArtist, RecordLabelArtistName } from '@/lib/types/record-label';

const NAME_TYPE_PRIORITY: Record<string, number> = {
  first_name: 0,
  last_name: 1,
  other_names: 2,
};

function scoreNameType(value?: string) {
  return NAME_TYPE_PRIORITY[(value || '').trim().toLowerCase()] ?? 99;
}

export function getRecordLabelArtistName(artist: Pick<RecordLabelArtist, 'name' | 'names'>): string {
  const directName = (artist.name || '').trim();
  if (directName) return directName;

  const namesField = artist.names;
  if (!namesField) return '';

  const entries: RecordLabelArtistName[] = Array.isArray(namesField) ? namesField : [namesField];
  if (entries.length === 0) return '';

  const best = [...entries]
    .sort((a, b) => scoreNameType(a.name_type) - scoreNameType(b.name_type))
    .find((entry) => (entry.name || '').trim().length > 0);

  return (best?.name || '').trim();
}
