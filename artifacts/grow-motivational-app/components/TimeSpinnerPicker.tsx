import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

/** Quick-pick presets shown as chips above the spinners. */
const QUICK_TIMES = [
  { label: '7 AM', hour: 7, minute: 0 },
  { label: '8 AM', hour: 8, minute: 0 },
  { label: '9 AM', hour: 9, minute: 0 },
  { label: 'Noon', hour: 12, minute: 0 },
  { label: '6 PM', hour: 18, minute: 0 },
  { label: '9 PM', hour: 21, minute: 0 },
];

interface Props {
  /** 0-23 */
  hour: number;
  /** 0-59 */
  minute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
}

export function TimeSpinnerPicker({ hour, minute, onHourChange, onMinuteChange }: Props) {
  const colors = useColors();

  // Track whether a long-press already handled the interaction so the
  // subsequent onPress (fired on finger-release) is suppressed.
  const minuteUpLongPressed = useRef(false);
  const minuteDownLongPressed = useRef(false);

  // Derived display values
  const isPM = hour >= 12;
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  const bump = (fn: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fn();
  };

  const bumpHeavy = (fn: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fn();
  };

  const incrementHour = () => bump(() => onHourChange((hour + 1) % 24));
  const decrementHour = () => bump(() => onHourChange((hour - 1 + 24) % 24));

  // Short tap: ±1 minute, but skip if long-press already fired this gesture
  const handleMinuteUpPress = () => {
    if (minuteUpLongPressed.current) { minuteUpLongPressed.current = false; return; }
    bump(() => onMinuteChange((minute + 1) % 60));
  };
  const handleMinuteDownPress = () => {
    if (minuteDownLongPressed.current) { minuteDownLongPressed.current = false; return; }
    bump(() => onMinuteChange((minute - 1 + 60) % 60));
  };

  // Long-press: ±5 minutes, mark flag so the trailing onPress is ignored
  const handleMinuteUpLongPress = () => {
    minuteUpLongPressed.current = true;
    bumpHeavy(() => onMinuteChange((minute + 5) % 60));
  };
  const handleMinuteDownLongPress = () => {
    minuteDownLongPressed.current = true;
    bumpHeavy(() => onMinuteChange((minute - 5 + 60) % 60));
  };

  const togglePeriod = () => bump(() => onHourChange((hour + 12) % 24));

  return (
    <View>
      {/* Quick-pick chips */}
      <View style={styles.chipRow}>
        {QUICK_TIMES.map((t) => {
          const selected = t.hour === hour && t.minute === minute;
          return (
            <TouchableOpacity
              key={t.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onHourChange(t.hour);
                onMinuteChange(t.minute);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.primary : colors.card,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: selected ? '#fff' : colors.foreground }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerLabel, { color: colors.mutedForeground }]}>or set exact time</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      {/* Spinners */}
      <View style={[styles.spinnerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Hour column */}
        <View style={styles.spinnerCol}>
          <TouchableOpacity onPress={incrementHour} style={[styles.arrowBtn, { backgroundColor: colors.muted }]}>
            <Feather name="chevron-up" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.spinnerValue, { color: colors.foreground }]}>
            {String(displayHour).padStart(2, '0')}
          </Text>
          <TouchableOpacity onPress={decrementHour} style={[styles.arrowBtn, { backgroundColor: colors.muted }]}>
            <Feather name="chevron-down" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.spinnerUnit, { color: colors.mutedForeground }]}>HR</Text>
        </View>

        <Text style={[styles.colon, { color: colors.foreground }]}>:</Text>

        {/* Minute column */}
        <View style={styles.spinnerCol}>
          <TouchableOpacity
            onPress={handleMinuteUpPress}
            onLongPress={handleMinuteUpLongPress}
            delayLongPress={300}
            style={[styles.arrowBtn, { backgroundColor: colors.muted }]}
          >
            <Feather name="chevron-up" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.spinnerValue, { color: colors.foreground }]}>
            {String(minute).padStart(2, '0')}
          </Text>
          <TouchableOpacity
            onPress={handleMinuteDownPress}
            onLongPress={handleMinuteDownLongPress}
            delayLongPress={300}
            style={[styles.arrowBtn, { backgroundColor: colors.muted }]}
          >
            <Feather name="chevron-down" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.spinnerUnit, { color: colors.mutedForeground }]}>MIN</Text>
        </View>

        {/* AM/PM toggle */}
        <View style={styles.periodCol}>
          <TouchableOpacity
            onPress={togglePeriod}
            style={[
              styles.periodBtn,
              {
                backgroundColor: !isPM ? colors.primary : colors.muted,
                borderColor: !isPM ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.periodText, { color: !isPM ? '#fff' : colors.mutedForeground }]}>AM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={togglePeriod}
            style={[
              styles.periodBtn,
              {
                backgroundColor: isPM ? colors.primary : colors.muted,
                borderColor: isPM ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.periodText, { color: isPM ? '#fff' : colors.mutedForeground }]}>PM</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  spinnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  spinnerCol: {
    alignItems: 'center',
    gap: 6,
    minWidth: 56,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerValue: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  spinnerUnit: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginTop: 2,
  },
  colon: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    lineHeight: 38,
    marginBottom: 22, // visually align with the digit area (offset spinner unit label)
    marginHorizontal: 4,
  },
  periodCol: {
    gap: 6,
    marginLeft: 8,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
});
