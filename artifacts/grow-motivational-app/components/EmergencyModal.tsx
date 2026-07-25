import React from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface EmergencyModalProps {
  visible: boolean;
  onClose: () => void;
}

const CRISIS_LINES = [
  {
    id: 'suicide-988',
    name: '988 Suicide & Crisis Lifeline',
    detail: 'Call or text 988 — 24/7, free, confidential',
    phone: '988',
    type: 'crisis' as const,
    icon: 'call' as const,
  },
  {
    id: 'emergency-911',
    name: 'Emergency Services',
    detail: 'Call 911 for immediate danger',
    phone: '911',
    type: 'crisis' as const,
    icon: 'alert-circle' as const,
  },
  {
    id: 'samhsa',
    name: 'SAMHSA Helpline',
    detail: '1-800-662-4357 — Treatment referrals, 24/7',
    phone: '18006624357',
    type: 'support' as const,
    icon: 'heart' as const,
  },
  {
    id: 'crisis-text',
    name: 'Crisis Text Line',
    detail: 'Text HOME to 741741 — 24/7 text support',
    phone: '741741',
    type: 'support' as const,
    icon: 'chatbubble' as const,
    isText: true,
  },
];

function CrisisCard({ item }: { item: (typeof CRISIS_LINES)[0] }) {
  const colors = useColors();

  const handlePress = () => {
    const scheme = item.isText ? 'sms' : 'tel';
    Linking.openURL(`${scheme}:${item.phone}`).catch(() => {});
  };

  const isCrisis = item.type === 'crisis';

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: isCrisis ? '#7F1D1D' : colors.card,
          borderColor: isCrisis ? '#EF4444' : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: isCrisis ? '#EF4444' : colors.primary },
        ]}
      >
        <Ionicons name={item.icon} size={20} color="#fff" />
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardName, { color: colors.foreground }]}>{item.name}</Text>
        <Text style={[styles.cardDetail, { color: colors.mutedForeground }]}>{item.detail}</Text>
      </View>
      <Feather name="phone-call" size={18} color={isCrisis ? '#EF4444' : colors.primary} />
    </TouchableOpacity>
  );
}

export function EmergencyModal({ visible, onClose }: EmergencyModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>Crisis Resources</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Tap any card to call or text
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.muted }]}
            >
              <Feather name="x" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Disclaimer */}
          <View style={[styles.disclaimer, { backgroundColor: '#451A03', borderColor: '#F97316' }]}>
            <Feather name="info" size={14} color="#F97316" />
            <Text style={[styles.disclaimerText, { color: '#FED7AA' }]}>
              If you are in immediate danger, call 911. The Grow app is not a substitute for
              clinical care.
            </Text>
          </View>

          {/* Crisis lines */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
            {CRISIS_LINES.map((item) => (
              <CrisisCard key={item.id} item={item} />
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  list: {
    flexGrow: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  cardDetail: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
