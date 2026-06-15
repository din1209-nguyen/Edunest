import Payment from "../models/Payment.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";
import Certificate from "../models/Certificate.js";
import Chapter from "../models/Chapter.js";
import Lesson from "../models/Lesson.js";
import Exercise from "../models/Exercise.js";
import { invalidateAuthUser } from "./cacheService.js";

async function layDashboardStats() {
  const [
    totalCourses,
    publishedCourses,
    pendingCourses,
    draftCourses,
    rejectedCourses,
    totalUsers,
    totalRegularUsers,
    totalAdmins,
    totalPayments,
    totalRevenue,
    recentPayments,
  ] = await Promise.all([
    Course.countDocuments(),
    Course.countDocuments({ status: "published" }),
    Course.countDocuments({ status: "pending" }),
    Course.countDocuments({ status: "draft" }),
    Course.countDocuments({ status: "rejected" }),
    User.countDocuments(),
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "admin" }),
    Payment.countDocuments({ status: "success" }),
    Payment.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.find({ status: "success" })
      .populate("user", "name email")
      .populate("courses", "title")
      .sort({ paidAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    courses: {
      total: totalCourses,
      published: publishedCourses,
      pending: pendingCourses,
      draft: draftCourses,
      rejected: rejectedCourses,
    },
    users: {
      total: totalUsers,
      users: totalRegularUsers,
      admins: totalAdmins,
    },
    payments: {
      totalTransactions: totalPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
    },
    recentPayments,
  };
}

async function layKhoaHocChoDuyet(options = {}) {
  const { page = 1, limit = 10, status, search } = options;

  const query = {};
  if (status) query.status = status;
  else query.status = "pending";

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  const total = await Course.countDocuments(query);
  const courses = await Course.find(query)
    .populate("instructor", "name email avatar")
    .sort({ updatedAt: -1 })
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

async function duyetKhoaHoc(courseId, adminId, action, reason = "") {
  const khoaHoc = await Course.findById(courseId);

  if (!khoaHoc) {
    const err = new Error("Không tìm thấy khóa học");
    err.statusCode = 404;
    throw err;
  }

  if (action === "approve") {
    if (khoaHoc.status !== "pending") {
      const err = new Error("Chỉ khóa học đang chờ duyệt mới có thể duyệt");
      err.statusCode = 400;
      throw err;
    }
    khoaHoc.status = "published";
    khoaHoc.rejectionReason = "";
    khoaHoc.reviewedBy = adminId;
    khoaHoc.reviewedAt = new Date();
    await khoaHoc.save();
    return { message: "Duyệt khóa học thành công", course: khoaHoc };
  }

  if (action === "reject") {
    if (khoaHoc.status !== "pending") {
      const err = new Error("Chỉ khóa học đang chờ duyệt mới có thể từ chối");
      err.statusCode = 400;
      throw err;
    }
    khoaHoc.status = "rejected";
    khoaHoc.rejectionReason = reason;
    khoaHoc.reviewedBy = adminId;
    khoaHoc.reviewedAt = new Date();
    await khoaHoc.save();
    return { message: "Từ chối khóa học thành công", course: khoaHoc };
  }

  if (action === "ban") {
    khoaHoc.status = "banned";
    khoaHoc.rejectionReason = reason;
    khoaHoc.reviewedBy = adminId;
    khoaHoc.reviewedAt = new Date();
    await khoaHoc.save();
    return { message: "Khóa khóa học thành công", course: khoaHoc };
  }

  if (action === "unlock") {
    if (khoaHoc.status === "locked" || khoaHoc.status === "banned") {
      khoaHoc.status = "draft";
      khoaHoc.rejectionReason = "";
      await khoaHoc.save();
    }
    return { message: "Mở khóa khóa học thành công", course: khoaHoc };
  }

  if (action === "lock") {
    khoaHoc.status = "locked";
    khoaHoc.rejectionReason = reason;
    await khoaHoc.save();
    return { message: "Khóa khóa học thành công", course: khoaHoc };
  }

  const err = new Error("Hành động không hợp lệ");
  err.statusCode = 400;
  throw err;
}

async function layDanhSachUser(options = {}) {
  const { page = 1, limit = 10, role, search, isActive } = options;

  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select("-password -refreshToken")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const userIds = users.map((u) => u._id);
  const enrollments = await Enrollment.aggregate([
    { $match: { student: { $in: userIds } } },
    { $group: { _id: "$student", courseCount: { $sum: 1 } } },
  ]);
  const enrollmentMap = Object.fromEntries(
    enrollments.map((e) => [e._id.toString(), e.courseCount]),
  );

  const withCounts = users.map((u) => ({
    ...u,
    enrolledCourses: enrollmentMap[u._id.toString()] || 0,
  }));

  return {
    users: withCounts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function capNhatTrangThaiUser(userId, adminId, action) {
  const user = await User.findById(userId);

  if (!user) {
    const err = new Error("Không tìm thấy người dùng");
    err.statusCode = 404;
    throw err;
  }

  if (user.role === "admin") {
    const err = new Error("Không thể thay đổi trạng thái tài khoản admin");
    err.statusCode = 403;
    throw err;
  }

  if (action === "lock") {
    user.isActive = false;
    await user.save();
    await invalidateAuthUser(userId);
    return { message: "Khóa tài khoản thành công", user };
  }

  if (action === "unlock") {
    user.isActive = true;
    await user.save();
    await invalidateAuthUser(userId);
    return { message: "Mở khóa tài khoản thành công", user };
  }

  if (action === "makeAdmin") {
    user.role = "admin";
    await user.save();
    await invalidateAuthUser(userId);
    return { message: "Đã thăng cấp thành admin", user };
  }

  if (action === "makeUser") {
    user.role = "user";
    await user.save();
    await invalidateAuthUser(userId);
    return { message: "Đã chuyển thành người dùng", user };
  }

  const err = new Error("Hành động không hợp lệ");
  err.statusCode = 400;
  throw err;
}

async function layDanhSachKhoaHoc(options = {}) {
  const { page = 1, limit = 10, status, search, sortBy = "createdAt", sortOrder = "desc" } = options;

  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  const total = await Course.countDocuments(query);
  const courses = await Course.find(query)
    .populate("instructor", "name email avatar")
    .sort({ [sortBy]: sortOrder })
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

async function layChiTietKhoaHoc(courseId) {
  const course = await Course.findById(courseId)
    .populate("instructor", "name email avatar bio")
    .populate("reviewedBy", "name email avatar")
    .lean();

  if (!course) {
    const err = new Error("KhÃ´ng tÃ¬m tháº¥y khÃ³a há»c");
    err.statusCode = 404;
    throw err;
  }

  const [chapters, lessons, exercises] = await Promise.all([
    Chapter.find({ course: courseId }).sort({ order: 1 }).lean(),
    Lesson.find({ course: courseId }).sort({ chapter: 1, order: 1 }).lean(),
    Exercise.find({ course: courseId }).lean(),
  ]);

  const exercisesByLesson = exercises.reduce((acc, exercise) => {
    const lessonId = exercise.lesson?.toString();
    if (!lessonId) return acc;
    acc[lessonId] = acc[lessonId] || [];
    acc[lessonId].push(exercise);
    return acc;
  }, {});

  const lessonsByChapter = lessons.reduce((acc, lesson) => {
    const chapterId = lesson.chapter?.toString();
    if (!chapterId) return acc;
    acc[chapterId] = acc[chapterId] || [];
    acc[chapterId].push({
      ...lesson,
      exercises: exercisesByLesson[lesson._id.toString()] || [],
    });
    return acc;
  }, {});

  return {
    course,
    chapters: chapters.map((chapter) => ({
      ...chapter,
      lessons: lessonsByChapter[chapter._id.toString()] || [],
    })),
  };
}

async function layRecentActivity(options = {}) {
  const { limit = 20 } = options;

  const [recentUsers, recentCourses, recentEnrollments] = await Promise.all([
    User.find({}).sort({ createdAt: -1 }).limit(limit).select("name email role avatar createdAt").lean(),
    Course.find({}).sort({ createdAt: -1 }).limit(limit).select("title slug thumbnail status instructor createdAt").populate("instructor", "name avatar").lean(),
    Enrollment.find({ isActive: true })
      .sort({ enrolledAt: -1 })
      .limit(limit)
      .populate({ path: "student", select: "name email avatar" })
      .populate({ path: "course", select: "title slug thumbnail" })
      .lean(),
  ]);

  return { recentUsers, recentCourses, recentEnrollments };
}

async function duyetKhoaHocV2(courseId, adminId, action, reason = "") {
  const khoaHoc = await Course.findById(courseId);

  if (!khoaHoc) {
    const err = new Error("Không tìm thấy khóa học");
    err.statusCode = 404;
    throw err;
  }

  if (action === "approve") {
    if (khoaHoc.status !== "pending") {
      const err = new Error("Chỉ khóa học đang chờ duyệt mới có thể duyệt");
      err.statusCode = 400;
      throw err;
    }

    khoaHoc.status = "published";
    khoaHoc.rejectionReason = "";
    khoaHoc.reviewedBy = adminId;
    khoaHoc.reviewedAt = new Date();
    if (khoaHoc.pendingPrice !== null && khoaHoc.pendingPrice !== undefined) {
      khoaHoc.price = khoaHoc.pendingPrice;
      khoaHoc.pendingPrice = null;
    }
    if (khoaHoc.pendingDiscountPrice !== null && khoaHoc.pendingDiscountPrice !== undefined) {
      khoaHoc.discountPrice = khoaHoc.pendingDiscountPrice;
      khoaHoc.pendingDiscountPrice = null;
    }
    if (khoaHoc.pendingIsFree !== null && khoaHoc.pendingIsFree !== undefined) {
      khoaHoc.isFree = khoaHoc.pendingIsFree;
      khoaHoc.pendingIsFree = null;
    }
    await khoaHoc.save();
    await Promise.all([
      Chapter.updateMany({ course: courseId, contentStatus: "pending" }, { $set: { contentStatus: "approved" } }),
      Lesson.updateMany({ course: courseId, contentStatus: "pending" }, { $set: { contentStatus: "approved" } }),
      Exercise.updateMany({ course: courseId, contentStatus: "pending" }, { $set: { contentStatus: "approved" } }),
    ]);
    return { message: "Duyệt khóa học thành công", course: khoaHoc };
  }

  if (action === "reject") {
    if (khoaHoc.status !== "pending") {
      const err = new Error("Chỉ khóa học đang chờ duyệt mới có thể từ chối");
      err.statusCode = 400;
      throw err;
    }
    khoaHoc.status = "rejected";
    khoaHoc.rejectionReason = reason;
    khoaHoc.reviewedBy = adminId;
    khoaHoc.reviewedAt = new Date();
    await khoaHoc.save();
    return { message: "Từ chối khóa học thành công", course: khoaHoc };
  }

  if (action === "ban") {
    khoaHoc.status = "banned";
    khoaHoc.rejectionReason = reason;
    khoaHoc.reviewedBy = adminId;
    khoaHoc.reviewedAt = new Date();
    await khoaHoc.save();
    return { message: "Khóa khóa học thành công", course: khoaHoc };
  }

  if (action === "unlock") {
    if (khoaHoc.status === "locked" || khoaHoc.status === "banned") {
      khoaHoc.status = "draft";
      khoaHoc.rejectionReason = "";
      await khoaHoc.save();
    }
    return { message: "Mở khóa khóa học thành công", course: khoaHoc };
  }

  if (action === "lock") {
    khoaHoc.status = "locked";
    khoaHoc.rejectionReason = reason;
    await khoaHoc.save();
    return { message: "Khóa khóa học thành công", course: khoaHoc };
  }

  const err = new Error("Hành động không hợp lệ");
  err.statusCode = 400;
  throw err;
}

export {
  layDashboardStats,
  layRecentActivity,
  layKhoaHocChoDuyet,
  duyetKhoaHocV2 as duyetKhoaHoc,
  layDanhSachUser,
  capNhatTrangThaiUser,
  layDanhSachKhoaHoc,
  layChiTietKhoaHoc,
};
