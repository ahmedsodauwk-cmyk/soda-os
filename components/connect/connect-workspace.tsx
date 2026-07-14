"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  Info,
  Loader2,
  MessageCircle,
  Mic,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Star,
  Video,
  X,
} from "lucide-react";

import { CL } from "@/components/connect/connect-labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  bootstrapConnectAction,
  deleteConnectMessageAction,
  editConnectMessageAction,
  loadMessagesAction,
  loadSharedMediaAction,
  markConnectReadAction,
  openDmAction,
  pinConnectMessageAction,
  reactConnectMessageAction,
  sendConnectMessageAction,
  setConnectPresenceAction,
  starConnectMessageAction,
} from "@/lib/connect/actions";
import { uploadConnectFiles } from "@/lib/connect/upload-client";
import {
  CONNECT_REACTION_EMOJIS,
  type ConnectConversation,
  type ConnectMessage,
  type ConnectPeer,
  type ConnectPresence,
  type ConnectReactionEmoji,
  type ConnectSharedMedia,
} from "@/lib/connect/types";

const LAST_CHAT_KEY = "soda-team-chat:lastConversationId";

type Props = {
  userId: string;
  displayName: string;
};

type ListRow =
  | { key: string; kind: "team"; conversation: ConnectConversation }
  | { key: string; kind: "private"; conversation: ConnectConversation; peer: ConnectPeer }
  | { key: string; kind: "peer"; peer: ConnectPeer };

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function formatLastSeen(iso: string | null | undefined): string {
  if (!iso) return CL.offline;
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return CL.offline;
  }
}

function statusLabel(p?: ConnectPresence | null): string {
  if (!p) return CL.offline;
  if (p.activity === "typing") return CL.typing;
  if (p.activity === "recording") return CL.recording;
  if (p.activity === "uploading") return CL.uploading;
  if (p.status === "online") return CL.activeNow;
  if (p.status === "away") return CL.away;
  if (p.status === "busy") return CL.busy;
  return `${CL.lastSeen}: ${formatLastSeen(p.lastSeenAt)}`;
}

/** Sidebar online/offline chip (Messenger-simple). */
function onlineLabel(p?: ConnectPresence | null): string {
  if (!p) return CL.offline;
  if (p.status === "online" || p.activity) return CL.onlineStatus;
  return CL.offline;
}

function isOnline(p?: ConnectPresence | null): boolean {
  if (!p) return false;
  return p.status === "online" || !!p.activity;
}

function ReceiptIcon({ status }: { status: ConnectMessage["receipt"] }) {
  if (status === "read") {
    return <CheckCheck className="size-3.5 text-sky-400" aria-label="read" />;
  }
  if (status === "delivered") {
    return <CheckCheck className="size-3.5 text-muted-foreground" aria-label="delivered" />;
  }
  return <Check className="size-3.5 text-muted-foreground" aria-label="sent" />;
}

export function ConnectWorkspace({ userId, displayName }: Props) {
  const [booting, setBooting] = useState(true);
  const [conversations, setConversations] = useState<ConnectConversation[]>([]);
  const [peers, setPeers] = useState<ConnectPeer[]>([]);
  const [presence, setPresence] = useState<ConnectPresence[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConnectMessage[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ConnectMessage | null>(null);
  const [editing, setEditing] = useState<ConnectMessage | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [mobilePane, setMobilePane] = useState<"list" | "chat">("list");
  const [query, setQuery] = useState("");
  const [chatQuery, setChatQuery] = useState("");
  const [openingPeerId, setOpeningPeerId] = useState<string | null>(null);
  const [media, setMedia] = useState<ConnectSharedMedia | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [menuMsg, setMenuMsg] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listTopRef = useRef<HTMLDivElement>(null);

  const presenceMap = useMemo(
    () => new Map(presence.map((p) => [p.userId, p])),
    [presence]
  );

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const activePeer = active?.kind === "private" ? active.peers[0] : null;
  const typingNames = useMemo(() => {
    if (!activeId) return [];
    return presence
      .filter(
        (p) =>
          p.userId !== userId &&
          p.activity === "typing" &&
          p.activityConversationId === activeId
      )
      .map((p) => {
        const peer = peers.find((x) => x.id === p.userId);
        return peer?.fullName ?? "Someone";
      });
  }, [presence, activeId, userId, peers]);

  const refreshConvos = useCallback(async () => {
    const r = await bootstrapConnectAction();
    if (r.ok) {
      if (r.conversations) setConversations(r.conversations);
      if (r.peers) setPeers(r.peers);
      if (r.presence) setPresence(r.presence);
    }
    return r;
  }, []);

  const persistActive = useCallback((conversationId: string) => {
    try {
      localStorage.setItem(LAST_CHAT_KEY, conversationId);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const selectConversation = useCallback(
    (conversationId: string) => {
      setActiveId((prev) => {
        if (prev !== conversationId) {
          setMessages([]);
          setMedia(null);
          setHasMore(true);
          setChatQuery("");
          setReplyTo(null);
          setEditing(null);
        }
        return conversationId;
      });
      setMobilePane("chat");
      setShowInfo(false);
      persistActive(conversationId);
    },
    [persistActive]
  );

  const openPeerDm = useCallback(
    async (peerId: string) => {
      setOpeningPeerId(peerId);
      setError(null);
      try {
        const r = await openDmAction({ peerId });
        if (r.conversations) setConversations(r.conversations);
        if (r.peers) setPeers(r.peers);
        if (r.presence) setPresence(r.presence);
        if (!r.ok || !r.conversationId) {
          setError(r.error ?? "المحادثة مش جاهزة");
          return;
        }
        selectConversation(r.conversationId);
      } finally {
        setOpeningPeerId(null);
      }
    },
    [selectConversation]
  );

  const loadThread = useCallback(
    async (conversationId: string, reset = true) => {
      const r = await loadMessagesAction({ conversationId, limit: 40 });
      if (!r.ok || !r.messages) return;
      setMessages(r.messages);
      setHasMore(r.messages.length >= 40);
      await markConnectReadAction({ conversationId });
      const m = await loadSharedMediaAction({ conversationId });
      if (m.ok && m.media) setMedia(m.media);
      if (reset) {
        requestAnimationFrame(() =>
          bottomRef.current?.scrollIntoView({ behavior: "smooth" })
        );
      }
      void refreshConvos();
    },
    [refreshConvos]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await bootstrapConnectAction();
      if (cancelled) return;
      if (!r.ok) {
        setError(r.error ?? "فشل التحميل");
        setBooting(false);
        return;
      }
      const convos = r.conversations ?? [];
      setConversations(convos);
      setPeers(r.peers ?? []);
      setPresence(r.presence ?? []);

      let restored: string | null = null;
      try {
        restored = localStorage.getItem(LAST_CHAT_KEY);
      } catch {
        restored = null;
      }
      const restoredOk =
        restored && convos.some((c) => c.id === restored) ? restored : null;
      const team = convos.find((c) => c.kind === "team");
      const nextId = restoredOk ?? team?.id ?? convos[0]?.id ?? null;
      if (nextId) {
        setActiveId(nextId);
        persistActive(nextId);
      }
      setBooting(false);
      await setConnectPresenceAction({ status: "online", activity: null });
    })();

    const onVis = () => {
      void setConnectPresenceAction({
        status: document.visibilityState === "visible" ? "online" : "away",
      });
    };
    document.addEventListener("visibilitychange", onVis);
    const heartbeat = setInterval(() => {
      void setConnectPresenceAction({ status: "online" });
    }, 45_000);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(heartbeat);
      void setConnectPresenceAction({ status: "offline", activity: null });
    };
  }, [persistActive]);

  useEffect(() => {
    if (!activeId) return;
    void loadThread(activeId, true);
  }, [activeId, loadThread]);

  // Realtime — messages + memberships so new accounts appear without reload
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("soda-team-chat")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connect_messages" },
        (payload) => {
          const row = payload.new as { conversation_id?: string } | null;
          if (row?.conversation_id === activeId) {
            void loadThread(activeId, false);
          }
          void refreshConvos();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connect_presence" },
        () => {
          void bootstrapConnectAction().then((r) => {
            if (r.presence) setPresence(r.presence);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connect_message_receipts" },
        () => {
          if (activeId) void loadThread(activeId, false);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connect_message_reactions" },
        () => {
          if (activeId) void loadThread(activeId, false);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connect_conversations" },
        () => {
          void refreshConvos();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connect_conversation_members" },
        () => {
          void refreshConvos();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          void refreshConvos();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeId, loadThread, refreshConvos]);

  async function loadOlder() {
    if (!activeId || !messages.length || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    const before = messages[0]?.createdAt;
    const r = await loadMessagesAction({
      conversationId: activeId,
      before,
      limit: 40,
    });
    if (r.ok && r.messages) {
      setMessages((prev) => [...r.messages!, ...prev]);
      setHasMore(r.messages.length >= 40);
    }
    setLoadingOlder(false);
  }

  function bumpTyping() {
    if (!activeId) return;
    void setConnectPresenceAction({
      status: "online",
      activity: "typing",
      activityConversationId: activeId,
    });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      void setConnectPresenceAction({ activity: null, activityConversationId: null });
    }, 2000);
  }

  async function handleSend(files?: File[]) {
    if (!activeId) return;
    setError(null);

    if (editing) {
      const r = await editConnectMessageAction({
        messageId: editing.id,
        body: draft,
      });
      if (!r.ok) setError(r.error ?? "فشل التعديل");
      setEditing(null);
      setDraft("");
      void loadThread(activeId, false);
      return;
    }

    let attachments:
      | {
          storagePath: string;
          fileName: string;
          mimeType: string;
          sizeBytes: number;
          kind?: ConnectMessage["attachments"][number]["kind"];
          durationMs?: number | null;
        }[]
      | undefined;

    if (files?.length) {
      setUploadPct(0);
      void setConnectPresenceAction({
        activity: "uploading",
        activityConversationId: activeId,
      });
      const up = await uploadConnectFiles(userId, files, {
        onProgress: setUploadPct,
      });
      void setConnectPresenceAction({ activity: null, activityConversationId: null });
      setUploadPct(null);
      if (!up.ok) {
        setError(up.error);
        return;
      }
      attachments = up.files;
    }

    if (voiceBlob) {
      setUploadPct(0);
      const file = new File([voiceBlob], `voice-${Date.now()}.webm`, {
        type: voiceBlob.type || "audio/webm",
      });
      const up = await uploadConnectFiles(userId, [file], {
        forceVoice: true,
        onProgress: setUploadPct,
      });
      setUploadPct(null);
      if (!up.ok) {
        setError(up.error);
        return;
      }
      attachments = up.files.map((f) => ({ ...f, kind: "voice" as const }));
      setVoiceBlob(null);
    }

    const clientId = crypto.randomUUID();
    const optimistic: ConnectMessage = {
      id: `optimistic-${clientId}`,
      conversationId: activeId,
      senderId: userId,
      body: draft.trim(),
      messageType: attachments?.some((a) => a.kind === "voice")
        ? "voice"
        : attachments?.length
          ? "attachment"
          : "text",
      replyToId: replyTo?.id ?? null,
      forwardedFromId: null,
      isPinned: false,
      editedAt: null,
      deletedAt: null,
      deletedForEveryone: false,
      clientId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: [],
      reactions: [],
      receipt: "sent",
      starred: false,
      pending: true,
      replyPreview: replyTo
        ? {
            id: replyTo.id,
            body: replyTo.body,
            senderName: replyTo.sender?.fullName ?? CL.you,
          }
        : null,
    };

    if (!draft.trim() && !attachments?.length) return;

    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    const replySnapshot = replyTo;
    setReplyTo(null);
    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    );

    const r = await sendConnectMessageAction({
      conversationId: activeId,
      body: optimistic.body,
      messageType: optimistic.messageType,
      replyToId: replySnapshot?.id,
      clientId,
      attachments,
    });

    void setConnectPresenceAction({ activity: null, activityConversationId: null });

    if (!r.ok || !r.message) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id ? { ...m, pending: false, failed: true } : m
        )
      );
      setError(r.error ?? "فشل الإرسال");
      return;
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === optimistic.id ? { ...r.message!, pending: false } : m))
    );
    void refreshConvos();
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        setVoiceBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        void setConnectPresenceAction({
          activity: null,
          activityConversationId: null,
        });
      };
      mediaRecorderRef.current = rec;
      rec.start();
      setRecording(true);
      void setConnectPresenceAction({
        activity: "recording",
        activityConversationId: activeId,
      });
    } catch {
      setError("الميكروفون مش متاح");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function onPaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.files;
    if (items?.length) {
      e.preventDefault();
      await handleSend(Array.from(items));
    }
  }

  const listRows = useMemo((): ListRow[] => {
    const team = conversations.find((c) => c.kind === "team");
    const dmByPeer = new Map<string, ConnectConversation>();
    for (const c of conversations) {
      if (c.kind !== "private") continue;
      const peer = c.peers[0];
      if (peer) dmByPeer.set(peer.id, c);
    }

    const rows: ListRow[] = [];
    if (team) {
      rows.push({ key: `team:${team.id}`, kind: "team", conversation: team });
    }

    const sortedPeers = [...peers].sort((a, b) =>
      a.fullName.localeCompare(b.fullName, "ar")
    );
    for (const peer of sortedPeers) {
      const conversation = dmByPeer.get(peer.id);
      if (conversation) {
        rows.push({
          key: `dm:${conversation.id}`,
          kind: "private",
          conversation,
          peer,
        });
      } else {
        rows.push({ key: `peer:${peer.id}`, kind: "peer", peer });
      }
    }

    // Orphan private memberships (peer missing from active list) still show
    for (const c of conversations) {
      if (c.kind !== "private") continue;
      const peerId = c.peers[0]?.id;
      if (peerId && sortedPeers.some((p) => p.id === peerId)) continue;
      rows.push({
        key: `dm:${c.id}`,
        kind: "private",
        conversation: c,
        peer: c.peers[0] ?? {
          id: c.id,
          fullName: c.displayName,
          username: null,
          email: null,
          accessLevel: null,
          personId: null,
          initials: "?",
          isActive: true,
        },
      });
    }

    return rows;
  }, [conversations, peers]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listRows;
    return listRows.filter((row) => {
      if (row.kind === "team") {
        return (
          row.conversation.displayName.toLowerCase().includes(q) ||
          CL.teamRoom.toLowerCase().includes(q)
        );
      }
      const name =
        row.kind === "private"
          ? row.conversation.displayName
          : row.peer.fullName;
      const username = row.kind === "peer" ? row.peer.username : row.peer.username;
      return (
        name.toLowerCase().includes(q) ||
        (username?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [listRows, query]);

  if (booting) {
    return (
      <div className="flex h-[min(78vh,820px)] items-center justify-center rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_top,_rgba(41,25,74,0.55),_#0c0a12_65%)]">
        <Loader2 className="size-8 animate-spin text-[#D23B68]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-[min(78vh,820px)] overflow-hidden rounded-2xl border border-white/10",
        "bg-[radial-gradient(ellipse_at_20%_0%,_rgba(41,25,74,0.7),_transparent_50%),radial-gradient(ellipse_at_80%_100%,_rgba(210,59,104,0.12),_transparent_45%),#0c0a12]",
        "text-foreground shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) {
          await handleSend(Array.from(e.dataTransfer.files));
        }
      }}
    >
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/50 text-lg font-medium text-white backdrop-blur-sm">
          {CL.dropFiles}
        </div>
      )}

      {/* Left — permanent Messenger-like list (independent scroll) */}
      <aside
        className={cn(
          "flex h-full w-full shrink-0 flex-col border-white/10 md:w-[300px] md:border-e lg:w-[320px]",
          mobilePane === "chat" ? "hidden md:flex" : "flex"
        )}
      >
        <div className="shrink-0 space-y-3 border-b border-white/10 p-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="size-5 text-[#D23B68]" />
            <div>
              <h1 className="text-base font-semibold tracking-tight">{CL.title}</h1>
              <p className="text-[11px] text-muted-foreground">{displayName}</p>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={CL.search}
              className="h-9 border-white/10 bg-black/30 pe-3 ps-8 text-sm"
            />
            {query.trim() ? (
              <button
                type="button"
                className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setQuery("")}
                aria-label="clear"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {filteredRows.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              {query.trim() ? CL.noResults : CL.emptyInbox}
            </p>
          ) : (
            filteredRows.map((row) => {
              if (row.kind === "team") {
                return (
                  <ConvoRow
                    key={row.key}
                    c={row.conversation}
                    active={row.conversation.id === activeId}
                    presenceLabel={CL.everyone}
                    online={false}
                    showOnlineDot={false}
                    pinned
                    onClick={() => selectConversation(row.conversation.id)}
                  />
                );
              }
              if (row.kind === "private") {
                const p = presenceMap.get(row.peer.id);
                return (
                  <ConvoRow
                    key={row.key}
                    c={row.conversation}
                    active={row.conversation.id === activeId}
                    presenceLabel={onlineLabel(p)}
                    online={isOnline(p)}
                    showOnlineDot
                    onClick={() => {
                      // Prefer direct open; heal via openDm if id somehow stale.
                      if (row.conversation.id) {
                        selectConversation(row.conversation.id);
                      } else {
                        void openPeerDm(row.peer.id);
                      }
                    }}
                  />
                );
              }
              return (
                <PeerRow
                  key={row.key}
                  peer={row.peer}
                  presenceLabel={onlineLabel(presenceMap.get(row.peer.id))}
                  online={isOnline(presenceMap.get(row.peer.id))}
                  busy={openingPeerId === row.peer.id}
                  onClick={() => void openPeerDm(row.peer.id)}
                />
              );
            })
          )}
        </div>
      </aside>

      {/* Center */}
      <main
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          mobilePane === "list" ? "hidden md:flex" : "flex"
        )}
      >
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            {activeId ? (
              <Loader2 className="size-8 animate-spin text-[#D23B68]" />
            ) : (
              <>
                <MessageCircle className="size-10 opacity-40" />
                <p>{CL.emptyInbox}</p>
              </>
            )}
          </div>
        ) : (
          <>
            <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobilePane("list")}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{active.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {typingNames.length
                    ? `${typingNames.join("، ")} ${CL.typing}`
                    : active.kind === "team"
                      ? CL.teamRoom
                      : statusLabel(presenceMap.get(activePeer?.id ?? ""))}
                </p>
              </div>
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute start-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  placeholder={CL.searchInChat}
                  className="h-8 w-40 border-white/10 bg-black/20 ps-7 text-xs lg:w-52"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title={CL.callsStub}
                disabled
              >
                <Phone className="size-4 opacity-40" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title={CL.callsStub}
                disabled
              >
                <Video className="size-4 opacity-40" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowInfo((v) => !v)}
              >
                <Info className="size-4" />
              </Button>
            </header>

            {active.pinnedMessageId && (
              <div className="border-b border-[#D23B68]/30 bg-[#D23B68]/10 px-3 py-1.5 text-xs">
                {CL.pinnedBanner}
              </div>
            )}

            <div className="relative flex-1 overflow-y-auto px-3 py-3">
              <div ref={listTopRef} className="mb-2 flex justify-center">
                {hasMore && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    disabled={loadingOlder}
                    onClick={() => void loadOlder()}
                  >
                    {loadingOlder ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      CL.loadOlder
                    )}
                  </Button>
                )}
              </div>

              {messages.length === 0 && (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  {CL.emptyThread}
                </p>
              )}

              <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
                {messages
                  .filter((m) =>
                    chatQuery.trim()
                      ? m.body.toLowerCase().includes(chatQuery.toLowerCase())
                      : true
                  )
                  .map((m) => {
                    const mine = m.senderId === userId;
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "group relative flex max-w-[92%] flex-col rounded-2xl px-3 py-2 text-sm shadow-sm",
                          mine
                            ? "ms-auto rounded-ee-md bg-gradient-to-br from-[#29194A] to-[#3d2468] text-white"
                            : "me-auto rounded-es-md bg-white/5 text-foreground ring-1 ring-white/10",
                          m.pending && "opacity-70",
                          m.failed && "ring-1 ring-red-400/60"
                        )}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setMenuMsg(m.id);
                        }}
                      >
                        {!mine && active.kind === "team" && (
                          <p className="mb-0.5 text-[11px] font-medium text-[#D23B68]">
                            {m.sender?.fullName}
                          </p>
                        )}
                        {m.replyPreview && (
                          <div className="mb-1 rounded-md border-s-2 border-[#D23B68] bg-black/20 px-2 py-1 text-[11px] opacity-90">
                            <p className="font-medium">{m.replyPreview.senderName}</p>
                            <p className="line-clamp-2">{m.replyPreview.body}</p>
                          </div>
                        )}
                        {m.deletedForEveryone ? (
                          <p className="italic text-muted-foreground">{CL.deleted}</p>
                        ) : (
                          <>
                            {m.attachments.map((a) => (
                              <AttachmentView
                                key={a.id}
                                a={a}
                                playbackRate={playbackRate}
                                onCycleSpeed={() =>
                                  setPlaybackRate((r) =>
                                    r === 1 ? 1.5 : r === 1.5 ? 2 : 1
                                  )
                                }
                              />
                            ))}
                            {m.body && (
                              <p className="whitespace-pre-wrap break-words leading-relaxed">
                                {m.body}
                              </p>
                            )}
                          </>
                        )}
                        {m.reactions.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Object.entries(
                              m.reactions.reduce<Record<string, number>>((acc, r) => {
                                acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
                                return acc;
                              }, {})
                            ).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                type="button"
                                className="rounded-full bg-black/25 px-1.5 text-xs"
                                onClick={() =>
                                  void reactConnectMessageAction({
                                    messageId: m.id,
                                    emoji: emoji as ConnectReactionEmoji,
                                  }).then(() => loadThread(active.id, false))
                                }
                              >
                                {emoji} {count}
                              </button>
                            ))}
                          </div>
                        )}
                        <div
                          className={cn(
                            "mt-1 flex items-center gap-1 text-[10px]",
                            mine ? "justify-end text-white/70" : "text-muted-foreground"
                          )}
                        >
                          {m.starred && <Star className="size-2.5 fill-current" />}
                          {m.editedAt && <span>{CL.edited}</span>}
                          <span>{formatTime(m.createdAt)}</span>
                          {mine && <ReceiptIcon status={m.receipt} />}
                        </div>

                        {menuMsg === m.id && (
                          <MsgMenu
                            mine={mine}
                            onClose={() => setMenuMsg(null)}
                            onReply={() => {
                              setReplyTo(m);
                              setMenuMsg(null);
                            }}
                            onCopy={() => {
                              void navigator.clipboard.writeText(m.body);
                              setMenuMsg(null);
                            }}
                            onEdit={() => {
                              setEditing(m);
                              setDraft(m.body);
                              setMenuMsg(null);
                            }}
                            onStar={() => {
                              void starConnectMessageAction({ messageId: m.id }).then(
                                () => loadThread(active.id, false)
                              );
                              setMenuMsg(null);
                            }}
                            onPin={() => {
                              void pinConnectMessageAction({
                                conversationId: active.id,
                                messageId: m.isPinned ? null : m.id,
                              }).then(() => loadThread(active.id, false));
                              setMenuMsg(null);
                            }}
                            onDeleteMe={() => {
                              void deleteConnectMessageAction({
                                messageId: m.id,
                                scope: "me",
                              }).then(() => loadThread(active.id, false));
                              setMenuMsg(null);
                            }}
                            onDeleteEveryone={() => {
                              void deleteConnectMessageAction({
                                messageId: m.id,
                                scope: "everyone",
                              }).then(() => loadThread(active.id, false));
                              setMenuMsg(null);
                            }}
                            onReact={(emoji) => {
                              void reactConnectMessageAction({
                                messageId: m.id,
                                emoji,
                              }).then(() => loadThread(active.id, false));
                              setMenuMsg(null);
                            }}
                            onForward={() => {
                              const body = m.body;
                              setDraft(body ? `↩ ${body}` : "");
                              setMenuMsg(null);
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                <div ref={bottomRef} />
              </div>
            </div>

            {(replyTo || editing) && (
              <div className="flex items-center gap-2 border-t border-white/10 bg-black/30 px-3 py-1.5 text-xs">
                <span className="text-[#D23B68]">
                  {editing ? CL.edit : CL.reply}
                </span>
                <span className="line-clamp-1 flex-1 opacity-80">
                  {editing?.body ?? replyTo?.body}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(null);
                    setEditing(null);
                  }}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {voiceBlob && (
              <div className="flex items-center gap-2 border-t border-white/10 bg-black/40 px-3 py-2 text-xs">
                <Mic className="size-3.5 text-[#D23B68]" />
                <span>تسجيل جاهز</span>
                <audio
                  controls
                  src={URL.createObjectURL(voiceBlob)}
                  className="h-8 flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setVoiceBlob(null)}
                >
                  {CL.discardVoice}
                </Button>
              </div>
            )}

            {uploadPct !== null && (
              <div className="px-3 py-1 text-xs text-muted-foreground">
                {CL.uploadProgress} {uploadPct}%
              </div>
            )}

            {error && (
              <div className="px-3 py-1 text-xs text-red-400">{error}</div>
            )}

            <footer className="border-t border-white/10 p-2.5">
              <div className="mx-auto flex max-w-3xl items-end gap-1.5">
                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEmoji((v) => !v)}
                  >
                    <Smile className="size-5" />
                  </Button>
                  {showEmoji && (
                    <div className="absolute bottom-11 start-0 z-20 grid grid-cols-5 gap-1 rounded-xl border border-white/10 bg-[#14101c] p-2 shadow-xl">
                      {CONNECT_REACTION_EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          className="rounded-md p-1 text-lg hover:bg-white/10"
                          onClick={() => {
                            setDraft((d) => d + e);
                            setShowEmoji(false);
                          }}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileRef.current?.click()}
                >
                  <Paperclip className="size-5" />
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files?.length) void handleSend(Array.from(files));
                    e.target.value = "";
                  }}
                />
                <textarea
                  value={draft}
                  rows={1}
                  placeholder={CL.typePlaceholder}
                  className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[#D23B68]/50"
                  onChange={(e) => {
                    setDraft(e.target.value);
                    bumpTyping();
                  }}
                  onPaste={(e) => void onPaste(e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(recording && "text-red-400")}
                  title={CL.holdVoice}
                  onMouseDown={() => void startRecording()}
                  onMouseUp={() => stopRecording()}
                  onMouseLeave={() => {
                    if (recording) stopRecording();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    void startRecording();
                  }}
                  onTouchEnd={() => stopRecording()}
                >
                  <Mic className="size-5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  className="bg-[#D23B68] text-white hover:bg-[#D23B68]/90"
                  onClick={() => void handleSend()}
                >
                  <Send className="size-4" />
                </Button>
              </div>
              <p className="mx-auto mt-1 max-w-3xl text-[10px] text-muted-foreground/70">
                {CL.channelsStub}
              </p>
            </footer>
          </>
        )}
      </main>

      {/* Right */}
      {active && showInfo && (
        <aside className="hidden w-[280px] flex-col border-s border-white/10 bg-black/20 lg:flex">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
            <p className="text-sm font-semibold">{CL.info}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowInfo(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 text-sm">
            <div className="mb-4 flex flex-col items-center gap-2 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-[#29194A] text-lg font-bold text-white">
                {active.kind === "team"
                  ? "ST"
                  : activePeer?.initials ?? "?"}
              </div>
              <p className="font-semibold">{active.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {active.kind === "team"
                  ? CL.teamRoom
                  : statusLabel(presenceMap.get(activePeer?.id ?? ""))}
              </p>
              {activePeer &&
                presenceMap.get(activePeer.id)?.customStatus && (
                  <p className="text-xs">
                    {presenceMap.get(activePeer.id)?.customStatus}
                  </p>
                )}
              {activePeer?.personId && (
                <a
                  href={`/people/${activePeer.personId}`}
                  className="text-xs text-[#D23B68] underline-offset-2 hover:underline"
                >
                  فتح الملف
                </a>
              )}
            </div>

            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {CL.media}
            </p>
            <div className="mb-3 grid grid-cols-3 gap-1">
              {(media?.attachments ?? [])
                .filter((a) => a.kind === "image" || a.kind === "video")
                .slice(0, 9)
                .map((a) =>
                  a.kind === "image" && a.signedUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={a.id}
                      src={a.signedUrl}
                      alt=""
                      className="aspect-square rounded-md object-cover"
                    />
                  ) : (
                    <div
                      key={a.id}
                      className="flex aspect-square items-center justify-center rounded-md bg-white/5 text-[10px]"
                    >
                      🎬
                    </div>
                  )
                )}
            </div>

            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {CL.files}
            </p>
            <ul className="mb-3 space-y-1">
              {(media?.attachments ?? [])
                .filter((a) => a.kind !== "image" && a.kind !== "video")
                .slice(0, 12)
                .map((a) => (
                  <li key={a.id}>
                    <a
                      href={a.signedUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="line-clamp-1 text-xs text-[#D23B68] hover:underline"
                    >
                      {a.fileName}
                    </a>
                  </li>
                ))}
            </ul>

            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {CL.links}
            </p>
            <ul className="space-y-1">
              {(media?.links ?? []).slice(0, 10).map((l) => (
                <li key={`${l.messageId}-${l.url}`}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="line-clamp-1 text-xs text-sky-400 hover:underline"
                  >
                    {l.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  );
}

function ConvoRow({
  c,
  active,
  presenceLabel,
  online,
  showOnlineDot,
  pinned,
  onClick,
}: {
  c: ConnectConversation;
  active: boolean;
  presenceLabel: string;
  online: boolean;
  showOnlineDot: boolean;
  pinned?: boolean;
  onClick: () => void;
}) {
  const preview = c.lastMessagePreview?.trim() || CL.startChat;
  const activityAt = c.lastMessageAt ?? c.updatedAt ?? c.createdAt;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mb-0.5 flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-start transition-colors",
        active
          ? "bg-[#D23B68]/20 ring-1 ring-[#D23B68]/45"
          : "hover:bg-white/5",
        pinned && !active && "bg-white/[0.03]"
      )}
    >
      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[#29194A] text-xs font-semibold text-white">
        {c.kind === "team" ? "ST" : c.peers[0]?.initials ?? "?"}
        {showOnlineDot ? (
          <span
            className={cn(
              "absolute bottom-0 end-0 size-2.5 rounded-full ring-2 ring-[#0c0a12]",
              online ? "bg-emerald-400" : "bg-zinc-500"
            )}
            aria-hidden
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">
            {c.displayName}
            {pinned ? (
              <span className="ms-1 text-[10px] font-normal text-[#D23B68]">
                ثابت
              </span>
            ) : null}
          </p>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {formatTime(activityAt)}
          </span>
        </div>
        <p className="truncate text-[11px] text-muted-foreground/90">
          {presenceLabel}
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">{preview}</p>
          {c.unreadCount > 0 && (
            <span className="rounded-full bg-[#D23B68] px-1.5 text-[10px] font-semibold text-white">
              {c.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function PeerRow({
  peer,
  presenceLabel,
  online,
  busy,
  onClick,
}: {
  peer: ConnectPeer;
  presenceLabel: string;
  online: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="mb-0.5 flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-start transition-colors hover:bg-white/5 disabled:opacity-60"
    >
      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[#29194A] text-xs font-semibold text-white">
        {busy ? <Loader2 className="size-4 animate-spin" /> : peer.initials}
        <span
          className={cn(
            "absolute bottom-0 end-0 size-2.5 rounded-full ring-2 ring-[#0c0a12]",
            online ? "bg-emerald-400" : "bg-zinc-500"
          )}
          aria-hidden
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{peer.fullName}</p>
        <p className="truncate text-[11px] text-muted-foreground/90">
          {presenceLabel}
        </p>
        <p className="truncate text-xs text-muted-foreground">{CL.startChat}</p>
      </div>
    </button>
  );
}

function AttachmentView({
  a,
  playbackRate,
  onCycleSpeed,
}: {
  a: ConnectMessage["attachments"][number];
  playbackRate: number;
  onCycleSpeed: () => void;
}) {
  if (a.kind === "image" && a.signedUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={a.signedUrl}
        alt={a.fileName}
        className="mb-1 max-h-56 max-w-full rounded-lg object-contain"
      />
    );
  }
  if ((a.kind === "voice" || a.kind === "audio") && a.signedUrl) {
    return (
      <div className="mb-1 flex items-center gap-2">
        <audio
          controls
          src={a.signedUrl}
          className="h-9 max-w-[220px]"
          ref={(el) => {
            if (el) el.playbackRate = playbackRate;
          }}
        />
        <button
          type="button"
          className="rounded bg-black/30 px-1.5 text-[10px]"
          onClick={onCycleSpeed}
          title={CL.playback}
        >
          {playbackRate}x
        </button>
      </div>
    );
  }
  if (a.kind === "video" && a.signedUrl) {
    return (
      <video
        controls
        src={a.signedUrl}
        className="mb-1 max-h-56 max-w-full rounded-lg"
      />
    );
  }
  return (
    <a
      href={a.signedUrl ?? "#"}
      target="_blank"
      rel="noreferrer"
      className="mb-1 inline-flex items-center gap-1 rounded-md bg-black/25 px-2 py-1 text-xs underline-offset-2 hover:underline"
    >
      📎 {a.fileName}
    </a>
  );
}

function MsgMenu({
  mine,
  onClose,
  onReply,
  onCopy,
  onEdit,
  onStar,
  onPin,
  onDeleteMe,
  onDeleteEveryone,
  onReact,
  onForward,
}: {
  mine: boolean;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onStar: () => void;
  onPin: () => void;
  onDeleteMe: () => void;
  onDeleteEveryone: () => void;
  onReact: (e: ConnectReactionEmoji) => void;
  onForward: () => void;
}) {
  return (
    <div
      className="absolute end-0 top-0 z-30 min-w-[160px] rounded-xl border border-white/10 bg-[#14101c] p-1 text-xs shadow-2xl"
      onMouseLeave={onClose}
    >
      <div className="mb-1 flex gap-0.5 border-b border-white/10 px-1 pb-1">
        {CONNECT_REACTION_EMOJIS.slice(0, 6).map((e) => (
          <button
            key={e}
            type="button"
            className="rounded p-0.5 hover:bg-white/10"
            onClick={() => onReact(e)}
          >
            {e}
          </button>
        ))}
      </div>
      {[
        [CL.reply, onReply],
        [CL.forward, onForward],
        [CL.copy, onCopy],
        [CL.star, onStar],
        [CL.pin, onPin],
        ...(mine ? [[CL.edit, onEdit] as const] : []),
        [CL.deleteMe, onDeleteMe],
        ...(mine ? [[CL.deleteEveryone, onDeleteEveryone] as const] : []),
      ].map(([label, fn]) => (
        <button
          key={label as string}
          type="button"
          className="block w-full rounded-md px-2 py-1.5 text-start hover:bg-white/10"
          onClick={fn as () => void}
        >
          {label as string}
        </button>
      ))}
    </div>
  );
}
