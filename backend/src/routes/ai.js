import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";
import {
  generateExercises,
  generateLessonExercises,
  saveAIExercise,
} from "../controllers/aiController.js";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware("user", "admin"));

router.post("/lessons/:lessonId/exercises/generate", generateLessonExercises);
router.post("/exercises/generate", generateExercises);
router.post("/exercises/save", roleMiddleware("user", "admin"), saveAIExercise);

export default router;
