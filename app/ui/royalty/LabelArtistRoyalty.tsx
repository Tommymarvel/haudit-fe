'use client';
import SoloArtistRoyalty from './SoloArtistRoyalty';

/** Label artists can view analytics and download files but cannot upload new royalty records. */
export default function LabelArtistRoyalty() {
  return <SoloArtistRoyalty canUpload={false} />;
}
