"use server";

import { requireAdmin } from "@/lib/admin";
import { broadcastPresence, broadcastToVisitor, staffOnline, type ChatMessage } from "@/lib/chat";
import { db } from "@/lib/supabase";
import { chatMessageError, cleanChatMessage } from "@/lib/validate";

// Admin side of live chat. Every action re-checks the admin session: Server Actions are public endpoints.

export type ChatConversation = {
  id: string;
  name: string;
  email: string;
  page_url: string;
  status: "open" | "closed";
  last_message_at: string;
  created_date: string;
  unread: number;
  preview: string;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Marks staff as available and "seen just now". The inbox page calls this every ~30 seconds. */
export async function chatHeartbeat() {
  await requireAdmin();
  const wasOnline = await staffOnline();
  const { data, error } = await db()
    .from("chat_presence")
    .update({ last_seen: new Date().toISOString() })
    .eq("id", 1)
    .select("available")
    .single();
  if (error) throw new Error(error.message);
  // Open chat windows learn about it instantly when staff come online.
  if (!wasOnline && data.available) await broadcastPresence(true);
  return { available: data.available as boolean };
}

export async function setChatAvailable(available: boolean) {
  await requireAdmin();
  const patch = available ? { available: true, last_seen: new Date().toISOString() } : { available: false };
  const { error } = await db().from("chat_presence").update(patch).eq("id", 1);
  if (error) throw new Error(error.message);
  await broadcastPresence(available);
  return available;
}

export async function listConversations(): Promise<ChatConversation[]> {
  await requireAdmin();
  const { data: rows, error } = await db()
    .from("chat_conversations")
    .select("id, name, email, page_url, status, last_message_at, created_date")
    .order("last_message_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  if (!rows?.length) return [];

  const ids = rows.map((r) => r.id);
  const { data: messages } = await db()
    .from("chat_messages")
    .select("conversation_id, sender, body, read_at, created_date")
    .in("conversation_id", ids)
    .order("created_date", { ascending: false })
    .limit(1000);

  const preview = new Map<string, string>();
  const unread = new Map<string, number>();
  for (const m of messages ?? []) {
    if (!preview.has(m.conversation_id)) preview.set(m.conversation_id, (m.sender === "staff" ? "You: " : "") + m.body);
    if (m.sender === "visitor" && !m.read_at) unread.set(m.conversation_id, (unread.get(m.conversation_id) ?? 0) + 1);
  }
  return rows.map((r) => ({
    ...r,
    status: r.status as "open" | "closed",
    unread: unread.get(r.id) ?? 0,
    preview: (preview.get(r.id) ?? "").slice(0, 120),
  }));
}

/** One conversation's messages; opening it marks the visitor's messages as read. */
export async function getThread(id: string): Promise<{ messages: ChatMessage[]; status: "open" | "closed" } | null> {
  await requireAdmin();
  if (!uuid.test(id)) return null;
  const { data: conversation } = await db().from("chat_conversations").select("status").eq("id", id).maybeSingle();
  if (!conversation) return null;
  await db().from("chat_messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", id).eq("sender", "visitor").is("read_at", null);
  const { data: messages, error } = await db()
    .from("chat_messages")
    .select("id, sender, body, created_date")
    .eq("conversation_id", id)
    .order("created_date", { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  return { messages: (messages ?? []) as ChatMessage[], status: conversation.status as "open" | "closed" };
}

export async function sendReply(id: string, body: string): Promise<{ message?: ChatMessage; error?: string }> {
  await requireAdmin();
  if (!uuid.test(id)) return { error: "Unknown conversation." };
  const text = cleanChatMessage(body);
  const problem = chatMessageError(text);
  if (problem) return { error: problem };

  const { data: conversation } = await db().from("chat_conversations").select("id, status").eq("id", id).maybeSingle();
  if (!conversation) return { error: "Unknown conversation." };
  if (conversation.status === "closed") return { error: "This chat is closed. Reopen it to reply." };

  const { data: message, error } = await db()
    .from("chat_messages")
    .insert({ conversation_id: id, sender: "staff", body: text })
    .select("id, sender, body, created_date")
    .single();
  if (error || !message) return { error: "Could not send the reply." };

  await db().from("chat_conversations").update({ last_message_at: message.created_date }).eq("id", id);
  await broadcastToVisitor(id, message as ChatMessage);
  return { message: message as ChatMessage };
}

export async function setConversationStatus(id: string, status: "open" | "closed") {
  await requireAdmin();
  if (!uuid.test(id) || !["open", "closed"].includes(status)) throw new Error("Invalid request");
  const { error } = await db().from("chat_conversations").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}
