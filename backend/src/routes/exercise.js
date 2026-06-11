import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";
import {
  getExercisesByLesson,
  getExercise,
  submitExercise,
} from "../controllers/exerciseController.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/lessons/:lessonId/exercises",
  roleMiddleware("user", "admin"),
  getExercisesByLesson,
);
router.get("/:exerciseId", roleMiddleware("user", "admin"), getExercise);
router.post("/:exerciseId/submit", roleMiddleware("user", "admin"), submitExercise);

export default router;
