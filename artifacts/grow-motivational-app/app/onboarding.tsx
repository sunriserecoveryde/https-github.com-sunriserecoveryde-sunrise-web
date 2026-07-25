import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp, ReminderSettings } from '@/context/AppContext';
import { formatReminderTime } from '@/utils/notifications';
import { TimeSpinnerPicker } from '@/components/TimeSpinnerPicker';
import { useAuth } from '@/context/AuthContext';

const USER_TYPES = [
  {
    id: 'individual',
    label: 'In Recovery',
    desc: 'Building daily habits and navigating my journey',
    icon: 'person' as const,
  },
  {
    id: 'family',
    label: 'Family / Loved One',
    desc: 'Supporting someone I care about',
    icon: 'people' as const,
  },
  {
    id: 'clinician',
    label: 'Clinician / Counselor',
    desc: 'Supplementing sessions with clients',
    icon: 'medkit' as const,
  },
  {
    id: 'student',
    label: 'Student / Trainee',
    desc: 'Learning behavioral health skills',
    icon: 'school' as const,
  },
];

function UserTypeCard({
  item,
  selected,
  onPress,
}: {
  item: (typeof USER_TYPES)[0];
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.typeCard,
        {
          backgroundColor: selected ? '#1C2D1C' : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.typeIcon,
          { backgroundColor: selected ? colors.primary : colors.muted },
        ]}
      >
        <Ionicons name={item.icon} size={22} color={selected ? '#fff' : colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.typeLabel, { color: colors.foreground }]}>{item.label}</Text>
        <Text style={[styles.typeDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
    </TouchableOpacity>
  );
}

// -1 = login screen, 0–3 = setup steps (type/name/sobriety/reminder), 4 = save-progress
type OnboardingStep = -1 | 0 | 1 | 2 | 3 | 4;

// Number of setup steps shown in the progress indicator (steps 0–3)
const SETUP_STEPS = 4;

export default function Onboarding() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding, restoreFromServer } = useApp();
  const { login, register } = useAuth();
  const isWeb = Platform.OS === 'web';

  const [step, setStep] = useState<OnboardingStep>(0);
  const [userType, setUserType] = useState('');
  const [name, setName] = useState('');
  const [sobrietyDays, setSobrietyDays] = useState(0);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderHour, setReminderHour] = useState(8);
  const [reminderMinute, setReminderMinute] = useState(0);

  // Auth form state (used for login screen and save-progress step)
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------
  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < SETUP_STEPS - 1) {
      setStep((s) => (s + 1) as OnboardingStep);
    } else if (step === SETUP_STEPS - 1) {
      // Last setup step (reminder) → save and go to save-progress
      const reminder: ReminderSettings = {
        enabled: reminderEnabled && Platform.OS !== 'web',
        hour: reminderHour,
        minute: reminderMinute,
      };
      await completeOnboarding(name.trim() || 'Friend', userType || 'individual', sobrietyDays, reminder);
      setStep(4);
    }
  };

  const finishOnboarding = () => {
    router.replace('/(tabs)');
  };

  const canProceed =
    step === 0
      ? !!userType
      : step === 1
      ? name.trim().length > 0
      : true;

  const adjustDays = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSobrietyDays((d) => Math.max(0, d + delta));
  };

  // -------------------------------------------------------------------------
  // Auth handlers (login screen & save-progress)
  // -------------------------------------------------------------------------
  const handleLogin = async () => {
    if (!authEmail.trim() || !authPassword) {
      setAuthError('Please enter your email and password.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const serverData = await login(authEmail.trim().toLowerCase(), authPassword);
      restoreFromServer(serverData);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!authEmail.trim() || authPassword.length < 8) {
      setAuthError('Use a valid email and a password of at least 8 characters.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      // Pass the full local snapshot so the server has a copy immediately —
      // the user's data is safe even if they reinstall before the next mutation.
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - sobrietyDays);
      const snapshot = {
        userName: name.trim() || 'Friend',
        userType: userType || 'individual',
        sobrietyStartDate: startDate.toISOString(),
        lessonsCompleted: [] as string[],
        skillsUsed: [] as string[],
        journalEntries: [] as Array<{ id: string; date: string; prompt: string; text: string }>,
        dailyMoods: [] as Array<{ date: string; rating: number }>,
      };
      await register(authEmail.trim().toLowerCase(), authPassword, snapshot);
      finishOnboarding();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Could not create account. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: isWeb ? 80 : insets.top + 24,
            paddingBottom: isWeb ? 60 : insets.bottom + 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / branding */}
        <View style={styles.logoArea}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.foreground }]}>Grow Motivational</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Your recovery journey companion
          </Text>
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* Step -1: Sign-in screen (returning users)                          */}
        {/* ------------------------------------------------------------------ */}
        {step === -1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Welcome back
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Sign in to restore your progress on this device.
            </Text>

            <TextInput
              style={[
                styles.authInput,
                {
                  backgroundColor: colors.card,
                  borderColor: authEmail.length > 0 ? colors.primary : colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Email address"
              placeholderTextColor={colors.mutedForeground}
              value={authEmail}
              onChangeText={setAuthEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              autoFocus
            />

            <TextInput
              style={[
                styles.authInput,
                {
                  backgroundColor: colors.card,
                  borderColor: authPassword.length > 0 ? colors.primary : colors.border,
                  color: colors.foreground,
                  marginTop: 12,
                },
              ]}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              value={authPassword}
              onChangeText={setAuthPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            {!!authError && (
              <Text style={[styles.authError, { color: '#EF4444' }]}>{authError}</Text>
            )}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={authLoading}
              activeOpacity={0.85}
              style={[styles.ctaWrap, { marginTop: 24 }]}
            >
              <LinearGradient
                colors={['#F97316', '#FBBF24']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                {authLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={[styles.ctaText, { color: '#fff' }]}>Sign In</Text>
                    <Feather name="arrow-right" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Pressable onPress={() => { setStep(0); setAuthError(''); }} style={styles.backLink}>
              <Text style={[styles.backLinkText, { color: colors.mutedForeground }]}>
                ← New here? Set up instead
              </Text>
            </Pressable>
          </View>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Steps 0–3: Onboarding setup (type → name → sobriety → reminder)   */}
        {/* ------------------------------------------------------------------ */}
        {step >= 0 && step < SETUP_STEPS && (
          <>
            {/* Sign-in link for returning users (only on step 0) */}
            {step === 0 && (
              <Pressable
                onPress={() => { setStep(-1); setAuthMode('login'); setAuthError(''); }}
                style={styles.signInBanner}
              >
                <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
                <Text style={[styles.signInBannerText, { color: colors.primary }]}>
                  Already have an account? Sign in →
                </Text>
              </Pressable>
            )}

            {/* Step indicator */}
            <View style={styles.stepRow}>
              {Array.from({ length: SETUP_STEPS }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: i <= (step as number) ? colors.primary : colors.muted,
                      width: i === (step as number) ? 24 : 8,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Step 0: User type */}
            {step === 0 && (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                  Who are you joining as?
                </Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  We'll tailor your experience to fit your needs.
                </Text>
                <View style={styles.typeList}>
                  {USER_TYPES.map((item) => (
                    <UserTypeCard
                      key={item.id}
                      item={item}
                      selected={userType === item.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setUserType(item.id);
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Step 1: Name */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                  What should we call you?
                </Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  Your first name or a nickname is fine.
                </Text>
                <TextInput
                  style={[
                    styles.nameInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: name.length > 0 ? colors.primary : colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder="Your name…"
                  placeholderTextColor={colors.mutedForeground}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={canProceed ? handleNext : undefined}
                  maxLength={40}
                />
              </View>
            )}

            {/* Step 2: Sobriety days */}
            {step === 2 && (
              <View style={styles.stepContent}>
                {userType === 'individual' ? (
                  <>
                    <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                      How many days sober are you today?
                    </Text>
                    <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                      This starts your streak counter. You can adjust it anytime.
                    </Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity
                        onPress={() => adjustDays(-10)}
                        style={[styles.stepperBtn, { backgroundColor: colors.muted }]}
                        disabled={sobrietyDays < 10}
                      >
                        <Feather name="minus" size={18} color={sobrietyDays >= 10 ? colors.foreground : colors.mutedForeground} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => adjustDays(-1)}
                        style={[styles.stepperBtn, { backgroundColor: colors.muted }]}
                        disabled={sobrietyDays === 0}
                      >
                        <Feather name="minus" size={22} color={sobrietyDays > 0 ? colors.foreground : colors.mutedForeground} />
                      </TouchableOpacity>
                      <LinearGradient
                        colors={['#F97316', '#FBBF24']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.daysBubble}
                      >
                        <Text style={styles.daysNumber}>{sobrietyDays}</Text>
                        <Text style={styles.daysLabel}>days</Text>
                      </LinearGradient>
                      <TouchableOpacity
                        onPress={() => adjustDays(1)}
                        style={[styles.stepperBtn, { backgroundColor: colors.muted }]}
                      >
                        <Feather name="plus" size={22} color={colors.foreground} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => adjustDays(10)}
                        style={[styles.stepperBtn, { backgroundColor: colors.muted }]}
                      >
                        <Feather name="plus" size={18} color={colors.foreground} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.daysHint, { color: colors.mutedForeground }]}>
                      {sobrietyDays === 0
                        ? 'Starting fresh — today is day one.'
                        : `Starting from ${sobrietyDays} days ago`}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                      {`You're almost there, ${name || 'friend'}!`}
                    </Text>
                    <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                      Just one more step — set up a daily reminder to keep your momentum going.
                    </Text>
                    <View style={[styles.readyCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                      <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
                      <Text style={[styles.readyText, { color: colors.foreground }]}>Profile ready</Text>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Step 3: Reminder opt-in */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <View style={[styles.reminderIconWrap, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="notifications-outline" size={40} color={colors.primary} />
                </View>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                  Stay on track with a daily reminder
                </Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  A gentle nudge each day helps build lasting habits. You can change or turn this off anytime.
                </Text>

                {/* Enable toggle */}
                <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Daily check-in reminder</Text>
                    <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                      {reminderEnabled
                        ? `Fires every day at ${formatReminderTime(reminderHour, reminderMinute)}`
                        : 'Off — you can enable it later in Progress'}
                    </Text>
                  </View>
                  <Switch
                    value={reminderEnabled}
                    onValueChange={(v) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setReminderEnabled(v);
                    }}
                    trackColor={{ false: colors.muted, true: colors.primary }}
                    thumbColor="#fff"
                  />
                </View>

                {/* Time picker (only visible when enabled) */}
                {reminderEnabled && (
                  <>
                    <Text style={[styles.timePickerLabel, { color: colors.mutedForeground }]}>
                      REMINDER TIME
                    </Text>
                    <TimeSpinnerPicker
                      hour={reminderHour}
                      minute={reminderMinute}
                      onHourChange={setReminderHour}
                      onMinuteChange={setReminderMinute}
                    />
                  </>
                )}

                {Platform.OS === 'web' && (
                  <View style={[styles.webNote, { backgroundColor: colors.muted }]}>
                    <Feather name="info" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.webNoteText, { color: colors.mutedForeground }]}>
                      Push notifications require the mobile app.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* CTA for setup steps */}
            <TouchableOpacity
              onPress={handleNext}
              disabled={!canProceed}
              activeOpacity={0.85}
              style={styles.ctaWrap}
            >
              <LinearGradient
                colors={canProceed ? ['#F97316', '#FBBF24'] : ['#293548', '#293548']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                <Text style={[styles.ctaText, { color: canProceed ? '#fff' : colors.mutedForeground }]}>
                  {step === SETUP_STEPS - 1 ? 'Start My Journey' : 'Continue'}
                </Text>
                <Feather name="arrow-right" size={18} color={canProceed ? '#fff' : colors.mutedForeground} />
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Step 4: Save progress (optional account creation)                  */}
        {/* ------------------------------------------------------------------ */}
        {step === 4 && (
          <View style={styles.stepContent}>
            {authMode === 'register' ? (
              <>
                <View style={[styles.saveProgressIcon, { backgroundColor: colors.card }]}>
                  <Ionicons name="cloud-upload-outline" size={40} color={colors.primary} />
                </View>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                  Protect your progress
                </Text>
                <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                  Create a free account so your journey is safe even if you switch phones or reinstall the app.
                </Text>

                <TextInput
                  style={[
                    styles.authInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: authEmail.length > 0 ? colors.primary : colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder="Email address"
                  placeholderTextColor={colors.mutedForeground}
                  value={authEmail}
                  onChangeText={setAuthEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                />

                <TextInput
                  style={[
                    styles.authInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: authPassword.length > 0 ? colors.primary : colors.border,
                      color: colors.foreground,
                      marginTop: 12,
                    },
                  ]}
                  placeholder="Password (8+ characters)"
                  placeholderTextColor={colors.mutedForeground}
                  value={authPassword}
                  onChangeText={setAuthPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />

                {!!authError && (
                  <Text style={[styles.authError, { color: '#EF4444' }]}>{authError}</Text>
                )}

                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={authLoading}
                  activeOpacity={0.85}
                  style={[styles.ctaWrap, { marginTop: 24 }]}
                >
                  <LinearGradient
                    colors={['#F97316', '#FBBF24']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cta}
                  >
                    {authLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={[styles.ctaText, { color: '#fff' }]}>Create Account & Save</Text>
                        <Feather name="shield" size={18} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <Pressable onPress={finishOnboarding} style={styles.skipLink}>
                  <Text style={[styles.skipLinkText, { color: colors.mutedForeground }]}>
                    Skip for now — save locally only
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* Ready card — prompt to save */}
                <View style={[styles.readyCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                  <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
                  <Text style={[styles.readyText, { color: colors.foreground }]}>
                    {`You're all set!`}
                  </Text>
                </View>

                <Text style={[styles.stepSub, { color: colors.mutedForeground, marginTop: 16 }]}>
                  Want to back up your progress? Create a free account so your data survives a phone switch or reinstall.
                </Text>

                <TouchableOpacity
                  onPress={() => setAuthMode('register')}
                  activeOpacity={0.85}
                  style={styles.ctaWrap}
                >
                  <LinearGradient
                    colors={['#F97316', '#FBBF24']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cta}
                  >
                    <Text style={[styles.ctaText, { color: '#fff' }]}>Save My Progress</Text>
                    <Feather name="cloud" size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                <Pressable onPress={finishOnboarding} style={styles.skipLink}>
                  <Text style={[styles.skipLinkText, { color: colors.mutedForeground }]}>
                    Start Journey →
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* Disclaimer */}
        <Text style={[styles.legalNote, { color: colors.mutedForeground }]}>
          Grow is an educational wellness tool, not a substitute for clinical treatment. In crisis,
          call 988 or 911.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    flexGrow: 1,
    alignItems: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  signInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  signInBannerText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 32,
    alignItems: 'center',
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  stepContent: {
    width: '100%',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  typeList: {
    gap: 10,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  typeDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  nameInput: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    width: '100%',
  },
  authInput: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: '100%',
  },
  authError: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 24,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysBubble: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  daysNumber: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    lineHeight: 40,
  },
  daysLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#fff',
    opacity: 0.85,
  },
  daysHint: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  readyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  readyText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  // Reminder step styles
  reminderIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  toggleSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  timePickerLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 2,
  },
  webNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  webNoteText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  // Save-progress step styles
  saveProgressIcon: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ctaWrap: {
    width: '100%',
    marginBottom: 20,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  backLink: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  skipLink: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  skipLinkText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  legalNote: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
