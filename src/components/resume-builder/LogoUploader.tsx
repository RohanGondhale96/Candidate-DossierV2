"use client";

import { useRef } from "react";
import { Upload, X, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";

import { useResumeStore } from "@/stores/resumeStore";

export function LogoUploader() {
  const logoUrl = useResumeStore((s) => s.logoUrl);
  const logoHidden = useResumeStore((s) => s.logoHidden);
  const setLogo = useResumeStore((s) => s.setLogo);
  const setLogoHidden = useResumeStore((s) => s.setLogoHidden);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Logo must be under 1.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string); // also un-hides
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // Has a logo image
  if (logoUrl && !logoHidden) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-12 flex-1 items-center justify-center rounded-md border bg-white p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Logo"
            className="max-h-10 max-w-full object-contain"
          />
        </div>
        <button
          type="button"
          onClick={() => setLogo(null)}
          className="flex h-7 w-7 items-center justify-center rounded-md border text-gray-400 transition-colors hover:text-destructive"
          aria-label="Remove logo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Logo area removed from the resume
  if (logoHidden) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-gray-200 px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <EyeOff className="h-3.5 w-3.5" /> No logo
        </span>
        <button
          type="button"
          onClick={() => setLogoHidden(false)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Eye className="h-3.5 w-3.5" /> Show
        </button>
      </div>
    );
  }

  // No logo yet — show upload affordance
  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 py-4 text-xs text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600"
      >
        <Upload className="h-4 w-4" />
        Upload logo
      </button>
      <button
        type="button"
        onClick={() => setLogoHidden(true)}
        className="mt-1.5 flex w-full items-center justify-center gap-1 text-[11px] text-gray-400 hover:text-gray-600"
      >
        <EyeOff className="h-3 w-3" /> Remove logo area
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </>
  );
}
