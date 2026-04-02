'use client';

import React, { useState, useCallback } from 'react';
import { X, Upload } from 'lucide-react';
import Modal from './Modal';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  showArtistSelect?: boolean;
  artistOptions?: string[];
  onUpload?: (
    file: File,
    organization: string,
    onProgress: (message: string) => void,
    artistName?: string,
  ) => Promise<{ unmatchedArtists?: string[] } | void>;
}

function parseProgressMessage(raw: string): string {
  // processed:1000  →  Processing… 1,000 rows
  // done:5000:4800  →  Done! 4,800 / 5,000 rows processed
  const processed = raw.match(/^processed:(\d+)$/);
  if (processed) return `Processing… ${Number(processed[1]).toLocaleString()} rows processed`;

  const done = raw.match(/^done:(\d+):(\d+)$/);
  if (done)
    return `Done! ${Number(done[2]).toLocaleString()} / ${Number(done[1]).toLocaleString()} rows processed`;

  return raw;
}

const ORGANIZATIONS = ['FUGA', 'DITTO'];

export default function UploadFileModal({
  isOpen,
  onClose,
  showArtistSelect = false,
  artistOptions = [],
  onUpload,
}: UploadFileModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [latestProgress, setLatestProgress] = useState<string>('');
  const shouldShowArtistSelect = showArtistSelect;
  const hasArtistOptions = artistOptions.length > 0;
  const canSubmit =
    !!selectedFile &&
    !!selectedOrganization &&
    (!shouldShowArtistSelect || !hasArtistOptions || !!selectedArtist) &&
    !isUploading;

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

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      // Validate file type
      if (
        file.name.endsWith('.csv') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.xlsx')
      ) {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleNext = async () => {
    if (canSubmit && onUpload && selectedFile) {
      setIsUploading(true);
      setProgressMessages([]);
      setLatestProgress('');
      const handleProgress = (message: string) => {
        const parsed = parseProgressMessage(message);
        setLatestProgress(parsed);
        setProgressMessages((prev) => [...prev, parsed]);
      };
      try {
        await onUpload(
          selectedFile,
          selectedOrganization,
          handleProgress,
          selectedArtist || undefined,
        );
        handleClose();
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleClose = () => {
    if (isUploading) return; // Prevent closing during upload
    setSelectedFile(null);
    setSelectedArtist('');
    setSelectedOrganization('');
    setShowArtistDropdown(false);
    setShowOrgDropdown(false);
    setIsUploading(false);
    setProgressMessages([]);
    setLatestProgress('');
    onClose();
  };



  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Modal open={isOpen} onClose={handleClose} size="lg" headerVariant="none" closeVariant="island">
      <div className="relative">


        {/* Modal content */}
        <div className="px-6 py-6">
          <h2 className="text-xl font-semibold text-neutral-900">Upload file</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Upload your royalty file to continue.
          </p>

          {/* Upload area */}
          <div className="mt-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-xl border-2 border-dashed bg-neutral-50 px-6 py-12 text-center transition-colors ${
                isDragging
                  ? 'border-[#7B00D4] bg-[#7B00D4]/5'
                  : 'border-neutral-300'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileSelect}
              />
              <div className="flex flex-col items-center">
                <div className="mb-3 text-neutral-400">
                  <Upload className="h-10 w-10 mx-auto" />
                </div>
                <p className="text-sm text-neutral-600">
                  Drag and Drop file here or{' '}
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer font-medium text-[#7B00D4] hover:text-[#6A00B8] underline"
                  >
                    Select a file
                  </label>
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
              <span>Supported file types: CSV, XLS, XLSX</span>
              <span>Maximum size: 10MB</span>
            </div>
          </div>

          {/* Selected file */}
          {selectedFile && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F5F5F5] px-4 py-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="32" height="32" rx="6" fill="#E8E8E8" />
                    <path
                      d="M18 10H12C11.4477 10 11 10.4477 11 11V21C11 21.5523 11.4477 22 12 22H20C20.5523 22 21 21.5523 21 21V13L18 10Z"
                      stroke="#5A5A5A"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18 10V13H21"
                      stroke="#5A5A5A"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#3C3C3C] truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {formatDate(new Date(selectedFile.lastModified))}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="flex-shrink-0 ml-2 text-[#DC2626] hover:text-[#B91C1C]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Selectors */}
          <div className="mt-6 space-y-4">
            {shouldShowArtistSelect && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-sm font-medium text-neutral-700">
                  Select artist
                </label>
                <div className="relative w-full sm:w-[68%]">
                  <button
                    type="button"
                    disabled={!hasArtistOptions}
                    onClick={() => {
                      setShowArtistDropdown(!showArtistDropdown);
                      setShowOrgDropdown(false);
                    }}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#7B00D4]/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
                  >
                    {selectedArtist || (hasArtistOptions ? 'Select artist' : 'No artists available')}
                    <svg
                      className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {showArtistDropdown && hasArtistOptions && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-lg">
                      {artistOptions.map((artist) => (
                        <button
                          key={artist}
                          type="button"
                          onClick={() => {
                            setSelectedArtist(artist);
                            setShowArtistDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 first:rounded-t-xl last:rounded-b-xl"
                        >
                          {artist}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-medium text-neutral-700">
                Select reporting Organisation
              </label>
              <div className="relative w-full sm:w-[68%]">
                <button
                  type="button"
                  onClick={() => {
                    setShowOrgDropdown(!showOrgDropdown);
                    setShowArtistDropdown(false);
                  }}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#7B00D4]/20"
                >
                  {selectedOrganization || 'Select organization'}
                  <svg
                    className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
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
            </div>
          </div>

          {/* SSE progress */}
          {isUploading && (
            <div className="mt-5 rounded-xl border border-[#7B00D4]/20 bg-[#F5ECFF] px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-[#7B00D4] uppercase tracking-wide">Upload progress</p>
              <div className="max-h-28 overflow-y-auto space-y-0.5 pr-1">
                {progressMessages.length === 0 ? (
                  <p className="text-xs text-neutral-500 animate-pulse">Connecting…</p>
                ) : (
                  progressMessages.map((msg, i) => (
                    <p
                      key={i}
                      className={`text-xs ${
                        i === progressMessages.length - 1
                          ? 'text-[#3c3c3c] font-medium'
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
                  <div className="h-1.5 w-full rounded-full bg-[#7B00D4]/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7B00D4] transition-all duration-500"
                      style={{
                        width: latestProgress.startsWith('Done') ? '100%' : '60%',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1 rounded-xl border-2 border-[#7B00D4] bg-white px-4 py-2.5 text-sm font-medium text-[#7B00D4] hover:bg-[#7B00D4]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={!canSubmit}
              className="flex-1 rounded-xl bg-[#7B00D4] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#6A00B8] disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
