import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  getMyCourses,
  freeEnroll,
  getProgress,
  completeLesson,
} from "../controllers/enrollmentController.js";
import { paginationSchema } from "../utils/studentValidation.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/my-courses",
  validateRequest(paginationSchema, "query"),
  getMyCourses,
);
router.post("/:courseId/free-enroll", freeEnroll);
router.get("/:courseId/progress", getProgress);
router.post(
  "/:courseId/lessons/:lessonId/complete",
  completeLesson,
);

export default router;
