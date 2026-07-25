import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Animated,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const STORAGE_KEY = "grow_chat_messages_v1";
const CONV_ID_KEY = "grow_chat_conv_id_v1";
const DEVICE_ID_KEY = "grow_chat_device_id_v1";

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
// All server conversations are scoped to this value.
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
// Server conversation management
// ---------------------------------------------------------------------------

async function getOrCreateConversation(deviceId: string): Promise<number> {
  const stored = await AsyncStorage.getItem(CONV_ID_KEY);
  if (stored) return parseInt(stored, 10);

  const res = await fetch(`${getApiBase()}/anthropic/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": deviceId,
    },
    body: JSON.stringify({ title: "Grow Support Chat" }),
  });

  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const data = await res.json();
  await AsyncStorage.setItem(CONV_ID_KEY, String(data.id));
  return data.id;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
// Main Screen
// ---------------------------------------------------------------------------

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [convId, setConvId] = useState<number | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");

  const flatListRef = useRef<FlatList>(null);

  // Initialise: load device ID, persisted messages, and server conversation
  useEffect(() => {
    (async () => {
      try {
        const dId = await getDeviceId();
        setDeviceId(dId);

        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setChatMessages(JSON.parse(raw) as ChatMessage[]);

        const cId = await getOrCreateConversation(dId);
        setConvId(cId);
      } catch (e) {
        console.warn("Chat init error:", e);
      } finally {
        setIsLoadingHistory(false);
      }
    })();
  }, []);

  // Persist messages whenever they change
  useEffect(() => {
    if (isLoadingHistory) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chatMessages)).catch(() => {});
  }, [chatMessages, isLoadingHistory]);

  // Scroll to bottom on new content or when typing indicator appears
  useEffect(() => {
    if (chatMessages.length > 0 || streamingContent || isSending) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [chatMessages, streamingContent, isSending]);

  // ---------------------------------------------------------------------------
  // Send message with SSE streaming
  // ---------------------------------------------------------------------------

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending || convId === null || deviceId === null) return;

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
        `${getApiBase()}/anthropic/conversations/${convId}/messages`,
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
            continue; // skip malformed chunk
          }

          if (payload.error) {
            // Surface server-sent errors to the user immediately
            throw new Error(payload.error);
          }
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
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: `I ran into a problem: ${msg}\n\nIf you're in crisis, please call or text 988.`,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, convId, deviceId]);

  // ---------------------------------------------------------------------------
  // Clear chat
  // ---------------------------------------------------------------------------

  const clearChat = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChatMessages([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(CONV_ID_KEY);
    try {
      if (deviceId) {
        const cId = await getOrCreateConversation(deviceId);
        setConvId(cId);
      }
    } catch {}
  }, [deviceId]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const bottomPad = isWeb ? 100 : insets.bottom + 90;

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

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item === "typing") return <TypingIndicator colors={colors} />;
    if (typeof item === "string") return null;
    return <MessageBubble message={item} colors={colors} />;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="AI Support Chat"
        subtitle="Empathetic guidance for your recovery"
        rightElement={
          chatMessages.length > 0 ? (
            <TouchableOpacity onPress={clearChat} activeOpacity={0.7} style={styles.clearBtn}>
              <Feather name="trash-2" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <CrisisBanner colors={colors} />

      {isLoadingHistory ? (
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
          renderItem={renderItem}
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
              },
            ]}
            placeholder="How are you feeling today?"
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={800}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim() || isSending || deviceId === null}
            activeOpacity={0.8}
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  input.trim() && !isSending ? colors.primary : colors.muted,
              },
            ]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="arrow-up"
                size={20}
                color={input.trim() ? "#fff" : colors.mutedForeground}
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
  clearBtn: { padding: 8 },
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
