"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export type UploadedFile = {
  name: string;
  type: string;
  base64: string;
  sizeBytes: number;
};

type Props = {
  onFile: (file: UploadedFile | null) => void;
  currentFile?: UploadedFile | null;
};

export default function FileUploadInput({ onFile, currentFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      setError(`File too large (max 5 MB). "${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB.`);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const base64 = await toBase64(file);
      onFile({ name: file.name, type: file.type, base64, sizeBytes: file.size });
    } catch {
      setError("Failed to read file. Please try again.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      {currentFile ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
          <Upload className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="flex-1 truncate text-slate-700">{currentFile.name}</span>
          <span className="text-slate-400">{(currentFile.sizeBytes / 1024).toFixed(0)} KB</span>
          <button
            type="button"
            onClick={() => { onFile(null); }}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:border-rootwork-sage hover:text-slate-700 transition-colors disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {loading ? "Reading file…" : "Attach file (image, PDF, video — max 5 MB)"}
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf,video/*"
        className="sr-only"
        onChange={handleChange}
      />
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}
