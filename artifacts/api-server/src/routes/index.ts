import { Router, type IRouter } from "express";
import healthRouter from "./health";
import censusRouter from "./census";
import alertsRouter from "./alerts";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(censusRouter);
router.use(alertsRouter);
router.use(contactRouter);

export default router;
