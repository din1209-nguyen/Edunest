import Course from "../models/Course.js";
import {
  getSearchResults as cachedGetSearchResults,
  getSearchSuggestions as cachedGetSearchSuggestions,
  getTrendingCourses as cachedGetTrending,
  getNewestCourses as cachedGetNewest,
  getTopRatedCourses as cachedGetTopRated,
  getFreeCourses as cachedGetFree,
  getCourseStats as cachedGetCourseStats,
} from "./cacheService.js";

// ─── Search Courses (cached) ────────────────────────────────────────────────────

async function searchCourses(query, filters = {}, options = {}) {
  // Only cache simple searches (no price range filters)
  const simpleSearch = !query && !filters?.minPrice && !filters?.maxPrice;

  return cachedGetSearchResults(query, filters, options, async () => {
    return doSearchCourses(query, filters, options);
  });
}

async function doSearchCourses(query, filters = {}, options = {}) {
  const {
    page = 1,
    limit = 12,
    sortBy = "relevance",
    category,
    level,
    minPrice,
    maxPrice,
    minRating,
    language,
    isFree,
  } = filters;

  const skip = (page - 1) * limit;
  const searchQuery = {};

  if (query) searchQuery.$text = { $search: query };
  if (category) searchQuery.category = new RegExp(category, "i");
  if (level) searchQuery.level = level.toLowerCase();
  if (isFree !== undefined) searchQuery.isFree = isFree === true || isFree === "true";
  if (language) searchQuery.language = language;
  if (minRating !== undefined) searchQuery.rating = { $gte: Number(minRating) };
  searchQuery.status = "published";

  // Price filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    searchQuery.isFree = false;
    searchQuery.$expr = {};
    const finalPrice = { $cond: [{ $gt: ["$discountPrice", 0] }, "$discountPrice", "$price"] };
    if (minPrice !== undefined && maxPrice !== undefined) {
      searchQuery.$expr.$and = [
        { $or: [{ $gt: ["$discountPrice", 0] }, { $eq: ["$discountPrice", 0] }] },
        { $gte: [finalPrice, Number(minPrice)] },
        { $lte: [finalPrice, Number(maxPrice)] },
      ];
    } else if (minPrice !== undefined) {
      searchQuery.$expr.$gte = [finalPrice, Number(minPrice)];
    } else if (maxPrice !== undefined) {
      searchQuery.$expr.$lte = [finalPrice, Number(maxPrice)];
    }
  }

  let sort = { createdAt: -1 };
  switch (sortBy) {
    case "price_asc": sort = { price: 1 }; break;
    case "price_desc": sort = { price: -1 }; break;
    case "rating": sort = { rating: -1, totalRatings: -1 }; break;
    case "students": sort = { totalStudents: -1 }; break;
    case "newest": sort = { createdAt: -1 }; break;
    case "relevance":
    default:
      if (query) sort = { score: { $meta: "textScore" }, totalStudents: -1 };
      break;
  }

  const [courses, total] = await Promise.all([
    Course.find(searchQuery, query ? { score: { $meta: "textScore" } } : {})
      .populate("instructor", "name avatar")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments(searchQuery),
  ]);

  return {
    courses,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    filters: { query, category, level, minPrice, maxPrice, minRating, sortBy },
  };
}

// ─── Search Suggestions (cached) ────────────────────────────────────────────────

async function getSearchSuggestions(query, limit = 5) {
  if (!query || query.length < 2) return [];

  return cachedGetSearchSuggestions(query, limit, async () => {
    const suggestions = await Course.find({
      title: new RegExp(query, "i"),
      status: "published",
    })
      .select("title slug thumbnail")
      .limit(limit)
      .lean();

    return suggestions.map((course) => ({
      title: course.title,
      slug: course.slug,
      thumbnail: course.thumbnail,
    }));
  });
}

// ─── Trending Courses (cached) ────────────────────────────────────────────────

async function getTrendingCourses(limit = 8) {
  return cachedGetTrending(async () => {
    return Course.find({ status: "published" })
      .populate("instructor", "name avatar")
      .sort({ totalStudents: -1, rating: -1 })
      .limit(limit)
      .lean();
  }, limit);
}

// ─── Newest Courses (cached) ──────────────────────────────────────────────────

async function getNewestCourses(limit = 8) {
  return cachedGetNewest(async () => {
    return Course.find({ status: "published" })
      .populate("instructor", "name avatar")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }, limit);
}

// ─── Top Rated Courses (cached) ───────────────────────────────────────────────

async function getTopRatedCourses(limit = 8, minRatings = 10) {
  return cachedGetTopRated(async () => {
    return Course.find({
      status: "published",
      totalRatings: { $gte: minRatings },
    })
      .populate("instructor", "name avatar")
      .sort({ rating: -1, totalRatings: -1 })
      .limit(limit)
      .lean();
  }, limit);
}

// ─── Free Courses (cached) ──────────────────────────────────────────────────────

async function getFreeCourses(limit = 8) {
  return cachedGetFree(async () => {
    return Course.find({ status: "published", isFree: true })
      .populate("instructor", "name avatar")
      .sort({ totalStudents: -1 })
      .limit(limit)
      .lean();
  }, limit);
}

// ─── Related Courses (no cache — uses courseId) ───────────────────────────────

async function getRelatedCourses(courseId, limit = 4) {
  const currentCourse = await Course.findById(courseId);
  if (!currentCourse) return [];

  return Course.find({
    _id: { $ne: courseId },
    status: "published",
    category: currentCourse.category,
  })
    .populate("instructor", "name avatar")
    .sort({ rating: -1, totalStudents: -1 })
    .limit(limit)
    .lean();
}

// ─── Courses by Instructor ─────────────────────────────────────────────────────

async function getCoursesByInstructor(instructorId, options = {}) {
  const { page = 1, limit = 12 } = options;
  const skip = (page - 1) * limit;

  const [courses, total] = await Promise.all([
    Course.find({ instructor: instructorId, status: "published" })
      .populate("instructor", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Course.countDocuments({ instructor: instructorId, status: "published" }),
  ]);

  return {
    courses,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Course Stats (cached) ────────────────────────────────────────────────────

async function getCourseStats() {
  return cachedGetCourseStats(async () => {
    const [stats, levelStats, categoryStats] = await Promise.all([
      Course.aggregate([
        { $match: { status: "published" } },
        { $group: { _id: null, totalCourses: { $sum: 1 }, avgRating: { $avg: "$rating" }, totalStudents: { $sum: "$totalStudents" }, minPrice: { $min: "$price" }, maxPrice: { $max: "$price" } } },
      ]),
      Course.aggregate([
        { $match: { status: "published" } },
        { $group: { _id: "$level", count: { $sum: 1 } } },
      ]),
      Course.aggregate([
        { $match: { status: "published" } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      general: stats[0] || { totalCourses: 0, avgRating: 0, totalStudents: 0, minPrice: 0, maxPrice: 0 },
      byLevel: levelStats,
      topCategories: categoryStats,
    };
  });
}

export const searchService = {
  searchCourses,
  getSearchSuggestions,
  getTrendingCourses,
  getNewestCourses,
  getTopRatedCourses,
  getFreeCourses,
  getRelatedCourses,
  getCoursesByInstructor,
  getCourseStats,
};
