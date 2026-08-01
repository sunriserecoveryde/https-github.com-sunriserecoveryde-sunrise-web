import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { rateLimit } from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";
import { notifySpamAlert } from "./lib/spamAlert";
import { devIdentityMiddleware } from "./middlewares/devIdentity";
import { requireIdentity } from "./middlewares/requireIdentity";
import healthRouter from "./routes/health";

const app: Express = express();

// Trust the first proxy hop so req.ip resolves to the real client IP
// (needed for per-client rate limiting in proxied / Replit deployments)
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Shared rate-limit handler (logs + optional Slack alert)
function makeLimiter(limit: number) {
  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
    handler(req, res, _next, options) {
      const ip = (req.ip ?? req.socket.remoteAddress ?? "unknown").replace(
        /^::ffff:/,
        "",
      );
      notifySpamAlert(ip).catch((err) =>
        logger.error({ err }, "notifySpamAlert threw unexpectedly"),
      );
      res.status(options.statusCode).json(options.message);
    },
  });
}

// Rate-limit the contact form: 5 submissions per IP per hour
app.use("/api/contact", makeLimiter(5));

// Rate-limit the subscribe/lead-capture forms: 10 per IP per hour
app.use("/api/subscribe", makeLimiter(10));

// Rate-limit Grow auth endpoints: 20 per IP per hour (covers login + register)
app.use("/api/grow/register", makeLimiter(10));
app.use("/api/grow/login", makeLimiter(20));

// Dev-only identity adapter.
// In development: reads X-Dev-Org-Id / X-Dev-Facility-Id headers (or seeds defaults).
// In production:  NOT registered — req.devIdentity is never set.
if (process.env.NODE_ENV !== "production") {
  app.use("/api/v1", devIdentityMiddleware);
}

// Identity guard — enforces 401 when no identity is attached.
// In dev:  devIdentityMiddleware already ran → req.devIdentity is set → next().
// In prod: devIdentityMiddleware never ran → req.devIdentity is undefined → 401.
// Development headers (X-Dev-Org-Id etc.) are silently ignored in production
// because the middleware that would read them is never registered.
app.use("/api/v1", requireIdentity);

// Health routes are mounted at the ROOT level — before requireIdentity — so
// they are always reachable without authentication.  They expose no patient data.
app.use(healthRouter);

app.use("/api", router);

export default app;
