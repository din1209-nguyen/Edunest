import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  getStats,
  getRecentActivity,
  getPendingCourses,
  getCourses,
  getCourse,
  approveCourse,
  rejectCourse,
  banCourse,
  lockCourse,
  unlockCourse,
  getUsers,
  lockUser,
  unlockUser,
  makeAdmin,
  makeUser,
} from "../controllers/adminController.js";
import { paginationSchema } from "../utils/studentValidation.js";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.get("/stats", getStats);
router.get("/dashboard/recent", getRecentActivity);
router.get("/courses", validateRequest(paginationSchema, "query"), getCourses);
router.get("/courses/pending", validateRequest(paginationSchema, "query"), getPendingCourses);
router.get("/courses/:courseId", getCourse);
router.patch("/courses/:courseId/approve", approveCourse);
router.patch("/courses/:courseId/reject", rejectCourse);
router.patch("/courses/:courseId/ban", banCourse);
router.patch("/courses/:courseId/lock", lockCourse);
router.patch("/courses/:courseId/unlock", unlockCourse);
router.get("/users", validateRequest(paginationSchema, "query"), getUsers);
router.patch("/users/:userId/lock", lockUser);
router.patch("/users/:userId/unlock", unlockUser);
router.patch("/users/:userId/make-admin", makeAdmin);
router.patch("/users/:userId/make-user", makeUser);

export default router;
