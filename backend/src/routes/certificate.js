import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";
import {
  getCertificate,
  getMyCertificates,
  checkEligibility,
} from "../controllers/certificateController.js";

const router = Router();

router.use(authMiddleware);

router.get("/my-certificates", roleMiddleware("user"), getMyCertificates);
router.get("/:courseId/check", roleMiddleware("user"), checkEligibility);
router.get("/:courseId", roleMiddleware("user"), getCertificate);

export default router;
