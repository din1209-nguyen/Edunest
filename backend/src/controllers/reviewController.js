import { reviewService } from "../services/reviewService.js";
import { z } from "zod";

// Validation schemas
export const createReviewSchema = z.object({
  courseId: z.string().min(1, "ID khóa học là bắt buộc"),
  rating: z.number().min(1).max(5, "Đánh giá phải từ 1 đến 5 sao"),
  comment: z.string().max(2000, "Bình luận không được vượt quá 2000 ký tự").optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5, "Đánh giá phải từ 1 đến 5 sao").optional(),
  comment: z.string().max(2000, "Bình luận không được vượt quá 2000 ký tự").optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "rating", "helpful"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  courseId: z.string().optional(),
  userId: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  isHidden: z.coerce.boolean().optional(),
});

/**
 * Tạo review mới
 * POST /api/reviews
 */
export async function createReview(req, res, next) {
  try {
    const { courseId, rating, comment } = req.validatedBody;
    const userId = req.user.userId;

    const review = await reviewService.createReview(
      userId,
      courseId,
      rating,
      comment
    );

    res.status(201).json({
      success: true,
      message: "Đánh giá đã được tạo thành công",
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật review
 * PATCH /api/reviews/:reviewId
 */
export async function updateReview(req, res, next) {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.validatedBody;
    const userId = req.user.userId;

    const review = await reviewService.updateReview(
      reviewId,
      userId,
      rating,
      comment
    );

    res.json({
      success: true,
      message: "Đánh giá đã được cập nhật",
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa review
 * DELETE /api/reviews/:reviewId
 */
export async function deleteReview(req, res, next) {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId;

    await reviewService.deleteReview(reviewId, userId);

    res.json({
      success: true,
      message: "Đánh giá đã được xóa",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy reviews theo khóa học
 * GET /api/reviews/course/:courseId
 */
export async function getReviewsByCourse(req, res, next) {
  try {
    const { courseId } = req.params;
    const { page, limit, sortBy, sortOrder } = req.validatedQuery;

    const result = await reviewService.getReviewsByCourse(courseId, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy review của user cho khóa học
 * GET /api/reviews/my-review/:courseId
 */
export async function getMyReview(req, res, next) {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    const review = await reviewService.getUserReviewForCourse(userId, courseId);

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy tất cả reviews của user hiện tại
 * GET /api/reviews/me
 */
export async function getMyReviews(req, res, next) {
  try {
    const { page, limit } = req.validatedQuery;
    const userId = req.user.userId;

    const result = await reviewService.getUserReviews(userId, { page, limit });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Vote helpful cho review
 * POST /api/reviews/:reviewId/helpful
 */
export async function voteHelpful(req, res, next) {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId;

    const result = await reviewService.voteHelpful(reviewId, userId);

    res.json({
      success: true,
      message: result.hasVoted
        ? "Đã vote hữu ích"
        : "Đã bỏ vote hữu ích",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy thống kê rating của khóa học
 * GET /api/reviews/course/:courseId/stats
 */
export async function getCourseStats(req, res, next) {
  try {
    const { courseId } = req.params;

    const stats = await reviewService.getCourseRatingStats(courseId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy reviews nổi bật
 * GET /api/reviews/course/:courseId/featured
 */
export async function getFeaturedReviews(req, res, next) {
  try {
    const { courseId } = req.params;
    const { limit } = req.query;

    const reviews = await reviewService.getFeaturedReviews(
      courseId,
      parseInt(limit) || 5
    );

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
}

// ============ INSTRUCTOR ROUTES ============

/**
 * Phản hồi review (Instructor)
 * POST /api/reviews/:reviewId/reply
 */
export async function replyToReview(req, res, next) {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;
    const instructorId = req.user.userId;

    if (!comment || comment.trim().length === 0) {
      const error = new Error("Nội dung phản hồi không được trống");
      error.statusCode = 400;
      throw error;
    }

    const review = await reviewService.replyToReview(reviewId, instructorId, comment);

    res.json({
      success: true,
      message: "Phản hồi thành công",
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa phản hồi review (Instructor)
 * DELETE /api/reviews/:reviewId/reply
 */
export async function deleteReply(req, res, next) {
  try {
    const { reviewId } = req.params;
    const instructorId = req.user.userId;

    const review = await reviewService.deleteInstructorReply(reviewId, instructorId);

    res.json({
      success: true,
      message: "Đã xóa phản hồi",
      data: review,
    });
  } catch (error) {
    next(error);
  }
}
