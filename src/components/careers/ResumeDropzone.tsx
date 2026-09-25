"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { FileText, Trash2, Upload } from "@/components/icons";
import { RESUME_ACCEPT, RESUME_REQUIRED, formatBytes, resumeProblem } from "@/lib/careers";

type Props = { file: File | null; onChange: (file: File | null) => void };

export function ResumeDropzone({ file, onChange }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const pick = (candidate: File | undefined | null) => {
    if (!candidate) return;
    const problem = resumeProblem(candidate);
    setError(problem ?? "");
    if (!problem) onChange(candidate);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <p id={`${id}-label`} className="block text-xs tracking-wider uppercase text-muted-foreground mb-2">
        Resume{RESUME_REQUIRED ? " *" : ""}
      </p>
      <input
        ref={inputRef}
        id={id}
        type="file"
        name="resume-picker"
        accept={RESUME_ACCEPT}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
        className="peer sr-only"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {file ? (
        <div className="flex items-center gap-4 border border-border rounded-sm bg-card px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <label htmlFor={id} className="text-sm text-accent hover:underline cursor-pointer">
            Replace
          </label>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            aria-label="Remove resume"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={
            "flex flex-col items-center justify-center text-center gap-2 px-6 py-8 border border-dashed rounded-sm cursor-pointer transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent " +
            (dragging ? "border-accent bg-accent/5" : "border-border bg-card/60 hover:border-accent hover:bg-accent/5")
          }
        >
          <span className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center mb-1">
            <Upload className="w-5 h-5 text-accent" />
          </span>
          <span className="text-sm text-foreground">
            <span className="font-medium">Drag &amp; drop your resume</span> or{" "}
            <span className="text-accent underline underline-offset-4">browse</span>
          </span>
          <span id={`${id}-hint`} className="text-xs text-muted-foreground">
            PDF or Word document · up to 4 MB
          </span>
        </label>
      )}
      {error && (
        <p className="text-destructive text-sm mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
