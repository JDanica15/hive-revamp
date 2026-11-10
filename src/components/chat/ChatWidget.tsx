"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { CircleAlert, LoaderCircle, MessageCircle, Send, X } from "@/components/icons";
import { CONTACT } from "@/lib/site";
import { CHAT_LIMITS, cleanChatStart, validateChatStart, type FieldErrors, type ChatStartFields } from "@/lib/validate";
import { DURATION, EASE } from "@/lib/motion";

type Message = { id: string; sender: "visitor" | "staff"; body: string; created_date: string };
type Session = { id: string; token: string; started: number };
type Status = { enabled: boolean; online: boolean; gate?: string; realtime?: { url: string; key: string } | null };

const STORAGE_KEY = "hive-chat-v1";
// A visitor's chat is forgotten 24 hours after it started, so they begin afresh (the server enforces
// the same limit on the token; staff still keep the conversation).
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const isFresh = (s: Session) => typeof s.started === "number" && Date.now() - s.started < SESSION_TTL_MS;
const POLL_MS = 20_000; // safety net in case a live push is missed
const FIELD =
  "w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors";

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

function loadSession(): Session | null {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    const session: Session | null = raw && typeof raw.id === "string" && typeof raw.token === "string" ? raw : null;
    if (session && !isFresh(session)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}
function saveSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode): the chat still works until the page is reloaded.
  }
}

const mergeMessages = (current: Message[], incoming: Message[]) => {
  const byId = new Map(current.map((m) => [m.id, m]));
  incoming.forEach((m) => byId.set(m.id, m));
  return [...byId.values()].sort((a, b) => a.created_date.localeCompare(b.created_date));
};

function EmailFallback({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "text-xs" : "text-sm"}>
      <p className={compact ? "" : "mb-4 text-muted-foreground leading-relaxed"}>
        {compact ? "Our team is offline right now. " : "Our team isn't online at the moment, so we can't chat live. Send us an email and we'll reply within one business day."}
        {compact && (
          <a href={`mailto:${CONTACT.email}`} className="underline font-medium">
            Email {CONTACT.email}
          </a>
        )}
      </p>
      {!compact && (
        <a
          href={`mailto:${CONTACT.email}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
        >
          Email {CONTACT.email}
        </a>
      )}
    </div>
  );
}

export function ChatWidget() {
  const reduce = useReducedMotion() ?? false;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [closed, setClosed] = useState(false);
  const [unread, setUnread] = useState(0);

  const [form, setForm] = useState<ChatStartFields>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors<keyof ChatStartFields>>({});
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const openRef = useRef(open);
  const restoring = useRef(true); // replies already waiting from an earlier visit don't count as "new"
  const statusRef = useRef<{ at: number; value: Status } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  openRef.current = open;

  // Staff replies add to the unread badge while the window is closed.
  const addMessages = useCallback((incoming: Message[]) => {
    setMessages((prev) => {
      const known = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id) && m.sender === "staff");
      if (fresh.length && !openRef.current && !restoring.current) setUnread((n) => n + fresh.length);
      return mergeMessages(prev, incoming);
    });
  }, []);

  const loadStatus = useCallback(async (force = false): Promise<Status> => {
    const cached = statusRef.current;
    if (!force && cached && Date.now() - cached.at < 30_000) return cached.value;
    try {
      const res = await fetch("/api/chat/status", { cache: "no-store" });
      const value: Status = res.ok ? await res.json() : { enabled: false, online: false };
      statusRef.current = { at: Date.now(), value };
      return value;
    } catch {
      return { enabled: false, online: false };
    }
  }, []);

  const loadHistory = useCallback(
    async (current: Session) => {
      try {
        const res = await fetch("/api/chat/history", { headers: { "x-chat-token": current.token }, cache: "no-store" });
        if (res.status === 401) {
          saveSession(null);
          setSession(null);
          setMessages([]);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        addMessages(data.messages ?? []);
        setClosed(data.status === "closed");
        setStatus((s) => (s ? { ...s, online: Boolean(data.online) } : s));
      } catch {
        // Offline or a blip: try again on the next poll.
      }
    },
    [addMessages],
  );

  // Restore a conversation from an earlier visit.
  useEffect(() => {
    const saved = loadSession();
    if (!saved) return;
    setSession(saved);
    loadStatus().then(setStatus);
    loadHistory(saved).finally(() => {
      restoring.current = false;
    });
  }, [loadHistory, loadStatus]);

  // Live updates over Supabase Realtime Broadcast: replies on a channel named after the
  // conversation's random id, and staff coming online/offline on a shared presence channel.
  const realtime = status?.realtime;
  const sessionId = session?.id;
  useEffect(() => {
    if (!realtime || (!open && !session)) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    import("@supabase/supabase-js").then(({ createClient }) => {
      if (cancelled) return;
      const client = createClient(realtime.url, realtime.key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      if (open) {
        client
          .channel("chat-presence")
          .on("broadcast", { event: "presence" }, ({ payload }) =>
            setStatus((s) => (s ? { ...s, online: Boolean(payload?.online) } : s)),
          )
          .subscribe();
      }
      if (session) {
        client
          .channel(`chat:${session.id}`)
          .on("broadcast", { event: "message" }, ({ payload }) => addMessages([payload as Message]))
          // Catch up on anything sent while we were connecting or disconnected.
          .subscribe((state) => state === "SUBSCRIBED" && loadHistory(session));
      }
      cleanup = () => void client.removeAllChannels();
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the session id, not the object
  }, [open, sessionId, realtime, addMessages, loadHistory]);

  // Backup for the push above (it can't announce staff timing out): re-check availability while open.
  useEffect(() => {
    if (!open) return;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      const fresh = await loadStatus(true);
      // Keep the original gate token: replacing it would reset its age and block starting a chat.
      setStatus((s) => (s ? { ...s, enabled: fresh.enabled, online: fresh.online } : fresh));
    };
    const timer = window.setInterval(check, 10_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [open, loadStatus]);

  // Safety net while the window is open: refresh when the tab regains focus and every so often.
  useEffect(() => {
    if (!open || !session) return;
    const refresh = () => document.visibilityState === "visible" && loadHistory(session);
    const timer = window.setInterval(refresh, POLL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [open, session, loadHistory]);

  // A chat left open past its 24 hours starts afresh too.
  useEffect(() => {
    if (!session) return;
    const left = session.started + SESSION_TTL_MS - Date.now();
    const timer = window.setTimeout(() => {
      saveSession(null);
      setSession(null);
      setMessages([]);
      setClosed(false);
    }, Math.max(left, 0));
    return () => window.clearTimeout(timer);
  }, [session]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, open, reduce]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open, messages]);

  const openChat = async () => {
    setOpen(true);
    setLoading(!statusRef.current);
    const value = await loadStatus(true);
    setStatus(value);
    setLoading(false);
    if (session) loadHistory(session);
  };

  const closeChat = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("input, textarea, a, button")?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && closeChat();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeChat, status?.enabled, session]);

  const endSession = () => {
    saveSession(null);
    setSession(null);
    setMessages([]);
    setClosed(false);
    setError("");
  };

  const handleApiError = async (res: Response) => {
    const data = await res.json().catch(() => ({}));
    if (data.code === "expired") {
      endSession();
      setError("Your earlier chat expired. Please start a new one.");
    } else if (data.code === "closed") setClosed(true);
    else if (data.code === "offline") {
      const value = await loadStatus(true);
      setStatus(value);
    } else if (data.code === "gate") {
      setStatus(await loadStatus(true));
      setError("Please try again in a moment.");
    } else {
      if (data.errors && typeof data.errors === "object") setErrors(data.errors);
      setError(res.status === 429 ? data.error : data.error || "Something went wrong. Please try again or email us.");
    }
  };

  const startChat = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const values = cleanChatStart(form);
    const found = validateChatStart(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    const honeypot = (e.currentTarget.elements.namedItem("company_website") as HTMLInputElement).value;

    setSending(true);
    try {
      const res = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, page: pathname, gate: status?.gate, company_website: honeypot }),
      });
      if (!res.ok) return await handleApiError(res);
      const data = await res.json();
      if (!data.token) return;
      const next: Session = { id: data.conversationId, token: data.token, started: Date.now() };
      restoring.current = false;
      saveSession(next);
      setSession(next);
      setMessages(data.message ? [data.message] : []);
      setForm({ name: "", email: "", message: "" });
    } catch {
      setError("We couldn't reach the server. Please check your connection or email us.");
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!session || !text || sending) return;
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: session.token, body: text }),
      });
      if (!res.ok) return await handleApiError(res);
      const data = await res.json();
      addMessages([data.message]);
      setDraft("");
      setStatus((s) => (s ? { ...s, online: Boolean(data.online) } : s));
    } catch {
      setError("We couldn't send that. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const onComposerKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const online = Boolean(status?.enabled && status.online);
  const field = (key: keyof ChatStartFields) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="Chat with Hive BPO"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: DURATION.micro + 0.1, ease: EASE.out }}
            className="fixed z-[45] right-3 bottom-[4.75rem] sm:right-5 sm:bottom-24 w-[calc(100vw-1.5rem)] sm:w-[380px] h-[min(560px,calc(100dvh-7rem))] flex flex-col bg-card text-card-foreground border border-border rounded-md shadow-2xl overflow-hidden origin-bottom-right"
          >
            <header className="flex items-center gap-3 px-4 py-3 bg-foreground text-background">
              <div className="min-w-0 flex-1">
                <p className="font-heading text-lg leading-tight">Chat with Hive</p>
                <p className="flex items-center gap-1.5 text-xs text-background/70">
                  <span className={"w-2 h-2 rounded-full " + (online ? "bg-emerald-400" : "bg-zinc-400")} aria-hidden />
                  {loading ? "Checking…" : online ? "Our team is online" : "Offline"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeChat}
                aria-label="Close chat"
                className="p-1.5 -mr-1 rounded-full hover:bg-background/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-background"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground" role="status">
                <LoaderCircle className="w-5 h-5 animate-spin" />
                <span className="sr-only">Loading chat</span>
              </div>
            ) : !session ? (
              !online ? (
                <div className="flex-1 p-5 overflow-y-auto">
                  <p className="font-heading text-xl mb-2">We&rsquo;ll get back to you</p>
                  <EmailFallback />
                  {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
                </div>
              ) : (
                <form onSubmit={startChat} noValidate className="flex-1 p-5 overflow-y-auto space-y-3" aria-label="Start a chat">
                  <p className="text-sm text-muted-foreground">Hi! Tell us a little about you and what you need, and we&rsquo;ll reply here.</p>
                  <div>
                    <label htmlFor="chat-name" className="sr-only">Your name</label>
                    <input
                      id="chat-name"
                      value={form.name}
                      onChange={field("name")}
                      maxLength={CHAT_LIMITS.name}
                      autoComplete="name"
                      placeholder="Your name *"
                      aria-invalid={errors.name ? true : undefined}
                      className={FIELD}
                    />
                    {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="chat-email" className="sr-only">Email (optional)</label>
                    <input
                      id="chat-email"
                      type="email"
                      inputMode="email"
                      value={form.email}
                      onChange={field("email")}
                      maxLength={CHAT_LIMITS.email}
                      autoComplete="email"
                      placeholder="Email (optional, in case we get disconnected)"
                      aria-invalid={errors.email ? true : undefined}
                      className={FIELD}
                    />
                    {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="chat-first-message" className="sr-only">Your message</label>
                    <textarea
                      id="chat-first-message"
                      rows={4}
                      value={form.message}
                      onChange={field("message")}
                      maxLength={CHAT_LIMITS.messageMax}
                      placeholder="How can we help? *"
                      aria-invalid={errors.message ? true : undefined}
                      className={FIELD + " resize-none"}
                    />
                    {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
                  </div>
                  {/* Honeypot for bots: hidden from people and assistive tech. */}
                  <input type="text" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                  {error && (
                    <p className="flex items-start gap-1.5 text-destructive text-sm" role="alert">
                      <CircleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-60"
                  >
                    {sending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : null}
                    Start chat
                  </button>
                </form>
              )
            ) : (
              <>
                <div
                  ref={listRef}
                  role="log"
                  aria-live="polite"
                  aria-label="Conversation"
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background/60"
                >
                  {messages.map((m) => (
                    <div key={m.id} className={"flex flex-col " + (m.sender === "visitor" ? "items-end" : "items-start")}>
                      <div
                        className={
                          "max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words " +
                          (m.sender === "visitor"
                            ? "bg-foreground text-background rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm")
                        }
                      >
                        {m.body}
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-1 px-1">
                        {m.sender === "staff" ? "Hive team · " : ""}
                        {timeFormat.format(new Date(m.created_date))}
                      </span>
                    </div>
                  ))}
                </div>

                {!online && !closed && (
                  <div className="px-4 py-2 bg-accent/10 text-foreground border-t border-border">
                    <EmailFallback compact />
                  </div>
                )}
                {error && (
                  <p className="px-4 py-2 text-sm text-destructive border-t border-border" role="alert">
                    {error}
                  </p>
                )}
                {closed ? (
                  <div className="p-4 border-t border-border text-center text-sm">
                    <p className="text-muted-foreground mb-3">This chat has ended.</p>
                    <button type="button" onClick={endSession} className="px-5 py-2 rounded-full border border-border hover:bg-muted transition-colors">
                      Start a new chat
                    </button>
                  </div>
                ) : (
                  <div className="flex items-end gap-2 p-3 border-t border-border">
                    <label htmlFor="chat-draft" className="sr-only">Type your message</label>
                    <textarea
                      id="chat-draft"
                      rows={1}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={onComposerKey}
                      maxLength={CHAT_LIMITS.messageMax}
                      placeholder="Type a message…"
                      className={FIELD + " resize-none max-h-28"}
                    />
                    <button
                      type="button"
                      onClick={() => void sendMessage()}
                      disabled={sending || !draft.trim()}
                      aria-label="Send message"
                      className="shrink-0 w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {sending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? closeChat() : void openChat())}
        aria-label={open ? "Close chat" : unread ? `Open chat, ${unread} new ${unread === 1 ? "message" : "messages"}` : "Open chat"}
        aria-expanded={open}
        className="fixed z-[45] right-3 bottom-3 sm:right-5 sm:bottom-5 w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[11px] font-semibold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
