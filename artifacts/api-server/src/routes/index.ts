import { Router, type IRouter } from "express";
// healthRouter is now mounted at root level in app.ts (unauthenticated, before requireIdentity).
import censusRouter from "./census";
import alertsRouter from "./alerts";
import contactRouter from "./contact";
import subscribeRouter from "./subscribe";
import growRouter from "./grow";
import anthropicRouter from "./anthropic";
import complianceRouter from "./compliance";
import patientsV1Router from "./patientsV1";

const router: IRouter = Router();

router.use(censusRouter);
router.use(alertsRouter);
router.use(contactRouter);
router.use(subscribeRouter);
router.use(growRouter);
router.use("/anthropic", anthropicRouter);
router.use(complianceRouter);
router.use(patientsV1Router);

export default router;
