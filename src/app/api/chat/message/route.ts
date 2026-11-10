import { NextResponse } from "next/server";
import { CHAT_ENABLED, conversationFromToken, staffOnline } from "@/lib/chat";
import { TOO_MANY, clientId, isCrossSite, isTooLarge, withinRateLimit } from "@/lib/request-guard";
import { db } from "@/lib/supabase";
import { chatMessageError, cleanChatMessage } from "@/lib/validate";

const MAX_BODY_BYTES = 8 * 1024;
const MAX_MESSAGES_PER_CHAT = 300;
const MIN_GAP_MS = 800;

const fail = (error: string, status = 400, extra?: object) => NextResponse.json({ error, ...extra }, { status });

export async function POST(request: Request) {
  if (!CHAT_ENABLED) return fail("Chat is unavailable.", 503);
  if (isCrossSite(request)) return fail("Forbidden", 403);
  if (isTooLarge(request, MAX_BODY_BYTES)) return fail("Your message is too long.", 413);
  if (!request.headers.get("content-type")?.includes("application/json")) return fail("Unsupported request.", 415);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Your message could not be read.");
  if (typeof body.company_website === "string" && body.company_website.trim()) return fail("Your message could not be sent.");

  const conversationId = conversationFromToken(body.token);
  if (!conversationId) return fail("This chat has expired.", 401, { code: "expired" });

  const text = cleanChatMessage(body.body);
  const problem = chatMessageError(text);
  if (problem) return fail(problem);

  if (!(await withinRateLimit("chatMessage", await clientId())) || !(await withinRateLimit("chatConversation", conversationId))) {
    return fail(TOO_MANY, 429);
  }

  const { data: conversation } = await db().from("chat_conversations").select("id, status").eq("id", conversationId).maybeSingle();
  if (!conversation) return fail("This chat has expired.", 401, { code: "expired" });
  if (conversation.status === "closed") return fail("This chat has ended.", 409, { code: "closed" });

  const { data: recent } = await db()
    .from("chat_messages")
    .select("created_date, sender")
    .eq("conversation_id", conversationId)
    .order("created_date", { ascending: false })
    .limit(1);
  if (recent?.[0]?.sender === "visitor" && Date.now() - new Date(recent[0].created_date).getTime() < MIN_GAP_MS) {
    return fail("You're sending messages too quickly.", 429);
  }
  const { count } = await db().from("chat_messages").select("id", { count: "exact", head: true }).eq("conversation_id", conversationId);
  if ((count ?? 0) >= MAX_MESSAGES_PER_CHAT) return fail("This chat has reached its length limit.", 409, { code: "closed" });

  const { data: message, error } = await db()
    .from("chat_messages")
    .insert({ conversation_id: conversationId, sender: "visitor", body: text })
    .select("id, sender, body, created_date")
    .single();
  if (error || !message) {
    console.error("Chat message insert failed:", error);
    return fail("We couldn't send your message. Please try again.", 502);
  }
  await db().from("chat_conversations").update({ last_message_at: message.created_date }).eq("id", conversationId);

  return NextResponse.json({ ok: true, message, online: await staffOnline() }, { status: 201 });
}
