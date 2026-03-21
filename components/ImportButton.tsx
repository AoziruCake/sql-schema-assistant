"use client";

import { useRef, type ChangeEvent, type DragEventHandler } from "react";
import { Button } from "@/components/ui/button";
import {
  ImportServiceError,
  parseImportedProjectJson,
  type ImportedProject
} from "@/lib/import-service";

type ImportButtonProps = {
  label: string;
  dropLabel?: string;
  maxFileSizeBytes?: number;
  onImportSuccess: (project: ImportedProject) => void;
  onImportError: (code: string, details?: string) => void;
  className?: string;
};

export default function ImportButton({
  label,
  dropLabel,
  maxFileSizeBytes = 2 * 1024 * 1024,
  onImportSuccess,
  onImportError,
  className
}: ImportButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    if (file.size > maxFileSizeBytes) {
      onImportError("FILE_TOO_LARGE");
      return;
    }

    try {
      const text = await file.text();
      const imported = parseImportedProjectJson(text);
      onImportSuccess(imported);
    } catch (err) {
      if (err instanceof ImportServiceError) {
        onImportError(err.code, err.details);
        return;
      }
      onImportError("INVALID_SCHEMA");
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    await handleFile(file);
  };

  const handleDragOver: DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter: DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave: DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop: DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await handleFile(file);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={className}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="w-full rounded-md border border-dashed border-slate-700 bg-slate-950/60 px-3 py-2 text-center text-[10px] text-slate-400"
      >
        {dropLabel ?? "Drop JSON file here"}
      </div>
    </div>
  );
}
