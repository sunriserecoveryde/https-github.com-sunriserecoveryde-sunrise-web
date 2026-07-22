import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { useRole } from '@/context/RoleContext';
import { PATIENTS } from '@/data/mockData';

// Date-scoped keys keep each calendar day's incident/UA data isolated.
const today = new Date();
const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const INCIDENTS_KEY = `@sunrise_incidents_${dateKey}`;
const UA_LOG_KEY    = `@sunrise_ua_log_${dateKey}`;

// Role-to-name lookup for the reporter field.
const ROLE_NAMES: Record<string, string> = {
  nursing: 'J. Torres, RN',
  bht:     'M. Boyd, BHT',
};

// NOTE: This tab does NOT render a "Discharging…" indicator.
// It manages its own local `incidents` and `uaLog` state and does not consume
// PatientContext, so it never reads `pendingDischarge` or `isPendingDischarge`.
// No discharge-undo test coverage is required here; if this tab is ever
// refactored to source patients from PatientContext, add tests mirroring the
// pattern in __tests__/crossTabDischargeUndo.test.ts at that time.

type IncidentType = 'Physical Altercation' | 'Medication Error' | 'Fall' | 'AMA Attempt' | 'Self-Harm Risk' | 'Other';
type UAResult = 'Negative' | 'Positive' | 'Refused' | 'Invalid';

const INCIDENT_TYPES: IncidentType[] = [
  'Physical Altercation',
  'Medication Error',
  'Fall',
  'AMA Attempt',
  'Self-Harm Risk',
  'Other',
];
const UA_RESULTS: UAResult[] = ['Negative', 'Positive', 'Refused', 'Invalid'];

type IncidentStatus = 'Open' | 'Reviewed' | 'Resolved';

interface IncidentReport {
  id: string;
  type: IncidentType;
  patientName: string;
  location: string;
  description: string;
  reportedBy: string;
  time: string;
  status: IncidentStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

interface UAEntry {
  id: string;
  patientName: string;
  bed: string;
  result: UAResult;
  substances: string;
  collectedBy: string;
  time: string;
}

const SEED_INCIDENTS: IncidentReport[] = [
  { id: 'i1', type: 'AMA Attempt', patientName: 'Marcus Webb', location: 'Main Hallway', description: 'Patient verbalized intent to leave AMA after lunch. Counselor engaged and patient agreed to remain. Clinical team notified.', reportedBy: 'K. Wright (BHT)', time: '11:42 AM', status: 'Reviewed', acknowledgedBy: 'J. Torres, RN', acknowledgedAt: '12:05 PM' },
  { id: 'i2', type: 'Physical Altercation', patientName: 'Devon Patel', location: 'Common Room', description: 'Patient became agitated during group, raised voice at peer. Redirected by BHT. No physical contact. De-escalated successfully.', reportedBy: 'K. Wright (BHT)', time: '09:15 AM', status: 'Open' },
];

const SEED_UA: UAEntry[] = [
  { id: 'u1', patientName: 'Marcus Webb', bed: '1A', result: 'Positive', substances: 'Buprenorphine (expected — MAT)', collectedBy: 'K. Wright (BHT)', time: '06:30 AM' },
  { id: 'u2', patientName: 'Devon Patel', bed: '2A', result: 'Positive', substances: 'METH', collectedBy: 'K. Wright (BHT)', time: '06:45 AM' },
  { id: 'u3', patientName: 'Angela Reyes', bed: '1B', result: 'Negative', substances: '—', collectedBy: 'J. Torres, RN', time: '07:00 AM' },
];

function incidentTypeColor(type: IncidentType, colors: ReturnType<typeof useColors>) {
  switch (type) {
    case 'Physical Altercation': return { bg: colors.criticalBg, text: colors.critical };
    case 'Self-Harm Risk': return { bg: colors.criticalBg, text: colors.critical };
    case 'AMA Attempt': return { bg: colors.highBg, text: colors.high };
    case 'Medication Error': return { bg: colors.moderateBg, text: colors.moderate };
    case 'Fall': return { bg: colors.moderateBg, text: colors.moderate };
    default: return { bg: colors.muted, text: colors.mutedForeground };
  }
}

function uaResultColor(result: UAResult, colors: ReturnType<typeof useColors>) {
  switch (result) {
    case 'Positive': return { bg: colors.criticalBg, text: colors.critical };
    case 'Negative': return { bg: colors.successBg, text: colors.success };
    case 'Refused': return { bg: colors.moderateBg, text: colors.moderate };
    default: return { bg: colors.muted, text: colors.mutedForeground };
  }
}

function statusBadgeStyle(status: IncidentStatus, colors: ReturnType<typeof useColors>) {
  switch (status) {
    case 'Open':     return { bg: colors.criticalBg, text: colors.critical };
    case 'Reviewed': return { bg: colors.moderateBg, text: colors.moderate };
    case 'Resolved': return { bg: colors.successBg,  text: colors.success };
  }
}

function IncidentCard({ item, role, onStatusChange }: {
  item: IncidentReport;
  role: string;
  onStatusChange: (id: string, next: IncidentStatus, by: string) => void;
}) {
  const colors = useColors();
  const tc = incidentTypeColor(item.type, colors);
  const sc = statusBadgeStyle(item.status, colors);
  const reporterName = ROLE_NAMES[role] ?? 'Staff';

  function handleAcknowledge() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (item.status === 'Open') onStatusChange(item.id, 'Reviewed', `${reporterName} · ${now}`);
    else if (item.status === 'Reviewed') onStatusChange(item.id, 'Resolved', `${reporterName} · ${now}`);
  }

  return (
    <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: item.status === 'Open' ? colors.critical : colors.border, borderWidth: item.status === 'Open' ? 1.5 : 1 }]}>
      <View style={styles.reportCardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: tc.bg }]}>
          <Text style={[styles.typeText, { color: tc.text }]}>{item.type}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: sc.bg, marginLeft: 0 }]}>
          <Text style={[styles.typeText, { color: sc.text }]}>{item.status}</Text>
        </View>
        <Text style={[styles.reportTime, { color: colors.mutedForeground }]}>{item.time}</Text>
      </View>
      <Text style={[styles.reportPatient, { color: colors.navy }]}>{item.patientName}</Text>
      <Text style={[styles.reportLocation, { color: colors.mutedForeground }]}>{item.location}</Text>
      <Text style={[styles.reportDesc, { color: colors.navyLight }]} numberOfLines={3}>{item.description}</Text>
      <Text style={[styles.reportedBy, { color: colors.mutedForeground }]}>Reported by {item.reportedBy}</Text>

      {item.status === 'Resolved' && item.acknowledgedBy ? (
        <View style={[styles.ackRow, { backgroundColor: colors.successBg }]}>
          <Ionicons name="checkmark-done-circle" size={14} color={colors.success} />
          <Text style={[styles.ackText, { color: colors.success }]}>Resolved by {item.acknowledgedBy}</Text>
        </View>
      ) : item.status === 'Reviewed' && item.acknowledgedBy ? (
        <View style={[styles.ackRow, { backgroundColor: colors.moderateBg }]}>
          <Ionicons name="eye" size={14} color={colors.moderate} />
          <Text style={[styles.ackText, { color: colors.moderate }]}>Reviewed by {item.acknowledgedBy}</Text>
        </View>
      ) : null}

      {item.status !== 'Resolved' && (
        <Pressable
          style={[styles.ackBtn, { backgroundColor: item.status === 'Open' ? colors.moderate : colors.success }]}
          onPress={handleAcknowledge}
        >
          <Ionicons name={item.status === 'Open' ? 'eye-outline' : 'checkmark-done-outline'} size={14} color="#fff" />
          <Text style={styles.ackBtnText}>
            {item.status === 'Open' ? 'Mark Reviewed' : 'Mark Resolved'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function UACard({ item }: { item: UAEntry }) {
  const colors = useColors();
  const rc = uaResultColor(item.result, colors);
  return (
    <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.reportCardHeader}>
        <View style={[styles.bedTag, { backgroundColor: colors.navyMid }]}>
          <Text style={styles.bedTagText}>{item.bed}</Text>
        </View>
        <Text style={[styles.reportPatient, { color: colors.navy, flex: 1, marginLeft: 8 }]}>{item.patientName}</Text>
        <View style={[styles.typeBadge, { backgroundColor: rc.bg }]}>
          <Text style={[styles.typeText, { color: rc.text }]}>{item.result}</Text>
        </View>
        <Text style={[styles.reportTime, { color: colors.mutedForeground }]}>{item.time}</Text>
      </View>
      <Text style={[styles.reportDesc, { color: colors.navyLight, marginTop: 6 }]}>
        Substances: {item.substances}
      </Text>
      <Text style={[styles.reportedBy, { color: colors.mutedForeground }]}>Collected by {item.collectedBy}</Text>
    </View>
  );
}

// ── New Incident Modal ───────────────────────────────────────────────────────

function NewIncidentModal({ visible, onClose, onSave, reporterName }: {
  visible: boolean;
  onClose: () => void;
  onSave: (r: IncidentReport) => void;
  reporterName: string;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<IncidentType>('AMA Attempt');
  const [patientId, setPatientId] = useState('p1');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const selectedPatient = PATIENTS.find(p => p.id === patientId);

  function handleSave() {
    if (!description.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      id: Date.now().toString(),
      type,
      patientName: `${selectedPatient?.firstName} ${selectedPatient?.lastName}`,
      location: location || 'Unspecified',
      description,
      reportedBy: reporterName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setDescription('');
    setLocation('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView
        style={[styles.modal, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.navy }]}>New Incident Report</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={styles.modalBody}>
          <Text style={[styles.fieldLabel, { color: colors.navy }]}>Incident Type</Text>
          <View style={styles.typeGrid}>
            {INCIDENT_TYPES.map(t => (
              <Pressable
                key={t}
                style={[styles.typeChip, { borderColor: type === t ? colors.orange : colors.border, backgroundColor: type === t ? colors.highBg : colors.card }]}
                onPress={() => { Haptics.selectionAsync(); setType(t); }}
              >
                <Text style={[styles.typeChipText, { color: type === t ? colors.orange : colors.mutedForeground }]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.navy }]}>Patient</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patientScroll}>
            {PATIENTS.slice(0, 8).map(p => (
              <Pressable
                key={p.id}
                style={[styles.patientChip, { borderColor: patientId === p.id ? colors.orange : colors.border, backgroundColor: patientId === p.id ? colors.highBg : colors.card }]}
                onPress={() => { Haptics.selectionAsync(); setPatientId(p.id); }}
              >
                <Text style={[styles.patientChipBed, { color: patientId === p.id ? colors.orange : colors.mutedForeground }]}>{p.bed}</Text>
                <Text style={[styles.patientChipName, { color: patientId === p.id ? colors.navy : colors.mutedForeground }]}>{p.firstName}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={[styles.fieldLabel, { color: colors.navy }]}>Location</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.navy, backgroundColor: colors.card }]}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Common Room, Hallway B"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[styles.fieldLabel, { color: colors.navy }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { borderColor: colors.border, color: colors.navy, backgroundColor: colors.card }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what occurred…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={5}
          />

          <Pressable
            style={[styles.saveBtn, { backgroundColor: !description.trim() ? colors.muted : colors.orange }]}
            onPress={handleSave}
            disabled={!description.trim()}
          >
            <Text style={[styles.saveBtnText, { color: !description.trim() ? colors.mutedForeground : '#fff' }]}>Submit Report</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Modal>
  );
}

// ── New UA Modal ─────────────────────────────────────────────────────────────

function NewUAModal({ visible, onClose, onSave, reporterName }: {
  visible: boolean;
  onClose: () => void;
  onSave: (e: UAEntry) => void;
  reporterName: string;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [patientId, setPatientId] = useState('p1');
  const [result, setResult] = useState<UAResult>('Negative');
  const [substances, setSubstances] = useState('');

  const selectedPatient = PATIENTS.find(p => p.id === patientId);

  function handleSave() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      id: Date.now().toString(),
      patientName: `${selectedPatient?.firstName} ${selectedPatient?.lastName}`,
      bed: selectedPatient?.bed ?? '—',
      result,
      substances: substances || (result === 'Negative' ? '—' : 'See notes'),
      collectedBy: reporterName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setSubstances('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView
        style={[styles.modal, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.navy }]}>Log UA Specimen</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={styles.modalBody}>
          <Text style={[styles.fieldLabel, { color: colors.navy }]}>Patient</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patientScroll}>
            {PATIENTS.slice(0, 8).map(p => (
              <Pressable
                key={p.id}
                style={[styles.patientChip, { borderColor: patientId === p.id ? colors.orange : colors.border, backgroundColor: patientId === p.id ? colors.highBg : colors.card }]}
                onPress={() => { Haptics.selectionAsync(); setPatientId(p.id); }}
              >
                <Text style={[styles.patientChipBed, { color: patientId === p.id ? colors.orange : colors.mutedForeground }]}>{p.bed}</Text>
                <Text style={[styles.patientChipName, { color: patientId === p.id ? colors.navy : colors.mutedForeground }]}>{p.firstName}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={[styles.fieldLabel, { color: colors.navy }]}>Result</Text>
          <View style={styles.resultRow}>
            {UA_RESULTS.map(r => {
              const rc = uaResultColor(r, colors);
              return (
                <Pressable
                  key={r}
                  style={[styles.resultChip, { borderColor: result === r ? rc.text : colors.border, backgroundColor: result === r ? rc.bg : colors.card }]}
                  onPress={() => { Haptics.selectionAsync(); setResult(r); }}
                >
                  <Text style={[styles.resultChipText, { color: result === r ? rc.text : colors.mutedForeground }]}>{r}</Text>
                </Pressable>
              );
            })}
          </View>

          {result === 'Positive' && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.navy }]}>Substances Detected</Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.border, color: colors.navy, backgroundColor: colors.card }]}
                value={substances}
                onChangeText={setSubstances}
                placeholder="e.g., THC, METH, BUP (MAT)"
                placeholderTextColor={colors.mutedForeground}
              />
            </>
          )}

          <Pressable style={[styles.saveBtn, { backgroundColor: colors.orange }]} onPress={handleSave}>
            <Text style={[styles.saveBtnText, { color: '#fff' }]}>Save UA Log</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Modal>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

type Tab = 'incidents' | 'ua';

export default function IncidentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const { role, setRole } = useRole();
  const [activeTab, setActiveTab] = useState<Tab>('incidents');
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showUAModal, setShowUAModal] = useState(false);
  const [incidents, setIncidents] = useState<IncidentReport[]>(SEED_INCIDENTS);
  const [uaLog, setUALog] = useState<UAEntry[]>(SEED_UA);
  const [loaded, setLoaded] = useState(false);

  // ── Toast ────────────────────────────────────────────────────────────────────
  const [toastMsg, setToastMsg] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  function showToast(msg: string) {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }

  // ── Persist to / load from AsyncStorage ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [storedIncidents, storedUA] = await Promise.all([
          AsyncStorage.getItem(INCIDENTS_KEY),
          AsyncStorage.getItem(UA_LOG_KEY),
        ]);
        if (storedIncidents) setIncidents(JSON.parse(storedIncidents));
        if (storedUA) setUALog(JSON.parse(storedUA));
      } catch { /* storage unavailable — fall back to seed data */ }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents)).catch(() => {});
  }, [incidents, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(UA_LOG_KEY, JSON.stringify(uaLog)).catch(() => {});
  }, [uaLog, loaded]);

  function handleSaveIncident(r: IncidentReport) {
    setIncidents(prev => [{ ...r, status: 'Open' }, ...prev]);
    showToast('Incident report filed');
  }

  function handleStatusChange(id: string, next: IncidentStatus, by: string) {
    setIncidents(prev => prev.map(inc =>
      inc.id === id ? { ...inc, status: next, acknowledgedBy: by } : inc
    ));
    showToast(next === 'Reviewed' ? 'Incident marked reviewed' : 'Incident resolved');
  }

  function handleSaveUA(e: UAEntry) {
    setUALog(prev => [e, ...prev]);
    showToast('UA specimen logged');
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.navy }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Incident Log</Text>
            <Text style={styles.headerSubtitle}>Oct 26 · {incidents.length} incidents, {uaLog.length} UA</Text>
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

      {/* Sub-tabs */}
      <View style={[styles.subTabRow, { backgroundColor: colors.navyMid }]}>
        <Pressable
          style={[styles.subTab, activeTab === 'incidents' && { borderBottomColor: colors.orange, borderBottomWidth: 2 }]}
          onPress={() => { Haptics.selectionAsync(); setActiveTab('incidents'); }}
        >
          <Text style={[styles.subTabText, { color: activeTab === 'incidents' ? colors.orange : colors.slateLight }]}>
            Incidents ({incidents.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.subTab, activeTab === 'ua' && { borderBottomColor: colors.orange, borderBottomWidth: 2 }]}
          onPress={() => { Haptics.selectionAsync(); setActiveTab('ua'); }}
        >
          <Text style={[styles.subTabText, { color: activeTab === 'ua' ? colors.orange : colors.slateLight }]}>
            UA Log ({uaLog.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.newBtn, { backgroundColor: colors.orange }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (activeTab === 'incidents') setShowIncidentModal(true);
            else setShowUAModal(true);
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newBtnText}>{activeTab === 'incidents' ? 'Report' : 'Log UA'}</Text>
        </Pressable>
      </View>

      {activeTab === 'incidents' ? (
        <FlatList
          data={incidents}
          keyExtractor={i => i.id}
          renderItem={({ item }) => <IncidentCard item={item} role={role} onStatusChange={handleStatusChange} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0) }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No incidents this shift</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={uaLog}
          keyExtractor={u => u.id}
          renderItem={({ item }) => <UACard item={item} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0) }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="flask-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No UA collections logged</Text>
            </View>
          }
        />
      )}

      <NewIncidentModal
        visible={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        onSave={handleSaveIncident}
        reporterName={ROLE_NAMES[role] ?? 'Staff'}
      />
      <NewUAModal
        visible={showUAModal}
        onClose={() => setShowUAModal(false)}
        onSave={handleSaveUA}
        reporterName={ROLE_NAMES[role] ?? 'Staff'}
      />

      {/* Success toast */}
      <Animated.View
        pointerEvents="none"
        style={[styles.toast, { backgroundColor: colors.navy, opacity: toastOpacity }]}
      >
        <Ionicons name="checkmark-circle" size={16} color="#fff" />
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>
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
  subTabRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4 },
  subTab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  subTabText: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  newBtnText: { fontSize: 13, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  listContent: { padding: 12, gap: 10 },
  reportCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  reportCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  reportTime: { fontSize: 12, marginLeft: 'auto' as any, fontFamily: 'Inter_400Regular' },
  reportPatient: { fontSize: 15, fontWeight: '600', marginBottom: 2, fontFamily: 'Inter_600SemiBold' },
  reportLocation: { fontSize: 12, marginBottom: 6, fontFamily: 'Inter_400Regular' },
  reportDesc: { fontSize: 13, lineHeight: 18, marginBottom: 8, fontFamily: 'Inter_400Regular' },
  reportedBy: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  bedTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  bedTagText: { fontSize: 13, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  emptyState: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  // Modal
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  modalBody: { padding: 20, gap: 4 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8, fontFamily: 'Inter_600SemiBold' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  typeChipText: { fontSize: 13, fontWeight: '500', fontFamily: 'Inter_500Medium' },
  patientScroll: { marginBottom: 4 },
  patientChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginRight: 8, alignItems: 'center', minWidth: 60 },
  patientChipBed: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  patientChipName: { fontSize: 11, marginTop: 2, fontFamily: 'Inter_400Regular' },
  resultRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  resultChip: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center', minWidth: 70 },
  resultChipText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  textInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular' },
  textArea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 120, textAlignVertical: 'top', fontFamily: 'Inter_400Regular' },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  toastText: { fontSize: 14, fontWeight: '600', color: '#fff', fontFamily: 'Inter_600SemiBold' },
  ackRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 8 },
  ackText: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  ackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10, alignSelf: 'flex-start' },
  ackBtnText: { fontSize: 13, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
});
