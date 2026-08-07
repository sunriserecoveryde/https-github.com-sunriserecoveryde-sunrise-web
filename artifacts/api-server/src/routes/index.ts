import { Router, type IRouter } from "express";
// healthRouter is mounted at root level in app.ts (unauthenticated, before session middleware).
import censusRouter from "./census";
import alertsRouter from "./alerts";
import contactRouter from "./contact";
import subscribeRouter from "./subscribe";
import growRouter from "./grow";
import anthropicRouter from "./anthropic";
import complianceRouter from "./compliance";
import patientsV1Router from "./patientsV1";
import clinicalNotesV1Router from "./clinicalNotesV1";
import appointmentsV1Router from "./appointmentsV1";
import authV1Router from "./authV1";

const router: IRouter = Router();

// Authentication routes (public — login, logout, csrf-token, password-reset).
// Must be mounted before the patient routes so login works without a session.
router.use(authV1Router);

router.use(censusRouter);
router.use(alertsRouter);
router.use(contactRouter);
router.use(subscribeRouter);
router.use(growRouter);
router.use("/anthropic", anthropicRouter);
router.use(complianceRouter);
router.use(patientsV1Router);
router.use(clinicalNotesV1Router);
router.use(appointmentsV1Router);

export default router;
