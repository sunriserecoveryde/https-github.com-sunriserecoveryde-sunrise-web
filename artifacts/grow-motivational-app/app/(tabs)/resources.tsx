import React, { useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { ScreenHeader } from '@/components/ScreenHeader';

interface Resource {
  id: string;
  name: string;
  detail: string;
  action: string;
  actionLabel: string;
  type: 'crisis' | 'support' | 'recovery';
  icon: string;
}

const RESOURCES: Resource[] = [
  // Crisis
  {
    id: '988',
    name: '988 Suicide & Crisis Lifeline',
    detail: 'Free, confidential support 24/7 for people in distress. Call or text 988.',
    action: 'tel:988',
    actionLabel: 'Call 988',
    type: 'crisis',
    icon: 'phone',
  },
  {
    id: '911',
    name: 'Emergency Services — 911',
    detail: 'Call 911 if you or someone else is in immediate physical danger.',
    action: 'tel:911',
    actionLabel: 'Call 911',
    type: 'crisis',
    icon: 'alert-circle',
  },
  // Support
  {
    id: 'samhsa',
    name: 'SAMHSA National Helpline',
    detail:
      '1-800-662-HELP (4357) — Free treatment referral and information service, 24/7.',
    action: 'tel:18006624357',
    actionLabel: 'Call SAMHSA',
    type: 'support',
    icon: 'heart',
  },
  {
    id: 'crisis-text',
    name: 'Crisis Text Line',
    detail: 'Text HOME to 741741 for free 24/7 crisis support via text message.',
    action: 'sms:741741',
    actionLabel: 'Text 741741',
    type: 'support',
    icon: 'message-square',
  },
  {
    id: 'nami',
    name: 'NAMI Helpline',
    detail: '1-800-950-6264 — Mental health information and support. Mon–Fri, 10am–10pm ET.',
    action: 'tel:18009506264',
    actionLabel: 'Call NAMI',
    type: 'support',
    icon: 'user',
  },
  // Recovery
  {
    id: 'aa',
    name: 'Alcoholics Anonymous',
    detail: 'Find local AA meetings and the Big Book online. Anonymous peer support.',
    action: 'https://www.aa.org',
    actionLabel: 'Visit aa.org',
    type: 'recovery',
    icon: 'users',
  },
  {
    id: 'na',
    name: 'Narcotics Anonymous',
    detail: 'Find NA meetings worldwide. Free peer support for anyone seeking recovery.',
    action: 'https://www.na.org',
    actionLabel: 'Visit na.org',
    type: 'recovery',
    icon: 'users',
  },
  {
    id: 'smart',
    name: 'SMART Recovery',
    detail: 'Science-based addiction recovery support. Face-to-face and online meetings.',
    action: 'https://www.smartrecovery.org',
    actionLabel: 'Visit SMART',
    type: 'recovery',
    icon: 'book-open',
  },
  {
    id: 'findtreatment',
    name: 'SAMHSA Treatment Locator',
    detail: 'Find substance use and mental health treatment facilities near you.',
    action: 'https://findtreatment.gov',
    actionLabel: 'Find Treatment',
    type: 'recovery',
    icon: 'map-pin',
  },
];

const TYPE_CONFIG = {
  crisis: { label: 'Crisis Lines', color: '#EF4444', bg: '#7F1D1D', border: '#EF444466' },
  support: { label: 'Support Lines', color: '#F97316', bg: '#431407', border: '#F9731666' },
  recovery: { label: 'Recovery Support', color: '#38BDF8', bg: '#0C1A26', border: '#38BDF866' },
};

function ResourceCard({ resource }: { resource: Resource }) {
  const colors = useColors();
  const config = TYPE_CONFIG[resource.type];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = resource.action;
    if (url.startsWith('http')) {
      Linking.openURL(url).catch(() => {});
    } else {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <View
      style={[
        styles.resourceCard,
        {
          backgroundColor: resource.type === 'crisis' ? config.bg : colors.card,
          borderColor: resource.type === 'crisis' ? config.border : colors.border,
        },
      ]}
    >
      <View style={styles.resourceTop}>
        <View style={[styles.resourceIcon, { backgroundColor: config.color + '22' }]}>
          <Feather name={resource.icon as any} size={18} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.resourceName, { color: colors.foreground }]}>{resource.name}</Text>
          <Text style={[styles.resourceDetail, { color: colors.mutedForeground }]}>
            {resource.detail}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[styles.resourceBtn, { backgroundColor: config.color }]}
      >
        <Feather
          name={resource.action.startsWith('http') ? 'external-link' : 'phone-call'}
          size={14}
          color="#fff"
        />
        <Text style={styles.resourceBtnText}>{resource.actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ResourcesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const grouped = {
    crisis: RESOURCES.filter((r) => r.type === 'crisis'),
    support: RESOURCES.filter((r) => r.type === 'support'),
    recovery: RESOURCES.filter((r) => r.type === 'recovery'),
  };

  const bottomPad = isWeb ? 100 : insets.bottom + 90;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Resources"
        subtitle="Help is always one tap away"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
      >
        {/* Emergency banner */}
        <View style={[styles.emergencyBanner, { backgroundColor: '#7F1D1D', borderColor: '#EF444444' }]}>
          <Ionicons name="warning" size={20} color="#EF4444" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: '#FECACA' }]}>In immediate crisis?</Text>
            <Text style={[styles.bannerSub, { color: '#FCA5A5' }]}>
              Call 988 (mental health) or 911 (physical danger). Do not wait.
            </Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            Grow is an educational wellness tool — not a substitute for clinical care. If you are in
            crisis, please use the resources below.
          </Text>
        </View>

        {/* Crisis lines */}
        <Text style={[styles.sectionLabel, { color: '#EF4444' }]}>🆘 CRISIS LINES</Text>
        {grouped.crisis.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}

        {/* Support lines */}
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>SUPPORT LINES</Text>
        {grouped.support.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}

        {/* Recovery support */}
        <Text style={[styles.sectionLabel, { color: colors.sky }]}>RECOVERY SUPPORT</Text>
        {grouped.recovery.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          All resources listed are free and available to anyone. You are not alone.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 4,
  },
  bannerTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  bannerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  disclaimer: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 2,
  },
  resourceCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 2,
  },
  resourceTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resourceName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  resourceDetail: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  resourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resourceBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  footer: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    lineHeight: 18,
  },
});
