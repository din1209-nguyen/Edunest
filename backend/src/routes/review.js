import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  createReview,
  updateReview,
  deleteReview,
  getReviewsByCourse,
  getMyReview,
  getMyReviews,
  voteHelpful,
  getCourseStats,
  getFeaturedReviews,
  replyToReview,
  deleteReply,
  createReviewSchema,
  updateReviewSchema,
  paginationSchema,
  reviewQuerySchema,
} from "../controllers/reviewController.js";

const router = Router();

// ============ PUBLIC ROUTES (không cần đăng nhập) ============

// Lấy reviews theo khóa học
router.get(
  "/courses/:courseId/reviews",
  validateRequest(paginationSchema, "query"),
  getReviewsByCourse
);

// Lấy thống kê rating của khóa học
router.get("/courses/:courseId/reviews/stats", getCourseStats);

// Lấy reviews nổi bật
router.get("/courses/:courseId/reviews/featured", getFeaturedReviews);

// ============ PROTECTED ROUTES (cần đăng nhập) ============

// Tạo review mới
router.post(
  "/reviews",
  authMiddleware,
  validateRequest(createReviewSchema),
  createReview
);

// Cập nhật review
router.patch(
  "/reviews/:reviewId",
  authMiddleware,
  validateRequest(updateReviewSchema),
  updateReview
);

// Xóa review
router.delete("/reviews/:reviewId", authMiddleware, deleteReview);

// Lấy review của user hiện tại cho một khóa học
router.get("/reviews/my-review/:courseId", authMiddleware, getMyReview);

// Lấy tất cả reviews của user hiện tại
router.get(
  "/reviews/me",
  authMiddleware,
  validateRequest(paginationSchema, "query"),
  getMyReviews
);

// Vote helpful cho review
router.post("/reviews/:reviewId/helpful", authMiddleware, voteHelpful);

// ============ INSTRUCTOR ROUTES ============

// Phản hồi review (Instructor)
router.post("/reviews/:reviewId/reply", authMiddleware, replyToReview);

// Xóa phản hồi review (Instructor)
router.delete("/reviews/:reviewId/reply", authMiddleware, deleteReply);

export default router;
