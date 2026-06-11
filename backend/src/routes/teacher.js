import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";
import {
  upload,
  validate,
  validateQuery,
  getDashboard,
  getCourseList,
  createCourseHandler,
  getCourse,
  updateCourseHandler,
  deleteCourseHandler,
  submitReviewHandler,
  uploadFile,
  themChuongHandler,
  layChuongVaBaiHoc,
  capNhatChuongHandler,
  xoaChuongHandler,
  themBaiHocHandler,
  capNhatBaiHocHandler,
  xoaBaiHocHandler,
  themBaiTapHandler,
  layDanhSachBaiTap,
  layBaiTap,
  capNhatBaiTapHandler,
  xoaBaiTapHandler,
  layHocVien,
  camHocVienHandler,
  moiHocVienHandler,
  createCourseSchema,
  updateCourseSchema,
  createChapterSchema,
  updateChapterSchema,
  createLessonSchema,
  updateLessonSchema,
  createExerciseSchema,
  updateExerciseSchema,
  submitReviewSchema,
  paginationSchema,
} from "../controllers/courseController.js";

const router = Router();

// Tất cả routes cần đăng nhập với tài khoản user/admin
router.use(authMiddleware);
router.use(roleMiddleware("user", "admin"));

// Dashboard
router.get("/dashboard", getDashboard);

// Courses CRUD
router.get("/courses", validateQuery(paginationSchema), getCourseList);
router.post("/courses", validate(createCourseSchema), createCourseHandler);
router.get("/courses/:id", getCourse);
router.patch(
  "/courses/:id",
  validate(updateCourseSchema),
  updateCourseHandler,
);
router.delete("/courses/:id", deleteCourseHandler);
router.patch(
  "/courses/:id/submit-review",
  validate(submitReviewSchema),
  submitReviewHandler,
);

// Upload file
router.post("/upload", upload.single("file"), uploadFile);

// Chapters
router.post(
  "/courses/:courseId/chapters",
  validate(createChapterSchema),
  themChuongHandler,
);
router.get("/courses/:courseId/chapters", layChuongVaBaiHoc);
router.patch(
  "/chapters/:chapterId",
  validate(updateChapterSchema),
  capNhatChuongHandler,
);
router.delete("/chapters/:chapterId", xoaChuongHandler);

// Lessons
router.post(
  "/chapters/:chapterId/lessons",
  validate(createLessonSchema),
  themBaiHocHandler,
);
router.patch(
  "/lessons/:lessonId",
  validate(updateLessonSchema),
  capNhatBaiHocHandler,
);
router.delete("/lessons/:lessonId", xoaBaiHocHandler);

// Exercises
router.post(
  "/lessons/:lessonId/exercises",
  validate(createExerciseSchema),
  themBaiTapHandler,
);
router.get("/lessons/:lessonId/exercises", layDanhSachBaiTap);
router.get("/exercises/:exerciseId", layBaiTap);
router.patch(
  "/exercises/:exerciseId",
  validate(updateExerciseSchema),
  capNhatBaiTapHandler,
);
router.delete("/exercises/:exerciseId", xoaBaiTapHandler);

// Students
router.get("/courses/:courseId/students", layHocVien);
router.patch("/courses/:courseId/students/:studentId/ban", camHocVienHandler);
router.patch(
  "/courses/:courseId/students/:studentId/invite",
  moiHocVienHandler,
);

export default router;
