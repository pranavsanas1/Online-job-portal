import { Router, type IRouter } from "express";
import healthRouter from "./health";
import nokarisetuRouter from "./nokarisetu";

const router: IRouter = Router();

router.use(healthRouter);
router.use(nokarisetuRouter);

export default router;
