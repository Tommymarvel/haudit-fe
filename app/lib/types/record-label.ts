export type RecordLabelMetric = {
  value?: number | null;
  valueUSD?: number | null;
  momChange?: number | null;
};

export type RecordLabelDashboardSummary = {
  totalArtists?: RecordLabelMetric;
  totalTracks?: RecordLabelMetric;
  advanceRepaymentTotal?: RecordLabelMetric;
};

export type RecordLabelTopTrack = {
  isrc?: string;
  trackName?: string;
  artistName?: string;
  totalRevenueUSD?: number;
  totalStreams?: number;
};

export type RecordLabelTopAlbum = {
  albumName?: string;
  artistName?: string;
  totalRevenueUSD?: number;
  totalStreams?: number;
};

export type RecordLabelTopAdvance = {
  id?: string;
  _id?: string;
  createdAt?: string;
  amount?: number;
  currency?: string;
  advance_type?: string;
  status?: string;
  purpose?: string;
};

export type RecordLabelTopExpense = {
  id?: string;
  _id?: string;
  createdAt?: string;
  artistName?: string;
  category?: string;
  status?: string;
  amount?: number;
  currency?: string;
};

export type RecordLabelArtistName = {
  _id?: string;
  name?: string;
  normalized_name?: string;
  user?: string;
  name_type?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RecordLabelArtist = {
  id?: string;
  _id?: string;
  name?: string;
  names?: RecordLabelArtistName | RecordLabelArtistName[] | null;
  email?: string;
  phn_no?: string;
  date_added?: string;
  no_of_tracks?: number;
  status?: string;
};

export type InviteRecordLabelArtistPayload = {
  email: string;
  first_name: string;
  last_name: string;
  phn_no: string;
  other_names: string[];
  bank: string;
  acc_no: string;
  acc_name: string;
};
