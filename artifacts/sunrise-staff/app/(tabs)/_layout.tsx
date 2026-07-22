import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useRole } from '@/context/RoleContext';
import { PATIENTS } from '@/data/mockData';
import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';

function NativeTabLayout() {
  const { role } = useRole();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'bed.double', selected: 'bed.double.fill' }} />
        <Label>Census</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mar">
        <Icon sf={{ default: 'pill', selected: 'pill.fill' }} />
        <Label>{role === 'nursing' ? 'MAR' : 'Checks'}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="vitals">
        <Icon sf={{ default: 'waveform.path.ecg', selected: 'waveform.path.ecg' }} />
        <Label>Scores</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="handoff">
        <Icon sf={{ default: 'arrow.left.arrow.right', selected: 'arrow.left.arrow.right' }} />
        <Label>Handoff</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="incidents">
        <Icon sf={{ default: 'exclamationmark.triangle', selected: 'exclamationmark.triangle.fill' }} />
        <Label>Incidents</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const { role } = useRole();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  const residentialPatients = PATIENTS.filter(p => p.bed != null);
  const alertCount = residentialPatients.filter(
    p => (p.cows != null && p.cows >= 13) || (p.ciwa != null && p.ciwa >= 13)
  ).length;

  // Haptic pulse when alert count rises
  const prevAlertCount = useRef(alertCount);
  useEffect(() => {
    if (alertCount > prevAlertCount.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    prevAlertCount.current = alertCount;
  }, [alertCount]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.navy,
          borderTopWidth: 0,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'dark'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.navy }]} />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_600SemiBold',
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Census',
          tabBarBadge: alertCount > 0 ? alertCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.critical, fontSize: 11 },
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bed.double" tintColor={color} size={22} />
            ) : (
              <Ionicons name="bed-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="mar"
        options={{
          title: role === 'nursing' ? 'MAR' : 'Checks',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="pill" tintColor={color} size={22} />
            ) : (
              <Ionicons name="medical-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="vitals"
        options={{
          title: 'Scores',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="waveform.path.ecg" tintColor={color} size={22} />
            ) : (
              <Ionicons name="pulse-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="handoff"
        options={{
          title: 'Handoff',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="arrow.left.arrow.right" tintColor={color} size={22} />
            ) : (
              <Feather name="repeat" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: 'Incidents',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="exclamationmark.triangle" tintColor={color} size={22} />
            ) : (
              <Ionicons name="warning-outline" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
