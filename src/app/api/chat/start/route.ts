import { NextResponse } from "next/server";
import { CHAT_ENABLED, gateAgeOk, issueConversationToken, staffOnline } from "@/lib/chat";
import { TOO_MANY, clientId, isCrossSite, isTooLarge, withinRateLimit } from "@/lib/request-guard";
import { db } from "@/lib/supabase";
import { cleanChatStart, cleanPagePath, validateChatStart } from "@/lib/validate";

const MAX_BODY_BYTES = 8 * 1024;

const fail = (error: string, status = 400, extra?: object) => NextResponse.json({ error, ...extra }, { status });

export async function POST(request: Request) {
  if (!CHAT_ENABLED) return fail("Chat is unavailable.", 503);
  if (isCrossSite(request)) return fail("Forbidden", 403);
  if (isTooLarge(request, MAX_BODY_BYTES)) return fail("Your message is too long.", 413);
  if (!request.headers.get("content-type")?.includes("application/json")) return fail("Unsupported request.", 415);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Your message could not be read.");

  // Honeypot: real people never fill this hidden field. Pretend it worked.
  if (typeof body.company_website === "string" && body.company_website.trim()) {
    return NextResponse.json({ ok: true, conversationId: crypto.randomUUID(), token: "", message: null }, { status: 201 });
  }
  // Bots post instantly without opening the widget; a real visitor's gate token is a few seconds old.
  if (!gateAgeOk(body.gate)) return fail("Please try again.", 400, { code: "gate" });

  const data = cleanChatStart(body);
  const errors = validateChatStart(data);
  if (Object.keys(errors).length) return fail("Please fix the highlighted fields.", 400, { errors });

  if (!(await staffOnline())) return fail("Our team is offline right now.", 409, { code: "offline" });

  const visitor = await clientId();
  if (!(await withinRateLimit("chatStart", visitor)) || !(await withinRateLimit("chatStartGlobal", "all"))) {
    return fail(TOO_MANY, 429);
  }

  const { data: conversation, error } = await db()
    .from("chat_conversations")
    .insert({ name: data.name, email: data.email, page_url: cleanPagePath(body.page), visitor_hash: visitor })
    .select("id")
    .single();
  if (error || !conversation) {
    console.error("Chat start failed:", error);
    return fail("We couldn't start the chat. Please try again.", 502);
  }

  const { data: message, error: messageError } = await db()
    .from("chat_messages")
    .insert({ conversation_id: conversation.id, sender: "visitor", body: data.message })
    .select("id, sender, body, created_date")
    .single();
  if (messageError || !message) {
    console.error("Chat first message failed:", messageError);
    await db().from("chat_conversations").delete().eq("id", conversation.id);
    return fail("We couldn't start the chat. Please try again.", 502);
  }

  return NextResponse.json(
    { ok: true, conversationId: conversation.id, token: issueConversationToken(conversation.id), message },
    { status: 201 },
  );
}
