"use server";

import { revalidatePath } from "next/cache";

import { canAsync } from "@/lib/identity/permission-service";
import { resolveSessionForApp } from "@/lib/identity/session";
import {
  attachFilesToMessage,
  deleteMessageForEveryone,
  deleteMessageForMe,
  editMessage,
  ensureConnectForSelf,
  findDmConversationId,
  globalSearch,
  listConversationsForUser,
  listMessages,
  listPresence,
  listSharedMedia,
  markConversationRead,
  pinMessage,
  searchInConversation,
  sendMessage,
  toggleReaction,
  toggleStar,
  upsertPresence,
  listActivePeers,
  getPeer,
} from "@/lib/connect/repository";
import type {
  ConnectConversation,
  ConnectGlobalSearchHit,
  ConnectMessage,
  ConnectPeer,
  ConnectPresence,
  ConnectPresenceStatus,
  ConnectReactionEmoji,
  ConnectSharedMedia,
} from "@/lib/connect/types";

async function requireConnect(
  needSend = false
): Promise<
  | { ok: true; userId: string; accessLevel: string }
  | { ok: false; error: string }
> {
  const session = await resolveSessionForApp();
  if (!session) return { ok: false, error: "سجّل دخولك تاني" };
  const view = await canAsync(session.profile.accessLevel, "connect.view");
  if (!view.allowed) return { ok: false, error: "مفيش صلاحية لـ Team Chat" };
  if (needSend) {
    const send = await canAsync(session.profile.accessLevel, "connect.send");
    if (!send.allowed) return { ok: false, error: "مفيش صلاحية إرسال" };
  }
  return {
    ok: true,
    userId: session.userId,
    accessLevel: session.profile.accessLevel,
  };
}

function revalidateConnect() {
  revalidatePath("/connect");
}

export async function bootstrapConnectAction(): Promise<{
  ok: boolean;
  error?: string;
  conversations?: ConnectConversation[];
  peers?: ConnectPeer[];
  presence?: ConnectPresence[];
}> {
  const gate = await requireConnect();
  if (!gate.ok) return gate;
  const ensured = await ensureConnectForSelf();
  if (!ensured.ok) return { ok: false, error: ensured.error };
  await upsertPresence({ userId: gate.userId, status: "online", activity: null });
  const [conversations, peers, presence] = await Promise.all([
    listConversationsForUser(gate.userId),
    listActivePeers(gate.userId),
    listPresence(),
  ]);
  return { ok: true, conversations, peers, presence };
}

export async function loadConversationsAction(): Promise<{
  ok: boolean;
  error?: string;
  conversations?: ConnectConversation[];
}> {
  const gate = await requireConnect();
  if (!gate.ok) return gate;
  const conversations = await listConversationsForUser(gate.userId);
  return { ok: true, conversations };
}

export async function loadMessagesAction(input: {
  conversationId: string;
  before?: string | null;
  limit?: number;
}): Promise<{
  ok: boolean;
  error?: string;
  messages?: ConnectMessage[];
}> {
  const gate = await requireConnect();
  if (!gate.ok) return gate;
  const messages = await listMessages(
    input.conversationId,
    gate.userId,
    { before: input.before, limit: input.limit }
  );
  return { ok: true, messages };
}

export async function sendConnectMessageAction(input: {
  conversationId: string;
  body: string;
  messageType?: ConnectMessage["messageType"];
  replyToId?: string | null;
  forwardedFromId?: string | null;
  clientId?: string | null;
  attachments?: {
    storagePath: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    kind?: ConnectMessage["attachments"][number]["kind"];
    durationMs?: number | null;
  }[];
}): Promise<{
  ok: boolean;
  error?: string;
  message?: ConnectMessage;
}> {
  const gate = await requireConnect(true);
  if (!gate.ok) return gate;
  const body = input.body.trim();
  const hasAtt = !!input.attachments?.length;
  if (!body && !hasAtt && input.messageType !== "voice") {
    return { ok: false, error: "اكتب رسالة أو ارفق ملف" };
  }
  const result = await sendMessage({
    conversationId: input.conversationId,
    senderId: gate.userId,
    body,
    messageType:
      input.messageType ??
      (hasAtt ? "attachment" : "text"),
    replyToId: input.replyToId,
    forwardedFromId: input.forwardedFromId,
    clientId: input.clientId,
  });
  if (!result.ok) return result;
  if (input.attachments?.length) {
    const att = await attachFilesToMessage({
      messageId: result.message.id,
      senderId: gate.userId,
      files: input.attachments,
    });
    if (!att.ok) return { ok: false, error: att.error };
  }
  revalidateConnect();
  const refreshed = await listMessages(input.conversationId, gate.userId, {
    limit: 5,
  });
  const message =
    refreshed.find((m) => m.id === result.message.id) ?? result.message;
  return { ok: true, message };
}

export async function editConnectMessageAction(input: {
  messageId: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireConnect(true);
  if (!gate.ok) return gate;
  const r = await editMessage(input.messageId, gate.userId, input.body.trim());
  if (r.ok) revalidateConnect();
  return r;
}

export async function deleteConnectMessageAction(input: {
  messageId: string;
  scope: "me" | "everyone";
}): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireConnect(true);
  if (!gate.ok) return gate;
  const r =
    input.scope === "everyone"
      ? await deleteMessageForEveryone(input.messageId, gate.userId)
      : await deleteMessageForMe(input.messageId, gate.userId);
  if (r.ok) revalidateConnect();
  return r;
}

export async function reactConnectMessageAction(input: {
  messageId: string;
  emoji: ConnectReactionEmoji;
}): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireConnect(true);
  if (!gate.ok) return gate;
  return toggleReaction({
    messageId: input.messageId,
    userId: gate.userId,
    emoji: input.emoji,
  });
}

export async function starConnectMessageAction(input: {
  messageId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireConnect();
  if (!gate.ok) return gate;
  return toggleStar(input.messageId, gate.userId);
}

export async function pinConnectMessageAction(input: {
  conversationId: string;
  messageId: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireConnect(true);
  if (!gate.ok) return gate;
  const r = await pinMessage(
    input.conversationId,
    input.messageId,
    gate.userId
  );
  if (r.ok) revalidateConnect();
  return r;
}

export async function markConnectReadAction(input: {
  conversationId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireConnect();
  if (!gate.ok) return gate;
  await markConversationRead(input.conversationId, gate.userId);
  return { ok: true };
}

export async function setConnectPresenceAction(input: {
  status?: ConnectPresenceStatus;
  customStatus?: string | null;
  activity?: ConnectPresence["activity"];
  activityConversationId?: string | null;
}): Promise<{ ok: boolean; error?: string; presence?: ConnectPresence | null }> {
  const gate = await requireConnect();
  if (!gate.ok) return gate;
  const presence = await upsertPresence({
    userId: gate.userId,
    ...input,
  });
  return { ok: true, presence };
}

export async function searchConnectAction(input: {
  query: string;
  conversationId?: string | null;
}): Promise<{
  ok: boolean;
  error?: string;
  hits?: ConnectGlobalSearchHit[];
  messages?: ConnectMessage[];
}> {
  const gate = await requireConnect();
  if (!gate.ok) return gate;
  if (input.conversationId) {
    const messages = await searchInConversation(
      input.conversationId,
      input.query,
      gate.userId
    );
    return { ok: true, messages };
  }
  const hits = await globalSearch(gate.userId, input.query);
  return { ok: true, hits };
}

export async function loadSharedMediaAction(input: {
  conversationId: string;
}): Promise<{
  ok: boolean;
  error?: string;
  media?: ConnectSharedMedia;
}> {
  const gate = await requireConnect();
  if (!gate.ok) return gate;
  const media = await listSharedMedia(input.conversationId);
  return { ok: true, media };
}

export async function openDmAction(input: {
  peerId: string;
}): Promise<{
  ok: boolean;
  error?: string;
  conversationId?: string;
  conversations?: ConnectConversation[];
  peers?: ConnectPeer[];
  presence?: ConnectPresence[];
}> {
  const gate = await requireConnect();
  if (!gate.ok) return gate;
  await ensureConnectForSelf();
  const id = await findDmConversationId(gate.userId, input.peerId);
  const [conversations, peers, presence] = await Promise.all([
    listConversationsForUser(gate.userId),
    listActivePeers(gate.userId),
    listPresence(),
  ]);
  if (!id) {
    return {
      ok: false,
      error: "المحادثة مش جاهزة — جرّب تاني",
      conversations,
      peers,
      presence,
    };
  }
  return { ok: true, conversationId: id, conversations, peers, presence };
}

export async function getConnectPeerAction(input: {
  userId: string;
}): Promise<{ ok: boolean; error?: string; peer?: ConnectPeer | null }> {
  const gate = await requireConnect();
  if (!gate.ok) return gate;
  const peer = await getPeer(input.userId);
  return { ok: true, peer };
}

export async function loadPresenceAction(): Promise<{
  ok: boolean;
  error?: string;
  presence?: ConnectPresence[];
}> {
  const gate = await requireConnect();
  if (!gate.ok) return gate;
  const presence = await listPresence();
  return { ok: true, presence };
}
