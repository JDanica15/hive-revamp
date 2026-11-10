import { NextResponse } from "next/server";
import { CHAT_ENABLED, issueGate, realtimeConfig, staffOnline } from "@/lib/chat";

export const dynamic = "force-dynamic";

// Called when the chat window opens: is staff online, a gate token for starting a chat, and the
// public Realtime connection details.
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  if (!CHAT_ENABLED) return NextResponse.json({ enabled: false, online: false }, { headers });
  const online = await staffOnline().catch(() => false);
  return NextResponse.json({ enabled: true, online, gate: issueGate(), realtime: realtimeConfig() }, { headers });
}
