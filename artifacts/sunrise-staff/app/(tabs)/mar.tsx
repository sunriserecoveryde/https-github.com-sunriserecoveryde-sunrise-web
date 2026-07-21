import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useRole } from '@/context/RoleContext';
import { usePatients } from '@/context/PatientContext';
import { useDisplayedResidentialPatients } from '@/hooks/useDisplayedResidentialPatients';
import { MEDICATIONS, Patient, Medication } from '@/data/mockData';
import { useMAR, AdminMap, CheckEntry } from '@/context/MARContext';

// ── MAR (Nursing) ──────────────────────────────────────────────────────────

const TODAY_SLOTS = ['06:00', '08:00', '12:00', '14:00', '18:00', '20:00', '22:00'];
const CURRENT_HOUR = 14; // demo: 2pm

function medClassColor(cls: Medication['class'], colors: ReturnType<typeof useColors>) {
  switch (cls) {
    case 'MAT': return { bg: colors.purpleBg, text: colors.purple };
    case 'Psychiatric': return { bg: colors.routineBg, text: colors.blue };
    case 'Medical': return { bg: colors.successBg, text: colors.success };
    case 'PRN': return { bg: colors.moderateBg, text: colors.moderate };
  }
}

function MedRow({ med, patientId, adminMap, onToggle }: {
  med: Medication;
  patientId: string;
  adminMap: AdminMap;
  onToggle: (patientId: string, medId: string, time: string) => void;
}) {
  const colors = useColors();
  const cls = medClassColor(med.class, colors);
  const activeTimes = med.times.filter(t => TODAY_SLOTS.includes(t));

  return (
    <View style={[styles.medRow, { borderBottomColor: colors.border }]}>
      <View style={styles.medInfo}>
        <View style={styles.medNameRow}>
          <Text style={[styles.medName, { color: colors.navy }]}>{med.name}</Text>
          <View style={[styles.medClassBadge, { backgroundColor: cls.bg }]}>
            <Text style={[styles.medClassText, { color: cls.text }]}>{med.class}</Text>
          </View>
        </View>
        <Text style={[styles.medMeta, { color: colors.mutedForeground }]}>
          {med.dose} · {med.route} · {med.frequency}
        </Text>
      </View>
      {activeTimes.length > 0 ? (
        <View style={styles.timeSlots}>
          {activeTimes.map(t => {
            const slotHour = parseInt(t.split(':')[0] ?? '0', 10);
            const isGiven = adminMap[patientId]?.[`${med.id}-${t}`] ?? false;
            const isPast = slotHour < CURRENT_HOUR;
            const isCurrent = slotHour === CURRENT_HOUR;
            return (
              <Pressable
                key={t}
                style={[
                  styles.timeSlot,
                  isGiven && { backgroundColor: colors.success },
                  !isGiven && isPast && { backgroundColor: colors.criticalBg, borderColor: colors.critical },
                  !isGiven && isCurrent && { borderColor: colors.orange, borderWidth: 2 },
                  { borderColor: isGiven ? colors.success : colors.border },
                ]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(patientId, med.id, t); }}
              >
                {isGiven ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text style={[styles.timeSlotText, { color: isPast ? colors.critical : isCurrent ? colors.orange : colors.mutedForeground }]}>
                    {t}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={[styles.prnLabel, { color: colors.mutedForeground }]}>PRN / See Orders</Text>
      )}
    </View>
  );
}

function PatientMARCard({ patient, adminMap, onToggle, expanded, onExpand, isPendingDischarge }: {
  patient: Patient;
  adminMap: AdminMap;
  onToggle: (patientId: string, medId: string, time: string) => void;
  expanded: boolean;
  onExpand: () => void;
  isPendingDischarge?: boolean;
}) {
  const colors = useColors();
  const meds = MEDICATIONS[patient.id] ?? [];
  const activeMeds = meds.filter(m => m.status === 'Active');
  const givenCount = activeMeds.reduce((acc, med) => {
    return acc + med.times.filter(t => adminMap[patient.id]?.[`${med.id}-${t}`]).length;
  }, 0);
  const totalDoses = activeMeds.reduce((acc, med) => acc + med.times.filter(t => TODAY_SLOTS.includes(t)).length, 0);

  return (
    <View style={[styles.patientCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: isPendingDischarge ? 0.65 : 1 }]}>
      {isPendingDischarge && (
        <View style={[styles.dischargingBanner, { backgroundColor: colors.moderateBg, borderColor: colors.moderate }]}>
          <Ionicons name="time-outline" size={11} color={colors.moderate} />
          <Text style={[styles.dischargingBannerText, { color: colors.moderate }]}>Discharging…</Text>
        </View>
      )}
      <Pressable style={styles.patientCardHeader} onPress={onExpand}>
        <View style={styles.patientCardLeft}>
          <View style={[styles.bedTag, { backgroundColor: colors.navyMid }]}>
            <Text style={styles.bedTagText}>{patient.bed}</Text>
          </View>
          <View>
            <Text style={[styles.patientCardName, { color: colors.navy }]}>
              {patient.firstName} {patient.lastName}
            </Text>
            <Text style={[styles.patientCardMeta, { color: colors.mutedForeground }]}>
              {activeMeds.length} meds · {givenCount}/{totalDoses} given
            </Text>
          </View>
        </View>
        <View style={styles.patientCardRight}>
          {givenCount < totalDoses && CURRENT_HOUR >= 8 && (
            <View style={[styles.pendingBadge, { backgroundColor: colors.criticalBg }]}>
              <Text style={[styles.pendingText, { color: colors.critical }]}>{totalDoses - givenCount} pending</Text>
            </View>
          )}
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
        </View>
      </Pressable>
      {expanded && (
        <View style={[styles.medList, { borderTopColor: colors.border }]}>
          {activeMeds.map(med => (
            <MedRow key={med.id} med={med} patientId={patient.id} adminMap={adminMap} onToggle={onToggle} />
          ))}
        </View>
      )}
    </View>
  );
}

function MARView() {
  const colors = useColors();
  const { pendingDischarge } = usePatients();
  const displayedPatients = useDisplayedResidentialPatients();
  const { adminMap, marLoaded, toggleAdmin } = useMAR();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['p1', 'p4', 'p8']));

  // Guard B: starts invisible so med checkmarks don't flash as unchecked before
  // AsyncStorage resolves (@sunrise_mar_<date>). Fades in once marLoaded.
  // Task #308: if marLoaded is already true on mount (e.g. BHT→RN role switch
  // remounts MARView while context data is intact), start at opacity 1 directly
  // so there is no 150 ms blind flash on return.
  const loadedOnMountMAR = useRef(marLoaded).current;
  const listOpacity = useRef(new Animated.Value(loadedOnMountMAR ? 1 : 0)).current;
  useEffect(() => {
    if (marLoaded && !loadedOnMountMAR) {
      Animated.timing(listOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [marLoaded]);

  function handleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  return (
    <Animated.View style={{ flex: 1, opacity: listOpacity }}>
    <FlatList
      data={displayedPatients}
      keyExtractor={p => p.id}
      renderItem={({ item }) => (
        <PatientMARCard
          patient={item}
          adminMap={adminMap}
          onToggle={toggleAdmin}
          expanded={expandedIds.has(item.id)}
          onExpand={() => handleExpand(item.id)}
          isPendingDischarge={pendingDischarge?.patient.id === item.id}
        />
      )}
      contentContainerStyle={[styles.listContent, { paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0) }]}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={[styles.marLegend, { backgroundColor: colors.navyMid }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.legendText, { color: colors.slateLight }]}>Given</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.critical }]} />
            <Text style={[styles.legendText, { color: colors.slateLight }]}>Overdue</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.orange }]} />
            <Text style={[styles.legendText, { color: colors.slateLight }]}>Due Now</Text>
          </View>
        </View>
      }
    />
    </Animated.View>
  );
}

// ── Checks (BHT) ───────────────────────────────────────────────────────────

const DEFAULT_CHECK: CheckEntry = { mood: 5, cravings: 5, oriented: true, uaCollected: false, completed: false };

function ScaleSelector({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  return (
    <View style={styles.scaleRow}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
        <Pressable
          key={n}
          style={[styles.scaleBtn, value >= n && { backgroundColor: color }]}
          onPress={() => { Haptics.selectionAsync(); onChange(n); }}
        >
          <Text style={[styles.scaleBtnText, { color: value >= n ? '#fff' : '#aaa' }]}>{n}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function PatientCheckCard({ patient, check, onChange, isPendingDischarge }: {
  patient: Patient;
  check: CheckEntry;
  onChange: (c: CheckEntry) => void;
  isPendingDischarge?: boolean;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.patientCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: isPendingDischarge ? 0.65 : 1 }]}>
      {isPendingDischarge && (
        <View style={[styles.dischargingBanner, { backgroundColor: colors.moderateBg, borderColor: colors.moderate }]}>
          <Ionicons name="time-outline" size={11} color={colors.moderate} />
          <Text style={[styles.dischargingBannerText, { color: colors.moderate }]}>Discharging…</Text>
        </View>
      )}
      <Pressable style={styles.patientCardHeader} onPress={() => setExpanded(e => !e)}>
        <View style={styles.patientCardLeft}>
          <View style={[styles.bedTag, { backgroundColor: colors.navyMid }]}>
            <Text style={styles.bedTagText}>{patient.bed}</Text>
          </View>
          <View>
            <Text style={[styles.patientCardName, { color: colors.navy }]}>
              {patient.firstName} {patient.lastName}
            </Text>
            <Text style={[styles.patientCardMeta, { color: colors.mutedForeground }]}>
              {check.completed ? 'Check complete' : 'Needs check-in'}
            </Text>
          </View>
        </View>
        <View style={styles.patientCardRight}>
          {check.completed ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          ) : (
            <View style={[styles.pendingBadge, { backgroundColor: colors.moderateBg }]}>
              <Text style={[styles.pendingText, { color: colors.moderate }]}>Pending</Text>
            </View>
          )}
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
        </View>
      </Pressable>

      {expanded && (
        <View style={[styles.checkForm, { borderTopColor: colors.border }]}>
          <View style={styles.checkRow}>
            <Text style={[styles.checkLabel, { color: colors.navy }]}>Mood</Text>
            <Text style={[styles.checkValue, { color: colors.mutedForeground }]}>{check.mood}/10</Text>
          </View>
          <ScaleSelector
            value={check.mood}
            onChange={v => onChange({ ...check, mood: v })}
            color={check.mood <= 3 ? colors.critical : check.mood <= 6 ? colors.moderate : colors.success}
          />

          <View style={[styles.checkRow, { marginTop: 14 }]}>
            <Text style={[styles.checkLabel, { color: colors.navy }]}>Cravings</Text>
            <Text style={[styles.checkValue, { color: colors.mutedForeground }]}>{check.cravings}/10</Text>
          </View>
          <ScaleSelector
            value={check.cravings}
            onChange={v => onChange({ ...check, cravings: v })}
            color={check.cravings >= 7 ? colors.critical : check.cravings >= 4 ? colors.moderate : colors.success}
          />

          <View style={styles.togglesRow}>
            <Pressable
              style={[styles.toggleChip, { backgroundColor: check.oriented ? colors.successBg : colors.muted, borderColor: check.oriented ? colors.success : colors.border }]}
              onPress={() => { Haptics.selectionAsync(); onChange({ ...check, oriented: !check.oriented }); }}
            >
              <Ionicons name={check.oriented ? 'checkmark-circle' : 'radio-button-off'} size={16} color={check.oriented ? colors.success : colors.mutedForeground} />
              <Text style={[styles.toggleText, { color: check.oriented ? colors.success : colors.mutedForeground }]}>A&Ox3</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleChip, { backgroundColor: check.uaCollected ? colors.purpleBg : colors.muted, borderColor: check.uaCollected ? colors.purple : colors.border }]}
              onPress={() => { Haptics.selectionAsync(); onChange({ ...check, uaCollected: !check.uaCollected }); }}
            >
              <Ionicons name={check.uaCollected ? 'checkmark-circle' : 'radio-button-off'} size={16} color={check.uaCollected ? colors.purple : colors.mutedForeground} />
              <Text style={[styles.toggleText, { color: check.uaCollected ? colors.purple : colors.mutedForeground }]}>UA Collected</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.completeBtn, { backgroundColor: check.completed ? colors.muted : colors.orange }]}
            onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onChange({ ...check, completed: true }); setExpanded(false); }}
          >
            <Text style={[styles.completeBtnText, { color: check.completed ? colors.mutedForeground : '#fff' }]}>
              {check.completed ? 'Check Saved' : 'Save Check'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ChecksView() {
  const colors = useColors();
  const { pendingDischarge } = usePatients();
  const displayedPatients = useDisplayedResidentialPatients();
  const { checks, checksLoaded, updateCheck } = useMAR();

  // Guard B: starts invisible so check completion status doesn't flash as
  // "Needs check-in" before AsyncStorage resolves (@sunrise_checks_<date>).
  // Fades in once checksLoaded, matching the pattern in vitals.tsx.
  // Task #306: if checksLoaded is already true on mount (e.g. RN→BHT role
  // switch remounts ChecksView while context data is intact), start at opacity
  // 1 directly so there is no 150 ms blind flash on return.
  const loadedOnMountChecks = useRef(checksLoaded).current;
  const listOpacity = useRef(new Animated.Value(loadedOnMountChecks ? 1 : 0)).current;
  useEffect(() => {
    if (checksLoaded && !loadedOnMountChecks) {
      Animated.timing(listOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [checksLoaded]);

  // Only count completions for patients currently on the active roster
  // (avoids stale entries from discharged patients inflating the count)
  const total = displayedPatients.length;
  const completedCount = displayedPatients.filter(p => checks[p.id]?.completed).length;

  return (
    <Animated.View style={{ flex: 1, opacity: listOpacity }}>
    <FlatList
      data={displayedPatients}
      keyExtractor={p => p.id}
      renderItem={({ item }) => (
        <PatientCheckCard
          patient={item}
          check={checks[item.id] ?? DEFAULT_CHECK}
          onChange={c => updateCheck(item.id, c)}
          isPendingDischarge={pendingDischarge?.patient.id === item.id}
        />
      )}
      contentContainerStyle={[styles.listContent, { paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0) }]}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={[styles.checksProgress, { backgroundColor: colors.navyMid }]}>
          <Text style={[styles.checksProgressText, { color: '#fff' }]}>
            {completedCount} / {total} complete
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <View
              style={[styles.progressFill, { backgroundColor: colors.success, width: total > 0 ? `${(completedCount / total) * 100}%` as any : '0%' }]}
            />
          </View>
        </View>
      }
    />
    </Animated.View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function MARScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const { role, setRole, isRehydrating } = useRole();


  // ── Role toggle rehydration guard ────────────────────────────────────────
  // While isRehydrating: show a shimmer skeleton so the toggle is never blank.
  // Once rehydrating flips to false: fade in the real RN / BHT toggle.
  const roleBarOpacity = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;
  const shimmerLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isRehydrating) {
      shimmerLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 0.8, duration: 600, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      );
      shimmerLoopRef.current.start();
    } else {
      shimmerLoopRef.current?.stop();
      shimmerLoopRef.current = null;
      Animated.timing(roleBarOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
    return () => {
      shimmerLoopRef.current?.stop();
      shimmerLoopRef.current = null;
    };
  }, [isRehydrating]);


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.navy }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{role === 'nursing' ? 'Medication MAR' : 'Morning Checks'}</Text>
            <Text style={styles.headerSubtitle}>Oct 26 · 14:00</Text>
          </View>

          {/* Role toggle — Guard B:
              While rehydrating → shimmer skeleton so the toggle is never blank.
              After rehydration → real RN / BHT toggle fades in. */}
          {isRehydrating ? (
            <View style={[styles.roleToggle, { backgroundColor: colors.navyLight }]}>
              {[28, 34].map((w, i) => (
                <Animated.View
                  key={i}
                  style={[styles.roleBtnSkeleton, { width: w, opacity: shimmerAnim }]}
                />
              ))}
            </View>
          ) : (
            <Animated.View style={[styles.roleToggle, { backgroundColor: colors.navyLight, opacity: roleBarOpacity }]}>
              <Pressable
                style={[styles.roleBtn, role === 'nursing' && { backgroundColor: colors.orange }]}
                onPress={() => { Haptics.selectionAsync(); setRole('nursing'); }}
              >
                <Text style={[styles.roleBtnText, { color: role === 'nursing' ? '#fff' : colors.slateLight }]}>RN</Text>
              </Pressable>
              <Pressable
                style={[styles.roleBtn, role === 'bht' && { backgroundColor: colors.orange }]}
                onPress={() => { Haptics.selectionAsync(); setRole('bht'); }}
              >
                <Text style={[styles.roleBtnText, { color: role === 'bht' ? '#fff' : colors.slateLight }]}>BHT</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>
      {role === 'nursing' ? <MARView /> : <ChecksView />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 14, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontFamily: 'Inter_400Regular' },
  roleToggle: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', padding: 2 },
  roleBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  roleBtnText: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  roleBtnSkeleton: { height: 26, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 2 },
  listContent: { padding: 12, gap: 8 },
  patientCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 0 },
  patientCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  patientCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  patientCardName: { fontSize: 15, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  patientCardMeta: { fontSize: 12, marginTop: 1, fontFamily: 'Inter_400Regular' },
  patientCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bedTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  bedTagText: { fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  pendingBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  pendingText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  medList: { borderTopWidth: 1 },
  medRow: { padding: 12, borderBottomWidth: 1 },
  medInfo: { marginBottom: 8 },
  medNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  medName: { fontSize: 14, fontWeight: '600', flex: 1, fontFamily: 'Inter_600SemiBold' },
  medClassBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  medClassText: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  medMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  timeSlots: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  timeSlot: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, alignItems: 'center', justifyContent: 'center', minWidth: 48 },
  timeSlotText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  prnLabel: { fontSize: 12, fontStyle: 'italic', fontFamily: 'Inter_400Regular' },
  marLegend: { flexDirection: 'row', gap: 20, paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  // Checks
  checkForm: { padding: 14, borderTopWidth: 1 },
  checkRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  checkLabel: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  checkValue: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  scaleRow: { flexDirection: 'row', gap: 4 },
  scaleBtn: { flex: 1, height: 32, borderRadius: 6, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  scaleBtnText: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  togglesRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  toggleChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8, borderWidth: 1 },
  toggleText: { fontSize: 13, fontWeight: '500', fontFamily: 'Inter_500Medium' },
  completeBtn: { marginTop: 14, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  completeBtnText: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  checksProgress: { paddingHorizontal: 16, paddingVertical: 12 },
  checksProgressText: { fontSize: 14, fontWeight: '600', marginBottom: 8, fontFamily: 'Inter_600SemiBold' },
  progressTrack: { height: 6, borderRadius: 3, width: '100%' },
  progressFill: { height: 6, borderRadius: 3 },
  dischargingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderBottomWidth: 1,
  },
  dischargingBannerText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
