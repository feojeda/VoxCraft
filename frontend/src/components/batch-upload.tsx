"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface BatchUploadProps {
  onUploadComplete: (batchId: string) => void;
}

export function BatchUpload({ onUploadComplete }: BatchUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

  const validateFile = (file: File): string | null => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      return "Please upload a CSV file (.csv)";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 1MB limit";
    }
    return null;
  };

  const processFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setFileName(null);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setFileName(file.name);
    setSelectedFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      const batch = await apiClient.uploadBatch(selectedFile);
      onUploadComplete(batch.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, onUploadComplete]);

  const clearFile = useCallback(() => {
    setFileName(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-[var(--accent)] bg-[var(--accent)]/5"
            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <Upload
          className={`mx-auto mb-3 h-8 w-8 ${
            isDragging ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
          }`}
        />
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Drop your CSV file here, or click to browse
        </p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Format: two columns — text, voice. Max 100 rows.
        </p>
      </div>

      {/* File info */}
      {fileName && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-sm text-[var(--text-primary)]">{fileName}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearFile();
            }}
            className="rounded-md p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-[var(--error)]">{error}</p>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Start Batch
          </>
        )}
      </button>
    </div>
  );
}
