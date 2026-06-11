import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from "../controllers/noteController.js";

const router = Router();

router.use(authMiddleware);

router.get("/lessons/:lessonId/notes", roleMiddleware("user", "admin"), getNotes);
router.post("/lessons/:lessonId/notes", roleMiddleware("user", "admin"), createNote);
router.patch("/notes/:noteId", roleMiddleware("user", "admin"), updateNote);
router.delete("/notes/:noteId", roleMiddleware("user", "admin"), deleteNote);

export default router;
