import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useRole } from '@/context/RoleContext';
import { RESIDENTIAL_PATIENTS, MEDICATIONS, Patient, Medication } from '@/data/mockData';

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

type AdminMap = Record<string, Record<string, boolean>>;

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

function PatientMARCard({ patient, adminMap, onToggle, expanded, onExpand }: {
  patient: Patient;
  adminMap: AdminMap;
  onToggle: (patientId: string, medId: string, time: string) => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  const colors = useColors();
  const meds = MEDICATIONS[patient.id] ?? [];
  const activeMeds = meds.filter(m => m.status === 'Active');
  const givenCount = activeMeds.reduce((acc, med) => {
    return acc + med.times.filter(t => adminMap[patient.id]?.[`${med.id}-${t}`]).length;
  }, 0);
  const totalDoses = activeMeds.reduce((acc, med) => acc + med.times.filter(t => TODAY_SLOTS.includes(t)).length, 0);

  return (
    <View style={[styles.patientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
  const [adminMap, setAdminMap] = useState<AdminMap>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['p1', 'p4', 'p8']));

  function handleToggle(patientId: string, medId: string, time: string) {
    const key = `${medId}-${time}`;
    setAdminMap(prev => ({
      ...prev,
      [patientId]: { ...(prev[patientId] ?? {}), [key]: !(prev[patientId]?.[key]) },
    }));
  }

  function handleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  return (
    <FlatList
      data={RESIDENTIAL_PATIENTS}
      keyExtractor={p => p.id}
      renderItem={({ item }) => (
        <PatientMARCard
          patient={item}
          adminMap={adminMap}
          onToggle={handleToggle}
          expanded={expandedIds.has(item.id)}
          onExpand={() => handleExpand(item.id)}
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
  );
}

// ── Checks (BHT) ───────────────────────────────────────────────────────────

interface CheckEntry {
  mood: number;
  cravings: number;
  oriented: boolean;
  uaCollected: boolean;
  completed: boolean;
}

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

function PatientCheckCard({ patient, check, onChange }: {
  patient: Patient;
  check: CheckEntry;
  onChange: (c: CheckEntry) => void;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.patientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
  const defaultCheck: CheckEntry = { mood: 5, cravings: 5, oriented: true, uaCollected: false, completed: false };
  const [checks, setChecks] = useState<Record<string, CheckEntry>>(
    Object.fromEntries(RESIDENTIAL_PATIENTS.map(p => [p.id, { ...defaultCheck }]))
  );

  const completedCount = Object.values(checks).filter(c => c.completed).length;

  return (
    <FlatList
      data={RESIDENTIAL_PATIENTS}
      keyExtractor={p => p.id}
      renderItem={({ item }) => (
        <PatientCheckCard
          patient={item}
          check={checks[item.id] ?? defaultCheck}
          onChange={c => setChecks(prev => ({ ...prev, [item.id]: c }))}
        />
      )}
      contentContainerStyle={[styles.listContent, { paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0) }]}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={[styles.checksProgress, { backgroundColor: colors.navyMid }]}>
          <Text style={[styles.checksProgressText, { color: '#fff' }]}>
            {completedCount} / {RESIDENTIAL_PATIENTS.length} complete
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <View
              style={[styles.progressFill, { backgroundColor: colors.success, width: `${(completedCount / RESIDENTIAL_PATIENTS.length) * 100}%` as any }]}
            />
          </View>
        </View>
      }
    />
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function MARScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const { role, setRole } = useRole();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.navy }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{role === 'nursing' ? 'Medication MAR' : 'Morning Checks'}</Text>
            <Text style={styles.headerSubtitle}>Oct 26 · 14:00</Text>
          </View>
          <View style={[styles.roleToggle, { backgroundColor: colors.navyLight }]}>
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
          </View>
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
});
