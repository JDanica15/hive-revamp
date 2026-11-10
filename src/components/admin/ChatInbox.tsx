"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  chatHeartbeat,
  getThread,
  listConversations,
  sendReply,
  setChatAvailable,
  setConversationStatus,
  type ChatConversation,
} from "@/app/admin/chat-actions";
import { BADGE, FIELD } from "@/components/admin/styles";
import { ArrowLeft, LoaderCircle, Send } from "@/components/icons";
import { formatWhen } from "@/lib/admin-shared";
import type { ChatMessage } from "@/lib/chat";

const LIST_POLL_MS = 4_000;
const HEARTBEAT_MS = 30_000;

type Thread = { messages: ChatMessage[]; status: "open" | "closed" };

/** Staff inbox for live chat. Polls while the tab is visible; being open and visible is what shows the site as "online". */
export function ChatInbox({
  initialConversations,
  initialAvailable,
}: {
  initialConversations: ChatConversation[];
  initialAvailable: boolean;
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [available, setAvailable] = useState(initialAvailable);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  const refresh = useCallback(async () => {
    try {
      const id = selectedRef.current;
      const [list, current] = await Promise.all([listConversations(), id ? getThread(id) : null]);
      setConversations(list);
      if (id && id === selectedRef.current && current) setThread(current);
    } catch {
      // A failed poll (offline, session expired) is retried on the next tick.
    }
  }, []);

  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && void refresh();
    const timer = window.setInterval(tick, LIST_POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  useEffect(() => {
    const beat = () => document.visibilityState === "visible" && chatHeartbeat().then((p) => setAvailable(p.available), () => {});
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [thread?.messages.length, selectedId]);

  const select = async (id: string) => {
    setSelectedId(id);
    selectedRef.current = id;
    setThread(null);
    setDraft("");
    setError("");
    setThread(await getThread(id));
    void refresh();
  };

  const toggleAvailable = async () => {
    const next = !available;
    setAvailable(next);
    try {
      await setChatAvailable(next);
    } catch {
      setAvailable(!next);
    }
  };

  const send = async () => {
    const text = draft.trim();
    if (!selectedId || !text || sending) return;
    setSending(true);
    setError("");
    const result = await sendReply(selectedId, text);
    setSending(false);
    if (result.error || !result.message) return setError(result.error ?? "Could not send the reply.");
    const message = result.message;
    setThread((t) => (t ? { ...t, messages: [...t.messages.filter((m) => m.id !== message.id), message] } : t));
    setDraft("");
    void refresh();
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const setStatus = async (status: "open" | "closed") => {
    if (!selectedId) return;
    await setConversationStatus(selectedId, status);
    setThread((t) => (t ? { ...t, status } : t));
    void refresh();
  };

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          role="switch"
          aria-checked={available}
          onClick={toggleAvailable}
          className={
            "relative w-11 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
            (available ? "bg-emerald-500" : "bg-zinc-300")
          }
        >
          <span
            className={"absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform " + (available ? "translate-x-5" : "")}
          />
          <span className="sr-only">Taking chats</span>
        </button>
        <p className="text-sm">
          {available ? "You're taking chats — the site shows you as online while this page is open." : "You're away — visitors are shown your email address."}
        </p>
      </div>

      <div className="md:grid md:grid-cols-[320px_1fr] gap-4 min-h-[28rem]">
        <ul className={"space-y-2 " + (selectedId ? "hidden md:block" : "")} aria-label="Conversations">
          {conversations.length === 0 && (
            <li className="text-muted-foreground text-sm py-16 text-center">No chats yet. New conversations appear here instantly.</li>
          )}
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => void select(c.id)}
                aria-current={c.id === selectedId ? "true" : undefined}
                className={
                  "w-full text-left bg-background border rounded-sm p-3 transition-colors hover:border-accent " +
                  (c.id === selectedId ? "border-accent" : "border-border")
                }
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate flex-1">{c.name}</p>
                  {c.unread > 0 && <span className={BADGE + " bg-accent text-accent-foreground"}>{c.unread}</span>}
                  {c.status === "closed" && <span className={BADGE + " bg-zinc-200 text-zinc-700"}>Closed</span>}
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">{c.preview}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{formatWhen(c.last_message_at)}</p>
              </button>
            </li>
          ))}
        </ul>

        <div className={"bg-background border border-border rounded-sm flex-col h-[32rem] " + (selectedId ? "flex" : "hidden md:flex")}>
          {!selected ? (
            <p className="m-auto text-muted-foreground text-sm">Select a conversation.</p>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <button type="button" onClick={() => setSelectedId(null)} className="md:hidden p-1 -ml-1" aria-label="Back to conversations">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{selected.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selected.email ? (
                      <a href={`mailto:${selected.email}`} className="hover:text-accent hover:underline">
                        {selected.email}
                      </a>
                    ) : (
                      "No email given"
                    )}
                    {selected.page_url && ` · from ${selected.page_url}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void setStatus(thread?.status === "closed" ? "open" : "closed")}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
                >
                  {thread?.status === "closed" ? "Reopen" : "Close chat"}
                </button>
              </div>

              <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {!thread ? (
                  <LoaderCircle className="w-5 h-5 animate-spin text-muted-foreground m-auto" />
                ) : (
                  thread.messages.map((m) => (
                    <div key={m.id} className={"flex flex-col " + (m.sender === "staff" ? "items-end" : "items-start")}>
                      <div
                        className={
                          "max-w-[80%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words " +
                          (m.sender === "staff" ? "bg-foreground text-background rounded-br-sm" : "bg-muted rounded-bl-sm")
                        }
                      >
                        {m.body}
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-1 px-1">{formatWhen(m.created_date)}</span>
                    </div>
                  ))
                )}
              </div>

              {error && <p className="px-4 py-2 text-sm text-destructive border-t border-border">{error}</p>}
              {thread?.status === "closed" ? (
                <p className="p-3 border-t border-border text-sm text-muted-foreground text-center">This chat is closed. Reopen it to reply.</p>
              ) : (
                <div className="flex items-end gap-2 p-3 border-t border-border">
                  <label htmlFor="chat-reply" className="sr-only">
                    Reply
                  </label>
                  <textarea
                    id="chat-reply"
                    rows={2}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="Type a reply… (Enter to send, Shift+Enter for a new line)"
                    className={FIELD + " resize-none"}
                  />
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={sending || !draft.trim()}
                    aria-label="Send reply"
                    className="shrink-0 w-11 h-11 rounded-full bg-accent text-accent-foreground flex items-center justify-center disabled:opacity-50"
                  >
                    {sending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
