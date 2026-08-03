/**
 * ProductionLogin — real email + password login form.
 *
 * Shown when VITE_SUNRISE_DATA_MODE=production and the user is not authenticated.
 * Uses POST /api/v1/auth/login (session cookie; no token in localStorage).
 *
 * Security:
 *  - No token stored in localStorage or sessionStorage.
 *  - Login endpoint is rate-limited server-side.
 *  - Generic error message on failure (no account-existence disclosure).
 *  - CSRF double-submit-cookie guard: GET /csrf-token called first, then the
 *    resulting token is sent as X-CSRF-Token on the POST (Phase 2C requirement).
 *  - Password field value never logged or sent to analytics.
 *
 * Accessibility: WCAG 2.2 AA — keyboard nav, ARIA labels, 44 px tap targets.
 */

import React, { useState, useRef, useId } from 'react';
import { Sun, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { API_BASE } from '../lib/dataMode';
import sunriseLogo from '@assets/0_SunriseOS_Logo_transparent.png';

interface ProductionLoginProps {
  onSuccess: (session: ProductionSessionData) => void;
}

export interface ProductionSessionData {
  userId:              string;
  orgId:               string;
  displayName:         string;
  roleIds:             string[];
  permissionCodes:     string[];
  facilityIds:         string[];
  sessionExpiresAt:    string;
  authenticationMethod: string;
}

type LoginState = 'idle' | 'loading' | 'error' | 'network-error' | 'locked';

export function ProductionLogin({ onSuccess }: ProductionLoginProps) {
  const emailId    = useId();
  const passwordId = useId();

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [loginState, setLoginState] = useState<LoginState>('idle');
  const [errorMsg,   setErrorMsg]   = useState('');
  const passwordRef = useRef<HTMLInputElement>(null);

  const GENERIC_ERROR = 'Unable to sign in with those credentials.';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loginState === 'loading') return;

    setLoginState('loading');
    setErrorMsg('');

    try {
      // Phase 2C: login requires double-submit CSRF token.
      // Fetch (or refresh) the token immediately before submitting so the
      // _csrf cookie and X-CSRF-Token header are always in sync.
      let csrfToken = '';
      try {
        const csrfRes = await fetch(`${API_BASE}/v1/auth/csrf-token`, { credentials: 'include' });
        if (csrfRes.ok) {
          const csrfData = await csrfRes.json() as { csrfToken?: string };
          csrfToken = csrfData.csrfToken ?? '';
        }
      } catch {
        // Non-fatal — proceed; server will return 403 if CSRF guard fires.
      }

      const res = await fetch(`${API_BASE}/v1/auth/login`, {
        method:      'POST',
        credentials: 'include',
        headers:     {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body:        JSON.stringify({
          orgSlug: (import.meta.env.VITE_SUNRISE_ORG_SLUG as string | undefined) ?? "sunrise",
          email:   email.trim().toLowerCase(),
          password,
        }),
      });

      if (res.status === 429) {
        setLoginState('locked');
        setErrorMsg('Too many login attempts. Please wait and try again.');
        return;
      }

      if (res.status === 401 || res.status === 400) {
        setLoginState('error');
        // Always use generic message — never expose the server's reason.
        setErrorMsg(GENERIC_ERROR);
        // Clear password field after failure.
        setPassword('');
        setTimeout(() => passwordRef.current?.focus(), 50);
        return;
      }

      if (!res.ok) {
        setLoginState('error');
        setErrorMsg('A server error occurred. Please try again.');
        return;
      }

      const data: ProductionSessionData = await res.json();
      setLoginState('idle');
      onSuccess(data);

    } catch (err) {
      setLoginState('network-error');
      setErrorMsg('Unable to reach the server. Check your connection and try again.');
    }
  }

  return (
    <div
      className="min-h-screen flex bg-slate-950"
      data-testid="production-login"
    >
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 p-12 relative overflow-hidden">
        {/* Sunrise glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160%] h-[60%] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, #f97316 0%, #dc2626 40%, transparent 70%)' }}
        />
        <div className="relative">
          <img src={sunriseLogo} alt="Sunrise OS" className="h-8 w-auto" />
        </div>
        <div className="relative space-y-6">
          <h1 className="text-3xl font-semibold text-white leading-snug">
            Clinical excellence,<br />one workflow at a time.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Secure, compliant behavioral health records designed for Maryland treatment programs.
          </p>
        </div>
        <div className="relative">
          <p className="text-xs text-slate-600">
            Sunrise OS — for authorized staff only.
          </p>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center">
            <img src={sunriseLogo} alt="Sunrise OS" className="h-8 w-auto" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Sign in</h2>
            <p className="text-sm text-slate-400">
              Use your organizational credentials.
            </p>
          </div>

          {/* Error alert */}
          {(loginState === 'error' || loginState === 'network-error' || loginState === 'locked') && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-3 rounded-lg border border-red-800/60 bg-red-950/50 px-4 py-3 text-sm text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor={emailId}
                className="block text-sm font-medium text-slate-300"
              >
                Email address
              </label>
              <input
                id={emailId}
                data-testid="email-input"
                type="email"
                autoComplete="email"
                required
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loginState === 'loading'}
                className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 disabled:opacity-50 transition"
                placeholder="you@organization.org"
                aria-describedby={loginState === 'error' ? 'login-error' : undefined}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor={passwordId}
                className="block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id={passwordId}
                  data-testid="password-input"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginState === 'loading'}
                  className="w-full min-h-[44px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 disabled:opacity-50 transition"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              data-testid="submit-btn"
              disabled={!email || !password || loginState === 'loading'}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loginState === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Signing in…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" aria-hidden />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600">
            For account issues, contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
