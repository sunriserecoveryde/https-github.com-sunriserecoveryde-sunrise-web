import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Animated,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";
import NetInfo from "@react-native-community/netinfo";
import {
  reconcileConversationList,
  buildOptimisticBackEntry,
} from "@/utils/reconcileConversationList";
import {
  parsePendingDeletes,
  normalizePendingDeletes,
  addEntryToRaw,
  removeEntryFromRaw,
} from "@/utils/pendingDeletes";

// ---------------------------------------------------------------------------
// Offline detection helpers
// ---------------------------------------------------------------------------

/**
 * True when a fetch error looks like a network/connectivity failure.
 * React Native throws "Network request failed"; web throws "Failed to fetch" / "Load failed".
 */
function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("network request failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("load failed") ||
    msg.includes("networkerror") ||
    err.name === "TypeError"
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ConversationSummary {
  id: number;
  title: string;
  createdAt: string;
  lastMessagePreview?: string | null; // returned by the server; no local cache needed
  wasRenamed?: boolean; // user explicitly set a custom title via rename
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const DEVICE_ID_KEY    = "grow_chat_device_id_v1";
const CONV_RENAMED_KEY = "grow_chat_renamed_v2";    // { [convId]: true } — convs with a user-set title

// Persists the active chat so that a cold-start into the chat view can restore
// the correct conversation title immediately, without a "New conversation" flash.
// Written on every openConversation call and after in-chat renames.
// Cleared when the user navigates back to the list.
const ACTIVE_CONV_RESTORE_KEY = "grow_chat_active_conv_restore_v1";

// Legacy keys written by the pre-multi-session version of the app.
// Checked once on first mount; cleaned up after successful migration.
const LEGACY_CONV_ID_KEY = "grow_chat_conv_id_v1";
const LEGACY_MESSAGES_KEY = "grow_chat_messages_v1";

// Written after the fallback is safely persisted. Survives across list reloads
// so the synthetic "Previous session" entry is re-injected every time
// loadConversations runs until the server confirms the conv is accessible.
const LEGACY_PENDING_MIGRATION_KEY = "grow_chat_pending_legacy_conv_v1";

// Per-conv fallback: migrated local messages stored here until openConversation
// successfully loads from the server, then removed.
const migratedMsgsKey = (convId: number) => `grow_chat_migrated_msgs_${convId}`;

// Persists ids of conversations whose DELETE request has been issued but not
// yet confirmed by the server (e.g. the app was backgrounded while offline).
// loadConversations reads this and suppresses any matching id from the server
// list so a ghost entry cannot reappear on resume.  Entries carry a timestamp
// and expire after PENDING_DELETE_TTL_MS (24 h) so a failed DELETE can never
// permanently hide a conversation — the tombstone simply ages out and the
// conversation reappears on the next server fetch.
const PENDING_DELETE_KEY = "grow_chat_pending_deletes_v1";

/** Read the set of non-expired pending-delete conversation ids from AsyncStorage.
 *  On first read after an upgrade, any legacy v1 (plain number) entries are
 *  stamped with the current time and written back as v2, ensuring they will
 *  expire after PENDING_DELETE_TTL_MS and can never permanently hide a
 *  conversation on a device that never successfully retried the DELETE. */
async function readPendingDeletes(): Promise<Set<number>> {
  try {
    const nowMs = Date.now();
    const raw = await AsyncStorage.getItem(PENDING_DELETE_KEY);
    const ids = parsePendingDeletes(raw, nowMs);

    // Migrate v1 entries to v2 in the background so subsequent reads are
    // properly TTL-governed.  We only write when the normalized form differs
    // from what is already stored (i.e. there were v1 entries or expired ones).
    const normalized = normalizePendingDeletes(raw, nowMs);
    if (normalized !== raw) {
      if (normalized === null) {
        AsyncStorage.removeItem(PENDING_DELETE_KEY).catch(() => {});
      } else {
        AsyncStorage.setItem(PENDING_DELETE_KEY, normalized).catch(() => {});
      }
    }

    return ids;
  } catch {
    return new Set();
  }
}

/** Add a timestamped tombstone for convId; prunes expired entries at the same time. */
async function addPendingDelete(convId: number): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_DELETE_KEY);
    const updated = addEntryToRaw(raw, convId, Date.now());
    await AsyncStorage.setItem(PENDING_DELETE_KEY, updated);
  } catch {
    // Non-fatal — worst case the ghost appears once and vanishes on next fetch
  }
}

/** Remove the tombstone for convId once the DELETE has definitively settled. */
async function removePendingDelete(convId: number): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_DELETE_KEY);
    const updated = removeEntryFromRaw(raw, convId, Date.now());
    if (updated === null) {
      await AsyncStorage.removeItem(PENDING_DELETE_KEY);
    } else {
      await AsyncStorage.setItem(PENDING_DELETE_KEY, updated);
    }
  } catch {
    // Non-fatal
  }
}

// ---------------------------------------------------------------------------
// API base
// ---------------------------------------------------------------------------

function getApiBase(): string {
  if (Platform.OS === "web") return "/api";
  const envBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
  if (envBase) return envBase;
  return "http://localhost:3000/api";
}

// ---------------------------------------------------------------------------
// Device ID — a UUID generated once per install and sent as X-Device-Id.
// ---------------------------------------------------------------------------

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let _cachedDeviceId: string | null = null;

async function getDeviceId(): Promise<string> {
  if (_cachedDeviceId) return _cachedDeviceId;
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) { _cachedDeviceId = stored; return stored; }
  const fresh = generateUUID();
  await AsyncStorage.setItem(DEVICE_ID_KEY, fresh);
  _cachedDeviceId = fresh;
  return fresh;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "long" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

const DEFAULT_TITLE = "Grow Support Chat";

function chatTitle(conv: ConversationSummary): string {
  // A conversation the user explicitly renamed always shows its server title,
  // even if the chosen name happens to equal the default string.
  if (conv.wasRenamed) return conv.title || "Untitled conversation";
  // For auto-titled convs, show the cached first-message snippet if available.
  if (conv.title && conv.title !== DEFAULT_TITLE) return conv.title;
  if (conv.lastMessagePreview) return conv.lastMessagePreview;
  return conv.title || "New conversation";
}

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------

function MessageBubble({
  message,
  colors,
}: {
  message: ChatMessage;
  colors: ReturnType<typeof useColors>;
}) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: colors.primary }]
            : [styles.bubbleAI, { backgroundColor: colors.card, borderColor: colors.border }],
        ]}
      >
        <Text style={[styles.bubbleText, { color: isUser ? "#fff" : colors.foreground }]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CrisisBanner — always visible, cannot be dismissed
// ---------------------------------------------------------------------------

function CrisisBanner({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View
      style={[
        styles.crisisBanner,
        { backgroundColor: colors.muted, borderColor: colors.border },
      ]}
    >
      <Ionicons name="information-circle-outline" size={14} color={colors.mutedForeground} />
      <Text style={[styles.crisisText, { color: colors.mutedForeground }]}>
        Not a therapist. For crisis support, call or text{" "}
        <Text style={{ fontFamily: "Inter_700Bold" }}>988</Text> anytime.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// TypingIndicator — three animated dots shown while AI is composing
// ---------------------------------------------------------------------------

function TypingIndicator({ colors }: { colors: ReturnType<typeof useColors> }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );

    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 200);
    const a3 = pulse(dot3, 400);
    a1.start();
    a2.start();
    a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [
      {
        translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }),
      },
    ],
  });

  return (
    <View style={styles.bubbleRow}>
      <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
      </View>
      <View
        style={[
          styles.bubble,
          styles.bubbleAI,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.typingDots}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                styles.typingDot,
                { backgroundColor: colors.primary },
                dotStyle(dot),
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// RenameModal — bottom-sheet style inline rename dialog
// ---------------------------------------------------------------------------

function RenameModal({
  visible,
  initialTitle,
  colors,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  initialTitle: string;
  colors: ReturnType<typeof useColors>;
  onConfirm: (title: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initialTitle);

  // Reset draft whenever the modal opens with a new title
  useEffect(() => {
    if (visible) setDraft(initialTitle);
  }, [visible, initialTitle]);

  const handleConfirm = () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0) return;
    onConfirm(trimmed);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.renameOverlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.renameSheet,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.renameTitle, { color: colors.foreground }]}>
                Rename conversation
              </Text>
              <TextInput
                style={[
                  styles.renameInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                value={draft}
                onChangeText={setDraft}
                placeholder="Conversation name"
                placeholderTextColor={colors.mutedForeground}
                maxLength={100}
                autoFocus
                selectTextOnFocus
                returnKeyType="done"
                onSubmitEditing={handleConfirm}
              />
              <View style={styles.renameActions}>
                <TouchableOpacity
                  onPress={onCancel}
                  activeOpacity={0.7}
                  style={[styles.renameBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.renameBtnText, { color: colors.mutedForeground }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                  style={[
                    styles.renameBtn,
                    styles.renameBtnPrimary,
                    {
                      backgroundColor:
                        draft.trim().length > 0 ? colors.primary : colors.muted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.renameBtnText,
                      { color: draft.trim().length > 0 ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// ConversationListItem
// ---------------------------------------------------------------------------

function ConversationListItem({
  conv,
  colors,
  onOpen,
  onDelete,
  onRename,
  isListLoading,
}: {
  conv: ConversationSummary;
  colors: ReturnType<typeof useColors>;
  onOpen: () => void;
  onDelete: () => void;
  onRename: () => void;
  isListLoading: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onOpen}
      onLongPress={() => {
        if (isListLoading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onRename();
      }}
      delayLongPress={400}
      style={[styles.convItem, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.convIconWrap, { backgroundColor: colors.primary + "18" }]}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.convItemBody}>
        <Text
          style={[styles.convItemTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {chatTitle(conv)}
        </Text>
        <Text style={[styles.convItemDate, { color: colors.mutedForeground }]}>
          {formatRelativeDate(conv.createdAt)}
        </Text>
      </View>
      <View style={styles.convRowActions}>
        <TouchableOpacity
          onPress={isListLoading ? undefined : onRename}
          disabled={isListLoading}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.convActionBtn}
        >
          <Feather name="edit-2" size={14} color={isListLoading ? colors.muted : colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.convActionBtn}
        >
          <Feather name="trash-2" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// OfflineBanner — shown when network is unavailable
// ---------------------------------------------------------------------------

function OfflineBanner({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View
      style={[
        styles.offlineBanner,
        { backgroundColor: "#FFF3CD", borderColor: "#FBBF24" },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={14} color="#92400E" />
      <Text style={[styles.offlineText, { color: "#92400E" }]}>
        You're offline — messages can't be sent right now.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

type ViewMode = "list" | "chat";

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  // ---------------------------------------------------------------------------
  // Shared state
  // ---------------------------------------------------------------------------
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("list");

  // ---------------------------------------------------------------------------
  // List view state
  // ---------------------------------------------------------------------------
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [renamedIds, setRenamedIds] = useState<Record<string, true>>({});

  // ---------------------------------------------------------------------------
  // Rename modal state — list view
  // ---------------------------------------------------------------------------
  const [renamingConv, setRenamingConv] = useState<ConversationSummary | null>(null);

  // ---------------------------------------------------------------------------
  // Chat view rename state
  // ---------------------------------------------------------------------------
  const [chatConvTitle, setChatConvTitle] = useState<string>("New conversation");
  const [showChatRenameModal, setShowChatRenameModal] = useState(false);

  // ---------------------------------------------------------------------------
  // Chat view state
  // ---------------------------------------------------------------------------
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  // Holds the conv ID found in legacy storage, used once to ensure it appears
  // in the list. Null means either no legacy data or migration already done.
  const [legacyConvId, setLegacyConvId] = useState<number | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const convListRef = useRef<FlatList>(null);

  // Holds the conversation the user just navigated back from, so
  // loadConversations can re-inject it if the server response is slow or
  // doesn't include it yet (e.g. race / brief offline window).
  // Cleared once the server confirms the conversation is present.
  const optimisticBackConvRef = useRef<ConversationSummary | null>(null);

  // Mirror of the conversations state kept in sync via useEffect below.
  // Used by callbacks with empty/minimal dep arrays (loadConversations,
  // goBackToList) so they can check current list membership without
  // capturing a stale closure value.
  const conversationsRef = useRef<ConversationSummary[]>([]);

  // Tracks an in-flight rename title (user-typed, server not yet confirmed).
  // Set when the user confirms the in-chat rename modal; cleared when the
  // rename request settles. Used by goBackToList so the optimistic back-nav
  // entry shows the pending title rather than the last confirmed one.
  const pendingRenameTitleRef = useRef<string | null>(null);

  // Holds the last server-confirmed title for the active conversation.
  // Updated only when a PATCH /conversations/:id returns 2xx, and initialised
  // when a conversation is opened or cold-start restored. On rename failure,
  // the rollback target is always this ref — NOT an AsyncStorage snapshot
  // captured at the start of the call. This prevents rapid successive renames
  // (where the second call's snapshot already contains the first call's
  // optimistic/unconfirmed title) from rolling back to an intermediate state.
  const lastConfirmedTitleRef = useRef<string | null>(null);

  // Maps conversation id → last server-confirmed title for list-view entries.
  // Populated whenever loadConversations returns server data and on rename
  // success. Used by the rename-failure rollback to restore the list entry to
  // a known-good server title rather than to whatever optimistic value the
  // conversations array happened to hold when the modal was opened.
  const confirmedListTitlesRef = useRef<Map<number, string>>(new Map());

  // Tracks the conversation whose PATCH rename is currently in-flight.
  // Set immediately before the fetch; cleared in the finally block so both
  // success and failure lift the guard. While set, loadConversations will
  // preserve the optimistic title for this conversation ID rather than
  // overwriting it with whatever the server still reports (the old title).
  const inFlightRenameRef = useRef<{ convId: number; title: string } | null>(null);

  // Keep conversationsRef in sync so zero-dep callbacks can read current state.
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Track online / offline transitions — cross-platform via NetInfo
  useEffect(() => {
    // Set initial connectivity state
    NetInfo.fetch().then((state) => {
      setIsOffline(state.isConnected === false);
    });
    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return unsubscribe;
  }, []);

  // ---------------------------------------------------------------------------
  // Init: load device ID
  // ---------------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const dId = await getDeviceId();
        setDeviceId(dId);

        const rawRenamed = await AsyncStorage.getItem(CONV_RENAMED_KEY);
        if (rawRenamed) setRenamedIds(JSON.parse(rawRenamed));
      } catch (e) {
        console.warn("Chat init error:", e);
      }
    })();
  }, []);

  // ---------------------------------------------------------------------------
  // Cold-start restore: if the app was killed while a conversation was open,
  // reopen it with the persisted title so the header never shows "New
  // conversation" while the server fetch is in flight.
  // Runs once when deviceId first becomes available (transitions null → string).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!deviceId) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ACTIVE_CONV_RESTORE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as { convId: number; title: string };
        if (
          typeof parsed?.convId !== "number" ||
          isNaN(parsed.convId)
        ) return;
        // openConversation sets chatConvTitle immediately from the title arg
        // before the network fetch completes, eliminating the "New conversation"
        // flash on cold start.
        openConversation(parsed.convId, parsed.title || "New conversation");
      } catch (e) {
        console.warn("Chat cold-start restore error:", e);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]); // run exactly once — openConversation is stable after deviceId is set

  // ---------------------------------------------------------------------------
  // One-time legacy migration: grow_chat_conv_id_v1 → multi-session list
  //
  // The pre-multi-session app wrote messages to grow_chat_messages_v1 (local)
  // and the server-side conversation ID to grow_chat_conv_id_v1. We must read
  // both before deleting so users don't lose history if the server is
  // unreachable on first launch after the upgrade.
  //
  // Steps:
  //  1. Read both legacy keys atomically.
  //  2. Persist the messages under a per-conv fallback key so openConversation
  //     can display them if the server fetch fails (e.g. offline).
  //  3. Seed the preview cache from the first user message.
  //  4. Write LEGACY_PENDING_MIGRATION_KEY so every subsequent loadConversations
  //     call can re-inject the synthetic entry until the server confirms access.
  //  5. Only then remove the original legacy keys.
  //  6. Set legacyConvId state for an immediate injection on this first mount
  //     (races with loadConversations; the guard in the effect prevents doubles).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const [[, rawId], [, rawMsgs]] = await AsyncStorage.multiGet([
          LEGACY_CONV_ID_KEY,
          LEGACY_MESSAGES_KEY,
        ]);

        if (!rawId) return; // No legacy data — nothing to do

        const convId = parseInt(rawId, 10);
        if (isNaN(convId)) {
          // Malformed ID — nothing to migrate; clean up and bail
          await AsyncStorage.multiRemove([LEGACY_CONV_ID_KEY, LEGACY_MESSAGES_KEY]);
          return;
        }

        // Persist the local message array as an offline fallback BEFORE touching
        // legacy keys. Parse and write errors are handled separately:
        //  - Parse failure → messages are unrecoverable; proceed without fallback.
        //  - Write failure → storage is unhealthy; abort migration entirely and
        //    leave legacy keys intact so the next launch can retry.
        if (rawMsgs) {
          let legacyMsgs: ChatMessage[] | null = null;
          try {
            legacyMsgs = JSON.parse(rawMsgs);
          } catch {
            // Malformed JSON — treat as no messages; safe to continue
          }

          if (legacyMsgs !== null) {
            // Write MUST succeed before we touch legacy keys. If it throws,
            // the outer catch aborts migration and legacy keys are preserved.
            await AsyncStorage.setItem(migratedMsgsKey(convId), rawMsgs);

          }
        }

        // Write the persistent migration marker. This also throws on storage
        // failure, aborting before we touch legacy keys.
        await AsyncStorage.setItem(LEGACY_PENDING_MIGRATION_KEY, String(convId));

        // Both fallback and marker are durable — now safe to remove legacy keys.
        await AsyncStorage.multiRemove([LEGACY_CONV_ID_KEY, LEGACY_MESSAGES_KEY]);

        // Set state for an immediate first-render injection (loadConversations
        // may have already run before this async block finished; the "after
        // load" effect's guard prevents double-injection).
        setLegacyConvId(convId);
      } catch (e) {
        console.warn("Legacy chat migration error:", e);
      }
    })();
  }, []); // Intentionally runs once on mount

  // ---------------------------------------------------------------------------
  // Load conversation list
  //
  // After every server fetch, checks LEGACY_PENDING_MIGRATION_KEY so the
  // synthetic "Previous session" entry is re-injected whenever the user returns
  // to the list — even if loadConversations ran before the migration effect
  // finished writing the marker on first mount.
  // ---------------------------------------------------------------------------
  const loadConversations = useCallback(async (dId: string) => {
    setIsLoadingList(true);

    // Read both the pending migration marker and pending delete intents in
    // parallel so we have full awareness before processing the server list.
    let pendingLegacyId: number | null = null;
    let pendingDeletes: Set<number> = new Set();
    try {
      const [pendingRaw] = await Promise.all([
        AsyncStorage.getItem(LEGACY_PENDING_MIGRATION_KEY),
        readPendingDeletes().then((s) => { pendingDeletes = s; }),
      ]);
      if (pendingRaw) {
        const parsed = parseInt(pendingRaw, 10);
        if (!isNaN(parsed)) pendingLegacyId = parsed;
      }
    } catch {
      // Storage read failed — continue without migration awareness
    }

    try {
      const res = await fetch(`${getApiBase()}/anthropic/conversations`, {
        headers: { "X-Device-Id": dId },
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: Array<{ id: number; title: string; createdAt: string; lastMessagePreview?: string | null }> = await res.json();
      // Newest first; strip any conversation whose delete is still in-flight so
      // a background delete that hasn't settled yet doesn't reappear on resume.
      const sorted = [...data]
        .filter((c) => !pendingDeletes.has(c.id))
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      // Reconcile the optimistic back-navigation entry: if the server list
      // doesn't include the conversation yet (e.g. a brief race where the
      // response arrived before the DB committed), keep it pinned at the top
      // so it doesn't vanish.  Once confirmed, clear the ref.
      const { baseList, clearOptimistic } = reconcileConversationList(
        sorted,
        optimisticBackConvRef.current,
        conversationsRef.current
      );
      if (clearOptimistic) {
        optimisticBackConvRef.current = null;
      }

      // Record the server-confirmed title for every conversation returned so
      // the rename-failure rollback can restore a known-good value even when
      // the conversations array temporarily holds an optimistic entry.
      for (const c of sorted) {
        confirmedListTitlesRef.current.set(c.id, c.title);
      }

      // Guard: if a rename PATCH is in-flight for a specific conversation,
      // don't let the server response (which still carries the old title) stomp
      // the optimistic title that the user already sees. Once the PATCH settles
      // (success or failure) the ref is cleared and the next loadConversations
      // can freely overwrite the title with whatever the server returns.
      const inFlight = inFlightRenameRef.current;
      const guardedList = inFlight
        ? baseList.map((c) =>
            c.id === inFlight.convId ? { ...c, title: inFlight.title } : c
          )
        : baseList;

      if (pendingLegacyId !== null) {
        if (guardedList.some((c) => c.id === pendingLegacyId)) {
          // Server returned it — migration confirmed; wipe all migration state
          AsyncStorage.multiRemove([
            LEGACY_PENDING_MIGRATION_KEY,
            migratedMsgsKey(pendingLegacyId),
          ]).catch(() => {});
          setConversations(guardedList);
        } else {
          // Server hasn't surfaced the legacy conv yet — keep synthetic at top
          const synthetic: ConversationSummary = {
            id: pendingLegacyId,
            title: "Previous session",
            createdAt: new Date().toISOString(),
          };
          setConversations([synthetic, ...guardedList]);
        }
      } else {
        setConversations(guardedList);
      }
    } catch (e) {
      console.warn("Failed to load conversations:", e);

      // Even on a network failure, surface the synthetic entry so users can
      // open their migrated history from the offline fallback.
      if (pendingLegacyId !== null) {
        setConversations((prev) => {
          if (prev.some((c) => c.id === pendingLegacyId)) return prev;
          const synthetic: ConversationSummary = {
            id: pendingLegacyId as number,
            title: "Previous session",
            createdAt: new Date().toISOString(),
          };
          return [synthetic, ...prev];
        });
      }
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // First-render injection: handles the race where the migration effect finishes
  // AFTER loadConversations has already run (before LEGACY_PENDING_MIGRATION_KEY
  // was written). On the next navigation back, loadConversations picks it up
  // from AsyncStorage; this effect bridges that first-session gap.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (legacyConvId === null || isLoadingList) return;

    setConversations((prev) => {
      // Already in the list (server returned it or synthetic already injected)
      if (prev.some((c) => c.id === legacyConvId)) return prev;

      const synthetic: ConversationSummary = {
        id: legacyConvId,
        title: "Previous session",
        createdAt: new Date().toISOString(),
      };
      return [synthetic, ...prev];
    });

    // Clear in-memory flag — persistence is now handled by the AsyncStorage key
    setLegacyConvId(null);
  }, [legacyConvId, isLoadingList]);

  // Load list whenever deviceId is ready or we return to list view
  useEffect(() => {
    if (deviceId && view === "list") {
      loadConversations(deviceId);
    }
  }, [deviceId, view, loadConversations]);

  // Scroll to bottom on new chat content or when typing indicator appears
  useEffect(() => {
    if (view === "chat" && (chatMessages.length > 0 || streamingContent || isSending)) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [chatMessages, streamingContent, isSending, view]);

  // ---------------------------------------------------------------------------
  // Open a past conversation
  // ---------------------------------------------------------------------------
  const openConversation = useCallback(async (convId: number, initialTitle?: string) => {
    if (!deviceId) return;
    const resolvedTitle = initialTitle ?? "New conversation";
    setActiveConvId(convId);
    setChatMessages([]);
    setStreamingContent("");
    setInput("");
    setChatConvTitle(resolvedTitle);
    // Record the server-confirmed title baseline. openConversation is called
    // either with the stored title on cold-start or with the server-returned
    // title from the list — either way it represents the last known good state.
    lastConfirmedTitleRef.current = resolvedTitle;
    setView("chat");
    setIsLoadingMessages(true);

    // Persist the active conversation so a cold-start can restore the title
    // immediately without a "New conversation" flash.
    AsyncStorage.setItem(
      ACTIVE_CONV_RESTORE_KEY,
      JSON.stringify({ convId, title: resolvedTitle })
    ).catch(() => {});

    try {
      const res = await fetch(
        `${getApiBase()}/anthropic/conversations/${convId}`,
        { headers: { "X-Device-Id": deviceId } }
      );
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: { messages: Array<{ id: number; role: string; content: string; createdAt: string }> } =
        await res.json();
      const msgs: ChatMessage[] = (data.messages ?? []).map((m) => ({
        id: String(m.id),
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.createdAt).getTime(),
      }));
      setChatMessages(msgs);

      // Clean up the per-conv message fallback now that the server has responded.
      // Only remove LEGACY_PENDING_MIGRATION_KEY if this is the actual legacy
      // conversation — opening any other conv must not prematurely clear the
      // marker and hide the "Previous session" entry from the list.
      try {
        const pendingRaw = await AsyncStorage.getItem(LEGACY_PENDING_MIGRATION_KEY);
        const pendingLegacyId = pendingRaw ? parseInt(pendingRaw, 10) : NaN;
        const keysToRemove = [migratedMsgsKey(convId)];
        if (!isNaN(pendingLegacyId) && pendingLegacyId === convId) {
          keysToRemove.push(LEGACY_PENDING_MIGRATION_KEY);
        }
        AsyncStorage.multiRemove(keysToRemove).catch(() => {});
      } catch {
        // Storage read failed — leave keys in place; they'll be cleaned up
        // the next time loadConversations confirms the conv from the server.
      }
    } catch (e) {
      console.warn("Failed to load messages:", e);

      // If the fetch failed because we're offline, mark it immediately so the
      // OfflineBanner appears without waiting for the next NetInfo event.
      // This covers the cold-start case where NetInfo hasn't fired yet.
      if (isNetworkError(e)) {
        setIsOffline(true);
      }

      // Fall back to the locally-migrated messages so the user isn't left with
      // an empty chat (e.g. offline on first launch after the upgrade).
      try {
        const fallbackRaw = await AsyncStorage.getItem(migratedMsgsKey(convId));
        if (fallbackRaw) {
          const fallbackMsgs: ChatMessage[] = JSON.parse(fallbackRaw);
          if (fallbackMsgs.length > 0) {
            setChatMessages(fallbackMsgs);
          }
        }
      } catch {
        // Fallback unavailable — show empty chat
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }, [deviceId]);

  // ---------------------------------------------------------------------------
  // Start a new chat
  // ---------------------------------------------------------------------------
  const startNewChat = useCallback(async () => {
    if (!deviceId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await fetch(`${getApiBase()}/anthropic/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": deviceId,
        },
        body: JSON.stringify({ title: "Grow Support Chat" }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: { id: number } = await res.json();
      setActiveConvId(data.id);
      setChatMessages([]);
      setStreamingContent("");
      setInput("");
      setChatConvTitle("New conversation");
      // New conversations have no prior confirmed title yet.
      lastConfirmedTitleRef.current = "New conversation";
      setView("chat");
      setIsLoadingMessages(false);
    } catch (e) {
      console.warn("Failed to create conversation:", e);
    }
  }, [deviceId]);

  // ---------------------------------------------------------------------------
  // Go back to list
  // ---------------------------------------------------------------------------
  // skipOptimistic must be true when called after a deletion so the just-deleted
  // conversation is not re-injected into the list by the optimistic update.
  const goBackToList = useCallback((skipOptimistic = false) => {
    // Optimistically place the conversation we're leaving at the top of the
    // list immediately, before loadConversations resolves. This prevents the
    // conversation from disappearing when the user backs out while the server
    // is slow or the device is briefly offline.
    // Skipped when returning from a delete — we don't want to re-add a ghost.
    if (!skipOptimistic) {
      // Guard: if the conversation has already been removed from state (e.g.
      // deleted while a PATCH was in-flight and the app was backgrounded),
      // buildOptimisticBackEntry returns null and we skip the injection so the
      // ghost can't come back.
      const optimistic = buildOptimisticBackEntry(
        activeConvId,
        conversationsRef.current,
        pendingRenameTitleRef.current,
        chatConvTitle,
        new Date().toISOString()
      );
      if (optimistic !== null) {
        optimisticBackConvRef.current = optimistic;
        setConversations((prev) => {
          const rest = prev.filter((c) => c.id !== optimistic.id);
          return [optimistic, ...rest];
        });
      }
    }

    setView("list");
    setActiveConvId(null);
    setChatMessages([]);
    setStreamingContent("");
    setInput("");
    // Clear the restore key so a cold-start doesn't re-open a conv the user
    // intentionally left.
    AsyncStorage.removeItem(ACTIVE_CONV_RESTORE_KEY).catch(() => {});
  }, [activeConvId, chatConvTitle]);

  // ---------------------------------------------------------------------------
  // Rename a conversation
  // ---------------------------------------------------------------------------
  const renameConversation = useCallback(async (convId: number, newTitle: string, originalTitle: string) => {
    if (!deviceId) return;

    if (convId === activeConvId) {
      // Optimistically update UI and the restore key immediately so that a
      // force-quit between now and the PATCH response persists the pending
      // title rather than the stale confirmed one.
      //
      // NOTE: we do NOT snapshot AsyncStorage here for rollback. Rapid successive
      // renames could cause a second call to read an already-optimistic value
      // from the first call, making the rollback target an intermediate
      // (unconfirmed) title. Instead, rollback always targets lastConfirmedTitleRef
      // which is updated only on a server 2xx — see below.
      setChatConvTitle(newTitle);
      AsyncStorage.setItem(
        ACTIVE_CONV_RESTORE_KEY,
        JSON.stringify({ convId, title: newTitle })
      ).catch(() => {});
    }

    // Optimistically update the conversations list immediately for both the
    // chat-view and list-view rename paths. The catch block rolls this back
    // using originalTitle if the PATCH fails.
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
    );
    // Keep the optimistic back-nav ref consistent so a loadConversations call
    // that fires before the PATCH resolves doesn't re-inject the stale title.
    if (optimisticBackConvRef.current?.id === convId) {
      optimisticBackConvRef.current = {
        ...optimisticBackConvRef.current,
        title: newTitle,
      };
    }

    // Mark this rename as in-flight so loadConversations doesn't overwrite the
    // optimistic title with the server's stale value during the PATCH request.
    inFlightRenameRef.current = { convId, title: newTitle };

    try {
      const res = await fetch(`${getApiBase()}/anthropic/conversations/${convId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": deviceId,
        },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      // Rename confirmed by server — advance the confirmed-title baseline so
      // any subsequent failure rolls back to this newly confirmed title, not
      // the one that was confirmed before this rename.
      if (convId === activeConvId) {
        lastConfirmedTitleRef.current = newTitle;
      }
      // Advance the per-conv confirmed-title map so rollback always targets a
      // real server-confirmed value, not an intermediate optimistic one.
      confirmedListTitlesRef.current.set(convId, newTitle);
      // Clear the pending ref so goBackToList stops using it.
      pendingRenameTitleRef.current = null;
      // Mark the conversation as explicitly renamed so chatTitle never lets
      // the server preview snippet shadow the custom title on cold start —
      // even if the chosen name happens to equal the default string.
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, wasRenamed: true } : c))
      );
      setRenamedIds((prev) => {
        const next = { ...prev, [String(convId)]: true as const };
        AsyncStorage.setItem(CONV_RENAMED_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    } catch (e) {
      // Rename failed — determine the authoritative rollback title.
      // - Chat view (convId === activeConvId): prefer lastConfirmedTitleRef,
      //   which is updated only on 2xx, so rapid successive renames always
      //   revert to a real server-confirmed state, not an intermediate value.
      // - List view (convId !== activeConvId): prefer confirmedListTitlesRef,
      //   which is populated by loadConversations and rename success for every
      //   conversation. This prevents the modal from being pre-filled with a
      //   stale optimistic title (e.g. from a goBackToList back-nav entry) if
      //   the rename is retried after a failure.
      // Fall back to originalTitle only when neither ref has a record for this
      // conversation (e.g. first rename ever on a brand-new conversation).
      const rollbackTitle =
        convId === activeConvId
          ? (lastConfirmedTitleRef.current ?? originalTitle)
          : (confirmedListTitlesRef.current.get(convId) ?? originalTitle);
      pendingRenameTitleRef.current = null;

      // Restore the list entry so it doesn't keep showing a title that never
      // took effect on the server.
      // Guard: skip the rollback if the conversation was deleted while the PATCH
      // was in-flight — rolling back a missing entry would re-insert a ghost.
      setConversations((prev) => {
        if (!prev.some((c) => c.id === convId)) return prev;
        return prev.map((c) => (c.id === convId ? { ...c, title: rollbackTitle } : c));
      });

      // If the optimistic back-nav ref still holds the pending (failed) title,
      // roll it back too.  Without this, a subsequent loadConversations call
      // that doesn't find the conversation in the server response will
      // re-inject the stale pending title from the ref, undoing the rollback
      // above and leaving the list showing a title the server never accepted.
      if (optimisticBackConvRef.current?.id === convId) {
        optimisticBackConvRef.current = {
          ...optimisticBackConvRef.current,
          title: rollbackTitle,
        };
      }

      if (convId === activeConvId) {
        const confirmedTitle = lastConfirmedTitleRef.current;
        if (confirmedTitle !== null) {
          setChatConvTitle(confirmedTitle);
          AsyncStorage.setItem(
            ACTIVE_CONV_RESTORE_KEY,
            JSON.stringify({ convId, title: confirmedTitle })
          ).catch(() => {});
        } else {
          // No confirmed title recorded yet (e.g. a brand-new conversation that
          // was never successfully renamed) — clear the restore key so a
          // cold-start doesn't show a stale optimistic title.
          AsyncStorage.removeItem(ACTIVE_CONV_RESTORE_KEY).catch(() => {});
        }
      }
      console.warn("Failed to rename conversation:", e);
      Alert.alert("Rename failed", "Could not save the new title. Please try again.");
    } finally {
      // Lift the in-flight guard so the next loadConversations call (e.g. a
      // pull-to-refresh or focus event) can freely update this conversation's
      // title with whatever the server now reports.
      inFlightRenameRef.current = null;
    }
  }, [deviceId, activeConvId]);

  // ---------------------------------------------------------------------------
  // Delete a conversation
  // ---------------------------------------------------------------------------
  const deleteConversation = useCallback(async (convId: number, fromChat = false) => {
    if (!deviceId) return;

    const doDelete = async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Persist the delete intent BEFORE the network request so that if the app
      // is backgrounded or the request fails mid-flight, loadConversations will
      // still suppress this id from the server list on the next resume.
      await addPendingDelete(convId);

      // Optimistically remove from local state immediately.
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      // Clear any optimistic back-nav entry for this conv so loadConversations
      // doesn't re-inject it after the delete.
      if (optimisticBackConvRef.current?.id === convId) {
        optimisticBackConvRef.current = null;
      }
      if (fromChat) goBackToList(true /* skipOptimistic */);

      try {
        const res = await fetch(`${getApiBase()}/anthropic/conversations/${convId}`, {
          method: "DELETE",
          headers: { "X-Device-Id": deviceId },
        });
        if (res.ok || res.status === 404) {
          // 200 or 404 both mean the conversation is definitively gone — clear
          // the tombstone and the renamed-flag cache entry.
          await removePendingDelete(convId);
          setRenamedIds((prev) => {
            if (!prev[String(convId)]) return prev;
            const next = { ...prev };
            delete next[String(convId)];
            AsyncStorage.setItem(CONV_RENAMED_KEY, JSON.stringify(next)).catch(() => {});
            return next;
          });
        } else {
          // Definitive server error (4xx other than 404, 5xx) — the DELETE did
          // not go through.  Clear the tombstone and restore the conversation so
          // it is never permanently hidden on this device.
          await removePendingDelete(convId);
          setConversations((prev) => {
            // Only restore if it isn't already in the list (idempotent).
            if (prev.some((c) => c.id === convId)) return prev;
            const restored: ConversationSummary = {
              id: convId,
              title: confirmedListTitlesRef.current.get(convId) ?? "Conversation",
              createdAt: new Date().toISOString(),
            };
            return [restored, ...prev];
          });
          console.warn(`Delete failed with status ${res.status} — conversation restored.`);
        }
      } catch (e) {
        // Network-level failure (offline, timeout).  The tombstone stays in
        // place with its 24-hour TTL so that if the app is force-quit here the
        // conversation doesn't ghost back on the next resume.  After 24 h the
        // tombstone expires automatically and the conversation reappears.
        // A future retry task (#460) can clear it sooner on reconnect.
        console.warn("Failed to delete conversation (tombstone TTL guards against permanent hide):", e);
      }
    };

    if (Platform.OS === "web") {
      await doDelete();
    } else {
      Alert.alert(
        "Delete conversation?",
        "This chat will be permanently removed.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: doDelete },
        ]
      );
    }
  }, [deviceId, goBackToList]);

  // ---------------------------------------------------------------------------
  // Send message with SSE streaming
  // ---------------------------------------------------------------------------
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending || activeConvId === null || deviceId === null) return;

    // Check connectivity before attempting any network call
    if (isOffline) {
      const offlineMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content:
          "You appear to be offline right now. Please check your connection and try again when you're back online.\n\nIf you need immediate support, you can call or text 988 — they're available 24/7.",
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, offlineMsg]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput("");
    setIsSending(true);
    setStreamingContent("");

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    let accumulated = "";

    try {
      const response = await fetch(
        `${getApiBase()}/anthropic/conversations/${activeConvId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Device-Id": deviceId,
          },
          body: JSON.stringify({ content: text }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(body.error ?? `Server error ${response.status}`);
      }

      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const rawJson = line.slice(6).trim();
          if (!rawJson) continue;

          let payload: { content?: string; done?: boolean; error?: string };
          try {
            payload = JSON.parse(rawJson);
          } catch {
            continue;
          }

          if (payload.error) throw new Error(payload.error);
          if (payload.done) break outer;
          if (payload.content) {
            accumulated += payload.content;
            setStreamingContent(accumulated);
          }
        }
      }

      if (accumulated) {
        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: accumulated,
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: unknown) {
      setStreamingContent("");

      const networkFailure = isNetworkError(err);

      // Mark offline so the banner appears and the input bar disables
      if (networkFailure) {
        setIsOffline(true);
      }

      // Distinguish connectivity failures from server errors
      const errorContent = networkFailure
        ? "It looks like the connection was lost mid-message. Your feelings matter — please try again when you're back online.\n\nIf you need immediate support, call or text 988 anytime."
        : "I ran into a problem and couldn't respond right now. Please try again in a moment.\n\nIf you're in crisis, please call or text 988.";

      const errorMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: errorContent,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, activeConvId, deviceId, isOffline, chatMessages.length]);

  // ---------------------------------------------------------------------------
  // Annotate conversations with the wasRenamed flag from AsyncStorage
  // ---------------------------------------------------------------------------
  const conversationsWithPreviews: ConversationSummary[] = conversations.map((c) => ({
    ...c,
    wasRenamed: renamedIds[String(c.id)] === true || c.wasRenamed,
  }));

  // ---------------------------------------------------------------------------
  // Render: list view
  // ---------------------------------------------------------------------------
  const bottomPad = isWeb ? 100 : insets.bottom + 90;

  if (view === "list") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader
          title="AI Support Chat"
          subtitle="Empathetic guidance for your recovery"
          rightElement={
            <TouchableOpacity
              onPress={startNewChat}
              activeOpacity={0.7}
              style={[styles.newChatBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.newChatBtnText}>New Chat</Text>
            </TouchableOpacity>
          }
        />

        <CrisisBanner colors={colors} />

        {isLoadingList ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : conversations.length === 0 ? (
          // Empty state
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name="chatbubbles-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No conversations yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Tap <Text style={{ fontFamily: "Inter_600SemiBold" }}>New Chat</Text> to start talking with your AI recovery companion.
            </Text>
            <TouchableOpacity
              onPress={startNewChat}
              activeOpacity={0.8}
              style={[styles.startChatCta, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="sparkles" size={16} color="#fff" />
              <Text style={styles.startChatCtaText}>Start your first chat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={convListRef}
            data={conversations}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.convList, { paddingBottom: bottomPad }]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <ConversationListItem
                conv={item}
                colors={colors}
                onOpen={() => openConversation(item.id, chatTitle(item))}
                onDelete={() => deleteConversation(item.id, false)}
                onRename={() => setRenamingConv(item)}
                isListLoading={isLoadingList}
              />
            )}
          />
        )}

        {/* Rename modal — rendered inside the list view so it floats above everything */}
        <RenameModal
          visible={renamingConv !== null}
          initialTitle={renamingConv ? chatTitle(renamingConv) : ""}
          colors={colors}
          onConfirm={(newTitle) => {
            if (renamingConv) {
              renameConversation(renamingConv.id, newTitle, chatTitle(renamingConv));
            }
            setRenamingConv(null);
          }}
          onCancel={() => setRenamingConv(null)}
        />
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: chat view
  // ---------------------------------------------------------------------------

  // Merge real messages with live streaming placeholder or typing indicator
  type ListItem = ChatMessage | "streaming" | "typing";
  const listData: ListItem[] = streamingContent
    ? [
        ...chatMessages,
        {
          id: "streaming",
          role: "assistant" as const,
          content: streamingContent,
          timestamp: Date.now(),
        },
      ]
    : isSending
    ? [...chatMessages, "typing"]
    : chatMessages;

  const renderMessage = ({ item }: { item: ListItem }) => {
    if (item === "typing") return <TypingIndicator colors={colors} />;
    if (typeof item === "string") return null;
    return <MessageBubble message={item} colors={colors} />;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={chatConvTitle}
        onTitlePress={activeConvId !== null ? () => setShowChatRenameModal(true) : undefined}
        leftElement={
          <TouchableOpacity onPress={() => goBackToList()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        }
        rightElement={
          activeConvId !== null ? (
            <>
              <TouchableOpacity
                onPress={() => setShowChatRenameModal(true)}
                activeOpacity={0.7}
                style={styles.clearBtn}
                accessibilityLabel="Rename conversation"
              >
                <Feather name="edit-2" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteConversation(activeConvId, true)}
                activeOpacity={0.7}
                style={styles.clearBtn}
              >
                <Feather name="trash-2" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </>
          ) : undefined
        }
      />

      <CrisisBanner colors={colors} />
      {isOffline && <OfflineBanner colors={colors} />}

      {isLoadingMessages ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : chatMessages.length === 0 && !streamingContent && !isSending ? (
        // Empty state — offline restore vs. normal new conversation
        isOffline && activeConvId !== null ? (
          // Restored a conversation while offline: messages couldn't load.
          // Show a clear offline state rather than the suggestion chips which
          // imply the user can start sending.
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: "#FFF3CD" }]}>
              <Ionicons name="cloud-offline-outline" size={32} color="#92400E" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              You're offline
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Your conversation history will appear here once you reconnect. Messages can't be sent right now.
            </Text>
          </View>
        ) : (
          // Normal new-conversation empty state with suggestion chips
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name="sparkles" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Your recovery companion
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Ask me anything about coping strategies, managing cravings, or how you're feeling today.
            </Text>
            <View style={styles.suggestionsRow}>
              {[
                "I'm feeling a craving right now",
                "Help me with a breathing exercise",
                "I need some encouragement",
              ].map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  onPress={() => setInput(prompt)}
                  activeOpacity={0.75}
                  style={[
                    styles.suggestionChip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.suggestionText, { color: colors.foreground }]}>
                    {prompt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )
      ) : (
        <FlatList
          ref={flatListRef}
          data={listData}
          keyExtractor={(item) => (typeof item === "string" ? item : item.id)}
          renderItem={renderMessage}
          contentContainerStyle={[styles.messageList, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: isWeb ? 20 : insets.bottom + 8,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
                opacity: isOffline ? 0.5 : 1,
              },
            ]}
            placeholder={isOffline ? "Reconnect to send messages" : "How are you feeling today?"}
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            editable={!isOffline}
            multiline
            maxLength={800}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim() || isSending || deviceId === null || isOffline}
            activeOpacity={0.8}
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  input.trim() && !isSending && !isOffline ? colors.primary : colors.muted,
              },
            ]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name={isOffline ? "cloud-offline-outline" : "arrow-up"}
                size={20}
                color={input.trim() && !isOffline ? "#fff" : colors.mutedForeground}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Rename modal — floats above the chat view */}
      <RenameModal
        visible={showChatRenameModal}
        initialTitle={lastConfirmedTitleRef.current ?? chatConvTitle}
        colors={colors}
        onConfirm={(newTitle) => {
          if (activeConvId !== null) {
            // Record the user-typed title before the network call so that
            // goBackToList can show it in the optimistic entry if the user
            // navigates away before the PATCH response arrives.
            pendingRenameTitleRef.current = newTitle;
            renameConversation(activeConvId, newTitle, chatConvTitle);
          }
          setShowChatRenameModal(false);
        }}
        onCancel={() => setShowChatRenameModal(false)}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  backBtn: { padding: 8, marginLeft: -4 },
  clearBtn: { padding: 8 },
  crisisBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  crisisText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  // ---- Conversation list ----
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  newChatBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  convList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  convIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  convItemBody: {
    flex: 1,
    gap: 3,
  },
  convItemTitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  convItemDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  convRowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  convActionBtn: {
    padding: 4,
  },
  // ---- Rename modal ----
  renameOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  renameSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    gap: 14,
  },
  renameTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginBottom: 2,
  },
  renameInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  renameActions: {
    flexDirection: "row",
    gap: 10,
  },
  renameBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  renameBtnPrimary: {
    borderWidth: 0,
  },
  renameBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  startChatCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startChatCtaText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  // ---- Offline banner ----
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  offlineText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    lineHeight: 16,
  },
  // ---- Empty state (shared) ----
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  suggestionsRow: {
    marginTop: 12,
    gap: 8,
    width: "100%",
    alignItems: "stretch",
  },
  suggestionChip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  // ---- Chat messages ----
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 2,
  },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowAI: { justifyContent: "flex-start" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAI: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
    minHeight: 42,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
