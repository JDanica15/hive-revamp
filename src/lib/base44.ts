import "server-only";
import { BASE44_APP_ID, BASE44_SERVER } from "@/lib/site";

/** Creates a record in a Base44 entity, the same request the original site's SDK made from the browser. */
export async function createEntity(entity: string, data: Record<string, unknown>) {
  const res = await fetch(`${BASE44_SERVER}/api/apps/${BASE44_APP_ID}/entities/${entity}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-App-Id": BASE44_APP_ID },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Base44 ${entity} create failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  return res.json();
}

/** Uploads a file to Base44 storage (Core.UploadFile) and returns its public URL. */
export async function uploadFile(file: Blob, filename: string): Promise<string> {
  const body = new FormData();
  body.append("file", file, filename);
  const res = await fetch(`${BASE44_SERVER}/api/apps/${BASE44_APP_ID}/integration-endpoints/Core/UploadFile`, {
    method: "POST",
    headers: { "X-App-Id": BASE44_APP_ID },
    body,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Base44 upload failed: ${res.status} ${await res.text().catch(() => "")}`);
  const json = (await res.json()) as { file_url?: string; url?: string };
  const url = json.file_url ?? json.url;
  if (!url) throw new Error("Base44 upload returned no file URL");
  return url;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Picks the allowed string fields from an untrusted body, trimmed and length-limited. */
export function pickFields(body: unknown, fields: Record<string, number>) {
  const src = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [key, max] of Object.entries(fields)) {
    const value = src[key];
    out[key] = typeof value === "string" ? value.trim().slice(0, max) : "";
  }
  return out;
}

export function isEmail(value: string) {
  return EMAIL_RE.test(value);
}
