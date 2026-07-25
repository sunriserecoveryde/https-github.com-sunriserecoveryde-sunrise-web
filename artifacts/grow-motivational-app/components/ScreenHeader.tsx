import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { EmergencyModal } from './EmergencyModal';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, rightElement }: ScreenHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const isWeb = Platform.OS === 'web';

  return (
    <>
      <View
        style={[
          styles.header,
          {
            paddingTop: isWeb ? 67 : insets.top + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.left}>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.right}>
          {rightElement}
          <TouchableOpacity
            onPress={() => setEmergencyVisible(true)}
            activeOpacity={0.7}
            style={[styles.sosBtn, { backgroundColor: '#7F1D1D', borderColor: '#EF4444' }]}
            accessibilityLabel="Open emergency crisis resources"
          >
            <Feather name="phone" size={14} color="#EF4444" />
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>
      <EmergencyModal visible={emergencyVisible} onClose={() => setEmergencyVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  sosText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
});
