import { Router, type IRouter } from "express";
import healthRouter from "./health";
import censusRouter from "./census";
import alertsRouter from "./alerts";
import contactRouter from "./contact";
import subscribeRouter from "./subscribe";
import growRouter from "./grow";
import anthropicRouter from "./anthropic";

const router: IRouter = Router();

router.use(healthRouter);
router.use(censusRouter);
router.use(alertsRouter);
router.use(contactRouter);
router.use(subscribeRouter);
router.use(growRouter);
router.use("/anthropic", anthropicRouter);

export default router;
