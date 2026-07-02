"use client";

import { useCallback, useRef, useState } from "react";
import { ACCEPTED_EXTENSIONS, isAcceptedFile } from "@/lib/api";

const MAX_FILE_SIZE_MB = 25;

interface UploadZoneProps {
  file: File | null;
  previewUrl: string | null;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
  onValidationError: (message: string) => void;
}

export default function UploadZone({
  file,
  previewUrl,
  disabled,
  onFileChange,
  onValidationError,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback(
    (candidate: File) => {
      if (!isAcceptedFile(candidate)) {
        onValidationError(
          `Unsupported file type. Please upload a ${ACCEPTED_EXTENSIONS.join(", ")} image.`
        );
        return;
      }
      if (candidate.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        onValidationError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      onFileChange(candidate);
    },
    [onFileChange, onValidationError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) validateAndSet(dropped);
    },
    [disabled, validateAndSet]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) validateAndSet(selected);
      e.target.value = "";
    },
    [validateAndSet]
  );

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="sr-only"
        onChange={handleInputChange}
        disabled={disabled}
      />
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload histology image"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center
          rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200
          ${disabled ? "cursor-not-allowed opacity-60" : ""}
          ${
            isDragging
              ? "border-teal bg-mint/40 scale-[1.01]"
              : "border-navy/20 bg-white hover:border-teal-light hover:bg-mint/10"
          }
        `}
      >
        {previewUrl && file ? (
          <div className="flex w-full flex-col items-center gap-4 animate-fade-in">
            <div className="relative overflow-hidden rounded-xl border border-navy/10 bg-navy/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Selected upload preview"
                className="max-h-56 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-navy/70">
              <span className="font-mono truncate max-w-[220px]">{file.name}</span>
              <span className="text-navy/30">&bull;</span>
              <span className="font-mono">{(file.size / 1024).toFixed(0)} KB</span>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={clearFile}
                className="text-xs font-medium text-navy/50 underline decoration-navy/20 underline-offset-4 hover:text-teal"
              >
                Choose a different image
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint/60 text-teal">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
            </div>
            <p className="font-display text-base font-semibold text-navy">
              Drop a scan here, or click to browse
            </p>
            <p className="max-w-xs text-sm text-navy/50">
              Accepts TIF, PNG, JPG, or BMP images up to {MAX_FILE_SIZE_MB}MB.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
