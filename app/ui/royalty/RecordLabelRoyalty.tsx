'use client';
import SoloArtistRoyalty from './SoloArtistRoyalty';

/** Record labels have full upload + analytics access — identical feature set to SoloArtistRoyalty. */
export default function RecordLabelRoyalty() {
  return <SoloArtistRoyalty canUpload={true} />;
}
