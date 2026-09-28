import Link from "next/link";
import { saveJob } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FIELD, LABEL } from "@/components/admin/styles";
import { DEPARTMENTS, EMPLOYMENT_TYPES, JOB_DEFAULTS, JOB_STATUSES, LOCATIONS, label } from "@/lib/admin-shared";
import type { JobListing } from "@/lib/data";

type Props = { job?: JobListing };

/** Create/edit form for a job listing. Department, location and type suggest common values but accept any text. */
export function JobForm({ job }: Props) {
  const values = job ?? { ...JOB_DEFAULTS, id: "", posted_date: new Date().toISOString().slice(0, 10) };

  return (
    <form action={saveJob} className="bg-background border border-border rounded-sm p-5 sm:p-8 space-y-6">
      <input type="hidden" name="id" value={values.id} />

      <div>
        <label htmlFor="title" className={LABEL}>
          Title *
        </label>
        <input id="title" name="title" required maxLength={200} defaultValue={values.title} className={FIELD} />
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        <div>
          <label htmlFor="department" className={LABEL}>
            Department *
          </label>
          <input id="department" name="department" list="departments" required defaultValue={values.department} className={FIELD} />
          <datalist id="departments">
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="location" className={LABEL}>
            Location *
          </label>
          <input id="location" name="location" list="locations" required defaultValue={values.location} className={FIELD} />
          <datalist id="locations">
            {LOCATIONS.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="employment_type" className={LABEL}>
            Type *
          </label>
          <input
            id="employment_type"
            name="employment_type"
            list="employment-types"
            required
            defaultValue={values.employment_type}
            className={FIELD}
          />
          <datalist id="employment-types">
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label htmlFor="summary" className={LABEL}>
          Summary
        </label>
        <input
          id="summary"
          name="summary"
          maxLength={500}
          defaultValue={values.summary}
          placeholder="One line shown on the job board"
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="description" className={LABEL}>
          Description
        </label>
        <textarea id="description" name="description" rows={6} defaultValue={values.description} className={FIELD} />
      </div>

      <div>
        <label htmlFor="requirements" className={LABEL}>
          Requirements
        </label>
        <textarea
          id="requirements"
          name="requirements"
          rows={4}
          defaultValue={values.requirements}
          placeholder="Write full sentences; each sentence becomes a bullet point on the job page."
          className={FIELD}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="status" className={LABEL}>
            Status
          </label>
          <select id="status" name="status" defaultValue={values.status} className={FIELD}>
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
                {s === "open" ? " (visible on the site)" : " (hidden)"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="posted_date" className={LABEL}>
            Posted date
          </label>
          <input id="posted_date" name="posted_date" type="date" defaultValue={values.posted_date.slice(0, 10)} className={FIELD} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/admin/jobs" className="px-5 py-2.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground">
          Cancel
        </Link>
        <SubmitButton>{job ? "Save changes" : "Create listing"}</SubmitButton>
      </div>
    </form>
  );
}
