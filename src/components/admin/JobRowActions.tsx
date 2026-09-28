"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteJob, setJobStatus } from "@/app/admin/actions";
import { Trash2 } from "@/components/icons";

const BUTTON =
  "px-3 py-1.5 rounded-sm border border-border text-xs font-medium hover:bg-muted disabled:opacity-60 transition-colors";

export function JobRowActions({ id, title, status }: { id: string; title: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => setJobStatus(id, status === "open" ? "closed" : "open"))}
        className={BUTTON}
      >
        {status === "open" ? "Close" : "Open"}
      </button>
      <Link href={`/admin/jobs/${id}`} className={BUTTON}>
        Edit
      </Link>
      <button
        type="button"
        disabled={pending}
        aria-label={`Delete ${title}`}
        onClick={() => {
          if (confirm(`Delete "${title}"? This can't be undone. To just hide it, use Close instead.`)) {
            startTransition(() => deleteJob(id));
          }
        }}
        className={BUTTON + " text-destructive hover:bg-destructive/10"}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </>
  );
}
