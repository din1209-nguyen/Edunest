import WishlistItem from "../models/WishlistItem.js";
import Course from "../models/Course.js";

/**
 * Thêm khóa học vào wishlist
 */
async function addToWishlist(userId, courseId) {
  // Kiểm tra khóa học tồn tại
  const course = await Course.findById(courseId);
  if (!course) {
    const error = new Error("Khóa học không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra đã có trong wishlist chưa
  const existing = await WishlistItem.findOne({
    user: userId,
    course: courseId,
  });

  if (existing) {
    const error = new Error("Khóa học đã có trong danh sách yêu thích");
    error.statusCode = 409;
    throw error;
  }

  // Thêm vào wishlist
  const wishlistItem = await WishlistItem.create({
    user: userId,
    course: courseId,
  });

  // Populate course info
  await wishlistItem.populate("course", "title slug thumbnail price discountPrice rating totalRatings instructor");

  return wishlistItem;
}

/**
 * Xóa khỏi wishlist
 */
async function removeFromWishlist(userId, courseId) {
  const result = await WishlistItem.findOneAndDelete({
    user: userId,
    course: courseId,
  });

  if (!result) {
    const error = new Error("Khóa học không có trong danh sách yêu thích");
    error.statusCode = 404;
    throw error;
  }

  return result;
}

/**
 * Lấy danh sách wishlist của user
 */
async function getUserWishlist(userId, options = {}) {
  const { page = 1, limit = 12 } = options;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    WishlistItem.find({ user: userId })
      .populate({
        path: "course",
        select: "title slug thumbnail price discountPrice rating totalRatings totalStudents level isFree instructor",
        populate: {
          path: "instructor",
          select: "name avatar",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WishlistItem.countDocuments({ user: userId }),
  ]);

  // Filter out items where course was deleted
  const validItems = items.filter((item) => item.course !== null);

  return {
    items: validItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Kiểm tra khóa học có trong wishlist không
 */
async function isInWishlist(userId, courseId) {
  const item = await WishlistItem.findOne({
    user: userId,
    course: courseId,
  });

  return !!item;
}

/**
 * Lấy danh sách course IDs trong wishlist của user
 */
async function getWishlistCourseIds(userId) {
  const items = await WishlistItem.find({ user: userId }).select("course").lean();
  return items.map((item) => item.course.toString());
}

/**
 * Toggle wishlist - thêm nếu chưa có, xóa nếu đã có
 */
async function toggleWishlist(userId, courseId) {
  const existing = await WishlistItem.findOne({
    user: userId,
    course: courseId,
  });

  if (existing) {
    await WishlistItem.deleteOne({ _id: existing._id });
    return { isWishlisted: false };
  } else {
    await addToWishlist(userId, courseId);
    return { isWishlisted: true };
  }
}

/**
 * Xóa tất cả wishlist items của một user (khi user bị xóa)
 */
async function clearUserWishlist(userId) {
  await WishlistItem.deleteMany({ user: userId });
}

/**
 * Xóa tất cả wishlist items chứa một course (khi course bị xóa)
 */
async function clearCourseFromAllWishlists(courseId) {
  await WishlistItem.deleteMany({ course: courseId });
}

export const wishlistService = {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
  isInWishlist,
  getWishlistCourseIds,
  toggleWishlist,
  clearUserWishlist,
  clearCourseFromAllWishlists,
};
