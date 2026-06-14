import { z } from "zod";
import { searchService } from "../services/searchService.js";

// Validation schemas
export const searchQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
  sortBy: z.enum(["relevance", "price_asc", "price_desc", "rating", "students", "newest"]).default("relevance"),
  category: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  language: z.string().optional(),
  isFree: z.coerce.boolean().optional(),
});

/**
 * Tìm kiếm khóa học
 * GET /api/search
 */
export async function searchCourses(req, res, next) {
  try {
    const result = await searchService.searchCourses(req.query.q, req.query, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 12,
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
 * Gợi ý tìm kiếm (autocomplete)
 * GET /api/search/suggestions?q=...
 */
export async function getSuggestions(req, res, next) {
  try {
    const { q } = req.query;
    const limit = Math.min(Number(req.query.limit) || 5, 10);

    const suggestions = await searchService.getSearchSuggestions(q, limit);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy khóa học trending
 * GET /api/search/trending
 */
export async function getTrending(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 8, 20);
    const courses = await searchService.getTrendingCourses(limit);

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy khóa học mới nhất
 * GET /api/search/newest
 */
export async function getNewest(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 8, 20);
    const courses = await searchService.getNewestCourses(limit);

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy khóa học được đánh giá cao
 * GET /api/search/top-rated
 */
export async function getTopRated(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 8, 20);
    const courses = await searchService.getTopRatedCourses(limit);

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy khóa học miễn phí
 * GET /api/search/free
 */
export async function getFreeCourses(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 8, 20);
    const courses = await searchService.getFreeCourses(limit);

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy khóa học liên quan
 * GET /api/search/related/:courseId
 */
export async function getRelated(req, res, next) {
  try {
    const { courseId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 4, 10);
    const courses = await searchService.getRelatedCourses(courseId, limit);

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy thống kê khóa học (cho filters)
 * GET /api/search/stats
 */
export async function getStats(req, res, next) {
  try {
    const stats = await searchService.getCourseStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
