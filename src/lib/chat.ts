import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db, isSupabaseConfigured } from "@/lib/supabase";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, SUPABASE_URL } from "@/lib/supabase-env";

// Live chat support: server-side helpers shared by the /api/chat routes and the admin inbox.
// Visitors never touch the database. They hold a signed token, and receive replies through
// Supabase Realtime Broadcast on a channel named after their (random, unguessable) conversation id.

export type ChatMessage = { id: string; sender: "visitor" | "staff"; body: string; created_date: string };

export const CHAT_ENABLED = isSupabaseConfigured;

/** Staff count as online if the admin chat page has pinged within this many seconds. */
const ONLINE_WINDOW_MS = 90_000;
/** A visitor's chat link stays valid for 7 days. */
const CONVERSATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** The widget's "gate" token must be at least this old before a chat can start (bots fire instantly). */
export const GATE_MIN_AGE_MS = 2_000;
export const GATE_MAX_AGE_MS = 60 * 60 * 1000;

// Signed tokens -----------------------------------------------------------------------------

const key = () => `hive-chat|${SUPABASE_SECRET_KEY ?? ""}`;
const b64 = (input: string | Buffer) => Buffer.from(input).toString("base64url");
const sign = (body: string) => createHmac("sha256", key()).update(body).digest();

function issue(payload: Record<string, unknown>) {
  const body = b64(JSON.stringify(payload));
  return `${body}.${b64(sign(body))}`;
}

function read(token: unknown): Record<string, unknown> | null {
  if (typeof token !== "string" || token.length > 600) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

/** Issued when the widget opens; a chat can only start from one that is a few seconds old. */
export const issueGate = () => issue({ t: "gate", iat: Date.now() });

export function gateAgeOk(token: unknown) {
  const p = read(token);
  if (!p || p.t !== "gate" || typeof p.iat !== "number") return false;
  const age = Date.now() - p.iat;
  return age >= GATE_MIN_AGE_MS && age <= GATE_MAX_AGE_MS;
}

export const issueConversationToken = (conversationId: string) =>
  issue({ t: "conv", cid: conversationId, exp: Date.now() + CONVERSATION_TTL_MS });

/** The conversation id a valid, unexpired token belongs to, or null. */
export function conversationFromToken(token: unknown): string | null {
  const p = read(token);
  if (!p || p.t !== "conv" || typeof p.cid !== "string" || typeof p.exp !== "number" || p.exp < Date.now()) return null;
  return p.cid;
}

// Realtime ------------------------------------------------------------------------------------

/** Public connection details for the browser (the publishable key is meant to be public). */
export const realtimeConfig = () =>
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY ? { url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY } : null;

/**
 * Pushes a message to the visitor's open widget. Best effort: the message is already saved, and
 * the widget also re-fetches history when it reconnects or regains focus, so a failure is only logged.
 */
export async function broadcastToVisitor(conversationId: string, message: ChatMessage) {
  const client = db();
  const channel = client.channel(`chat:${conversationId}`);
  try {
    await channel.httpSend("message", message, { timeout: 4000 });
  } catch (err) {
    console.error("Chat broadcast failed:", err);
  } finally {
    await client.removeChannel(channel);
  }
}

// Staff presence --------------------------------------------------------------------------------

export async function staffOnline() {
  if (!CHAT_ENABLED) return false;
  const { data } = await db().from("chat_presence").select("available, last_seen").eq("id", 1).maybeSingle();
  if (!data?.available) return false;
  return Date.now() - new Date(data.last_seen).getTime() < ONLINE_WINDOW_MS;
}
