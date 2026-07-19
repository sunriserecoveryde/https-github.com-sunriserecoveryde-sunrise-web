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
import { useWithdrawalFilters } from '@/context/WithdrawalFiltersContext';
import { PATIENTS, VITALS, Patient, VitalEntry, acuityColor } from '@/data/mockData';

// ── Mock withdrawal score history for all residential patients ─────────────────

const WITHDRAWAL_HISTORY: Record<string, { time: string; cows?: number; ciwa?: number; by: string }[]> = {
  p1: [
    { time: '14:00', cows: 4, by: 'J. Torres, RN' },
    { time: '10:00', cows: 8, by: 'J. Torres, RN' },
    { time: '06:00', cows: 12, by: 'M. Boyd, RN' },
    { time: '22:00', cows: 10, by: 'M. Boyd, RN' },
    { time: '18:00', cows: 14, by: 'J. Torres, RN' },
  ],
  p4: [
    { time: '14:00', cows: 10, ciwa: 8, by: 'J. Torres, RN' },
    { time: '10:00', cows: 14, ciwa: 12, by: 'J. Torres, RN' },
    { time: '06:00', cows: 16, ciwa: 14, by: 'M. Boyd, RN' },
    { time: '22:00', cows: 18, ciwa: 16, by: 'M. Boyd, RN' },
  ],
  p5: [
    { time: '14:00', ciwa: 6, by: 'J. Torres, RN' },
    { time: '10:00', ciwa: 9, by: 'J. Torres, RN' },
    { time: '06:00', ciwa: 11, by: 'M. Boyd, RN' },
    { time: '22:00', ciwa: 14, by: 'M. Boyd, RN' },
  ],
  p8: [
    { time: '14:00', ciwa: 12, by: 'J. Torres, RN' },
    { time: '10:00', ciwa: 14, by: 'J. Torres, RN' },
    { time: '06:00', ciwa: 17, by: 'M. Boyd, RN' },
    { time: '22:00', ciwa: 19, by: 'M. Boyd, RN' },
    { time: '18:00', ciwa: 21, by: 'J. Torres, RN' },
  ],
};

function getScoreColor(score: number, threshold: number, colors: ReturnType<typeof useColors>) {
  if (score >= threshold) return { bg: colors.criticalBg, text: colors.critical, border: colors.critical };
  if (score >= threshold * 0.7) return { bg: colors.highBg, text: colors.high, border: colors.high };
  if (score >= threshold * 0.4) return { bg: colors.moderateBg, text: colors.moderate, border: colors.moderate };
  return { bg: colors.successBg, text: colors.success, border: colors.success };
}

function getSeverityLabel(score: number, isCiwa: boolean): string {
  if (isCiwa) {
    if (score <= 7) return 'Mild';
    if (score <= 14) return 'Moderate';
    if (score <= 19) return 'Severe';
    return 'DANGER';
  } else {
    if (score <= 5) return 'Mild';
    if (score <= 12) return 'Moderate';
    if (score <= 24) return 'Severe';
    return 'DANGER';
  }
}

function ScoreHistoryModal({
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
  const history = WITHDRAWAL_HISTORY[patient.id] ?? [];
  const vitals = VITALS[patient.id] ?? [];
  const hasCows = history.some(h => h.cows != null);
  const hasCiwa = history.some(h => h.ciwa != null);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { backgroundColor: colors.navy, paddingTop: Platform.OS === 'ios' ? 20 : 16 }]}>
          <View>
            <Text style={styles.modalTitle}>{patient.firstName} {patient.lastName}</Text>
            <Text style={styles.modalSubtitle}>Bed {patient.bed} · {patient.mrn}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>

        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
          {/* Current scores */}
          {(patient.cows != null || patient.ciwa != null) && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CURRENT SCORES</Text>
              <View style={styles.currentScoresRow}>
                {patient.cows != null && (
                  <View style={[styles.currentScoreCard, { backgroundColor: getScoreColor(patient.cows, 13, colors).bg, borderColor: getScoreColor(patient.cows, 13, colors).border }]}>
                    <Text style={[styles.currentScoreLabel, { color: getScoreColor(patient.cows, 13, colors).text }]}>COWS</Text>
                    <Text style={[styles.currentScoreValue, { color: getScoreColor(patient.cows, 13, colors).text }]}>{patient.cows}</Text>
                    <Text style={[styles.currentScoreSeverity, { color: getScoreColor(patient.cows, 13, colors).text }]}>{getSeverityLabel(patient.cows, false)}</Text>
                  </View>
                )}
                {patient.ciwa != null && patient.ciwa > 0 && (
                  <View style={[styles.currentScoreCard, { backgroundColor: getScoreColor(patient.ciwa, 15, colors).bg, borderColor: getScoreColor(patient.ciwa, 15, colors).border }]}>
                    <Text style={[styles.currentScoreLabel, { color: getScoreColor(patient.ciwa, 15, colors).text }]}>CIWA-Ar</Text>
                    <Text style={[styles.currentScoreValue, { color: getScoreColor(patient.ciwa, 15, colors).text }]}>{patient.ciwa}</Text>
                    <Text style={[styles.currentScoreSeverity, { color: getScoreColor(patient.ciwa, 15, colors).text }]}>{getSeverityLabel(patient.ciwa, true)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Score trend */}
          {history.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SCORE TREND — TODAY</Text>
              <View style={[styles.trendCard, { backgroundColor: colors.card }]}>
                {/* Header row */}
                <View style={[styles.trendRow, { borderBottomColor: colors.border, borderBottomWidth: 1, paddingBottom: 6, marginBottom: 6 }]}>
                  <Text style={[styles.trendTime, { color: colors.mutedForeground, fontWeight: '700' }]}>Time</Text>
                  {hasCows && <Text style={[styles.trendScore, { color: colors.mutedForeground, fontWeight: '700' }]}>COWS</Text>}
                  {hasCiwa && <Text style={[styles.trendScore, { color: colors.mutedForeground, fontWeight: '700' }]}>CIWA</Text>}
                  <Text style={[styles.trendBy, { color: colors.mutedForeground, fontWeight: '700' }]}>By</Text>
                </View>
                {history.map((h, i) => {
                  const cowsC = h.cows != null ? getScoreColor(h.cows, 13, colors) : null;
                  const ciwaC = h.ciwa != null ? getScoreColor(h.ciwa, 15, colors) : null;
                  return (
                    <View key={i} style={[styles.trendRow, i < history.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                      <Text style={[styles.trendTime, { color: colors.navy }]}>{h.time}</Text>
                      {hasCows && (
                        <View style={[styles.scoreBubble, cowsC ? { backgroundColor: cowsC.bg } : { backgroundColor: colors.muted }]}>
                          <Text style={[styles.scoreBubbleText, { color: cowsC ? cowsC.text : colors.mutedForeground }]}>
                            {h.cows ?? '–'}
                          </Text>
                        </View>
                      )}
                      {hasCiwa && (
                        <View style={[styles.scoreBubble, ciwaC ? { backgroundColor: ciwaC.bg } : { backgroundColor: colors.muted }]}>
                          <Text style={[styles.scoreBubbleText, { color: ciwaC ? ciwaC.text : colors.mutedForeground }]}>
                            {h.ciwa ?? '–'}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.trendBy, { color: colors.mutedForeground }]}>{h.by.split(',')[0]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Vitals history */}
          {vitals.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>VITAL SIGNS — HISTORY</Text>
              <View style={[styles.trendCard, { backgroundColor: colors.card }]}>
                <View style={[styles.vitalsHeaderRow, { borderBottomColor: colors.border, borderBottomWidth: 1, paddingBottom: 6, marginBottom: 6 }]}>
                  {['Date', 'BP', 'HR', 'Temp', 'O₂', 'Pain'].map(h => (
                    <Text key={h} style={[styles.vitalsCell, { color: colors.mutedForeground, fontWeight: '700', fontSize: 11 }]}>{h}</Text>
                  ))}
                </View>
                {vitals.map((v, i) => (
                  <View key={v.id} style={[styles.vitalsHeaderRow, i < vitals.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                    <Text style={[styles.vitalsCell, { color: colors.navy }]}>{v.date}</Text>
                    <Text style={[styles.vitalsCell, { color: colors.navy }]}>{v.bp}</Text>
                    <Text style={[styles.vitalsCell, { color: colors.navy }]}>{v.hr}</Text>
                    <Text style={[styles.vitalsCell, { color: colors.navy }]}>{v.temp}</Text>
                    <Text style={[styles.vitalsCell, { color: colors.navy }]}>{v.o2}%</Text>
                    <Text style={[styles.vitalsCell, { color: v.pain >= 7 ? colors.critical : v.pain >= 5 ? colors.moderate : colors.success }]}>{v.pain}/10</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Handoff note */}
          {patient.handoffNote && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>NURSING HANDOFF NOTE</Text>
              <View style={[styles.noteCard, { backgroundColor: colors.navyMid }]}>
                <Text style={[styles.noteText, { color: '#fff' }]}>{patient.handoffNote}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function PatientScoreRow({
  patient,
  onPress,
  colors,
}: {
  patient: Patient;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const hasCows = patient.cows != null && patient.cows > 0;
  const hasCiwa = patient.ciwa != null && patient.ciwa > 0;
  const cowsAlert = hasCows && patient.cows! >= 13;
  const ciwaAlert = hasCiwa && patient.ciwa! >= 15;
  const isAlert = cowsAlert || ciwaAlert;

  if (!hasCows && !hasCiwa) return null;

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={[styles.patientRow, { backgroundColor: isAlert ? '#FEF2F2' : colors.card, borderColor: isAlert ? colors.critical : colors.border }]}
    >
      <View style={styles.patientRowLeft}>
        {isAlert && (
          <Ionicons name="warning" size={16} color={colors.critical} style={styles.alertIcon} />
        )}
        <View style={[styles.bedBadge, { backgroundColor: colors.navyMid }]}>
          <Text style={styles.bedBadgeText}>{patient.bed}</Text>
        </View>
        <View>
          <Text style={[styles.patientName, { color: colors.navy }]}>{patient.firstName} {patient.lastName}</Text>
          <Text style={[styles.patientMeta, { color: colors.mutedForeground }]}>{patient.primaryDiagnosis.split(' ')[0]} · LOS {patient.los}d</Text>
        </View>
      </View>
      <View style={styles.scoresRight}>
        {hasCows && (() => {
          const c = getScoreColor(patient.cows!, 13, colors);
          return (
            <View style={[styles.scorePill, { backgroundColor: c.bg, borderColor: c.border }]}>
              <Text style={[styles.scorePillLabel, { color: c.text }]}>COWS</Text>
              <Text style={[styles.scorePillValue, { color: c.text }]}>{patient.cows}</Text>
            </View>
          );
        })()}
        {hasCiwa && (() => {
          const c = getScoreColor(patient.ciwa!, 15, colors);
          return (
            <View style={[styles.scorePill, { backgroundColor: c.bg, borderColor: c.border }]}>
              <Text style={[styles.scorePillLabel, { color: c.text }]}>CIWA</Text>
              <Text style={[styles.scorePillValue, { color: c.text }]}>{patient.ciwa}</Text>
            </View>
          );
        })()}
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

export default function VitalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { bannerDismissed, dismissBanner, scoreFilter, setScoreFilter } = useWithdrawalFilters();

  const residentialPatients = PATIENTS.filter(p => p.program === 'Residential');
  const allPatientsWithScores = residentialPatients.filter(p =>
    (p.cows != null && p.cows > 0) || (p.ciwa != null && p.ciwa > 0)
  );
  const patientsWithoutScores = residentialPatients.filter(p =>
    !(p.cows != null && p.cows > 0) && !(p.ciwa != null && p.ciwa > 0)
  );

  const patientsWithScores = (() => {
    switch (scoreFilter) {
      case 'cows':
        return allPatientsWithScores.filter(p => p.cows != null && p.cows > 0);
      case 'ciwa':
        return allPatientsWithScores.filter(p => p.ciwa != null && p.ciwa > 0);
      case 'alerts':
        return allPatientsWithScores.filter(p =>
          (p.cows != null && p.cows >= 13) || (p.ciwa != null && p.ciwa >= 15)
        );
      default:
        return allPatientsWithScores;
    }
  })();

  const criticalCount = patientsWithScores.filter(p =>
    (p.cows != null && p.cows >= 13) || (p.ciwa != null && p.ciwa >= 15)
  ).length;

  const openModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.navy }]}>
        <Text style={styles.headerTitle}>Withdrawal Scores</Text>
        <Text style={styles.headerSubtitle}>COWS · CIWA-Ar · Tap a patient for full history</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{patientsWithScores.length}</Text>
            <Text style={styles.statLabel}>On Protocol</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: criticalCount > 0 ? colors.critical : colors.success }]}>{criticalCount}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.amber }]}>Q4H</Text>
            <Text style={styles.statLabel}>Next Round</Text>
          </View>
        </View>
      </View>

      {/* Score filter bar */}
      <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {([
          { key: 'all', label: 'All', count: allPatientsWithScores.length },
          { key: 'cows', label: 'COWS Only', count: allPatientsWithScores.filter(p => p.cows != null && p.cows > 0).length },
          { key: 'ciwa', label: 'CIWA Only', count: allPatientsWithScores.filter(p => p.ciwa != null && p.ciwa > 0).length },
          { key: 'alerts', label: 'Alerts', count: allPatientsWithScores.filter(p => (p.cows != null && p.cows >= 13) || (p.ciwa != null && p.ciwa >= 15)).length },
        ] as { key: typeof scoreFilter; label: string; count: number }[]).map(opt => {
          const active = scoreFilter === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                Haptics.selectionAsync();
                setScoreFilter(opt.key);
              }}
              style={[
                styles.filterChip,
                active
                  ? { backgroundColor: colors.navy, borderColor: colors.navy }
                  : { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: active ? '#fff' : colors.mutedForeground },
                ]}
              >
                {opt.label}
              </Text>
              <View style={[
                styles.filterChipBadge,
                active
                  ? { backgroundColor: 'rgba(255,255,255,0.25)' }
                  : { backgroundColor: colors.muted },
              ]}>
                <Text style={[styles.filterChipBadgeText, { color: active ? '#fff' : colors.mutedForeground }]}>
                  {opt.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Alert banner — dismissable; cleared on shift handoff */}
      {criticalCount > 0 && !bannerDismissed && (
        <View style={[styles.alertBanner, { backgroundColor: '#FEF2F2', borderBottomColor: colors.critical }]}>
          <Ionicons name="warning" size={18} color={colors.critical} />
          <Text style={[styles.alertText, { color: colors.critical }]}>
            {criticalCount} patient{criticalCount > 1 ? 's' : ''} at or above alert threshold — notify physician
          </Text>
          <Pressable onPress={dismissBanner} hitSlop={8}>
            <Ionicons name="close" size={18} color={colors.critical} />
          </Pressable>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Severity reference strip */}
        <View style={[styles.legendRow, { backgroundColor: colors.card }]}>
          {[
            { label: 'Mild', cowsRange: '≤5', ciwaRange: '≤7', color: colors.success },
            { label: 'Mod', cowsRange: '6–12', ciwaRange: '8–14', color: colors.moderate },
            { label: 'Severe', cowsRange: '13–24', ciwaRange: '15–19', color: colors.high },
            { label: 'Danger', cowsRange: '≥25', ciwaRange: '≥20', color: colors.critical },
          ].map(r => (
            <View key={r.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: r.color }]} />
              <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>{r.label}</Text>
            </View>
          ))}
        </View>

        {/* Patients with active scores */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            ACTIVE WITHDRAWAL PROTOCOLS ({patientsWithScores.length}{scoreFilter !== 'all' ? ` of ${allPatientsWithScores.length}` : ''})
          </Text>
          {patientsWithScores.length > 0 ? patientsWithScores.map(p => (
            <PatientScoreRow
              key={p.id}
              patient={p}
              onPress={() => openModal(p)}
              colors={colors}
            />
          )) : (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="checkmark-circle-outline" size={28} color={colors.success} />
              <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
                No patients match this filter
              </Text>
            </View>
          )}
        </View>

        {/* Patients without active WD scores */}
        {patientsWithoutScores.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              NO ACTIVE PROTOCOL ({patientsWithoutScores.length})
            </Text>
            {patientsWithoutScores.map(p => (
              <Pressable
                key={p.id}
                onPress={() => openModal(p)}
                style={[styles.patientRowMinimal, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.bedBadge, { backgroundColor: colors.navyMid }]}>
                  <Text style={styles.bedBadgeText}>{p.bed}</Text>
                </View>
                <Text style={[styles.patientName, { color: colors.navy }]}>{p.firstName} {p.lastName}</Text>
                <View style={[styles.noWdBadge, { backgroundColor: colors.successBg }]}>
                  <Text style={[styles.noWdText, { color: colors.success }]}>No WD Protocol</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <ScoreHistoryModal
        patient={selectedPatient}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 12, paddingHorizontal: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold', paddingTop: 12 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', marginTop: 12, paddingBottom: 4 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1, fontFamily: 'Inter_400Regular' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  alertText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 12, gap: 4 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 10, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, fontFamily: 'Inter_600SemiBold' },
  patientRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  patientRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  alertIcon: { marginRight: -4 },
  bedBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  bedBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  patientName: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  patientMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  scoresRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scorePill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', borderWidth: 1, minWidth: 52 },
  scorePillLabel: { fontSize: 9, fontWeight: '700', fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  scorePillValue: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold', lineHeight: 22 },
  patientRowMinimal: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10,
    borderRadius: 10, marginBottom: 6, borderWidth: 1,
  },
  noWdBadge: { marginLeft: 'auto', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  noWdText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  modalSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontFamily: 'Inter_400Regular' },
  closeBtn: { padding: 4 },
  modalScroll: { flex: 1 },
  modalContent: { padding: 16, paddingBottom: 40, gap: 4 },
  currentScoresRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  currentScoreCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2 },
  currentScoreLabel: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  currentScoreValue: { fontSize: 48, fontWeight: '700', fontFamily: 'Inter_700Bold', lineHeight: 56 },
  currentScoreSeverity: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  trendCard: { borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  trendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  trendTime: { width: 50, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  trendScore: { flex: 1, textAlign: 'center', fontSize: 13, fontFamily: 'Inter_500Medium' },
  trendBy: { flex: 1.5, fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  scoreBubble: { flex: 1, alignItems: 'center', borderRadius: 6, paddingVertical: 3 },
  scoreBubbleText: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  vitalsHeaderRow: { flexDirection: 'row', paddingVertical: 8 },
  vitalsCell: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  noteCard: { borderRadius: 10, padding: 14 },
  noteText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  filterBar: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  filterChipBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  filterChipBadgeText: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  emptyState: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 28, borderRadius: 12, borderWidth: 1,
  },
  emptyStateText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
