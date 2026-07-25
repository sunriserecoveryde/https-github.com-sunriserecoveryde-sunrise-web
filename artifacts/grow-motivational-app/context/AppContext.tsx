import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleDailyReminder, cancelDailyReminder, ensureDailyReminderScheduled } from '@/utils/notifications';

export interface JournalEntry {
  id: string;
  date: string;
  prompt: string;
  text: string;
}

export interface MoodEntry {
  date: string; // YYYY-MM-DD
  rating: number; // 1-5
}

export interface ReminderSettings {
  enabled: boolean;
  hour: number;   // 0-23
  minute: number; // 0-59
}

interface AppState {
  hasOnboarded: boolean;
  userName: string;
  userType: 'individual' | 'family' | 'clinician' | 'student' | '';
  sobrietyStartDate: string | null; // ISO date string
  lessonsCompleted: string[];
  skillsUsed: string[];
  journalEntries: JournalEntry[];
  dailyMoods: MoodEntry[];
  reminderSettings: ReminderSettings;
  isLoading: boolean;
}

interface AppContextValue extends AppState {
  completeOnboarding: (name: string, type: string, sobrietyDays: number, reminder?: ReminderSettings) => Promise<void>;
  completeLesson: (lessonId: string) => void;
  markSkillUsed: (skillId: string) => void;
  addJournalEntry: (prompt: string, text: string) => void;
  recordMood: (rating: number) => void;
  resetSobriety: () => void;
  getSobrietyDays: () => number;
  getTodayMood: () => number | null;
  updateReminderSettings: (settings: ReminderSettings) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = 'grow_app_state_v1';

const todayStr = () => new Date().toISOString().slice(0, 10);

const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 8,
  minute: 0,
};

function daysBetween(start: string): number {
  const startDate = new Date(start);
  const now = new Date();
  const diff = now.getTime() - startDate.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    hasOnboarded: false,
    userName: '',
    userType: '',
    sobrietyStartDate: null,
    lessonsCompleted: [],
    skillsUsed: [],
    journalEntries: [],
    dailyMoods: [],
    reminderSettings: DEFAULT_REMINDER,
    isLoading: true,
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(async (raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          // Ensure reminderSettings exists for old installs
          if (!saved.reminderSettings) {
            saved.reminderSettings = DEFAULT_REMINDER;
          }
          setState((prev) => ({ ...prev, ...saved, isLoading: false }));

          // Re-register the reminder if it was enabled but lost (force-quit,
          // app upgrade, OS notification prune, etc.)
          const reminder: ReminderSettings = saved.reminderSettings;
          if (reminder.enabled) {
            await ensureDailyReminderScheduled(reminder.hour, reminder.minute);
          }
        } catch {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    });
  }, []);

  const save = useCallback((next: Partial<AppState>) => {
    setState((prev) => {
      const merged = { ...prev, ...next };
      const { isLoading: _ignored, ...toSave } = merged;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
      return merged;
    });
  }, []);

  const completeOnboarding = useCallback(
    async (name: string, type: string, sobrietyDays: number, reminder?: ReminderSettings) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - sobrietyDays);
      const finalReminder = reminder ?? DEFAULT_REMINDER;
      save({
        hasOnboarded: true,
        userName: name,
        userType: type as AppState['userType'],
        sobrietyStartDate: startDate.toISOString(),
        reminderSettings: finalReminder,
      });
      if (finalReminder.enabled) {
        await scheduleDailyReminder(finalReminder.hour, finalReminder.minute);
      }
    },
    [save],
  );

  const completeLesson = useCallback(
    (lessonId: string) => {
      setState((prev) => {
        if (prev.lessonsCompleted.includes(lessonId)) return prev;
        const updated = [...prev.lessonsCompleted, lessonId];
        const { isLoading: _ignored, ...toSave } = { ...prev, lessonsCompleted: updated };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
        return { ...prev, lessonsCompleted: updated };
      });
    },
    [],
  );

  const markSkillUsed = useCallback(
    (skillId: string) => {
      setState((prev) => {
        const entry = `${skillId}_${Date.now()}`;
        const updated = [...prev.skillsUsed, entry];
        const { isLoading: _ignored, ...toSave } = { ...prev, skillsUsed: updated };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
        return { ...prev, skillsUsed: updated };
      });
    },
    [],
  );

  const addJournalEntry = useCallback(
    (prompt: string, text: string) => {
      setState((prev) => {
        const entry: JournalEntry = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          date: new Date().toISOString(),
          prompt,
          text,
        };
        const updated = [entry, ...prev.journalEntries];
        const { isLoading: _ignored, ...toSave } = { ...prev, journalEntries: updated };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
        return { ...prev, journalEntries: updated };
      });
    },
    [],
  );

  const recordMood = useCallback(
    (rating: number) => {
      setState((prev) => {
        const today = todayStr();
        const filtered = prev.dailyMoods.filter((m) => m.date !== today);
        const updated = [...filtered, { date: today, rating }];
        const { isLoading: _ignored, ...toSave } = { ...prev, dailyMoods: updated };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
        return { ...prev, dailyMoods: updated };
      });
    },
    [],
  );

  const resetSobriety = useCallback(() => {
    save({ sobrietyStartDate: new Date().toISOString() });
  }, [save]);

  const getSobrietyDays = useCallback(() => {
    if (!state.sobrietyStartDate) return 0;
    return daysBetween(state.sobrietyStartDate);
  }, [state.sobrietyStartDate]);

  const getTodayMood = useCallback(() => {
    const today = todayStr();
    const entry = state.dailyMoods.find((m) => m.date === today);
    return entry ? entry.rating : null;
  }, [state.dailyMoods]);

  const updateReminderSettings = useCallback(
    async (settings: ReminderSettings) => {
      save({ reminderSettings: settings });
      if (settings.enabled) {
        await scheduleDailyReminder(settings.hour, settings.minute);
      } else {
        await cancelDailyReminder();
      }
    },
    [save],
  );

  return (
    <AppContext.Provider
      value={{
        ...state,
        completeOnboarding,
        completeLesson,
        markSkillUsed,
        addJournalEntry,
        recordMood,
        resetSobriety,
        getSobrietyDays,
        getTodayMood,
        updateReminderSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
