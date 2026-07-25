import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { rateLimit } from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";
import { notifySpamAlert } from "./lib/spamAlert";

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

app.use("/api", router);

export default app;
