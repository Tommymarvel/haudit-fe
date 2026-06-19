'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { X, Upload, FileText, AlertCircle, ChevronDown } from 'lucide-react';
import Modal from './Modal';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  showArtistSelect?: boolean;
  artistOptions?: Array<{ id: string; name: string }>;
  templateUrl?: string;
  onUpload?: (
    file: File,
    organization: string,
    onProgress: (message: string) => void,
    artistIds?: string[],
  ) => Promise<{ unmatchedArtists?: string[] } | void>;
}

const ORGANIZATIONS = ['FUGA', 'DITTO'];

const UPLOAD_INSIGHTS = [
  'Validating the sheet structure so the upload lands cleanly in your dashboard.',
  'Matching rows to artists, tracks, DSPs, and territories for more reliable reporting.',
  'Preparing fresh trend, territory, and track-level views as soon as processing finishes.',
];

function parseProgressMessage(raw: string): string {
  const processed = raw.match(/^processed:(\d+)$/);
  if (processed) return `Processing... ${Number(processed[1]).toLocaleString()} rows processed`;

  const done = raw.match(/^done:(\d+):(\d+)$/);
  if (done)
    return `Done! ${Number(done[2]).toLocaleString()} / ${Number(done[1]).toLocaleString()} rows processed`;

  return raw;
}

export default function UploadFileModal({
  isOpen,
  onClose,
  showArtistSelect = false,
  artistOptions = [],
  templateUrl,
  onUpload,
}: UploadFileModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [latestProgress, setLatestProgress] = useState('');
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);

  const artistDropdownRef = useRef<HTMLDivElement>(null);
  const orgDropdownRef = useRef<HTMLDivElement>(null);

  const hasArtistOptions = artistOptions.length > 0;

  const canSubmit =
    !!selectedFile &&
    !!selectedOrganization &&
    (!showArtistSelect || !hasArtistOptions || selectedArtistIds.length > 0) &&
    !isUploading;

  const selectedArtistNames = selectedArtistIds
    .map((id) => artistOptions.find((a) => a.id === id)?.name)
    .filter((n): n is string => !!n);

  const filteredArtistOptions = artistOptions.filter((artist) => {
    if (selectedArtistIds.includes(artist.id)) return false;
    if (!artistSearch.trim()) return true;
    return artist.name.toLowerCase().includes(artistSearch.toLowerCase());
  });

  const uploadInsights = useMemo(() => {
    const fileName = selectedFile?.name || 'your royalty statement';
    const artistSummary = showArtistSelect
      ? selectedArtistIds.length > 0
        ? `${selectedArtistIds.length} selected artist${selectedArtistIds.length > 1 ? 's' : ''}`
        : 'your selected artists'
      : 'your catalog';
    return [
      { label: 'Reading the file', title: `Inspecting ${fileName}`, detail: UPLOAD_INSIGHTS[0] },
      { label: 'Mapping the data', title: `Connecting the report to ${artistSummary}`, detail: UPLOAD_INSIGHTS[1] },
      { label: 'Staging insights', title: 'Getting the dashboard ready', detail: UPLOAD_INSIGHTS[2] },
    ];
  }, [selectedFile?.name, selectedArtistIds.length, showArtistSelect]);

  useEffect(() => {
    if (!showArtistDropdown) return;
    const handler = (e: MouseEvent) => {
      if (artistDropdownRef.current && !artistDropdownRef.current.contains(e.target as Node)) {
        setShowArtistDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showArtistDropdown]);

  useEffect(() => {
    if (!showOrgDropdown) return;
    const handler = (e: MouseEvent) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target as Node)) {
        setShowOrgDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showOrgDropdown]);

  useEffect(() => {
    if (!isUploading) { setActiveInsightIndex(0); return; }
    const id = window.setInterval(() => {
      setActiveInsightIndex((prev) => (prev + 1) % uploadInsights.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, [isUploading, uploadInsights.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && /\.(csv|xls|xlsx)$/i.test(file.name)) setSelectedFile(file);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleNext = async () => {
    if (!canSubmit || !onUpload || !selectedFile) return;
    setIsUploading(true);
    setProgressMessages([]);
    setLatestProgress('');
    try {
      await onUpload(
        selectedFile,
        selectedOrganization,
        (msg) => {
          const parsed = parseProgressMessage(msg);
          setLatestProgress(parsed);
          setProgressMessages((prev) => [...prev, parsed]);
        },
        selectedArtistIds.length > 0 ? selectedArtistIds : undefined,
      );
      handleClose();
    } catch {
      // error handled by caller
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setStep(1);
    setSelectedFile(null);
    setSelectedArtistIds([]);
    setArtistSearch('');
    setSelectedOrganization('');
    setShowArtistDropdown(false);
    setShowOrgDropdown(false);
    setIsUploading(false);
    setProgressMessages([]);
    setLatestProgress('');
    setActiveInsightIndex(0);
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} size="lg" headerVariant="none" closeVariant="island">
      <div className="px-6 py-6">
        <h2 className="text-xl font-semibold text-neutral-900">Upload file</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Upload data from reporting organisation or use Haudit template.
        </p>

        {/* ── STEP 1 ── */}
        {step === 1 && !isUploading && (
          <>
            <div className="mt-6">
              {/* Use Haudit template */}
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full rounded-xl border-2 border-dashed border-[#7B00D4] bg-[#F5ECFF]/50 px-4 py-3 text-sm font-medium text-[#7B00D4] transition-colors hover:bg-[#F5ECFF]"
              >
                Use Haudit template
              </button>

              {/* or separator */}
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-200" />
                <span className="text-sm text-neutral-400">or</span>
                <div className="h-px flex-1 bg-neutral-200" />
              </div>

              {/* Reporting Organisation */}
              <div ref={orgDropdownRef} className="relative">
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Reporting Organisation <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowOrgDropdown((v) => !v);
                    setShowArtistDropdown(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#7B00D4]/20"
                >
                  <span className={selectedOrganization ? 'text-neutral-900' : 'text-neutral-400'}>
                    {selectedOrganization || 'Select reporting organisation'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                </button>
                {showOrgDropdown && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-lg">
                    {ORGANIZATIONS.map((org) => (
                      <button
                        key={org}
                        type="button"
                        onClick={() => {
                          setSelectedOrganization(org);
                          setShowOrgDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 first:rounded-t-xl last:rounded-b-xl"
                      >
                        {org}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Artist select (record label only) */}
              {showArtistSelect && (
                <div ref={artistDropdownRef} className="relative mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Select artists
                  </label>
                  <button
                    type="button"
                    disabled={!hasArtistOptions}
                    onClick={() => {
                      setShowArtistDropdown((v) => !v);
                      setShowOrgDropdown(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#7B00D4]/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
                  >
                    <span>
                      {selectedArtistIds.length > 0
                        ? `${selectedArtistIds.length} artist${selectedArtistIds.length > 1 ? 's' : ''} selected`
                        : hasArtistOptions
                          ? 'Select artists'
                          : 'No artists available'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  </button>

                  {selectedArtistNames.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-2">
                      {selectedArtistNames.map((name, i) => (
                        <span
                          key={selectedArtistIds[i]}
                          className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedArtistIds((prev) =>
                                prev.filter((id) => id !== selectedArtistIds[i]),
                              )
                            }
                            className="text-neutral-400 hover:text-neutral-700"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {showArtistDropdown && hasArtistOptions && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-lg">
                      <div className="flex items-center gap-2 border-b border-neutral-100 p-2">
                        <input
                          type="text"
                          value={artistSearch}
                          onChange={(e) => setArtistSearch(e.target.value)}
                          placeholder="Search artists"
                          className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 outline-none focus:border-[#7B00D4]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowArtistDropdown(false)}
                          className="text-neutral-400 hover:text-neutral-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="max-h-52 overflow-y-auto py-1">
                        {filteredArtistOptions.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-neutral-400">No artist matches</p>
                        ) : (
                          filteredArtistOptions.map((artist) => (
                            <button
                              key={artist.id}
                              type="button"
                              onClick={() => {
                                setSelectedArtistIds((prev) => [...prev, artist.id]);
                                setArtistSearch('');
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                            >
                              {artist.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* File dropzone */}
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">File</label>
                {selectedFile ? (
                  <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <FileText className="h-5 w-5 flex-shrink-0 text-[#7B00D4]" />
                      <p className="truncate text-sm font-medium text-neutral-800">
                        {selectedFile.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="ml-3 text-rose-500 hover:text-rose-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                      isDragging ? 'border-[#7B00D4] bg-[#7B00D4]/5' : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".csv,.xls,.xlsx"
                      onChange={handleFileSelect}
                    />
                    <Upload className="mx-auto h-8 w-8 text-neutral-400" />
                    <p className="mt-2 text-sm text-neutral-600">
                      Drag and Drop file here or{' '}
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer font-medium text-[#7B00D4] underline hover:text-[#6A00B8]"
                      >
                        Click to upload
                      </label>
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">CSV, XLS or XLSX (max. 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 1 actions */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canSubmit}
                className="flex-1 rounded-xl bg-[#7B00D4] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#6A00B8] disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2 (template) ── */}
        {step === 2 && (
          <>
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <p className="text-sm text-amber-800">
                Download the Haudit template below, fill it with data from your reporting
                organization, then upload it back to continue.
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">File</label>
              <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-[#7B00D4] bg-[#F5ECFF]/40 px-6 py-8 text-center">
                <FileText className="h-10 w-10 text-[#7B00D4]" />
                <p className="mt-3 text-sm font-medium text-neutral-800">Haudit Template</p>
                {templateUrl ? (
                  <a
                    href={templateUrl}
                    download
                    className="mt-1 text-sm font-medium text-[#7B00D4] underline hover:text-[#6A00B8]"
                  >
                    Download template
                  </a>
                ) : (
                  <span className="mt-1 text-sm text-neutral-400">Download template</span>
                )}
              </div>
            </div>

            {/* Step 2 actions */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-[#7B00D4] bg-white px-4 py-2.5 text-sm font-medium text-[#7B00D4] hover:bg-[#7B00D4]/5 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl bg-[#7B00D4] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#6A00B8] transition-colors"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* ── UPLOADING ── */}
        {isUploading && (
          <>
            <div className="mt-5 rounded-xl border border-[#7B00D4]/20 bg-[#F5ECFF] px-4 py-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7B00D4]">
                Upload progress
              </p>
              <div className="max-h-28 overflow-y-auto space-y-0.5 pr-1">
                {progressMessages.length === 0 ? (
                  <p className="animate-pulse text-xs text-neutral-500">Connecting…</p>
                ) : (
                  progressMessages.map((msg, i) => (
                    <p
                      key={i}
                      className={`text-xs ${
                        i === progressMessages.length - 1
                          ? 'font-medium text-[#3c3c3c]'
                          : 'text-neutral-400'
                      }`}
                    >
                      {msg}
                    </p>
                  ))
                )}
              </div>
              {latestProgress && (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#7B00D4]/20">
                    <div
                      className="h-full rounded-full bg-[#7B00D4] transition-all duration-500"
                      style={{ width: latestProgress.startsWith('Done') ? '100%' : '60%' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.85fr)]">
              <div className="rounded-2xl border border-[#E9D7FE] bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7B00D4]">
                    {uploadInsights[activeInsightIndex].label}
                  </p>
                  <span className="rounded-full bg-[#F5ECFF] px-2.5 py-1 text-[11px] font-medium text-[#7B00D4]">
                    Step {activeInsightIndex + 1} of {uploadInsights.length}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-[#111827]">
                  {uploadInsights[activeInsightIndex].title}
                </p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  {uploadInsights[activeInsightIndex].detail}
                </p>
                <div className="mt-4 flex gap-2">
                  {uploadInsights.map((insight, i) => (
                    <span
                      key={insight.label}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i === activeInsightIndex ? 'bg-[#7B00D4]' : 'bg-[#E9D7FE]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-[#111827] px-4 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                  Upload context
                </p>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-white/60">File</span>
                    <span className="max-w-[180px] break-words text-right font-medium">
                      {selectedFile?.name || 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-white/60">Source</span>
                    <span className="text-right font-medium">
                      {selectedOrganization || 'Pending'}
                    </span>
                  </div>
                  {showArtistSelect && (
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-white/60">Artists</span>
                      <span className="text-right font-medium">
                        {selectedArtistIds.length > 0
                          ? `${selectedArtistIds.length} selected`
                          : 'Pending'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
