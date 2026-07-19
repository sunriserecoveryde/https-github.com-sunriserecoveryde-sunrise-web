import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import {
  PATIENTS,
  VITALS,
  MEDICATIONS,
  VitalEntry,
  Medication,
  MedClass,
  acuityColor,
} from '@/data/mockData';

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({
  data,
  color,
  width = 180,
  height = 48,
  label,
  unit = '',
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  label?: string;
  unit?: string;
}) {
  if (data.length < 2) return null;

  const padX = 6;
  const padY = 8;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const toX = (i: number) => padX + (i / (data.length - 1)) * innerW;
  const toY = (v: number) => padY + innerH - ((v - min) / range) * innerH;

  const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const latestX = toX(data.length - 1);
  const latestY = toY(data[data.length - 1]);

  return (
    <View style={{ alignItems: 'center' }}>
      {label && (
        <Text style={[sparkStyles.label, { color }]}>{label}</Text>
      )}
      <Svg width={width} height={height}>
        {/* Grid line */}
        <Line x1={padX} y1={padY + innerH} x2={padX + innerW} y2={padY + innerH} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
        {/* Trend line */}
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Latest value dot */}
        <Circle cx={latestX} cy={latestY} r={3.5} fill={color} />
        {/* Min label */}
        <SvgText x={padX} y={height - 2} fontSize={9} fill="rgba(0,0,0,0.35)">{min}{unit}</SvgText>
        {/* Max label */}
        <SvgText x={padX} y={11} fontSize={9} fill="rgba(0,0,0,0.35)">{max}{unit}</SvgText>
        {/* Latest value */}
        <SvgText x={latestX + 5} y={latestY + 4} fontSize={10} fontWeight="700" fill={color}>
          {data[data.length - 1]}{unit}
        </SvgText>
      </Svg>
    </View>
  );
}

const sparkStyles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2, fontFamily: 'Inter_700Bold' },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSystolic(bp: string): number {
  return parseInt(bp.split('/')[0], 10) || 0;
}

function medClassColor(cls: MedClass, colors: ReturnType<typeof useColors>): { bg: string; text: string } {
  switch (cls) {
    case 'MAT':        return { bg: colors.purpleBg, text: colors.purple };
    case 'Psychiatric': return { bg: colors.routineBg, text: colors.blue };
    case 'Medical':    return { bg: colors.successBg, text: colors.success };
    case 'PRN':        return { bg: colors.moderateBg, text: colors.moderate };
  }
}

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

// ─── Section components ───────────────────────────────────────────────────────

function SectionTitle({ title, colors }: { title: string; colors: ReturnType<typeof useColors> }) {
  return (
    <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
  );
}

function Card({ children, colors, style }: { children: React.ReactNode; colors: ReturnType<typeof useColors>; style?: any }) {
  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const patient = PATIENTS.find(p => p.id === id);
  if (!patient) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>Patient not found</Text>
      </View>
    );
  }

  const vitals: VitalEntry[] = VITALS[patient.id] ?? [];
  const medications: Medication[] = (MEDICATIONS[patient.id] ?? []).filter(m => m.status === 'Active');
  const ac = acuityColor(patient.acuity);
  const hasCows = patient.cows != null && patient.cows > 0;
  const hasCiwa = patient.ciwa != null && patient.ciwa > 0;
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);

  // Build sparkline series from vitals (oldest → newest)
  const vitalsAsc = [...vitals].reverse();
  const cowsSeries = vitalsAsc.map(v => v.cows).filter((v): v is number => v != null);
  const ciwaSeries = vitalsAsc.map(v => v.ciwa).filter((v): v is number => v != null);
  const bpSeries   = vitalsAsc.map(v => parseSystolic(v.bp));
  const hrSeries   = vitalsAsc.map(v => v.hr);

  const hasSparklines = vitalsAsc.length >= 2;

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* ─── Header ─── */}
      <View style={[s.header, { backgroundColor: colors.navy, paddingTop: topPad }]}>
        <View style={s.headerRow}>
          <Pressable onPress={goBack} style={s.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
            <Text style={s.backText}>Census</Text>
          </Pressable>

          <View style={[s.acuityBadge, { backgroundColor: ac.bg }]}>
            <Text style={[s.acuityText, { color: ac.text }]}>{patient.acuity}</Text>
          </View>
        </View>

        <View style={s.patientBlock}>
          <View style={[s.bedBadge, { backgroundColor: colors.navyMid }]}>
            <Text style={s.bedBadgeText}>{patient.bed ?? patient.program}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.headerName}>{patient.firstName} {patient.lastName}</Text>
            <Text style={s.headerMeta}>
              {patient.mrn} · {patient.age}{patient.gender} · LOS {patient.los}d · {patient.counselor}
            </Text>
            <Text style={s.headerDx} numberOfLines={1}>{patient.primaryDiagnosis}</Text>
          </View>
        </View>

        {/* Quick-stat row */}
        <View style={s.quickStats}>
          <View style={s.quickStat}>
            <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.55)" />
            <Text style={s.quickStatLabel}>Next Appt</Text>
            <Text style={s.quickStatValue}>{patient.nextAppointment}</Text>
          </View>
          <View style={s.quickStatDivider} />
          <View style={s.quickStat}>
            <Ionicons name="flask-outline" size={12} color="rgba(255,255,255,0.55)" />
            <Text style={s.quickStatLabel}>Last UA</Text>
            <Text style={s.quickStatValue}>{patient.lastUa}</Text>
          </View>
          <View style={s.quickStatDivider} />
          <View style={s.quickStat}>
            <Ionicons name="happy-outline" size={12} color="rgba(255,255,255,0.55)" />
            <Text style={s.quickStatLabel}>Mood / Cravings</Text>
            <Text style={s.quickStatValue}>{patient.mood}/10 · {patient.cravings}/10</Text>
          </View>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={[s.content, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>

        {/* ─── Withdrawal scores ─── */}
        {(hasCows || hasCiwa) && (
          <View style={s.section}>
            <SectionTitle title="WITHDRAWAL SCORES" colors={colors} />
            <View style={s.scoreRow}>
              {hasCows && (() => {
                const c = getScoreStyle(patient.cows!, 13, colors);
                return (
                  <View style={[s.scoreCard, { backgroundColor: c.bg, borderColor: c.text }]}>
                    <Text style={[s.scoreLabel, { color: c.text }]}>COWS</Text>
                    <Text style={[s.scoreValue, { color: c.text }]}>{patient.cows}</Text>
                    <Text style={[s.scoreSev, { color: c.text }]}>{getSeverityLabel(patient.cows!, false)}</Text>
                  </View>
                );
              })()}
              {hasCiwa && (() => {
                const c = getScoreStyle(patient.ciwa!, 15, colors);
                return (
                  <View style={[s.scoreCard, { backgroundColor: c.bg, borderColor: c.text }]}>
                    <Text style={[s.scoreLabel, { color: c.text }]}>CIWA-Ar</Text>
                    <Text style={[s.scoreValue, { color: c.text }]}>{patient.ciwa}</Text>
                    <Text style={[s.scoreSev, { color: c.text }]}>{getSeverityLabel(patient.ciwa!, true)}</Text>
                  </View>
                );
              })()}
            </View>
          </View>
        )}

        {/* ─── Vitals trend sparklines ─── */}
        <View style={s.section}>
          <SectionTitle title="VITALS TREND" colors={colors} />
          {hasSparklines ? (
            <Card colors={colors} style={s.sparkCard}>
              <View style={s.sparkRow}>
                {cowsSeries.length >= 2 && (
                  <View style={s.sparkItem}>
                    <Sparkline data={cowsSeries} color={colors.high} label="COWS" />
                  </View>
                )}
                {ciwaSeries.length >= 2 && (
                  <View style={s.sparkItem}>
                    <Sparkline data={ciwaSeries} color={colors.moderate} label="CIWA" />
                  </View>
                )}
                {bpSeries.length >= 2 && (
                  <View style={s.sparkItem}>
                    <Sparkline data={bpSeries} color={colors.blue} label="SBP" unit=" mmHg" />
                  </View>
                )}
                {hrSeries.length >= 2 && (
                  <View style={s.sparkItem}>
                    <Sparkline data={hrSeries} color={colors.teal} label="HR" unit=" bpm" />
                  </View>
                )}
              </View>
              {vitalsAsc.length > 0 && (
                <Text style={[s.sparkHint, { color: colors.mutedForeground }]}>
                  Last recorded: {vitals[0].date} {vitals[0].time} · {vitals[0].recordedBy}
                </Text>
              )}
            </Card>
          ) : (
            <Card colors={colors}>
              <View style={s.emptyVitals}>
                <Ionicons name="pulse-outline" size={24} color={colors.mutedForeground} />
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                  {vitals.length === 1
                    ? 'Only one reading — trend requires at least two data points.'
                    : 'No vitals recorded for this patient yet.'}
                </Text>
              </View>
            </Card>
          )}
        </View>

        {/* ─── Vitals table ─── */}
        {vitals.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="VITAL SIGNS — RECENT READINGS" colors={colors} />
            <Card colors={colors} style={{ padding: 0, overflow: 'hidden' }}>
              {/* Header row */}
              <View style={[s.tableRow, s.tableHeaderRow, { backgroundColor: colors.muted }]}>
                {['Date', 'Time', 'BP', 'HR', 'Temp', 'O₂', 'Pain'].map(h => (
                  <Text key={h} style={[s.tableCell, s.tableHeaderCell, { color: colors.mutedForeground }]}>{h}</Text>
                ))}
              </View>
              {vitals.map((v, i) => (
                <View
                  key={v.id}
                  style={[
                    s.tableRow,
                    i < vitals.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <Text style={[s.tableCell, { color: colors.navy }]}>{v.date}</Text>
                  <Text style={[s.tableCell, { color: colors.navy }]}>{v.time}</Text>
                  <Text style={[s.tableCell, { color: colors.navy, fontSize: 11 }]}>{v.bp}</Text>
                  <Text style={[s.tableCell, { color: v.hr > 100 ? colors.high : colors.navy }]}>{v.hr}</Text>
                  <Text style={[s.tableCell, { color: v.temp > 99 ? colors.moderate : colors.navy }]}>{v.temp}°</Text>
                  <Text style={[s.tableCell, { color: v.o2 < 96 ? colors.high : colors.success }]}>{v.o2}%</Text>
                  <Text style={[s.tableCell, { color: v.pain >= 7 ? colors.critical : v.pain >= 5 ? colors.moderate : colors.success }]}>{v.pain}/10</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* ─── Active medications ─── */}
        <View style={s.section}>
          <SectionTitle title={`ACTIVE MEDICATIONS (${medications.length})`} colors={colors} />
          {medications.length > 0 ? (
            <View style={s.medList}>
              {medications.map((med, i) => {
                const cls = medClassColor(med.class, colors);
                return (
                  <Card key={med.id} colors={colors} style={[s.medCard, i === medications.length - 1 && { marginBottom: 0 }]}>
                    <View style={s.medRow}>
                      <View style={{ flex: 1 }}>
                        <View style={s.medNameRow}>
                          <Text style={[s.medName, { color: colors.navy }]}>{med.name}</Text>
                          <View style={[s.classBadge, { backgroundColor: cls.bg }]}>
                            <Text style={[s.classBadgeText, { color: cls.text }]}>{med.class}</Text>
                          </View>
                        </View>
                        {med.genericName && (
                          <Text style={[s.medGeneric, { color: colors.mutedForeground }]}>{med.genericName}</Text>
                        )}
                        <Text style={[s.medDetail, { color: colors.navyLight }]}>
                          {med.dose} · {med.route} · {med.frequency}
                        </Text>
                        {med.times.length > 0 && (
                          <View style={s.timesRow}>
                            {med.times.map(t => (
                              <View key={t} style={[s.timeBadge, { backgroundColor: colors.muted }]}>
                                <Text style={[s.timeText, { color: colors.navy }]}>{t}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          ) : (
            <Card colors={colors}>
              <View style={s.emptyVitals}>
                <Ionicons name="medkit-outline" size={24} color={colors.mutedForeground} />
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No active medications on file.</Text>
              </View>
            </Card>
          )}
        </View>

        {/* ─── Flags ─── */}
        {patient.flags.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="FLAGS" colors={colors} />
            <View style={s.flagsList}>
              {patient.flags.map((f, i) => (
                <View key={i} style={[s.flagRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="flag" size={13} color={colors.high} />
                  <Text style={[s.flagText, { color: colors.navy }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── Handoff note ─── */}
        {patient.handoffNote && (
          <View style={s.section}>
            <SectionTitle title="NURSING HANDOFF NOTE" colors={colors} />
            <View style={[s.handoffNote, { backgroundColor: colors.navyMid }]}>
              <Text style={s.handoffText}>{patient.handoffNote}</Text>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },
  // Header
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_500Medium' },
  acuityBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  acuityText: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  patientBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  bedBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 2 },
  bedBadgeText: { fontSize: 15, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  headerName: { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  headerMeta: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontFamily: 'Inter_400Regular' },
  headerDx: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3, fontFamily: 'Inter_400Regular' },
  // Quick stats strip
  quickStats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 10, gap: 0 },
  quickStat: { flex: 1, alignItems: 'center', gap: 2 },
  quickStatDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)' },
  quickStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter_400Regular' },
  quickStatValue: { fontSize: 11, color: '#fff', fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  // Content
  scroll: { flex: 1 },
  content: { padding: 14, gap: 2 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8, fontFamily: 'Inter_700Bold' },
  // Card
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  // Score cards
  scoreRow: { flexDirection: 'row', gap: 10 },
  scoreCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 2 },
  scoreLabel: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  scoreValue: { fontSize: 44, fontWeight: '700', fontFamily: 'Inter_700Bold', lineHeight: 52 },
  scoreSev: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  // Sparklines
  sparkCard: { paddingBottom: 8 },
  sparkRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 6 },
  sparkItem: { alignItems: 'center' },
  sparkHint: { fontSize: 10, textAlign: 'center', marginTop: 6, fontFamily: 'Inter_400Regular' },
  // Empty state
  emptyVitals: { alignItems: 'center', padding: 20, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  // Vitals table
  tableRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 10 },
  tableHeaderRow: { borderTopLeftRadius: 11, borderTopRightRadius: 11 },
  tableCell: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  tableHeaderCell: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  // Medications
  medList: { gap: 8 },
  medCard: { marginBottom: 0 },
  medRow: { flexDirection: 'row', alignItems: 'flex-start' },
  medNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 },
  medName: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold', flex: 1 },
  medGeneric: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 3 },
  medDetail: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 5 },
  classBadge: { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  classBadgeText: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  timesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  timeBadge: { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  timeText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  // Flags
  flagsList: { gap: 6 },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  flagText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  // Handoff
  handoffNote: { borderRadius: 12, padding: 14 },
  handoffText: { fontSize: 14, color: '#fff', fontFamily: 'Inter_400Regular', lineHeight: 22 },
});
