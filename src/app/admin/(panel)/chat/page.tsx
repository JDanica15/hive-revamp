import type { Metadata } from "next";
import { chatHeartbeat, listConversations } from "@/app/admin/chat-actions";
import { ChatInbox } from "@/components/admin/ChatInbox";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Live chat" };

export default async function ChatPage() {
  await requireAdmin();
  const [conversations, presence] = await Promise.all([listConversations(), chatHeartbeat()]);

  return (
    <section aria-labelledby="chat-heading">
      <h1 id="chat-heading" className="font-heading text-2xl font-medium mb-2">
        Live chat
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Visitors can start a chat only while this page is open and you&rsquo;re marked available. Otherwise the site shows them
        your email address instead.
      </p>
      <ChatInbox initialConversations={conversations} initialAvailable={presence.available} />
    </section>
  );
}
