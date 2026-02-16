export interface UploadedFile {
  source: string;
  normalizedName: string;
  fileUrl: string;
  hash: string;
  uploadedAt: string;
}

export interface RoyaltyUploadsResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: UploadedFile[];
}

export interface Metric {
  current: number;
  percentageChange: number | null;
}

export interface TopTrack {
  isrc: string;
  title: string;
  artist: string;
  totalRevenue: number;
  totalStreams: number;
}

export interface MonthlyMetric {
  label: string;
  revenue?: number;
  streams?: number;
}

export interface RoyaltyDashboardMetrics {
  totalRevenue: number;
  totalStreams: number;
  topTrack: TopTrack | null;
  revenueByMonth: MonthlyMetric[];
  streamsByMonth: MonthlyMetric[];
}

// Assuming structure for other endpoints based on descriptions
export interface TrackRevenueDsp {
  // Structure not fully visible in screenshot, assuming generic for now
  [key: string]: unknown;
}

export interface DspStreamPercentage {
  dsp: string;
  streams: number;
  percentage: number;
}

export interface TrackDspStream {
  dsp: string;
  streams: number;
}

export interface TrackBreakdown {
  title: string;
  isrc: string;
  dsps: TrackDspStream[];
}

export interface TrackStreamsDsp {
  dspSummary: DspStreamPercentage[];
  trackBreakdown: TrackBreakdown[];
}

export interface TrackStreams {
  // Structure not fully visible in screenshot, assuming generic for now
  [key: string]: unknown;
}
