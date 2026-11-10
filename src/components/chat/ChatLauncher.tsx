"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// The chat code is only downloaded in the browser, after the page has loaded, so it adds nothing
// to the first paint. It is hidden on the admin panel, which has its own chat inbox.
const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget").then((m) => m.ChatWidget), { ssr: false });

export function ChatLauncher() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <ChatWidget />;
}
