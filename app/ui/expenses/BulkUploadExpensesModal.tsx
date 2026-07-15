'use client';

import React, { useEffect, useRef, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { CheckCircle, CloudUpload, FileSpreadsheet } from 'lucide-react';

type Step = 'template' | 'upload' | 'success';

type ArtistOption = { id: string; name: string };

interface Props {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, artistId?: string) => Promise<{ rowsProcessed?: number; count?: number }>;
  artistOptions?: ArtistOption[];
  initialArtistId?: string;
}

export default function BulkUploadExpensesModal({
  open,
  onClose,
  onUpload,
  artistOptions,
  initialArtistId = '',
}: Props) {
  const [step, setStep] = useState<Step>('template');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recordsProcessed, setRecordsProcessed] = useState(0);
  const [artistId, setArtistId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const showArtistField = Boolean(artistOptions && artistOptions.length > 0);

  useEffect(() => {
    if (open) setArtistId(initialArtistId);
  }, [open, initialArtistId]);

  const handleClose = () => {
    setStep('template');
    setFile(null);
    setDragging(false);
    setUploading(false);
    setArtistId('');
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleUpload = async () => {
    if (!file || uploading || (showArtistField && !artistId)) return;
    setUploading(true);
    try {
      const result = await onUpload(file, artistId || undefined);
      setRecordsProcessed(result?.rowsProcessed ?? result?.count ?? 0);
      setStep('success');
    } catch {
      // error already toasted by hook
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="sm"
      closeVariant="island"
      headerVariant="none"
    >
      <div className="px-6 pb-8 pt-10">
        {step === 'template' && (
          <>
            <h2 className="text-[20px] font-semibold text-[#1A1A1A]">Bulk Upload Expenses</h2>
            <p className="mt-1 text-sm text-[#777777]">Upload multiple artist expenses at once using a spreadsheet template.</p>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>Download the template, enter your expense details, then upload the completed file.</span>
            </div>

            <a
              href="/Expense Upload Template.xlsx"
              download
              onClick={(e) => e.stopPropagation()}
              className="mt-4 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 px-6 py-8 transition-colors hover:bg-violet-100"
            >
              <FileSpreadsheet className="h-10 w-10 text-violet-500" />
              <span className="text-sm font-medium text-[#1A1A1A]">Expense Upload Template</span>
              <span className="text-sm text-violet-600 underline">Download template</span>
            </a>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl border border-violet-500 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="flex-1 rounded-xl bg-[#888] py-2.5 text-sm font-medium text-white hover:bg-[#666]"
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 'upload' && (
          <>
            <h2 className="text-[20px] font-semibold text-[#1A1A1A]">Bulk Upload Expenses</h2>
            <p className="mt-1 text-sm text-[#777777]">Upload multiple artist expenses at once using a spreadsheet template.</p>

            {showArtistField && (
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-[#1A1A1A]">
                  Artist Name
                </label>
                <Select
                  value={artistId}
                  onChange={setArtistId}
                  placeholder="Select artist name"
                  options={(artistOptions ?? []).map((a) => ({ label: a.name, value: a.id }))}
                  searchable={(artistOptions ?? []).length > 5}
                />
              </div>
            )}

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed py-14 transition-colors ${
                dragging ? 'border-violet-400 bg-violet-50' : 'border-[#C4C4C4] bg-white hover:border-violet-300 hover:bg-violet-50/40'
              }`}
            >
              <CloudUpload className="h-9 w-9 text-[#9C9C9C]" />
              <p className="text-sm text-[#5A5A5A]">
                Drag and Drop file here or{' '}
                <span className="font-semibold text-violet-600 underline">Click to upload</span>
              </p>
              <p className="text-xs text-[#9C9C9C]">CSV, XLS or XLSX (max. 10MB)</p>
              {file && (
                <p className="mt-1 rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-700">
                  {file.name}
                </p>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl border border-violet-500 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading || (showArtistField && !artistId)}
                className="flex-1 rounded-xl bg-[#888] py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 enabled:hover:bg-[#666]"
              >
                {uploading ? 'Uploading...' : 'Upload Expenses'}
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-[#1A1A1A]">Upload Successful!</h3>
            <p className="mt-1 text-sm text-[#777777]">{recordsProcessed} records have been processed.</p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-8 w-full rounded-xl bg-[#7B00D4] py-3 text-sm font-medium text-white hover:bg-[#6A00B8]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
