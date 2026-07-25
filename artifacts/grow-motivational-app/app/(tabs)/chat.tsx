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
  preview?: string; // first user message, cached locally
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const DEVICE_ID_KEY = "grow_chat_device_id_v1";
const CONV_PREVIEWS_KEY = "grow_chat_previews_v2"; // { [convId]: string }

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
  // User-assigned custom title takes priority over the auto-preview snippet
  if (conv.title && conv.title !== DEFAULT_TITLE) return conv.title;
  if (conv.preview) return conv.preview;
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
}: {
  conv: ConversationSummary;
  colors: ReturnType<typeof useColors>;
  onOpen: () => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onOpen}
      onLongPress={() => {
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
          onPress={onRename}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.convActionBtn}
        >
          <Feather name="edit-2" size={14} color={colors.mutedForeground} />
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
  const [previews, setPreviews] = useState<Record<string, string>>({});

  // ---------------------------------------------------------------------------
  // Rename modal state
  // ---------------------------------------------------------------------------
  const [renamingConv, setRenamingConv] = useState<ConversationSummary | null>(null);

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

  const flatListRef = useRef<FlatList>(null);
  const convListRef = useRef<FlatList>(null);

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
  // Init: load device ID and previews cache
  // ---------------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const dId = await getDeviceId();
        setDeviceId(dId);

        const rawPreviews = await AsyncStorage.getItem(CONV_PREVIEWS_KEY);
        if (rawPreviews) setPreviews(JSON.parse(rawPreviews));
      } catch (e) {
        console.warn("Chat init error:", e);
      }
    })();
  }, []);

  // ---------------------------------------------------------------------------
  // Load conversation list
  // ---------------------------------------------------------------------------
  const loadConversations = useCallback(async (dId: string) => {
    setIsLoadingList(true);
    try {
      const res = await fetch(`${getApiBase()}/anthropic/conversations`, {
        headers: { "X-Device-Id": dId },
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: Array<{ id: number; title: string; createdAt: string }> = await res.json();
      // Newest first
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setConversations(sorted);
    } catch (e) {
      console.warn("Failed to load conversations:", e);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

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
  const openConversation = useCallback(async (convId: number) => {
    if (!deviceId) return;
    setActiveConvId(convId);
    setChatMessages([]);
    setStreamingContent("");
    setInput("");
    setView("chat");
    setIsLoadingMessages(true);

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
    } catch (e) {
      console.warn("Failed to load messages:", e);
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
      setView("chat");
      setIsLoadingMessages(false);
    } catch (e) {
      console.warn("Failed to create conversation:", e);
    }
  }, [deviceId]);

  // ---------------------------------------------------------------------------
  // Go back to list
  // ---------------------------------------------------------------------------
  const goBackToList = useCallback(() => {
    setView("list");
    setActiveConvId(null);
    setChatMessages([]);
    setStreamingContent("");
    setInput("");
  }, []);

  // ---------------------------------------------------------------------------
  // Rename a conversation
  // ---------------------------------------------------------------------------
  const renameConversation = useCallback(async (convId: number, newTitle: string) => {
    if (!deviceId) return;
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
      // Optimistically update local state so the list refreshes immediately
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
      );
    } catch (e) {
      console.warn("Failed to rename conversation:", e);
      Alert.alert("Rename failed", "Could not save the new title. Please try again.");
    }
  }, [deviceId]);

  // ---------------------------------------------------------------------------
  // Delete a conversation
  // ---------------------------------------------------------------------------
  const deleteConversation = useCallback(async (convId: number, fromChat = false) => {
    if (!deviceId) return;

    const doDelete = async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        await fetch(`${getApiBase()}/anthropic/conversations/${convId}`, {
          method: "DELETE",
          headers: { "X-Device-Id": deviceId },
        });
        // Remove from local preview cache
        setPreviews((prev) => {
          const next = { ...prev };
          delete next[String(convId)];
          AsyncStorage.setItem(CONV_PREVIEWS_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (fromChat) goBackToList();
      } catch (e) {
        console.warn("Failed to delete conversation:", e);
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

    const isFirstMessage = chatMessages.length === 0;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    // Cache preview for this conversation (first user message)
    if (isFirstMessage) {
      const preview = text.length > 60 ? text.slice(0, 57) + "…" : text;
      setPreviews((prev) => {
        const next = { ...prev, [String(activeConvId)]: preview };
        AsyncStorage.setItem(CONV_PREVIEWS_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    }

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
  // Merge conversations with locally-cached previews
  // ---------------------------------------------------------------------------
  const conversationsWithPreviews: ConversationSummary[] = conversations.map((c) => ({
    ...c,
    preview: previews[String(c.id)],
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
        ) : conversationsWithPreviews.length === 0 ? (
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
            data={conversationsWithPreviews}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.convList, { paddingBottom: bottomPad }]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <ConversationListItem
                conv={item}
                colors={colors}
                onOpen={() => openConversation(item.id)}
                onDelete={() => deleteConversation(item.id, false)}
                onRename={() => setRenamingConv(item)}
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
              renameConversation(renamingConv.id, newTitle);
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
        title="AI Support Chat"
        subtitle="Empathetic guidance for your recovery"
        leftElement={
          <TouchableOpacity onPress={goBackToList} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        }
        rightElement={
          activeConvId !== null ? (
            <TouchableOpacity
              onPress={() => deleteConversation(activeConvId, true)}
              activeOpacity={0.7}
              style={styles.clearBtn}
            >
              <Feather name="trash-2" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
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
        // Empty state with suggestion chips
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
