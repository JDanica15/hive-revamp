import "server-only";

// Minimal Gemini API client (REST, no SDK). The key lives only in the GEMINI_API_KEY environment
// variable on the server and is sent in a header, never in a URL, so it can't leak into logs.
//
// Models: Google retires and overloads models often, so each job takes a LIST of models and tries
// them in order, moving on quickly when one is busy, rate-limited or gone. Set GEMINI_TEXT_MODELS /
// GEMINI_IMAGE_MODELS (comma separated) to change them; the admin Blog page's "Check Gemini
// connection" button tests every model in the lists for real.

const API = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta"; // override only for tests

export const GEMINI_CONFIGURED = Boolean(process.env.GEMINI_API_KEY);

/** Cover images are switched off until BLOG_IMAGES=true (they need billing on the Google project). */
export const IMAGES_ENABLED = process.env.BLOG_IMAGES === "true";

const list = (value: string | undefined, fallback: string[]) => {
  const items = (value ?? "").split(",").map((m) => m.trim()).filter(Boolean);
  return items.length ? items : fallback;
};
// Tested against a real key (Nov 2026): fastest-reliable first. gemini-3.5-flash is a slow "thinking" model, so it is last. The others are
// faster / less busy backups. (Free-tier keys have no image quota: see the message in explain429.)
export const TEXT_MODELS = list(process.env.GEMINI_TEXT_MODELS, ["gemini-3-flash-preview", "gemini-3.5-flash-lite", "gemini-3.5-flash"]);
export const IMAGE_MODELS = list(process.env.GEMINI_IMAGE_MODELS, ["gemini-3.1-flash-image", "gemini-3.1-flash-image-preview"]);

/** `fallbackOk`: another model might succeed (busy, rate limited, retired, timed out). */
export class GeminiError extends Error {
  constructor(
    message: string,
    public fallbackOk = false,
  ) {
    super(message);
  }
}

const FALLBACK_STATUSES = new Set([404, 429, 500, 503, 504]);

function explain429(model: string, detail: string) {
  if (/limit:\s*0/.test(detail)) {
    return `Google's free tier has no quota for ${model}. Image generation needs billing turned on for this API key's project (Google AI Studio → Settings → Billing).`;
  }
  return `Gemini rate limit reached for ${model}. Wait a minute and try again.`;
}

type CallInit = { method?: string; body?: unknown; timeoutMs: number; model?: string };

/** One request, no retries. Throws GeminiError (with fallbackOk set) on any failure. */
async function call(path: string, init: CallInit) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("GEMINI_API_KEY is not set.");
  let res: Response;
  try {
    res = await fetch(`${API}/${path}`, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      headers: { "x-goog-api-key": key, "content-type": "application/json" },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(init.timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      throw new GeminiError(`${init.model ?? "Gemini"} didn't answer within ${Math.round(init.timeoutMs / 1000)} seconds.`, true);
    }
    throw new GeminiError(`Could not reach Gemini: ${err instanceof Error ? err.message : "network error"}`, true);
  }
  if (res.ok) return (await res.json()) as GeminiResponse;

  const detail = (await res.text().catch(() => "")).slice(0, 1200);
  const model = init.model ?? "the model";
  if (res.status === 429) throw new GeminiError(explain429(model, detail), true);
  if (res.status === 503 || res.status === 500 || res.status === 504) throw new GeminiError(`${model} is busy right now (${res.status}).`, true);
  let message = detail;
  try {
    message = JSON.parse(detail).error?.message ?? detail;
  } catch {}
  throw new GeminiError(`Gemini returned ${res.status} for ${model}. ${message.slice(0, 300)}`, FALLBACK_STATUSES.has(res.status));
}

type Part = { text?: string; inlineData?: { mimeType: string; data: string }; inline_data?: { mime_type: string; data: string } };
type GeminiResponse = {
  candidates?: { content?: { parts?: Part[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  models?: { name: string; supportedGenerationMethods?: string[] }[];
};

/**
 * Tries each model in turn within a total time budget. The first attempts are capped so one slow
 * failure can't use up the whole budget; the last attempt gets whatever is left.
 */
async function withModels<T>(models: string[], budgetMs: number, firstAttemptCapMs: number, run: (model: string, timeoutMs: number) => Promise<T>) {
  const deadline = Date.now() + budgetMs;
  const problems: string[] = [];
  for (let i = 0; i < models.length; i += 1) {
    const remaining = deadline - Date.now();
    if (remaining < 6_000) break;
    const timeoutMs = i === models.length - 1 ? remaining : Math.min(remaining, firstAttemptCapMs);
    try {
      return { value: await run(models[i], timeoutMs), model: models[i] };
    } catch (err) {
      if (!(err instanceof GeminiError)) throw err;
      problems.push(err.message);
      if (!err.fallbackOk) throw err; // a bad key or request: another model won't help
    }
  }
  const last = problems.at(-1) ?? "Gemini took too long.";
  throw new GeminiError(problems.length > 1 ? `${last} (also tried ${problems.length - 1} other model${problems.length > 2 ? "s" : ""}: all unavailable)` : last);
}

/** Asks a text model for JSON that matches `schema`. Returns the parsed object and the model that answered. */
export async function generateJson<T>(opts: { system: string; prompt: string; schema: object; temperature?: number; budgetMs?: number }) {
  const budget = opts.budgetMs ?? 100_000;
  return withModels(TEXT_MODELS, budget, Math.min(45_000, Math.round(budget * 0.5)), async (model, timeoutMs) => {
    const data = await call(`models/${model}:generateContent`, {
      model,
      timeoutMs,
      body: {
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: opts.schema, temperature: opts.temperature ?? 0.8 },
      },
    });
    if (data.promptFeedback?.blockReason) throw new GeminiError(`Gemini blocked the request (${data.promptFeedback.blockReason}).`);
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text) throw new GeminiError(`${model} returned no text.`, true);
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new GeminiError(`${model} returned text that wasn't valid JSON.`, true);
    }
  });
}

/** Generates one image. Returns the bytes, MIME type and the model that drew it. */
export async function generateImage(prompt: string) {
  const { value, model } = await withModels(IMAGE_MODELS, 100_000, 60_000, async (model, timeoutMs) => {
    const data = await call(`models/${model}:generateContent`, {
      model,
      timeoutMs,
      body: {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      },
    });
    if (data.promptFeedback?.blockReason) throw new GeminiError(`Gemini blocked the image request (${data.promptFeedback.blockReason}).`);
    for (const part of data.candidates?.[0]?.content?.parts ?? []) {
      const inline = part.inlineData ?? (part.inline_data ? { mimeType: part.inline_data.mime_type, data: part.inline_data.data } : null);
      if (inline?.data) return { bytes: Buffer.from(inline.data, "base64"), mimeType: inline.mimeType || "image/png" };
    }
    throw new GeminiError("Gemini returned no image (the prompt may have been declined).");
  });
  return { ...value, model };
}

export type ModelCheck = { model: string; kind: "text" | "image"; ok: boolean; seconds: number; note: string };

/**
 * For the admin "Check Gemini connection" button: a tiny real request to every model in both lists
 * (a model being listed doesn't mean it works: Google keeps retired models in the list). The image
 * test draws one small picture, which costs a fraction of a cent on a paid key and is refused on free keys.
 */
export async function checkGemini(): Promise<ModelCheck[]> {
  const ping = async (model: string, kind: "text" | "image"): Promise<ModelCheck> => {
    const started = Date.now();
    try {
      await call(`models/${model}:generateContent`, {
        model,
        timeoutMs: 45_000,
        body:
          kind === "text"
            ? { contents: [{ role: "user", parts: [{ text: "Reply with the word OK." }] }], generationConfig: { maxOutputTokens: 64 } }
            : { contents: [{ role: "user", parts: [{ text: "A plain cream coloured square." }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } },
      });
      return { model, kind, ok: true, seconds: (Date.now() - started) / 1000, note: "working" };
    } catch (err) {
      return { model, kind, ok: false, seconds: (Date.now() - started) / 1000, note: err instanceof Error ? err.message : "failed" };
    }
  };
  return Promise.all([...TEXT_MODELS.map((m) => ping(m, "text")), ...(IMAGES_ENABLED ? IMAGE_MODELS.slice(0, 1) : []).map((m) => ping(m, "image"))]);
}
