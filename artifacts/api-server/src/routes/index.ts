import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import meRouter from "./me";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(meRouter);

export default router;
