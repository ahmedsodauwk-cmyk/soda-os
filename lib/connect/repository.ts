/**
 * SODA Connect repository — RLS-aware server client preferred.
 * Membership checks are enforced by RLS; app still verifies session permissions.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { accessLevelCan } from "@/lib/identity/access-levels";
import { attachmentKindFromMime } from "@/lib/connect/mime";
import type {
  ConnectAttachment,
  ConnectAttachmentKind,
  ConnectConversation,
  ConnectConversationKind,
  ConnectGlobalSearchHit,
  ConnectMessage,
  ConnectPeer,
  ConnectPresence,
  ConnectPresenceStatus,
  ConnectReaction,
  ConnectReactionEmoji,
  ConnectReceiptStatus,
  ConnectSharedMedia,
} from "@/lib/connect/types";

/** Deterministic DM pair key — mirrors public.connect_dm_key. */
export function connectDmKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function initialsFrom(name: string, email: string | null): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (email?.slice(0, 2) || "SO").toUpperCase();
}

function mapPeer(row: {
  id: string;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  access_level?: string | null;
  person_id?: string | null;
  is_active?: boolean | null;
}): ConnectPeer {
  const fullName = row.full_name?.trim() || row.username || row.email || "User";
  return {
    id: row.id,
    fullName,
    username: row.username ?? null,
    email: row.email ?? null,
    accessLevel: row.access_level ?? null,
    personId: row.person_id ?? null,
    initials: initialsFrom(fullName, row.email ?? null),
    isActive: !!row.is_active,
  };
}

function mapPresence(row: {
  user_id: string;
  status: string;
  custom_status?: string | null;
  activity?: string | null;
  activity_conversation_id?: string | null;
  last_seen_at: string;
  updated_at: string;
}): ConnectPresence {
  return {
    userId: row.user_id,
    status: row.status as ConnectPresenceStatus,
    customStatus: row.custom_status ?? null,
    activity: (row.activity as ConnectPresence["activity"]) ?? null,
    activityConversationId: row.activity_conversation_id ?? null,
    lastSeenAt: row.last_seen_at,
    updatedAt: row.updated_at,
  };
}

function mapAttachment(row: {
  id: string;
  message_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number | null;
  kind: string;
  width?: number | null;
  height?: number | null;
  duration_ms?: number | null;
}): ConnectAttachment {
  return {
    id: row.id,
    messageId: row.message_id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes ?? 0),
    kind: row.kind as ConnectAttachmentKind,
    width: row.width ?? null,
    height: row.height ?? null,
    durationMs: row.duration_ms ?? null,
  };
}

/** Called after Founder provisions a login — admin client, no fake users. */
export async function provisionConnectForUser(userId: string): Promise<void> {
  const admin = createAdminClient();
  // Presence + SODA Team + DM with every active peer (security definer).
  const { error } = await admin.rpc("connect_ensure_user", {
    p_user_id: userId,
  });
  if (error) {
    console.error("[connect] provisionConnectForUser", error.message);
    return;
  }
  // Heal any other active users who were missing this peer pair.
  const { error: bootErr } = await admin.rpc("connect_bootstrap_all_active");
  if (bootErr) {
    console.error("[connect] provision bootstrap_all", bootErr.message);
  }
}

export async function ensureConnectForSelf(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("connect_ensure_self");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Service-role heal: ensure the viewer (and optionally full roster) has
 * Team room + private DMs. No schema changes; uses existing RPCs only.
 */
export async function adminEnsureConnectUser(
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("connect_ensure_user", {
      p_user_id: userId,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "connect ensure failed",
    };
  }
}

export async function adminBootstrapAllActive(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("connect_bootstrap_all_active");
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "connect bootstrap failed",
    };
  }
}

function peerHasConnectAccess(peer: ConnectPeer): boolean {
  return accessLevelCan(peer.accessLevel, "connect.view");
}

export async function listActivePeers(
  excludeUserId: string
): Promise<ConnectPeer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, email, access_level, person_id, is_active")
    .eq("is_active", true)
    .neq("id", excludeUserId)
    .order("full_name", { ascending: true });
  if (error || !data) return [];
  return data.map(mapPeer).filter(peerHasConnectAccess);
}

/**
 * Silent Team Chat bootstrap: ensure self, then heal any missing peer DMs /
 * Team room via service RPCs before the UI list is returned.
 */
export async function bootstrapTeamChatRoster(userId: string): Promise<{
  ok: boolean;
  error?: string;
  conversations: ConnectConversation[];
  peers: ConnectPeer[];
  presence: ConnectPresence[];
}> {
  const self = await ensureConnectForSelf();
  if (!self.ok) {
    // Fall through to admin heal if RLS/session RPC failed.
    const healed = await adminEnsureConnectUser(userId);
    if (!healed.ok) {
      return {
        ok: false,
        error: self.error ?? healed.error ?? "فشل تجهيز Team Chat",
        conversations: [],
        peers: [],
        presence: [],
      };
    }
  }

  const load = async () => {
    const [conversations, peers, presence] = await Promise.all([
      listConversationsForUser(userId),
      listActivePeers(userId),
      listPresence(),
    ]);
    return { conversations, peers, presence };
  };

  let { conversations, peers, presence } = await load();

  const missingPeerDms = (convos: ConnectConversation[], roster: ConnectPeer[]) => {
    const dmPeers = new Set(
      convos
        .filter((c) => c.kind === "private")
        .map((c) => c.peers[0]?.id)
        .filter(Boolean) as string[]
    );
    return roster.filter((p) => !dmPeers.has(p.id));
  };

  const needsHeal = (convos: ConnectConversation[], roster: ConnectPeer[]) => {
    const hasTeam = convos.some((c) => c.kind === "team");
    if (!hasTeam) return true;
    if (roster.length > 0 && convos.filter((c) => c.kind === "private").length === 0) {
      return true;
    }
    return missingPeerDms(convos, roster).length > 0;
  };

  if (needsHeal(conversations, peers)) {
    await adminEnsureConnectUser(userId);
    ({ conversations, peers, presence } = await load());
  }

  if (needsHeal(conversations, peers)) {
    await adminBootstrapAllActive();
    await adminEnsureConnectUser(userId);
    ({ conversations, peers, presence } = await load());
  }

  // Still missing specific pairs — ensure each missing peer once (max modest N).
  const stillMissing = missingPeerDms(conversations, peers).slice(0, 40);
  if (stillMissing.length) {
    await Promise.all(
      stillMissing.map((p) => adminEnsureConnectUser(p.id))
    );
    await adminEnsureConnectUser(userId);
    ({ conversations, peers, presence } = await load());
  }

  return { ok: true, conversations, peers, presence };
}

export async function getPeer(userId: string): Promise<ConnectPeer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, email, access_level, person_id, is_active")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return mapPeer(data);
}

export async function listPresence(): Promise<ConnectPresence[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("connect_presence").select("*");
  if (error || !data) return [];
  return data.map(mapPresence);
}

export async function upsertPresence(input: {
  userId: string;
  status?: ConnectPresenceStatus;
  customStatus?: string | null;
  activity?: ConnectPresence["activity"];
  activityConversationId?: string | null;
}): Promise<ConnectPresence | null> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    user_id: input.userId,
    updated_at: now,
    last_seen_at: now,
  };
  if (input.status) patch.status = input.status;
  if (input.customStatus !== undefined) patch.custom_status = input.customStatus;
  if (input.activity !== undefined) patch.activity = input.activity;
  if (input.activityConversationId !== undefined) {
    patch.activity_conversation_id = input.activityConversationId;
  }
  const { data, error } = await supabase
    .from("connect_presence")
    .upsert(patch)
    .select("*")
    .single();
  if (error || !data) return null;
  return mapPresence(data);
}

export async function listConversationsForUser(
  userId: string
): Promise<ConnectConversation[]> {
  const supabase = await createClient();
  const { data: memberships, error } = await supabase
    .from("connect_conversation_members")
    .select("conversation_id, last_read_at, cleared_before")
    .eq("user_id", userId)
    .is("left_at", null);
  if (error || !memberships?.length) return [];

  const ids = memberships.map((m) => m.conversation_id as string);
  const memberMeta = new Map(
    memberships.map((m) => [
      m.conversation_id as string,
      {
        lastReadAt: (m.last_read_at as string | null) ?? null,
        clearedBefore: (m.cleared_before as string | null) ?? null,
      },
    ])
  );

  const { data: convos } = await supabase
    .from("connect_conversations")
    .select("*")
    .in("id", ids)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (!convos?.length) return [];

  const { data: allMembers } = await supabase
    .from("connect_conversation_members")
    .select("conversation_id, user_id")
    .in("conversation_id", ids)
    .is("left_at", null);

  const peerIds = [
    ...new Set(
      (allMembers ?? [])
        .map((m) => m.user_id as string)
        .filter((id) => id !== userId)
    ),
  ];

  const peersById = new Map<string, ConnectPeer>();
  if (peerIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select(
        "id, full_name, username, email, access_level, person_id, is_active"
      )
      .in("id", peerIds);
    for (const p of profiles ?? []) peersById.set(p.id, mapPeer(p));
  }

  const presenceList = await listPresence();
  const presenceById = new Map(presenceList.map((p) => [p.userId, p]));

  const result: ConnectConversation[] = [];

  for (const c of convos) {
    const kind = c.kind as ConnectConversationKind;
    const peerIdsForConvo = (allMembers ?? [])
      .filter((m) => m.conversation_id === c.id && m.user_id !== userId)
      .map((m) => m.user_id as string);
    const peers = peerIdsForConvo
      .map((id) => peersById.get(id))
      .filter(Boolean) as ConnectPeer[];

    const displayName =
      kind === "team"
        ? c.title || "SODA Team"
        : peers[0]?.fullName || "محادثة";

    const meta = memberMeta.get(c.id as string);
    let unreadCount = 0;
    if (meta) {
      let q = supabase
        .from("connect_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .neq("sender_id", userId)
        .eq("deleted_for_everyone", false);
      if (meta.lastReadAt) {
        q = q.gt("created_at", meta.lastReadAt);
      }
      if (meta.clearedBefore) {
        q = q.gt("created_at", meta.clearedBefore);
      }
      const { count } = await q;
      unreadCount = count ?? 0;
    }

    const primaryPeer = peers[0];
    result.push({
      id: c.id as string,
      kind,
      title: c.title,
      systemKey: c.system_key,
      dmKey: c.dm_key,
      isSystem: !!c.is_system,
      pinnedMessageId: c.pinned_message_id,
      lastMessageAt: c.last_message_at,
      lastMessagePreview: c.last_message_preview,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      unreadCount,
      peers,
      displayName,
      presence: primaryPeer ? presenceById.get(primaryPeer.id) ?? null : null,
      lastReadAt: meta?.lastReadAt ?? null,
    });
  }

  result.sort((a, b) => {
    if (a.kind === "team" && b.kind !== "team") return -1;
    if (b.kind === "team" && a.kind !== "team") return 1;
    const ta = a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0;
    const tb = b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0;
    return tb - ta;
  });

  return result;
}

function aggregateReceipt(
  rows: { status: string }[] | undefined
): ConnectReceiptStatus {
  if (!rows?.length) return "sent";
  if (rows.every((r) => r.status === "read")) return "read";
  if (rows.some((r) => r.status === "delivered" || r.status === "read")) {
    return "delivered";
  }
  return "sent";
}

export async function listMessages(
  conversationId: string,
  viewerId: string,
  opts?: { before?: string | null; limit?: number }
): Promise<ConnectMessage[]> {
  const supabase = await createClient();
  const limit = opts?.limit ?? 40;
  let q = supabase
    .from("connect_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (opts?.before) {
    q = q.lt("created_at", opts.before);
  }
  const { data, error } = await q;
  if (error || !data) return [];

  const ids = data.map((m) => m.id as string);
  const { data: attachments } = await supabase
    .from("connect_message_attachments")
    .select("*")
    .in("message_id", ids);
  const { data: reactions } = await supabase
    .from("connect_message_reactions")
    .select("*")
    .in("message_id", ids);
  const { data: stars } = await supabase
    .from("connect_message_stars")
    .select("message_id")
    .eq("user_id", viewerId)
    .in("message_id", ids);

  const mineIds = data
    .filter((m) => m.sender_id === viewerId)
    .map((m) => m.id as string);
  const receiptByMsg = new Map<string, { status: string }[]>();
  if (mineIds.length) {
    const { data: receipts } = await supabase
      .from("connect_message_receipts")
      .select("message_id, status")
      .in("message_id", mineIds);
    for (const r of receipts ?? []) {
      const mid = r.message_id as string;
      const list = receiptByMsg.get(mid) ?? [];
      list.push({ status: r.status as string });
      receiptByMsg.set(mid, list);
    }
  }

  const starSet = new Set((stars ?? []).map((s) => s.message_id as string));
  const attsByMsg = new Map<string, ConnectAttachment[]>();
  for (const a of attachments ?? []) {
    const mapped = mapAttachment(a);
    const list = attsByMsg.get(mapped.messageId) ?? [];
    list.push(mapped);
    attsByMsg.set(mapped.messageId, list);
  }
  const reactsByMsg = new Map<string, ConnectReaction[]>();
  for (const r of reactions ?? []) {
    const mapped: ConnectReaction = {
      messageId: r.message_id,
      userId: r.user_id,
      emoji: r.emoji as ConnectReactionEmoji,
      createdAt: r.created_at,
    };
    const list = reactsByMsg.get(mapped.messageId) ?? [];
    list.push(mapped);
    reactsByMsg.set(mapped.messageId, list);
  }

  const senderIds = [...new Set(data.map((m) => m.sender_id as string))];
  const { data: senders } = await supabase
    .from("profiles")
    .select("id, full_name, username, email, access_level, person_id, is_active")
    .in("id", senderIds);
  const senderMap = new Map((senders ?? []).map((s) => [s.id, mapPeer(s)]));

  const replyIds = data
    .map((m) => m.reply_to_id as string | null)
    .filter(Boolean) as string[];
  const replyMap = new Map<string, { id: string; body: string; senderName: string }>();
  if (replyIds.length) {
    const { data: replies } = await supabase
      .from("connect_messages")
      .select("id, body, sender_id, deleted_for_everyone")
      .in("id", replyIds);
    for (const r of replies ?? []) {
      const peer = senderMap.get(r.sender_id as string);
      replyMap.set(r.id as string, {
        id: r.id as string,
        body: r.deleted_for_everyone ? "تم حذف الرسالة" : (r.body as string),
        senderName: peer?.fullName ?? "User",
      });
    }
  }

  const messages: ConnectMessage[] = [];
  for (const m of data) {
    const receipt =
      m.sender_id === viewerId
        ? aggregateReceipt(receiptByMsg.get(m.id as string))
        : "sent";
    let atts = attsByMsg.get(m.id as string) ?? [];
    atts = await signAttachments(supabase, atts);
    messages.push({
      id: m.id as string,
      conversationId: m.conversation_id as string,
      senderId: m.sender_id as string,
      body: m.deleted_for_everyone ? "" : (m.body as string),
      messageType: m.message_type,
      replyToId: m.reply_to_id,
      forwardedFromId: m.forwarded_from_id,
      isPinned: !!m.is_pinned,
      editedAt: m.edited_at,
      deletedAt: m.deleted_at,
      deletedForEveryone: !!m.deleted_for_everyone,
      clientId: m.client_id,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      attachments: atts,
      reactions: reactsByMsg.get(m.id as string) ?? [],
      receipt,
      starred: starSet.has(m.id as string),
      replyPreview: m.reply_to_id
        ? replyMap.get(m.reply_to_id as string) ?? null
        : null,
      sender: senderMap.get(m.sender_id as string) ?? null,
    });
  }

  return messages.reverse();
}

async function signAttachments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  atts: ConnectAttachment[]
): Promise<ConnectAttachment[]> {
  const out: ConnectAttachment[] = [];
  for (const a of atts) {
    const { data } = await supabase.storage
      .from("connect")
      .createSignedUrl(a.storagePath, 60 * 60);
    out.push({ ...a, signedUrl: data?.signedUrl ?? null });
  }
  return out;
}

export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  body: string;
  messageType?: ConnectMessage["messageType"];
  replyToId?: string | null;
  forwardedFromId?: string | null;
  clientId?: string | null;
}): Promise<{ ok: true; message: ConnectMessage } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connect_messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      body: input.body,
      message_type: input.messageType ?? "text",
      reply_to_id: input.replyToId ?? null,
      forwarded_from_id: input.forwardedFromId ?? null,
      client_id: input.clientId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "فشل الإرسال" };
  }
  const [mapped] = await listMessages(input.conversationId, input.senderId, {
    limit: 1,
  });
  // Prefer the just-inserted id
  const messages = await listMessages(input.conversationId, input.senderId, {
    limit: 5,
  });
  const found = messages.find((m) => m.id === data.id) ?? mapped;
  if (!found) {
    return {
      ok: true,
      message: {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        body: data.body,
        messageType: data.message_type,
        replyToId: data.reply_to_id,
        forwardedFromId: data.forwarded_from_id,
        isPinned: false,
        editedAt: null,
        deletedAt: null,
        deletedForEveryone: false,
        clientId: data.client_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        attachments: [],
        reactions: [],
        receipt: "sent",
        starred: false,
      },
    };
  }
  return { ok: true, message: found };
}

export async function editMessage(
  messageId: string,
  senderId: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("connect_messages")
    .update({ body, edited_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("sender_id", senderId)
    .eq("deleted_for_everyone", false);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteMessageForEveryone(
  messageId: string,
  senderId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("connect_messages")
    .update({
      deleted_for_everyone: true,
      deleted_at: new Date().toISOString(),
      body: "",
    })
    .eq("id", messageId)
    .eq("sender_id", senderId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteMessageForMe(
  messageId: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("connect_message_hides").upsert({
    message_id: messageId,
    user_id: userId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function toggleReaction(input: {
  messageId: string;
  userId: string;
  emoji: ConnectReactionEmoji;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("connect_message_reactions")
    .select("emoji")
    .eq("message_id", input.messageId)
    .eq("user_id", input.userId)
    .eq("emoji", input.emoji)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("connect_message_reactions")
      .delete()
      .eq("message_id", input.messageId)
      .eq("user_id", input.userId)
      .eq("emoji", input.emoji);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }
  const { error } = await supabase.from("connect_message_reactions").insert({
    message_id: input.messageId,
    user_id: input.userId,
    emoji: input.emoji,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function toggleStar(
  messageId: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("connect_message_stars")
    .select("message_id")
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("connect_message_stars")
      .delete()
      .eq("message_id", messageId)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }
  const { error } = await supabase.from("connect_message_stars").insert({
    message_id: messageId,
    user_id: userId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function pinMessage(
  conversationId: string,
  messageId: string | null,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  if (messageId) {
    await supabase
      .from("connect_messages")
      .update({ is_pinned: false })
      .eq("conversation_id", conversationId)
      .eq("is_pinned", true);
    await supabase
      .from("connect_messages")
      .update({ is_pinned: true })
      .eq("id", messageId);
  }
  const { error } = await supabase
    .from("connect_conversations")
    .update({ pinned_message_id: messageId })
    .eq("id", conversationId);
  if (error) return { ok: false, error: error.message };
  void userId;
  return { ok: true };
}

export async function markConversationRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  await supabase
    .from("connect_conversation_members")
    .update({ last_read_at: now, last_delivered_at: now })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  const { data: unread } = await supabase
    .from("connect_messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .limit(100);

  if (unread?.length) {
    const rows = unread.map((m) => ({
      message_id: m.id,
      user_id: userId,
      status: "read",
      updated_at: now,
    }));
    await supabase.from("connect_message_receipts").upsert(rows);
  }
}

export async function searchInConversation(
  conversationId: string,
  query: string,
  viewerId: string
): Promise<ConnectMessage[]> {
  const q = query.trim();
  if (!q) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("connect_messages")
    .select("id, created_at")
    .eq("conversation_id", conversationId)
    .eq("deleted_for_everyone", false)
    .ilike("body", `%${q}%`)
    .order("created_at", { ascending: false })
    .limit(40);
  if (!data?.length) return [];
  const all = await listMessages(conversationId, viewerId, { limit: 200 });
  const idSet = new Set(data.map((d) => d.id as string));
  return all.filter((m) => idSet.has(m.id));
}

export async function globalSearch(
  userId: string,
  query: string
): Promise<ConnectGlobalSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const hits: ConnectGlobalSearchHit[] = [];
  const peers = await listActivePeers(userId);
  for (const peer of peers) {
    if (
      peer.fullName.toLowerCase().includes(q.toLowerCase()) ||
      peer.username?.toLowerCase().includes(q.toLowerCase())
    ) {
      hits.push({ type: "user", peer });
    }
  }

  const supabase = await createClient();
  const convos = await listConversationsForUser(userId);
  const convoIds = convos.map((c) => c.id);
  if (convoIds.length) {
    const { data: msgs } = await supabase
      .from("connect_messages")
      .select("id, conversation_id, body, created_at, sender_id")
      .in("conversation_id", convoIds)
      .eq("deleted_for_everyone", false)
      .ilike("body", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(30);
    for (const m of msgs ?? []) {
      hits.push({
        type: "message",
        conversationId: m.conversation_id as string,
        message: {
          id: m.id as string,
          conversationId: m.conversation_id as string,
          senderId: m.sender_id as string,
          body: m.body as string,
          messageType: "text",
          replyToId: null,
          forwardedFromId: null,
          isPinned: false,
          editedAt: null,
          deletedAt: null,
          deletedForEveryone: false,
          clientId: null,
          createdAt: m.created_at as string,
          updatedAt: m.created_at as string,
          attachments: [],
          reactions: [],
          receipt: "sent",
          starred: false,
        },
      });
    }

    const { data: files } = await supabase
      .from("connect_message_attachments")
      .select("*, connect_messages!inner(conversation_id)")
      .ilike("file_name", `%${q}%`)
      .limit(20);
    for (const f of files ?? []) {
      const conversationId = (f as { connect_messages?: { conversation_id: string } })
        .connect_messages?.conversation_id;
      if (!conversationId || !convoIds.includes(conversationId)) continue;
      hits.push({
        type: "file",
        conversationId,
        attachment: mapAttachment(f),
      });
    }
  }
  return hits.slice(0, 50);
}

export async function listSharedMedia(
  conversationId: string
): Promise<ConnectSharedMedia> {
  const supabase = await createClient();
  const { data: msgs } = await supabase
    .from("connect_messages")
    .select("id, body, created_at")
    .eq("conversation_id", conversationId)
    .eq("deleted_for_everyone", false)
    .order("created_at", { ascending: false })
    .limit(200);
  const ids = (msgs ?? []).map((m) => m.id as string);
  let attachments: ConnectAttachment[] = [];
  if (ids.length) {
    const { data } = await supabase
      .from("connect_message_attachments")
      .select("*")
      .in("message_id", ids)
      .order("created_at", { ascending: false });
    attachments = await signAttachments(
      supabase,
      (data ?? []).map(mapAttachment)
    );
  }
  const urlRe = /https?:\/\/[^\s]+/gi;
  const links: ConnectSharedMedia["links"] = [];
  for (const m of msgs ?? []) {
    const body = (m.body as string) || "";
    const found = body.match(urlRe);
    if (found) {
      for (const url of found) {
        links.push({
          url,
          messageId: m.id as string,
          createdAt: m.created_at as string,
        });
      }
    }
  }
  return { attachments, links: links.slice(0, 40) };
}

export async function attachFilesToMessage(input: {
  messageId: string;
  senderId: string;
  files: {
    storagePath: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    kind?: ConnectAttachmentKind;
    durationMs?: number | null;
  }[];
}): Promise<{ ok: boolean; error?: string }> {
  if (!input.files.length) return { ok: true };
  const supabase = await createClient();
  const rows = input.files.map((f) => ({
    message_id: input.messageId,
    storage_path: f.storagePath,
    file_name: f.fileName,
    mime_type: f.mimeType,
    size_bytes: f.sizeBytes,
    kind: f.kind ?? attachmentKindFromMime(f.mimeType),
    duration_ms: f.durationMs ?? null,
  }));
  const { error } = await supabase
    .from("connect_message_attachments")
    .insert(rows);
  if (error) return { ok: false, error: error.message };
  await supabase
    .from("connect_messages")
    .update({ message_type: "attachment", updated_at: new Date().toISOString() })
    .eq("id", input.messageId)
    .eq("sender_id", input.senderId);
  return { ok: true };
}

export async function findDmConversationId(
  userId: string,
  peerId: string
): Promise<string | null> {
  const supabase = await createClient();
  const key = connectDmKey(userId, peerId);
  const { data } = await supabase
    .from("connect_conversations")
    .select("id")
    .eq("kind", "private")
    .eq("dm_key", key)
    .maybeSingle();
  if (data?.id) return data.id as string;

  const convos = await listConversationsForUser(userId);
  const hit = convos.find(
    (c) => c.kind === "private" && c.peers.some((p) => p.id === peerId)
  );
  return hit?.id ?? null;
}

/** Ensure DM exists (self RPC → admin heal), then return conversation id. */
export async function openOrCreateDm(
  userId: string,
  peerId: string
): Promise<{ ok: true; conversationId: string } | { ok: false; error: string }> {
  await ensureConnectForSelf();
  let id = await findDmConversationId(userId, peerId);
  if (id) return { ok: true, conversationId: id };

  await adminEnsureConnectUser(userId);
  await adminEnsureConnectUser(peerId);
  id = await findDmConversationId(userId, peerId);
  if (id) return { ok: true, conversationId: id };

  await adminBootstrapAllActive();
  await adminEnsureConnectUser(userId);
  id = await findDmConversationId(userId, peerId);
  if (id) return { ok: true, conversationId: id };

  return { ok: false, error: "المحادثة مش جاهزة — جرّب تاني" };
}
