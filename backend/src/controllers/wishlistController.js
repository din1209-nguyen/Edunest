import { z } from "zod";
import { wishlistService } from "../services/wishlistService.js";

// Validation schemas
export const addWishlistSchema = z.object({
  courseId: z.string().min(1, "ID khóa học là bắt buộc"),
});

export const toggleWishlistSchema = z.object({
  courseId: z.string().min(1, "ID khóa học là bắt buộc"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

/**
 * Lấy wishlist của user
 * GET /api/wishlist
 */
export async function getWishlist(req, res, next) {
  try {
    const { page, limit } = req.validatedQuery;
    const userId = req.user.userId;

    const result = await wishlistService.getUserWishlist(userId, { page, limit });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Thêm vào wishlist
 * POST /api/wishlist
 */
export async function addToWishlist(req, res, next) {
  try {
    const { courseId } = req.validatedBody;
    const userId = req.user.userId;

    const item = await wishlistService.addToWishlist(userId, courseId);

    res.status(201).json({
      success: true,
      message: "Đã thêm vào danh sách yêu thích",
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa khỏi wishlist
 * DELETE /api/wishlist/:courseId
 */
export async function removeFromWishlist(req, res, next) {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    await wishlistService.removeFromWishlist(userId, courseId);

    res.json({
      success: true,
      message: "Đã xóa khỏi danh sách yêu thích",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle wishlist
 * POST /api/wishlist/toggle
 */
export async function toggleWishlist(req, res, next) {
  try {
    const { courseId } = req.body;
    const userId = req.user.userId;

    const result = await wishlistService.toggleWishlist(userId, courseId);

    res.json({
      success: true,
      message: result.isWishlisted
        ? "Đã thêm vào danh sách yêu thích"
        : "Đã xóa khỏi danh sách yêu thích",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Kiểm tra wishlist status
 * GET /api/wishlist/check/:courseId
 */
export async function checkWishlist(req, res, next) {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    const isWishlisted = await wishlistService.isInWishlist(userId, courseId);

    res.json({
      success: true,
      data: { isWishlisted },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy danh sách wishlist course IDs
 * GET /api/wishlist/ids
 */
export async function getWishlistIds(req, res, next) {
  try {
    const userId = req.user.userId;

    const courseIds = await wishlistService.getWishlistCourseIds(userId);

    res.json({
      success: true,
      data: { courseIds },
    });
  } catch (error) {
    next(error);
  }
}
