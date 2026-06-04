'use client';

import React, { useMemo, useState } from 'react';
import { ExternalLink, FileText, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import FileDropzone from '@/components/ui/FIleDropzone';
import { SplitDocument, useSplitDocuments } from '@/hooks/useSplitDocuments';

type ArtistOption = {
  id: string;
  name: string;
};

function formatDocumentDate(value: string) {
  if (!value) return 'Recently added';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently added';

  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return 'Unknown size';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function ArtistMultiSelect({
  artistOptions,
  selectedArtistIds,
  onChange,
  helperText,
}: {
  artistOptions: ArtistOption[];
  selectedArtistIds: string[];
  onChange: (artistIds: string[]) => void;
  helperText: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArtistOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return artistOptions;

    return artistOptions.filter((artist) =>
      artist.name.toLowerCase().includes(normalizedQuery),
    );
  }, [artistOptions, searchQuery]);

  const selectedArtists = artistOptions.filter((artist) =>
    selectedArtistIds.includes(artist.id),
  );

  const toggleArtist = (artistId: string) => {
    if (selectedArtistIds.includes(artistId)) {
      onChange(selectedArtistIds.filter((id) => id !== artistId));
      return;
    }

    onChange([...selectedArtistIds, artistId]);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-neutral-800">Assign artists</p>
        <p className="mt-1 text-xs text-neutral-500">{helperText}</p>
      </div>

      {artistOptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-4 text-sm text-neutral-500">
          No roster artists available yet. You can still upload the document now and assign artists later.
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search artists"
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-700 outline-none focus:border-[#7B00D4]"
            />
          </div>

          {selectedArtists.length > 0 ? (
            <div className="flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
              {selectedArtists.map((artist) => (
                <span
                  key={artist.id}
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700"
                >
                  {artist.name}
                  <button
                    type="button"
                    onClick={() => toggleArtist(artist.id)}
                    className="text-neutral-400 transition-colors hover:text-neutral-700"
                    aria-label={`Remove ${artist.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="max-h-56 overflow-y-auto rounded-2xl border border-neutral-200 bg-white">
            {filteredArtistOptions.length === 0 ? (
              <p className="px-4 py-4 text-sm text-neutral-500">No artists match that search.</p>
            ) : (
              filteredArtistOptions.map((artist) => {
                const isSelected = selectedArtistIds.includes(artist.id);
                return (
                  <label
                    key={artist.id}
                    className="flex cursor-pointer items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0 hover:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-800">{artist.name}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleArtist(artist.id)}
                      className="h-4 w-4 rounded border-neutral-300 text-[#7B00D4] focus:ring-[#7B00D4]"
                    />
                  </label>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SelectedFileCard({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5">
          <FileText className="h-5 w-5 text-[#7B00D4]" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-800">{file.name}</p>
          <p className="mt-1 text-xs text-neutral-500">{formatFileSize(file.size)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-1 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
        aria-label="Remove selected file"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function SplitDocumentsTab({
  artistOptions,
}: {
  artistOptions: ArtistOption[];
}) {
  const { documents, isLoading, isRecordLabel, createDocument, assignArtists, deleteDocument } =
    useSplitDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [documentToAssign, setDocumentToAssign] = useState<SplitDocument | null>(null);
  const [assignArtistIds, setAssignArtistIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<SplitDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const artistOptionMap = useMemo(
    () => new Map(artistOptions.map((a) => [a.id, a.name])),
    [artistOptions],
  );

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return documents;

    return documents.filter((document) => {
      const artistNames = document.artistIds.map((id) => artistOptionMap.get(id) ?? '').join(' ');
      const haystack = [document.fileName, artistNames].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [documents, searchQuery, artistOptionMap]);

  const handleDocumentOpen = (fileUrl: string) => {
    if (!fileUrl) return;
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSelectedFiles = (files: File[]) => {
    const nextFile = files[0];
    if (!nextFile) return;

    const isSupportedFile = /\.pdf$|\.doc$|\.docx$/i.test(nextFile.name);
    if (!isSupportedFile) {
      toast.error('Please select a PDF or DOCX report document.');
      return;
    }

    setSelectedFile(nextFile);
  };

  const closeCreateModal = () => {
    if (isCreating) return;
    setSelectedFile(null);
    setSelectedArtistIds([]);
    setIsCreateModalOpen(false);
  };

  const closeAssignModal = () => {
    if (isAssigning) return;
    setDocumentToAssign(null);
    setAssignArtistIds([]);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDocumentToDelete(null);
  };

  const handleCreateDocument = async () => {
    if (!selectedFile) return;

    setIsCreating(true);
    try {
      await createDocument(selectedFile, selectedArtistIds);
      closeCreateModal();
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignArtists = async () => {
    if (!documentToAssign) return;

    setIsAssigning(true);
    try {
      await assignArtists(documentToAssign.id, assignArtistIds);
      closeAssignModal();
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDocument(documentToDelete.id);
      closeDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-neutral-500">
              {isRecordLabel
                ? 'Upload report documents, assign them to artists, and keep your roster in sync.'
                : 'Review report documents that your label has shared with you.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search document by name"
                className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B00D4]"
              />
            </div>

            {isRecordLabel ? (
              <Button
                variant="primary"
                className="justify-center"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add split document
              </Button>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#7B00D4]" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
              <FileText className="h-7 w-7 text-neutral-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900">
              {documents.length === 0 ? 'No split documents yet' : 'No documents match your search'}
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-500">
              {documents.length === 0
                ? isRecordLabel
                  ? 'Start by uploading a report document, then assign it to the artists who should receive it.'
                  : 'Your label has not shared any split documents with you yet.'
                : 'Try a different file name or artist search to find the document you need.'}
            </p>
            {isRecordLabel && documents.length === 0 ? (
              <div className="mt-6">
                <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Upload first document
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((document) => {
              const documentArtistNames = document.artistIds.map(
                (id) => artistOptionMap.get(id) ?? id,
              );
              const visibleArtists = documentArtistNames.slice(0, 3);
              const remainingArtistCount = Math.max(document.artistIds.length - 3, 0);

              return (
                <div
                  key={document.id}
                  className="rounded-3xl border border-neutral-200 bg-white px-5 py-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="rounded-2xl bg-[#F5ECFF] p-3">
                        <FileText className="h-5 w-5 text-[#7B00D4]" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-neutral-900">
                          {document.fileName}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                          <span>{formatDocumentDate(document.uploadedAt)}</span>
                          {isRecordLabel ? (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                document.status === 'shared'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {document.status === 'shared' ? 'Shared' : 'Draft'}
                            </span>
                          ) : null}
                        </div>

                        {isRecordLabel ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {document.artistIds.length > 0 ? (
                              <>
                                {visibleArtists.map((artistName: string) => (
                                  <span
                                    key={`${document.id}-${artistName}`}
                                    className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
                                  >
                                    <Users className="h-3.5 w-3.5 text-neutral-400" />
                                    {artistName}
                                  </span>
                                ))}
                                {remainingArtistCount > 0 ? (
                                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                                    +{remainingArtistCount} more
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                Not assigned yet
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Button
                        variant="outline"
                        className="justify-center"
                        onClick={() => handleDocumentOpen(document.fileUrl)}
                        disabled={!document.fileUrl}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Button>

                      {isRecordLabel ? (
                        <>
                          <Button
                            variant="outline"
                            className="justify-center"
                            onClick={() => {
                              setDocumentToAssign(document);
                              setAssignArtistIds(document.artistIds);
                            }}
                          >
                            <Users className="h-4 w-4" />
                            Assign artists
                          </Button>

                          <Button
                            variant="outline"
                            className="justify-center border-rose-200 text-rose-600 hover:bg-rose-50"
                            onClick={() => setDocumentToDelete(document)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={isCreateModalOpen}
        onClose={closeCreateModal}
        size="lg"
        headerVariant="none"
        closeVariant="island"
      >
        <div className="px-6 py-6">
          <h2 className="text-xl font-semibold text-neutral-900">Upload split document</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Add a PDF or DOCX report document and optionally assign it to artists right away.
          </p>

          <div className="mt-6">
            <FileDropzone
              onFiles={handleSelectedFiles}
              accept=".pdf,.doc,.docx"
              label="Drag and Drop report document here"
              linkText="Select a document"
              className="bg-neutral-50"
            />
            <div className="mt-2 text-xs text-neutral-500">Supported file types: PDF, DOC, DOCX</div>
          </div>

          {selectedFile ? (
            <div className="mt-4">
              <SelectedFileCard file={selectedFile} onRemove={() => setSelectedFile(null)} />
            </div>
          ) : null}

          <div className="mt-6">
            <ArtistMultiSelect
              artistOptions={artistOptions}
              selectedArtistIds={selectedArtistIds}
              onChange={setSelectedArtistIds}
              helperText="Choose the artists who should receive this document. You can also leave this empty and assign later."
            />
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 justify-center border-[#7B00D4] text-[#7B00D4] hover:bg-[#7B00D4]/5"
              onClick={closeCreateModal}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 justify-center"
              onClick={handleCreateDocument}
              disabled={!selectedFile || isCreating}
            >
              {isCreating ? 'Uploading...' : 'Upload document'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!documentToAssign}
        onClose={closeAssignModal}
        size="lg"
        headerVariant="none"
        closeVariant="island"
      >
        <div className="px-6 py-6">
          <h2 className="text-xl font-semibold text-neutral-900">Assign split document</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Update which artists can access <span className="font-medium text-neutral-700">{documentToAssign?.fileName}</span>.
          </p>

          <div className="mt-6">
            <ArtistMultiSelect
              artistOptions={artistOptions}
              selectedArtistIds={assignArtistIds}
              onChange={setAssignArtistIds}
              helperText="Select the artists that should have access to this document."
            />
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 justify-center border-[#7B00D4] text-[#7B00D4] hover:bg-[#7B00D4]/5"
              onClick={closeAssignModal}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 justify-center"
              onClick={handleAssignArtists}
              disabled={isAssigning}
            >
              {isAssigning ? 'Saving...' : 'Save assignment'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!documentToDelete}
        onClose={closeDeleteModal}
        size="sm"
        headerVariant="none"
        closeVariant="island"
      >
        <div className="px-6 py-7">
          <h2 className="text-xl font-semibold text-neutral-900">Delete split document?</h2>
          <p className="mt-2 text-sm text-neutral-600">
            This will permanently remove <span className="font-medium text-neutral-800">{documentToDelete?.fileName}</span> from your label documents.
          </p>
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 justify-center"
              onClick={closeDeleteModal}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 justify-center bg-rose-600 hover:bg-rose-700"
              onClick={handleDeleteDocument}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
