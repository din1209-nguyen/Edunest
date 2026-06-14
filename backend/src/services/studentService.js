import Course from "../models/Course.js";
import Chapter from "../models/Chapter.js";
import Lesson from "../models/Lesson.js";
import {
  getCourseDetail,
  invalidateCourseDetail,
  invalidateOnCourseChange,
} from "./cacheService.js";

// Lấy danh sách khóa học cho học viên (khóa học đã xuất bản)
async function layDanhSachKhoaHoc(options = {}) {
  const {
    page = 1,
    limit = 12,
    search,
    category,
    level,
    minPrice,
    maxPrice,
    isFree,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  // Tạo query để tìm khóa học đã xuất bản
  const query = { status: "published" };

  // Thêm điều kiện tìm kiếm theo text index
  if (search) {
    query.$text = { $search: search };
  }

  // Thêm điều kiện lọc theo danh mục
  if (category) {
    query.category = { $regex: category, $options: "i" };
  }

  // Thêm điều kiện lọc theo cấp độ
  if (level) {
    query.level = level;
  }

  // Thêm điều kiện lọc theo miễn phí
  if (isFree !== undefined) {
    query.isFree = isFree === true || isFree === "true";
  }

  // Thêm điều kiện lọc theo giá (sử dụng finalPrice)
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.$expr = {};
    if (minPrice !== undefined && maxPrice !== undefined) {
      query.$expr.$and = [
        {
          $gte: [
            {
              $cond: [
                { $gt: ["$discountPrice", 0] },
                "$discountPrice",
                "$price",
              ],
            },
            Number(minPrice),
          ],
        },
        {
          $lte: [
            {
              $cond: [
                { $gt: ["$discountPrice", 0] },
                "$discountPrice",
                "$price",
              ],
            },
            Number(maxPrice),
          ],
        },
      ];
    } else if (minPrice !== undefined) {
      query.$expr.$gte = [
        {
          $cond: [{ $gt: ["$discountPrice", 0] }, "$discountPrice", "$price"],
        },
        Number(minPrice),
      ];
    } else if (maxPrice !== undefined) {
      query.$expr.$lte = [
        {
          $cond: [{ $gt: ["$discountPrice", 0] }, "$discountPrice", "$price"],
        },
        Number(maxPrice),
      ];
    }
  }

  // Đếm tổng số khóa học phù hợp
  const total = await Course.countDocuments(query);
  
  // Lấy danh sách khóa học với phân trang
  const courses = await Course.find(query)
    .populate("instructor", "name email avatar bio")
    .select("-rejectionReason")
    .sort({ [sortBy]: sortOrder, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    courses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Lấy chi tiết khóa học theo slug hoặc ID
async function layKhoaHocTheoSlug(slugOrId, userId = null) {
  return getCourseDetail(slugOrId, async () => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugOrId);

    let query;
    if (isObjectId) {
      query = { _id: slugOrId, status: "published" };
    } else {
      query = { slug: slugOrId, status: "published" };
    }

    const course = await Course.findOne(query).populate(
      "instructor",
      "name email avatar bio",
    );

    if (!course) {
      const err = new Error("Không tìm thấy khóa học");
      err.statusCode = 404;
      throw err;
    }

    const chapters = await Chapter.find({ course: course._id, isPublished: true })
      .sort({ order: 1 })
      .lean();

    const lessons = await Lesson.find({ course: course._id, isPublished: true })
      .sort({ chapter: 1, order: 1 })
      .lean();

    const courseObj = course.toObject();
    courseObj.chapters = chapters.map((chapter) => ({
      ...chapter,
      lessons: lessons.filter(
        (l) => l.chapter.toString() === chapter._id.toString(),
      ),
    }));

    if (!isObjectId && course._id) {
      void invalidateCourseDetail(course._id.toString()).catch(() => {});
    }

    return courseObj;
  });
}

export { layDanhSachKhoaHoc, layKhoaHocTheoSlug };
