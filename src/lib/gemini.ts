import "server-only";

// Minimal Gemini API client (REST, no SDK). The key lives only in the GEMINI_API_KEY environment
// variable on the server and is sent in a header, never in a URL, so it can't leak into logs.
//
// Model names change often: set GEMINI_TEXT_MODEL / GEMINI_IMAGE_MODEL to whatever Google AI Studio
// lists for your key (the admin Blog page has a "Check Gemini" button that shows what's available).

const API = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta"; // override only for tests

export const GEMINI_CONFIGURED = Boolean(process.env.GEMINI_API_KEY);
export const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.8-flash";
export const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

export class GeminiError extends Error {}

async function call(path: string, init: { method?: string; body?: unknown; timeoutMs?: number } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("GEMINI_API_KEY is not set.");
  let res: Response;
  try {
    res = await fetch(`${API}/${path}`, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      headers: { "x-goog-api-key": key, "content-type": "application/json" },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(init.timeoutMs ?? 90_000),
      cache: "no-store",
    });
  } catch (err) {
    throw new GeminiError(`Could not reach Gemini: ${err instanceof Error ? err.message : "network error"}`);
  }
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 400);
    throw new GeminiError(`Gemini returned ${res.status}. ${detail}`);
  }
  return (await res.json()) as GeminiResponse;
}

type Part = { text?: string; inlineData?: { mimeType: string; data: string }; inline_data?: { mime_type: string; data: string } };
type GeminiResponse = {
  candidates?: { content?: { parts?: Part[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  models?: { name: string; supportedGenerationMethods?: string[] }[];
};

/** Asks the text model for JSON that matches `schema`. Returns the parsed object. */
export async function generateJson<T>(opts: { system: string; prompt: string; schema: object; temperature?: number }): Promise<T> {
  const data = await call(`models/${TEXT_MODEL}:generateContent`, {
    body: {
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: opts.schema,
        temperature: opts.temperature ?? 0.8,
      },
    },
  });
  if (data.promptFeedback?.blockReason) throw new GeminiError(`Gemini blocked the request (${data.promptFeedback.blockReason}).`);
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new GeminiError("Gemini returned no text.");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new GeminiError("Gemini returned text that wasn't valid JSON.");
  }
}

/** Generates one image. Returns the raw bytes and MIME type. */
export async function generateImage(prompt: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const data = await call(`models/${IMAGE_MODEL}:generateContent`, {
    timeoutMs: 120_000,
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
}

/** For the admin "Check Gemini" button: which models this key can use, and whether ours are among them. */
export async function checkGemini() {
  const data = await call("models?pageSize=200", { timeoutMs: 20_000 });
  // Being listed isn't enough: Google keeps retired models in the list while rejecting calls to them
  // ("no longer available to new users"). So make one tiny real request to the text model.
  let textError = "";
  try {
    await call(`models/${TEXT_MODEL}:generateContent`, {
      timeoutMs: 20_000,
      body: { contents: [{ role: "user", parts: [{ text: "Reply with the word OK." }] }], generationConfig: { maxOutputTokens: 8 } },
    });
  } catch (err) {
    textError = err instanceof Error ? err.message : "failed";
  }
  const names = (data.models ?? []).filter((m) => m.supportedGenerationMethods?.includes("generateContent")).map((m) => m.name.replace(/^models\//, ""));
  return {
    textModel: TEXT_MODEL,
    imageModel: IMAGE_MODEL,
    textOk: !textError,
    textError,
    imageOk: names.includes(IMAGE_MODEL),
    suggestions: names.filter((n) => /image/i.test(n)).slice(0, 8),
    textSuggestions: names.filter((n) => /gemini/i.test(n) && !/image|tts|embed|live|audio/i.test(n)).slice(0, 8),
  };
}
