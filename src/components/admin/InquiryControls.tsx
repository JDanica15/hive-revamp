"use client";

import { useTransition } from "react";
import { updateInquiry } from "@/app/admin/actions";
import { SELECT } from "@/components/admin/styles";
import { INQUIRY_PRIORITIES, INQUIRY_STATUSES, label } from "@/lib/admin-shared";

export function InquiryControls({ id, status, priority }: { id: string; status: string; priority: string }) {
  const [pending, startTransition] = useTransition();
  const update = (patch: { status?: string; priority?: string }) => startTransition(() => updateInquiry(id, patch));

  return (
    <div className="flex gap-2 shrink-0">
      <select
        aria-label="Priority"
        defaultValue={priority}
        disabled={pending}
        onChange={(e) => update({ priority: e.target.value })}
        className={SELECT}
      >
        {INQUIRY_PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {label(p)} priority
          </option>
        ))}
      </select>
      <select
        aria-label="Status"
        defaultValue={status}
        disabled={pending}
        onChange={(e) => update({ status: e.target.value })}
        className={SELECT}
      >
        {INQUIRY_STATUSES.map((s) => (
          <option key={s} value={s}>
            {label(s)}
          </option>
        ))}
      </select>
    </div>
  );
}
