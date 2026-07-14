/**
 * SODA Connect — types (Mission 07.0).
 * Communication layer only. No ERP entities.
 *
 * Future stubs (NOT implemented): video/voice calls, screen share, channels, bots, AI.
 */

export const CONNECT_REACTION_EMOJIS = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "🙏",
  "🔥",
  "✅",
  "👏",
  "💯",
] as const;

export type ConnectReactionEmoji = (typeof CONNECT_REACTION_EMOJIS)[number];

export type ConnectConversationKind = "private" | "team";

export type ConnectPresenceStatus = "online" | "away" | "busy" | "offline";

export type ConnectActivity = "typing" | "recording" | "uploading" | null;

export type ConnectMessageType = "text" | "voice" | "system" | "attachment";

export type ConnectAttachmentKind =
  | "image"
  | "video"
  | "audio"
  | "voice"
  | "pdf"
  | "office"
  | "zip"
  | "other";

export type ConnectReceiptStatus = "sent" | "delivered" | "read";

export type ConnectPeer = {
  id: string;
  fullName: string;
  username: string | null;
  email: string | null;
  accessLevel: string | null;
  personId: string | null;
  initials: string;
  isActive: boolean;
};

export type ConnectPresence = {
  userId: string;
  status: ConnectPresenceStatus;
  customStatus: string | null;
  activity: ConnectActivity;
  activityConversationId: string | null;
  lastSeenAt: string;
  updatedAt: string;
};

export type ConnectAttachment = {
  id: string;
  messageId: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: ConnectAttachmentKind;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  signedUrl?: string | null;
};

export type ConnectReaction = {
  messageId: string;
  userId: string;
  emoji: ConnectReactionEmoji;
  createdAt: string;
};

export type ConnectMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  messageType: ConnectMessageType;
  replyToId: string | null;
  forwardedFromId: string | null;
  isPinned: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  deletedForEveryone: boolean;
  clientId: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: ConnectAttachment[];
  reactions: ConnectReaction[];
  /** Aggregate for current viewer (own outbound). */
  receipt: ConnectReceiptStatus;
  starred: boolean;
  replyPreview?: { id: string; body: string; senderName: string } | null;
  sender?: ConnectPeer | null;
  /** Optimistic local flag */
  pending?: boolean;
  failed?: boolean;
};

export type ConnectConversation = {
  id: string;
  kind: ConnectConversationKind;
  title: string | null;
  systemKey: string | null;
  dmKey: string | null;
  isSystem: boolean;
  pinnedMessageId: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  peers: ConnectPeer[];
  displayName: string;
  presence?: ConnectPresence | null;
  /** Member last_read_at for current user */
  lastReadAt: string | null;
};

export type ConnectSharedMedia = {
  attachments: ConnectAttachment[];
  links: { url: string; messageId: string; createdAt: string }[];
};

export type ConnectGlobalSearchHit =
  | { type: "user"; peer: ConnectPeer }
  | { type: "message"; message: ConnectMessage; conversationId: string }
  | { type: "file"; attachment: ConnectAttachment; conversationId: string };

/** UI-only stubs — do not implement call/share/channel/bot features yet. */
export type ConnectFutureStub =
  | "voice_call"
  | "video_call"
  | "screen_share"
  | "channels"
  | "bots"
  | "ai_assistant";
