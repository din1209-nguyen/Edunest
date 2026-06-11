import mongoose from "mongoose";
import Review from "../models/Review.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import {
  getCourseReviews,
  invalidateOnReview,
} from "./cacheService.js";

/**
 * Tạo review mới cho khóa học
 */
async function createReview(userId, courseId, rating, comment) {
  // Kiểm tra khóa học có tồn tại không
  const course = await Course.findById(courseId);
  if (!course) {
    const error = new Error("Khóa học không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra user đã mua khóa học chưa
  const enrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
  });

  // User phải đã đăng ký khóa học mới được review
  if (!enrollment) {
    const error = new Error("Bạn cần đăng ký khóa học trước khi đánh giá");
    error.statusCode = 403;
    throw error;
  }

  // Kiểm tra user đã review chưa
  const existingReview = await Review.findOne({
    user: userId,
    course: courseId,
  });

  if (existingReview) {
    const error = new Error("Bạn đã đánh giá khóa học này rồi");
    error.statusCode = 409;
    throw error;
  }

  // Tạo review
  const review = new Review({
    user: userId,
    course: courseId,
    rating,
    comment,
    isVerifiedPurchase: true,
  });

  await review.save();

  // Cập nhật rating trung bình của khóa học
  await updateCourseRating(courseId);
  await invalidateOnReview(courseId.toString());

  // Populate user info
  await review.populate("user", "name avatar");

  return review;
}

/**
 * Cập nhật review
 */
async function updateReview(reviewId, userId, rating, comment) {
  const review = await Review.findOne({
    _id: reviewId,
    user: userId,
  });

  if (!review) {
    const error = new Error("Review không tồn tại hoặc bạn không có quyền");
    error.statusCode = 404;
    throw error;
  }

  if (rating !== undefined) {
    review.rating = rating;
  }
  if (comment !== undefined) {
    review.comment = comment;
  }

  await review.save();
  await review.populate("user", "name avatar");

  // Cập nhật lại rating trung bình nếu rating thay đổi
  if (rating !== undefined) {
    await updateCourseRating(review.course);
    await invalidateOnReview(review.course.toString());
  }

  return review;
}

/**
 * Xóa review
 */
async function deleteReview(reviewId, userId, isAdmin = false) {
  const query = isAdmin ? { _id: reviewId } : { _id: reviewId, user: userId };

  const review = await Review.findOneAndDelete(query);

  if (!review) {
    const error = new Error("Review không tồn tại hoặc bạn không có quyền");
    error.statusCode = 404;
    throw error;
  }

  // Cập nhật lại rating
  await updateCourseRating(review.course);
  await invalidateOnReview(review.course.toString());

  return review;
}

/**
 * Lấy reviews theo khóa học
 */
async function getReviewsByCourse(courseId, options = {}) {
  return getCourseReviews(courseId, options, async () => {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [reviews, total] = await Promise.all([
      Review.find({ course: courseId, isHidden: false })
        .populate("user", "name avatar")
        .populate("course", "title slug")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ course: courseId, isHidden: false }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
}

/**
 * Lấy review của user cho khóa học
 */
async function getUserReviewForCourse(userId, courseId) {
  const review = await Review.findOne({
    user: userId,
    course: courseId,
  }).populate("user", "name avatar");

  return review;
}

/**
 * Lấy tất cả reviews của một user
 */
async function getUserReviews(userId, options = {}) {
  const { page = 1, limit = 10 } = options;

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ user: userId, isHidden: false })
      .populate("course", "title slug thumbnail")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ user: userId, isHidden: false }),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Vote helpful cho review
 */
async function voteHelpful(reviewId, userId) {
  const review = await Review.findById(reviewId);

  if (!review) {
    const error = new Error("Review không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra user đã vote chưa
  const alreadyVoted = review.helpfulVotes.some(
    (vote) => vote.user.toString() === userId.toString()
  );

  if (alreadyVoted) {
    // Bỏ vote
    review.helpfulVotes = review.helpfulVotes.filter(
      (vote) => vote.user.toString() !== userId.toString()
    );
    review.helpful = Math.max(0, review.helpful - 1);
  } else {
    // Thêm vote
    review.helpfulVotes.push({ user: userId });
    review.helpful += 1;
  }

  await review.save();
  await invalidateOnReview(review.course.toString());

  return {
    reviewId: review._id,
    helpful: review.helpful,
    hasVoted: !alreadyVoted,
  };
}

/**
 * Admin: Ẩn/hiện review
 */
async function toggleReviewVisibility(reviewId, isHidden) {
  const review = await Review.findByIdAndUpdate(
    reviewId,
    { isHidden },
    { new: true }
  ).populate("user", "name avatar");

  if (!review) {
    const error = new Error("Review không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  // Cập nhật rating nếu ẩn review
  if (isHidden) {
    await updateCourseRating(review.course);
  }

  return review;
}

/**
 * Giảng viên phản hồi review
 */
async function replyToReview(reviewId, instructorId, comment) {
  const review = await Review.findById(reviewId);

  if (!review) {
    const error = new Error("Review không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra giảng viên có phải là người tạo khóa học không
  const course = await Course.findById(review.course);
  if (!course) {
    const error = new Error("Khóa học không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  if (course.instructor.toString() !== instructorId.toString()) {
    const error = new Error("Bạn không có quyền phản hồi review này");
    error.statusCode = 403;
    throw error;
  }

  review.instructorReply = {
    comment,
    repliedAt: new Date(),
  };

  await review.save();
  await review.populate("user", "name avatar");

  return review;
}

/**
 * Xóa phản hồi của giảng viên
 */
async function deleteInstructorReply(reviewId, instructorId) {
  const review = await Review.findById(reviewId);

  if (!review) {
    const error = new Error("Review không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  const course = await Course.findById(review.course);
  if (course && course.instructor.toString() !== instructorId.toString()) {
    const error = new Error("Bạn không có quyền xóa phản hồi này");
    error.statusCode = 403;
    throw error;
  }

  review.instructorReply = null;
  await review.save();

  return review;
}

/**
 * Admin: Lấy tất cả reviews (bao gồm hidden)
 */
async function getAllReviews(options = {}) {
  const {
    page = 1,
    limit = 10,
    courseId,
    userId,
    rating,
    isHidden,
  } = options;

  const query = {};
  if (courseId) query.course = courseId;
  if (userId) query.user = userId;
  if (rating) query.rating = rating;
  if (isHidden !== undefined) query.isHidden = isHidden;

  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate("user", "name avatar email")
      .populate("course", "title slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(query),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Lấy thống kê rating của khóa học
 */
async function getCourseRatingStats(courseId) {
  const stats = await Review.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId), isHidden: false } },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
  ]);

  const ratingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let totalRating = 0;
  let totalReviews = 0;

  stats.forEach((stat) => {
    ratingDistribution[stat._id] = stat.count;
    totalRating += stat._id * stat.count;
    totalReviews += stat.count;
  });

  const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    distribution: ratingDistribution,
  };
}

/**
 * Cập nhật rating trung bình của khóa học
 */
async function updateCourseRating(courseId) {
  const stats = await getCourseRatingStats(courseId);

  await Course.findByIdAndUpdate(courseId, {
    rating: stats.averageRating,
    totalRatings: stats.totalReviews,
  });

  return stats;
}

/**
 * Lấy reviews nổi bật (helpful cao nhất)
 */
async function getFeaturedReviews(courseId, limit = 5) {
  const reviews = await Review.find({
    course: courseId,
    isHidden: false,
    helpful: { $gt: 0 },
  })
    .populate("user", "name avatar")
    .sort({ helpful: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return reviews;
}

export const reviewService = {
  createReview,
  updateReview,
  deleteReview,
  getReviewsByCourse,
  getUserReviewForCourse,
  getUserReviews,
  voteHelpful,
  toggleReviewVisibility,
  getAllReviews,
  getCourseRatingStats,
  updateCourseRating,
  getFeaturedReviews,
  replyToReview,
  deleteInstructorReply,
};
