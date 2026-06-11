import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  getRecommendations,
  getRecommendationsPublic,
} from "../controllers/recommendController.js";
import { paginationSchema } from "../utils/studentValidation.js";

const router = Router();

router.get(
  "/recommendations/public",
  getRecommendationsPublic,
);

router.get(
  "/recommendations",
  authMiddleware,
  validateRequest(paginationSchema, "query"),
  getRecommendations,
);

export default router;
