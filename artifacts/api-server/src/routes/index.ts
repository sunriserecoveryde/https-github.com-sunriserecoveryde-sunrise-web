import { Router, type IRouter } from "express";
import healthRouter from "./health";
import censusRouter from "./census";

const router: IRouter = Router();

router.use(healthRouter);
router.use(censusRouter);

export default router;
