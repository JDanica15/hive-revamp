"use client";

import { useTransition } from "react";
import { updateApplicationStatus } from "@/app/admin/actions";
import { SELECT } from "@/components/admin/styles";
import { APPLICATION_STATUSES, label } from "@/lib/admin-shared";

export function ApplicationStatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label="Application status"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(() => updateApplicationStatus(id, next));
      }}
      className={SELECT}
    >
      {APPLICATION_STATUSES.map((s) => (
        <option key={s} value={s}>
          {label(s)}
        </option>
      ))}
    </select>
  );
}
