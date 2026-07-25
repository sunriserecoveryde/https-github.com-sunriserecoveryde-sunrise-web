/**
 * AuthContext — manages the Grow app's user account (email + password auth).
 *
 * Token is persisted in AsyncStorage so the user stays signed in across
 * restarts and survives a full JS bundle reload.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface GrowUser {
  id: string;
  email: string;
}

export interface GrowStateSnapshot {
  userName?: string;
  userType?: string;
  sobrietyStartDate?: string | null;
  lessonsCompleted?: string[];
  skillsUsed?: string[];
  journalEntries?: Array<{ id: string; date: string; prompt: string; text: string }>;
  dailyMoods?: Array<{ date: string; rating: number }>;
}

interface AuthState {
  user: GrowUser | null;
  token: string | null;
  authLoading: boolean;
}

interface AuthContextValue extends AuthState {
  register: (email: string, password: string, snapshot?: GrowStateSnapshot) => Promise<GrowStateSnapshot>;
  login: (email: string, password: string) => Promise<GrowStateSnapshot>;
  logout: () => Promise<void>;
  syncToServer: (snapshot: GrowStateSnapshot) => Promise<void>;
  /** Fetches the latest state from the server; returns null on failure */
  fetchServerState: () => Promise<GrowStateSnapshot | null>;
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------
const AUTH_TOKEN_KEY = 'grow_auth_token';
const AUTH_USER_KEY = 'grow_auth_user';

// ---------------------------------------------------------------------------
// API base URL
// Expo bundles expose EXPO_PUBLIC_* vars at build time.
// In development this is the Replit dev domain; in production it is the
// deployment domain injected via EXPO_PUBLIC_API_BASE.
// ---------------------------------------------------------------------------
function getApiBase(): string {
  // Allow explicit override for production deployments
  const explicit = process.env.EXPO_PUBLIC_API_BASE;
  if (explicit) return explicit.replace(/\/$/, '');

  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;

  // Fallback for local/web previews
  return '/api';
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, ...rest } = options;
  const base = getApiBase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${base}${path}`, { ...rest, headers });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? `HTTP ${res.status}`);
  }
  return json as T;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    authLoading: true,
  });

  // Load persisted auth on mount
  useEffect(() => {
    (async () => {
      try {
        const [tokenRaw, userRaw] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
        ]);
        if (tokenRaw && userRaw) {
          setState({ user: JSON.parse(userRaw), token: tokenRaw, authLoading: false });
          return;
        }
      } catch {
        // corrupt storage — ignore
      }
      setState((p) => ({ ...p, authLoading: false }));
    })();
  }, []);

  const persist = useCallback(async (user: GrowUser, token: string) => {
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
      AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
    ]);
    setState({ user, token, authLoading: false });
  }, []);

  const register = useCallback(
    async (email: string, password: string, snapshot?: GrowStateSnapshot): Promise<GrowStateSnapshot> => {
      const res = await apiFetch<{ token: string; user: GrowUser; data: GrowStateSnapshot }>(
        '/grow/register',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      );
      await persist(res.user, res.token);
      // Immediately back up any local state with the fresh token so data
      // is safe on the server even before the next mutation fires a sync.
      if (snapshot) {
        await apiFetch('/grow/sync', {
          method: 'PUT',
          body: JSON.stringify(snapshot),
          token: res.token,
        }).catch((err) => console.warn('[Grow] Initial sync after register failed:', err));
      }
      return res.data;
    },
    [persist],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<GrowStateSnapshot> => {
      const res = await apiFetch<{ token: string; user: GrowUser; data: GrowStateSnapshot }>(
        '/grow/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      );
      await persist(res.user, res.token);
      return res.data;
    },
    [persist],
  );

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(AUTH_USER_KEY),
    ]);
    setState({ user: null, token: null, authLoading: false });
  }, []);

  const syncToServer = useCallback(
    async (snapshot: GrowStateSnapshot): Promise<void> => {
      const { token } = state;
      if (!token) return;
      try {
        await apiFetch('/grow/sync', {
          method: 'PUT',
          body: JSON.stringify(snapshot),
          token,
        });
      } catch (err) {
        // Sync failures are non-fatal — data is already in AsyncStorage
        console.warn('[Grow] Sync failed:', err);
      }
    },
    [state],
  );

  const fetchServerState = useCallback(async (): Promise<GrowStateSnapshot | null> => {
    const { token } = state;
    if (!token) return null;
    try {
      const res = await apiFetch<{ user: GrowUser; data: GrowStateSnapshot }>('/grow/me', {
        token,
      });
      return res.data;
    } catch {
      return null;
    }
  }, [state]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        login,
        logout,
        syncToServer,
        fetchServerState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
