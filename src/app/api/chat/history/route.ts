import { NextResponse } from "next/server";
import { CHAT_ENABLED, conversationFromToken, staffOnline } from "@/lib/chat";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// The visitor's conversation so far, for restoring the chat after a reload or a dropped connection.
export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!CHAT_ENABLED) return NextResponse.json({ error: "Chat is unavailable." }, { status: 503, headers });
  const conversationId = conversationFromToken(request.headers.get("x-chat-token"));
  if (!conversationId) return NextResponse.json({ error: "expired" }, { status: 401, headers });

  const [{ data: conversation }, { data: messages }, online] = await Promise.all([
    db().from("chat_conversations").select("status").eq("id", conversationId).maybeSingle(),
    db()
      .from("chat_messages")
      .select("id, sender, body, created_date")
      .eq("conversation_id", conversationId)
      .order("created_date", { ascending: true })
      .limit(300),
    staffOnline().catch(() => false),
  ]);
  if (!conversation) return NextResponse.json({ error: "expired" }, { status: 401, headers });
  return NextResponse.json({ messages: messages ?? [], status: conversation.status, online }, { headers });
}
