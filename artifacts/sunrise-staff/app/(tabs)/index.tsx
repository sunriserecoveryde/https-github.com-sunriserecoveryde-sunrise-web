import React, { useState } from 'react';
import {
  FlatList,
  Modal,
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
import {
  BEDS,
  PATIENTS,
  VITALS,
  Patient,
  Acuity,
  VitalEntry,
  acuityColor,
} from '@/data/mockData';

type Filter = 'All' | Acuity | 'Available';
const FILTERS: Filter[] = ['All', 'Critical', 'High', 'Moderate', 'Routine', 'Available'];

// ─── Score helpers ────────────────────────────────────────────────────────────

function getSeverityLabel(score: number, isCiwa: boolean) {
  if (isCiwa) {
    if (score <= 7) return 'Mild';
    if (score <= 14) return 'Moderate';
    if (score <= 19) return 'Severe';
    return 'DANGER';
  }
  if (score <= 5) return 'Mild';
  if (score <= 12) return 'Moderate';
  if (score <= 24) return 'Severe';
  return 'DANGER';
}

function getScoreStyle(score: number, threshold: number, colors: ReturnType<typeof useColors>) {
  if (score >= threshold) return { bg: colors.criticalBg, text: colors.critical };
  const mid = threshold * 0.65;
  if (score >= mid) return { bg: colors.highBg, text: colors.high };
  if (score >= mid * 0.5) return { bg: colors.moderateBg, text: colors.moderate };
  return { bg: colors.successBg, text: colors.success };
}

// ─── Withdrawal alert banner (critical patients) ──────────────────────────────

function WithdrawalAlertBanner({
  patients,
  colors,
  onSelectPatient,
}: {
  patients: Patient[];
  colors: ReturnType<typeof useColors>;
  onSelectPatient: (p: Patient) => void;
}) {
  const alertPatients = patients.filter(
    p => (p.cows != null && p.cows >= 13) || (p.ciwa != null && p.ciwa >= 15)
  );
  if (alertPatients.length === 0) return null;

  return (
    <View style={[styles.alertBanner, { backgroundColor: '#FEF2F2', borderBottomColor: colors.critical }]}>
      <Ionicons name="warning" size={16} color={colors.critical} />
      <View style={styles.alertContent}>
        <Text style={[styles.alertTitle, { color: colors.critical }]}>
          {alertPatients.length} withdrawal alert{alertPatients.length > 1 ? 's' : ''} — MD notification required
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.alertChips}>
            {alertPatients.map(p => {
              const isCiwa = (p.ciwa ?? 0) >= 15;
              const score = isCiwa ? p.ciwa! : p.cows!;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onSelectPatient(p); }}
                  style={[styles.alertChip, { backgroundColor: colors.critical }]}
                >
                  <Text style={styles.alertChipText}>
                    {p.bed}: {p.lastName} · {isCiwa ? 'CIWA' : 'COWS'} {score}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Vitals History Modal ─────────────────────────────────────────────────────

function VitalsModal({
  patient,
  visible,
  onClose,
  colors,
}: {
  patient: Patient | null;
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  if (!patient) return null;
  const vitals: VitalEntry[] = VITALS[patient.id] ?? [];
  const hasCows = patient.cows != null && patient.cows > 0;
  const hasCiwa = patient.ciwa != null && patient.ciwa > 0;
  const ac = acuityColor(patient.acuity);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { backgroundColor: colors.navy, paddingTop: Platform.OS === 'ios' ? 20 : 16 }]}>
          <View style={styles.modalHeaderLeft}>
            <View style={[styles.modalBedBadge, { backgroundColor: colors.navyMid }]}>
              <Text style={styles.modalBedText}>{patient.bed}</Text>
            </View>
            <View>
              <Text style={styles.modalTitle}>{patient.firstName} {patient.lastName}</Text>
              <Text style={styles.modalSubtitle}>{patient.primaryDiagnosis} · LOS {patient.los}d</Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>

        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
          {/* Current scores */}
          {(hasCows || hasCiwa) && (
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.mutedForeground }]}>CURRENT WITHDRAWAL SCORES</Text>
              <View style={styles.scoreRow}>
                {hasCows && (() => {
                  const c = getScoreStyle(patient.cows!, 13, colors);
                  return (
                    <View style={[styles.scoreCard, { backgroundColor: c.bg, borderColor: c.text }]}>
                      <Text style={[styles.scoreCardLabel, { color: c.text }]}>COWS</Text>
                      <Text style={[styles.scoreCardValue, { color: c.text }]}>{patient.cows}</Text>
                      <Text style={[styles.scoreCardSeverity, { color: c.text }]}>{getSeverityLabel(patient.cows!, false)}</Text>
                    </View>
                  );
                })()}
                {hasCiwa && (() => {
                  const c = getScoreStyle(patient.ciwa!, 15, colors);
                  return (
                    <View style={[styles.scoreCard, { backgroundColor: c.bg, borderColor: c.text }]}>
                      <Text style={[styles.scoreCardLabel, { color: c.text }]}>CIWA-Ar</Text>
                      <Text style={[styles.scoreCardValue, { color: c.text }]}>{patient.ciwa}</Text>
                      <Text style={[styles.scoreCardSeverity, { color: c.text }]}>{getSeverityLabel(patient.ciwa!, true)}</Text>
                    </View>
                  );
                })()}
                {/* Mood + Cravings */}
                <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.scoreCardLabel, { color: colors.mutedForeground }]}>Mood</Text>
                  <Text style={[styles.scoreCardValue, { color: colors.navy }]}>{patient.mood}/10</Text>
                  <Text style={[styles.scoreCardSeverity, { color: colors.mutedForeground }]}>Cravings {patient.cravings}/10</Text>
                </View>
              </View>
            </View>
          )}

          {/* Vitals history */}
          {vitals.length > 0 ? (
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.mutedForeground }]}>VITAL SIGNS — RECENT HISTORY</Text>
              <View style={[styles.vitalsTable, { backgroundColor: colors.card }]}>
                {/* Header */}
                <View style={[styles.vitalsRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                  {['Date', 'Time', 'BP', 'HR', 'Temp', 'O₂', 'Pain'].map(h => (
                    <Text key={h} style={[styles.vitalsCell, { color: colors.mutedForeground, fontWeight: '700', fontSize: 11 }]}>{h}</Text>
                  ))}
                </View>
                {vitals.map((v, i) => (
                  <View key={v.id} style={[styles.vitalsRow, i < vitals.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                    <Text style={[styles.vitalsCell, { color: colors.navy }]}>{v.date}</Text>
                    <Text style={[styles.vitalsCell, { color: colors.navy }]}>{v.time}</Text>
                    <Text style={[styles.vitalsCell, { color: colors.navy, fontSize: 11 }]}>{v.bp}</Text>
                    <Text style={[styles.vitalsCell, { color: v.hr > 100 ? colors.high : colors.navy }]}>{v.hr}</Text>
                    <Text style={[styles.vitalsCell, { color: v.temp > 99 ? colors.moderate : colors.navy }]}>{v.temp}°</Text>
                    <Text style={[styles.vitalsCell, { color: v.o2 < 96 ? colors.high : colors.success }]}>{v.o2}%</Text>
                    <Text style={[styles.vitalsCell, { color: v.pain >= 7 ? colors.critical : v.pain >= 5 ? colors.moderate : colors.success }]}>{v.pain}/10</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.mutedForeground }]}>VITAL SIGNS</Text>
              <View style={[styles.noVitalsCard, { backgroundColor: colors.card }]}>
                <Ionicons name="pulse-outline" size={28} color={colors.mutedForeground} />
                <Text style={[styles.noVitalsText, { color: colors.mutedForeground }]}>No vitals recorded for this patient yet.</Text>
              </View>
            </View>
          )}

          {/* Handoff note */}
          {patient.handoffNote && (
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.mutedForeground }]}>NURSING HANDOFF NOTE</Text>
              <View style={[styles.handoffNote, { backgroundColor: colors.navyMid }]}>
                <Text style={styles.handoffNoteText}>{patient.handoffNote}</Text>
              </View>
            </View>
          )}

          {/* Flags */}
          {patient.flags.length > 0 && (
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.mutedForeground }]}>FLAGS</Text>
              {patient.flags.map((f, i) => (
                <View key={i} style={[styles.flagRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="flag" size={13} color={colors.high} />
                  <Text style={[styles.flagText, { color: colors.navy }]}>{f}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleToggle() {
  const colors = useColors();
  const { role, setRole } = useRole();
  return (
    <View style={[styles.roleToggle, { backgroundColor: colors.navyLight, borderColor: colors.navy }]}>
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
  );
}

function AcuityPill({ acuity }: { acuity: Acuity }) {
  const c = acuityColor(acuity);
  return (
    <View style={[styles.acuityPill, { backgroundColor: c.bg }]}>
      <Text style={[styles.acuityText, { color: c.text }]}>{acuity}</Text>
    </View>
  );
}

function FlagChip({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.flagChip, { backgroundColor: colors.muted }]}>
      <Text style={[styles.flagText2, { color: colors.navy }]}>{label}</Text>
    </View>
  );
}

function MoodBar({ value, colors }: { value: number; colors: ReturnType<typeof useColors> }) {
  const pct = value / 10;
  const barColor = value <= 3 ? colors.critical : value <= 6 ? colors.moderate : colors.success;
  return (
    <View style={styles.moodBarContainer}>
      <View style={[styles.moodBarTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.moodBarFill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.moodBarLabel, { color: colors.mutedForeground }]}>{value}/10</Text>
    </View>
  );
}

function BedCard({ patient, onPress }: { patient: Patient; onPress: () => void }) {
  const colors = useColors();
  const ac = acuityColor(patient.acuity);
  const showCows = patient.cows != null && patient.cows > 0;
  const showCiwa = patient.ciwa != null && patient.ciwa > 0;
  const isAlert = (showCows && patient.cows! >= 13) || (showCiwa && patient.ciwa! >= 15);

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={[styles.bedCard, { backgroundColor: isAlert ? '#FFF5F5' : colors.card, borderLeftColor: ac.border }]}
    >
      <View style={styles.bedCardTop}>
        <View style={styles.bedCardTopLeft}>
          <View style={[styles.bedBadge, { backgroundColor: colors.navyMid }]}>
            <Text style={styles.bedBadgeText}>{patient.bed}</Text>
          </View>
          <View>
            <Text style={[styles.patientName, { color: colors.navy }]}>
              {patient.firstName} {patient.lastName}
            </Text>
            <Text style={[styles.patientMeta, { color: colors.mutedForeground }]}>
              {patient.age}{patient.gender} · LOS {patient.los}d
            </Text>
          </View>
        </View>
        <View style={styles.cardTopRight}>
          {isAlert && <Ionicons name="warning" size={14} color={colors.critical} style={{ marginBottom: 2 }} />}
          <AcuityPill acuity={patient.acuity} />
        </View>
      </View>

      <Text style={[styles.diagnosis, { color: colors.navyLight }]} numberOfLines={1}>
        {patient.primaryDiagnosis}
      </Text>

      {patient.flags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flagsRow}>
          {patient.flags.map(f => <FlagChip key={f} label={f} />)}
        </ScrollView>
      )}

      <View style={styles.bedCardBottom}>
        <View style={styles.scoresRow}>
          {showCows && (() => {
            const c = getScoreStyle(patient.cows!, 13, colors);
            return (
              <View style={[styles.scorePill, { backgroundColor: c.bg }]}>
                <Text style={[styles.scoreText, { color: c.text }]}>COWS {patient.cows}</Text>
              </View>
            );
          })()}
          {showCiwa && (() => {
            const c = getScoreStyle(patient.ciwa!, 15, colors);
            return (
              <View style={[styles.scorePill, { backgroundColor: c.bg }]}>
                <Text style={[styles.scoreText, { color: c.text }]}>CIWA {patient.ciwa}</Text>
              </View>
            );
          })()}
        </View>
        <View style={styles.moodSection}>
          <Text style={[styles.moodLabel, { color: colors.mutedForeground }]}>Mood</Text>
          <MoodBar value={patient.mood} colors={colors} />
        </View>
      </View>

      {/* Tap hint */}
      <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Tap for vitals history</Text>
    </Pressable>
  );
}

function AvailableBedCard({ bedId, status }: { bedId: string; status: string }) {
  const colors = useColors();
  const bgColor = status === 'Available' ? colors.successBg : colors.muted;
  const textColor = status === 'Available' ? colors.success : colors.mutedForeground;
  const icon = status === 'Available' ? 'bed-outline' : 'refresh-outline';
  return (
    <View style={[styles.availableBedCard, { backgroundColor: bgColor, borderColor: colors.border }]}>
      <Ionicons name={icon as any} size={18} color={textColor} />
      <Text style={[styles.availableBedId, { color: textColor }]}>{bedId}</Text>
      <Text style={[styles.availableBedStatus, { color: textColor }]}>{status}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CensusScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const [filter, setFilter] = useState<Filter>('All');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const occupiedCount = BEDS.filter(b => b.status === 'Occupied').length;
  const availableCount = BEDS.filter(b => b.status === 'Available').length;
  const cleaningCount = BEDS.filter(b => b.status === 'Cleaning').length;
  const residentialPatients = PATIENTS.filter(p => p.bed != null);

  const alertCount = residentialPatients.filter(
    p => (p.cows != null && p.cows >= 13) || (p.ciwa != null && p.ciwa >= 15)
  ).length;

  const filteredPatients = filter === 'Available'
    ? []
    : residentialPatients.filter(p => filter === 'All' || p.acuity === filter);
  const nonOccupiedBeds = BEDS.filter(b => b.status !== 'Occupied');

  const openModal = (p: Patient) => {
    setSelectedPatient(p);
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.navy }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Census Board</Text>
            <Text style={styles.headerSubtitle}>Jul 19 · Day Shift</Text>
          </View>
          <RoleToggle />
        </View>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{occupiedCount}</Text>
            <Text style={styles.statLabel}>Occupied</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{availableCount}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.amber }]}>{cleaningCount}</Text>
            <Text style={styles.statLabel}>Cleaning</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: alertCount > 0 ? colors.critical : '#fff' }]}>{alertCount}</Text>
            <Text style={styles.statLabel}>WD Alerts</Text>
          </View>
        </View>
      </View>

      {/* Withdrawal alert banner */}
      <WithdrawalAlertBanner
        patients={residentialPatients}
        colors={colors}
        onSelectPatient={openModal}
      />

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterScroll, { backgroundColor: colors.navyMid }]}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(f => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && { backgroundColor: colors.orange }]}
            onPress={() => { Haptics.selectionAsync(); setFilter(f); }}
          >
            <Text style={[styles.filterChipText, { color: filter === f ? '#fff' : colors.slateLight }]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filter === 'Available' ? [] : filteredPatients}
        keyExtractor={p => p.id}
        renderItem={({ item }) => <BedCard patient={item} onPress={() => openModal(item)} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0) }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={filter === 'Available' ? (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Non-Occupied Beds</Text>
            <View style={styles.availableGrid}>
              {nonOccupiedBeds.map(b => <AvailableBedCard key={b.id} bedId={b.id} status={b.status} />)}
            </View>
          </View>
        ) : null}
        ListFooterComponent={filter !== 'Available' && nonOccupiedBeds.length > 0 ? (
          <View style={styles.footerBeds}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Other Beds</Text>
            <View style={styles.availableGrid}>
              {nonOccupiedBeds.map(b => <AvailableBedCard key={b.id} bedId={b.id} status={b.status} />)}
            </View>
          </View>
        ) : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bed-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No patients match this filter</Text>
          </View>
        }
      />

      {/* Vitals / score detail modal */}
      <VitalsModal
        patient={selectedPatient}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        colors={colors}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 12, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', marginTop: 12, paddingBottom: 4 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1, fontFamily: 'Inter_400Regular' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  // Alert banner
  alertBanner: { borderBottomWidth: 1, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 4 },
  alertChips: { flexDirection: 'row', gap: 6 },
  alertChip: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  alertChipText: { fontSize: 11, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  // Filters
  filterScroll: {},
  filterContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  filterChipText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  // Bed cards
  listContent: { padding: 12, gap: 10 },
  bedCard: {
    borderRadius: 12, padding: 14, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  bedCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  bedCardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cardTopRight: { alignItems: 'center', gap: 2 },
  bedBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  bedBadgeText: { fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  patientName: { fontSize: 15, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  patientMeta: { fontSize: 12, marginTop: 1, fontFamily: 'Inter_400Regular' },
  acuityPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  acuityText: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  diagnosis: { fontSize: 13, marginBottom: 8, fontFamily: 'Inter_400Regular' },
  flagsRow: { marginBottom: 10 },
  flagChip: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 },
  flagText2: { fontSize: 11, fontWeight: '500', fontFamily: 'Inter_500Medium' },
  bedCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoresRow: { flexDirection: 'row', gap: 6 },
  scorePill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  scoreText: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  moodSection: { alignItems: 'flex-end', flex: 1, marginLeft: 12 },
  moodLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 3 },
  moodBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moodBarTrack: { width: 70, height: 6, borderRadius: 3 },
  moodBarFill: { height: 6, borderRadius: 3 },
  moodBarLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  tapHint: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'right', marginTop: 6, opacity: 0.6 },
  // Role toggle
  roleToggle: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', padding: 2 },
  roleBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  roleBtnText: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  // Available beds
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, fontFamily: 'Inter_600SemiBold' },
  availableGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  availableBedCard: { borderRadius: 8, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, minWidth: 80 },
  availableBedId: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  availableBedStatus: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  footerBeds: { marginTop: 8 },
  emptyState: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 16 },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalBedBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  modalBedText: { fontSize: 16, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  modalSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontFamily: 'Inter_400Regular' },
  closeBtn: { padding: 4 },
  modalScroll: { flex: 1 },
  modalContent: { padding: 16, paddingBottom: 40, gap: 4 },
  modalSection: { marginBottom: 16 },
  modalSectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, fontFamily: 'Inter_700Bold' },
  scoreRow: { flexDirection: 'row', gap: 10 },
  scoreCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 2 },
  scoreCardLabel: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  scoreCardValue: { fontSize: 40, fontWeight: '700', fontFamily: 'Inter_700Bold', lineHeight: 48 },
  scoreCardSeverity: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  vitalsTable: { borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  vitalsRow: { flexDirection: 'row', paddingVertical: 8 },
  vitalsCell: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  noVitalsCard: { borderRadius: 10, padding: 24, alignItems: 'center', gap: 8 },
  noVitalsText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  handoffNote: { borderRadius: 10, padding: 14 },
  handoffNoteText: { fontSize: 14, color: '#fff', fontFamily: 'Inter_400Regular', lineHeight: 20 },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 6 },
  flagText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
});
