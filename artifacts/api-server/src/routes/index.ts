import { Router, type IRouter } from "express";
import healthRouter from "./health";
import censusRouter from "./census";
import alertsRouter from "./alerts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(censusRouter);
router.use(alertsRouter);

export default router;
