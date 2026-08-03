/**
 * Sunrise OS API Server — Phase 2
 *
 * Middleware order:
 *  1. Trust proxy (Replit / reverse-proxy deployments)
 *  2. Pino HTTP logging (no sensitive headers logged — see logger.ts redact list)
 *  3. Helmet — security headers + CSP
 *  4. CORS — explicit allowlist, credentials: true
 *  5. Body parsers (enlarged limit for patient routes)
 *  6. Rate limiters (auth + existing public endpoints)
 *  7. express-session + connect-pg-simple → sos_sessions table
 *  8. CSRF protection (double-submit cookie; skipped for login/csrf-token/GET)
 *  9. sessionAuthMiddleware on /api/v1/* — loads AuthenticatedIdentity
 * 10. Routers
 */

import express, { type Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { rateLimit } from "express-rate-limit";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import helmet from "helmet";
import { doubleCsrf } from "csrf-csrf";
import { pool } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";
import { notifySpamAlert } from "./lib/spamAlert";
import { devIdentityMiddleware } from "./middlewares/devIdentity";
import { sessionAuthMiddleware } from "./middlewares/sessionAuth";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import healthRouter from "./routes/health";

const app: Express = express();
const isProduction = process.env.NODE_ENV === "production";

// Trust the first proxy hop so req.ip resolves to the real client IP.
app.set("trust proxy", 1);

// ── 2. Logging (before everything else so all requests are logged) ────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── 3. Helmet — security headers ─────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:     ["'self'"],
        scriptSrc:      ["'self'"],
        styleSrc:       ["'self'", "'unsafe-inline'"],
        imgSrc:         ["'self'", "data:"],
        connectSrc:     ["'self'"],
        fontSrc:        ["'self'"],
        objectSrc:      ["'none'"],
        frameSrc:       ["'none'"],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    hsts: isProduction
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    permittedCrossDomainPolicies: false,
    frameguard: { action: "deny" },
  }),
);

// ── 4. CORS — explicit allowlist ──────────────────────────────────────────────
const REPLIT_DEV_DOMAIN = process.env.REPLIT_DEV_DOMAIN ?? "";
const ALLOWED_ORIGINS_ENV = process.env.ALLOWED_ORIGINS ?? "";

const allowedOrigins: string[] = [
  // Replit preview domain (https://<repl>.<user>.replit.dev)
  ...(REPLIT_DEV_DOMAIN ? [`https://${REPLIT_DEV_DOMAIN}`] : []),
  // Comma-separated production origins from env
  ...ALLOWED_ORIGINS_ENV.split(",").map((s) => s.trim()).filter(Boolean),
  // Local development
  ...(isProduction ? [] : [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:80",
    // Playwright e2e — Vite dev server port used by the browser test runner
    "http://localhost:23456",
    // Allow any additional origins configured via env (e.g. CI / Playwright matrix)
    ...(process.env.PLAYWRIGHT_ORIGIN ? [process.env.PLAYWRIGHT_ORIGIN] : []),
  ]),
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (server-to-server, curl, health probes).
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // In development, allow any *.replit.dev origin for Replit previews.
      if (!isProduction && origin.endsWith(".replit.dev")) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token", "X-Dev-Org-Id", "X-Dev-Facility-Id"],
    exposedHeaders: [],
  }),
);

// ── 4b. Cookie parser — required by csrf-csrf to read the _csrf cookie ───────
// Must be mounted before CSRF middleware and before any route that needs cookies.
app.use(cookieParser());

// ── 5. Body parsers ───────────────────────────────────────────────────────────
// Enlarged limit for /api/v1/patients/* — reserved for future chart photograph
// uploads (spec: attached_assets/Pasted--Sunrise-OS-Compliant-Patient-Chart-
// Photograph-Capture-_1785608920909.txt; target branch feature/compliant-
// patient-chart-photo; NOT part of Phase 2 scope).
app.use(
  "/api/v1/patients",
  (req: Request, _res: Response, next: NextFunction) =>
    express.json({ limit: "8mb" })(req, _res, next),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 6. Rate limiters ──────────────────────────────────────────────────────────
function makeLimiter(limit: number, windowHours = 1) {
  return rateLimit({
    windowMs: windowHours * 60 * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
    handler(req, res, _next, options) {
      const ip = (req.ip ?? req.socket.remoteAddress ?? "unknown").replace(/^::ffff:/, "");
      notifySpamAlert(ip).catch((err) =>
        logger.error({ err }, "notifySpamAlert threw unexpectedly"),
      );
      res.status(options.statusCode).json(options.message);
    },
  });
}

app.use("/api/contact",    makeLimiter(5));
app.use("/api/subscribe",  makeLimiter(10));
app.use("/api/grow/register", makeLimiter(10));
app.use("/api/grow/login",    makeLimiter(20));
// Auth endpoints are rate-limited inside authV1.ts (10/15 min).

// ── 7. express-session + connect-pg-simple ────────────────────────────────────
const PgSession = ConnectPgSimple(session);

const COOKIE_NAME = isProduction ? "sos_session" : "sos_dev_session";
const IDLE_MAX_AGE = parseInt(process.env.SESSION_IDLE_TIMEOUT_MS ?? "1800000", 10); // 30 min

app.use(
  session({
    name:   COOKIE_NAME,
    secret: process.env.SESSION_SECRET ?? (isProduction
      ? (() => { throw new Error("SESSION_SECRET must be set in production"); })()
      : "dev-insecure-fallback-secret-do-not-use-in-prod"),
    resave:            false,
    saveUninitialized: false,
    rolling:           true,   // slide idle timeout on activity
    cookie: {
      httpOnly: true,
      secure:   isProduction,
      sameSite: "lax",
      path:     "/api",
      maxAge:   IDLE_MAX_AGE,
    },
    store: new PgSession({
      pool,
      tableName:          "sos_sessions",
      createTableIfMissing: false,   // table created by migration 0002
      pruneSessionInterval: 3600,    // prune expired sessions every hour (seconds)
      errorLog: (err: Error) => logger.error({ err }, "connect-pg-simple store error"),
    }),
  }),
);

// ── 8. CSRF protection ────────────────────────────────────────────────────────
const CSRF_SECRET = process.env.CSRF_SECRET ?? process.env.SESSION_SECRET ?? "csrf-dev-secret";

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret:            () => CSRF_SECRET,
  // Session ID is used as the HMAC message — use the express-session id.
  getSessionIdentifier: (req) => (req.session as { id?: string }).id ?? req.ip ?? "anon",
  cookieName:           "_csrf",
  cookieOptions: {
    sameSite: "lax",
    secure:   isProduction,
    path:     "/",
  },
  size:                   32,
  getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"] as string | undefined ?? "",
});

// Expose generateCsrfToken for the /api/v1/auth/csrf-token route.
app.set("csrfGenerateToken", generateCsrfToken);

// Apply CSRF to all state-changing /api/v1/* requests EXCEPT:
//  - Login (user not authenticated yet; protected by rate limiting)
//  - Password-reset request (same)
//  - CSRF token endpoint (it ISSUES the token)
//  - GET / HEAD / OPTIONS (safe methods)
app.use("/api/v1", (req: Request, res: Response, next: NextFunction) => {
  const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
  // §7 (Phase 2C): Login is NO LONGER exempt from CSRF.
  // The pre-login CSRF flow: GET /csrf-token → POST /login (with X-CSRF-Token).
  // After session.regenerate(), a fresh token must be fetched for subsequent requests.
  const CSRF_EXEMPT = [
    "/api/v1/auth/csrf-token",
    "/api/v1/auth/password-reset/request",
  ];

  if (SAFE_METHODS.includes(req.method)) return next();
  if (CSRF_EXEMPT.some((p) => req.path === p.replace("/api/v1", ""))) return next();

  doubleCsrfProtection(req, res, next);
});

// ── 8a. CSRF error handler ────────────────────────────────────────────────────
// csrf-csrf throws a ForbiddenError (status 403) when the token is missing or
// mismatched. Without this handler Express falls through to its default HTML
// error page which leaks the full stack trace. Return a clean, generic JSON 403.
app.use("/api/v1", (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (
    err !== null &&
    typeof err === "object" &&
    "status" in err &&
    (err as { status: unknown }).status === 403
  ) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next(err);
});

// ── 9. Session auth middleware on /api/v1/* ───────────────────────────────────
// In development: falls back to synthetic dev identity when no real session exists.
// In production: returns 401 for unauthenticated requests.
if (!isProduction) {
  // Keep dev header adapter for Replit preview environments — ignored in prod.
  app.use("/api/v1", devIdentityMiddleware);
}
app.use("/api/v1", sessionAuthMiddleware);

// ── Health routes (unauthenticated — before identity guard) ──────────────────
app.use(healthRouter);

// ── 10. API routers ───────────────────────────────────────────────────────────
app.use("/api", router);

// ── 11. Global error handler ──────────────────────────────────────────────────
// Catches any error passed to next(err) that was not handled by a more-specific
// error handler above (e.g. the CSRF 403 handler at §8a).
// See src/middlewares/globalErrorHandler.ts for the full implementation.
app.use(globalErrorHandler);

export default app;
