import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import {
  getPublicRecommendations,
  getUserRecommendations,
  invalidateOnEnrollment,
} from "./cacheService.js";

async function goiYKhoaHoc(userId, limit = 6) {
  // Try cache first
  const result = await getUserRecommendations(userId, async () => {
    return computeRecommendations(userId, limit);
  }, limit);

  return result;
}

async function computeRecommendations(userId, limit) {
  const user = await User.findById(userId).lean();

  let recommended = [];

  if (user?.role !== "admin") {
    const enrolled = await Enrollment.find({ student: userId, isActive: true })
      .select("course")
      .lean();

    const enrolledCourseIds = enrolled.map((e) => e.course);

    const enrolledCourses = await Course.find({
      _id: { $in: enrolledCourseIds },
    }).lean();

    const enrolledCategories = enrolledCourses.map((c) => c.category);
    const enrolledLevels = enrolledCourses.map((c) => c.level);

    if (enrolledCategories.length > 0 || enrolledLevels.length > 0) {
      recommended = await Course.find({
        _id: { $nin: enrolledCourseIds },
        status: "published",
        $or: [
          ...(enrolledCategories.length > 0
            ? [{ category: { $in: [...new Set(enrolledCategories)] } }]
            : []),
          ...(enrolledLevels.length > 0
            ? [{ level: { $in: [...new Set(enrolledLevels)] } }]
            : []),
        ],
      })
        .populate("instructor", "name avatar")
        .sort({ rating: -1, totalStudents: -1 })
        .limit(limit)
        .lean();
    }

    if (recommended.length < limit) {
      const existingIds = [
        ...enrolledCourseIds.map((id) => id.toString()),
        ...recommended.map((c) => c._id.toString()),
      ];

      const featured = await Course.find({
        _id: { $nin: existingIds },
        status: "published",
        $or: [{ isFeatured: true }, { rating: { $gte: 4 } }],
      })
        .populate("instructor", "name avatar")
        .sort({ rating: -1, totalStudents: -1 })
        .limit(limit - recommended.length)
        .lean();

      recommended = [...recommended, ...featured];
    }
  } else {
    recommended = await Course.find({
      status: "published",
    })
      .populate("instructor", "name avatar")
      .sort({ rating: -1, totalStudents: -1 })
      .limit(limit)
      .lean();
  }

  return recommended;
}

async function goiYKhoaHocPublic(limit = 6) {
  // Try cache first
  return getPublicRecommendations(async () => {
    return computePublicRecommendations(limit);
  }, limit);
}

async function computePublicRecommendations(limit) {
  const featured = await Course.find({
    status: "published",
    isFeatured: true,
  })
    .populate("instructor", "name avatar")
    .sort({ rating: -1 })
    .limit(limit)
    .lean();

  if (featured.length >= limit) return featured;

  const existingIds = featured.map((c) => c._id);
  const topRated = await Course.find({
    _id: { $nin: existingIds },
    status: "published",
    rating: { $gte: 3.5 },
  })
    .populate("instructor", "name avatar")
    .sort({ rating: -1, totalStudents: -1 })
    .limit(limit - featured.length)
    .lean();

  return [...featured, ...topRated];
}

export { goiYKhoaHoc, goiYKhoaHocPublic, invalidateOnEnrollment };
