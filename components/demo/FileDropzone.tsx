"use client";

import { useRef, useState } from "react";
import { readFileText } from "@/lib/csv";

/** Drag-and-drop / click file picker that hands back raw file text. */
export function FileDropzone({
  accept,
  onLoad,
  onError,
}: {
  accept: string;
  onLoad: (fileName: string, text: string) => void;
  onError: (message: string) => void;
}) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (file: File | undefined) => {
    if (!file) return;
    readFileText(file)
      .then((text) => onLoad(file.name, text))
      .catch((e) =>
        onError(e instanceof Error ? e.message : "That file could not be read."),
      );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files?.[0]);
      }}
      className={`cursor-pointer rounded-xl border border-dashed p-5 text-center outline-none transition-colors ${
        drag
          ? "border-accent bg-accent/10"
          : "border-white/[0.15] hover:border-accent/50 hover:bg-white/[0.03]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        className="mx-auto text-accent"
        aria-hidden
      >
        <path
          d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="mt-2 text-sm font-medium text-text">
        Drop a data file or <span className="text-accent">browse</span>
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {accept.replace(/\./g, "").toUpperCase()}
      </p>
    </div>
  );
}
