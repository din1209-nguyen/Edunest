import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import Certificate from "../models/Certificate.js";
import User from "../models/User.js";
import { sendCertificateEmail } from "./emailService.js";
import {
  getEnrolledCoursesCache,
  invalidateOnEnrollment,
  invalidateTeacherStats,
  invalidateUserEnrollments,
} from "./cacheService.js";

function supportsTransactions() {
  const topologyType = mongoose.connection.client?.topology?.description?.type;
  return topologyType === "ReplicaSetWithPrimary" || topologyType === "Sharded";
}

async function startOptionalTransaction() {
  const session = await mongoose.startSession();
  const useTransaction = supportsTransactions();

  if (useTransaction) {
    session.startTransaction();
  }

  return { session, useTransaction };
}

function maybeWithSession(query, session, useTransaction) {
  return useTransaction ? query.session(session) : query;
}

// Lấy danh sách khóa học đã đăng ký của học viên
async function getEnrolledCourses(userId, options = {}) {
  return getEnrolledCoursesCache(userId, options, async () => {
    const { page = 1, limit = 10 } = options;

    // Tạo query để tìm các enrollment đang hoạt động
    const query = { student: userId, isActive: true };

    // Đếm tổng số enrollment
    const total = await Enrollment.countDocuments(query);

    // Lấy danh sách enrollment với phân trang
    const enrollments = await Enrollment.find(query)
      .populate({
        path: "course",
        select:
          "title slug thumbnail level category totalLessons totalDuration instructor",
        populate: { path: "instructor", select: "name avatar" },
      })
      .sort({ enrolledAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
}

// Đăng ký khóa học miễn phí
async function enrollFreeCourse(userId, courseId) {
  const courseObjectId = new mongoose.Types.ObjectId(courseId);
  const studentObjectId = new mongoose.Types.ObjectId(userId);

  // Bắt đầu transaction để đảm bảo atomicity
  const { session, useTransaction } = await startOptionalTransaction();

  try {
    // Tìm khóa học đã xuất bản
    const course = await maybeWithSession(Course.findOne({
      _id: courseObjectId,
      status: { $in: ["published", "draft", "pending"] },
    }), session, useTransaction);
    if (!course) {
      const err = new Error("Không tìm thấy khóa học");
      err.statusCode = 404;
      throw err;
    }

    // Kiểm tra khóa học có phải là miễn phí không
    if (!course.isFree) {
      const err = new Error("Khóa học này không miễn phí");
      err.statusCode = 400;
      throw err;
    }

    // Kiểm tra đã đăng ký chưa
    const existing = await maybeWithSession(Enrollment.findOne({
      student: studentObjectId,
      course: courseObjectId,
    }), session, useTransaction);

    if (existing) {
      if (existing.isActive) {
        const err = new Error("Bạn đã đăng ký khóa học này rồi");
        err.statusCode = 409;
        throw err;
      }
      // Kích hoạt lại enrollment đã bị vô hiệu hóa
      existing.isActive = true;
      existing.source = "free";
      await existing.save(useTransaction ? { session } : {});
      await Course.findByIdAndUpdate(courseObjectId, { $inc: { totalStudents: 1 } }, useTransaction ? { session } : {});
      if (useTransaction) await session.commitTransaction();
      await invalidateOnEnrollment(userId);
      await invalidateTeacherStats(course.instructor?.toString());
      existing.$session(null);
      await existing.populate({
        path: "course",
        select: "title slug thumbnail level category",
      });
      return existing;
    }

    // Tạo enrollment mới cho khóa học miễn phí
    const enrollmentPayload = {
      student: studentObjectId,
      course: courseObjectId,
      source: "free",
      progress: 0,
      completedLessons: [],
    };
    const enrollment = useTransaction
      ? await Enrollment.create([enrollmentPayload], { session })
      : [await Enrollment.create(enrollmentPayload)];

    // Tăng số lượng học viên
    await Course.findByIdAndUpdate(courseObjectId, { $inc: { totalStudents: 1 } }, useTransaction ? { session } : {});

    if (useTransaction) await session.commitTransaction();
    await invalidateOnEnrollment(userId);
    await invalidateTeacherStats(course.instructor?.toString());

    const enrollmentRecord = enrollment[0];
    enrollmentRecord.$session(null);
    await enrollmentRecord.populate({
      path: "course",
      select: "title slug thumbnail level category",
    });
    return enrollmentRecord;
  } catch (error) {
    if (useTransaction) await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// Lấy tiến độ học tập của học viên trong khóa học
async function getCourseProgress(userId, courseId) {
  // Tìm enrollment của học viên với khóa học
  const enrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
  });

  if (!enrollment) {
    const err = new Error("Bạn chưa đăng ký khóa học này");
    err.statusCode = 404;
    throw err;
  }

  // Trả về thông tin tiến độ
  return {
    progress: enrollment.progress,
    completedLessons: enrollment.completedLessons,
    enrolledAt: enrollment.enrolledAt,
    completedAt: enrollment.completedAt,
    isActive: enrollment.isActive,
  };
}

// Đánh dấu bài học hoàn thành
async function markLessonComplete(userId, courseId, lessonId) {
  const { session, useTransaction } = await startOptionalTransaction();

  try {
    const studentObjectId = new mongoose.Types.ObjectId(userId);
    const courseObjectId = new mongoose.Types.ObjectId(courseId);
    const lessonObjectId = new mongoose.Types.ObjectId(lessonId);

    // Tìm enrollment của học viên
    const enrollment = await maybeWithSession(Enrollment.findOne({
      student: studentObjectId,
      course: courseObjectId,
    }), session, useTransaction);

    if (!enrollment) {
      const err = new Error("Bạn chưa đăng ký khóa học này");
      err.statusCode = 404;
      throw err;
    }

    // Kiểm tra enrollment có đang hoạt động không
    if (!enrollment.isActive) {
      const err = new Error("Enrollment đã bị vô hiệu hóa");
      err.statusCode = 403;
      throw err;
    }

    // Kiểm tra bài học đã được hoàn thành chưa
    const lessonIdStr = lessonObjectId.toString();
    const alreadyCompleted = enrollment.completedLessons.some(
      (id) => id.toString() === lessonIdStr,
    );

    // Thêm bài học vào danh sách đã hoàn thành nếu chưa có
    if (!alreadyCompleted) {
      enrollment.completedLessons.push(lessonObjectId);
    }

    // Tính toán tiến độ mới
    const totalLessonsDoc = await maybeWithSession(
      Course.findById(courseObjectId).select("totalLessons"),
      session,
      useTransaction,
    );
    const completedCount = enrollment.completedLessons.length;
    const totalCount = totalLessonsDoc?.totalLessons || 1;
    enrollment.progress = Math.round((completedCount / totalCount) * 100);

    // Kiểm tra nếu hoàn thành 100% thì cấp chứng chỉ
    if (enrollment.progress >= 100) {
      enrollment.completedAt = new Date();
      enrollment.progress = 100;

      // Tạo chứng chỉ nếu chưa có (trong cùng transaction)
      const existingCert = await maybeWithSession(Certificate.findOne({
        student: studentObjectId,
        course: courseObjectId,
      }), session, useTransaction);

      if (!existingCert) {
        const certId = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        const certificatePayload = {
          student: studentObjectId,
          course: courseObjectId,
          certificateId: certId,
          issuedAt: new Date(),
        };
        if (useTransaction) {
          await Certificate.create([certificatePayload], { session });
        } else {
          await Certificate.create(certificatePayload);
        }
      }
    }

    // Lưu enrollment đã cập nhật
    await enrollment.save(useTransaction ? { session } : {});

    if (useTransaction) await session.commitTransaction();

    // Gửi email chứng chỉ SAU KHI transaction commit thành công
    if (enrollment.progress >= 100) {
      const user = await User.findById(studentObjectId).select("name email");
      const course = await Course.findById(courseObjectId).select("title instructor");
      if (user && course) {
        const cert = await Certificate.findOne({
          student: studentObjectId,
          course: courseObjectId,
        }).select("certificateId issuedAt");
        const instructor = course.instructor
          ? await User.findById(course.instructor).select("name")
          : null;
        if (cert) {
          sendCertificateEmail({ student: user, course, certificate: cert, instructor })
            .catch(err => console.error("[Email] Certificate email failed:", err.message));
        }
      }
    }

    return {
      progress: enrollment.progress,
      completedLessons: enrollment.completedLessons,
      completedAt: enrollment.completedAt,
      lessonMarked: !alreadyCompleted,
    };
  } catch (error) {
    if (useTransaction) await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// Lấy enrollment theo khóa học
async function getEnrollmentByCourse(userId, courseId) {
  return Enrollment.findOne({ student: userId, course: courseId });
}

export {
  getEnrolledCourses,
  enrollFreeCourse,
  getCourseProgress,
  markLessonComplete,
  getEnrollmentByCourse,
};
