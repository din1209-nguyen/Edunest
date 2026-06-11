import Certificate from "../models/Certificate.js";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";

async function layChungChi(userId, courseId) {
  const chungChi = await Certificate.findOne({
    student: userId,
    course: courseId,
  })
    .populate({
      path: "student",
      select: "name email avatar",
    })
    .populate({
      path: "course",
      select: "title slug thumbnail category level",
    });

  if (!chungChi) {
    const err = new Error("Không tìm thấy chứng chỉ");
    err.statusCode = 404;
    throw err;
  }

  return chungChi;
}

async function layTatCaChungChi(userId) {
  const certificates = await Certificate.find({ student: userId })
    .populate({
      path: "course",
      select: "title slug thumbnail category level",
    })
    .sort({ issuedAt: -1 })
    .lean();

  return certificates;
}

async function kiemTraChungChi(userId, courseId) {
  const enrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
  });

  if (!enrollment) {
    return {
      eligible: false,
      hasCertificate: false,
      reason: "Bạn chưa đăng ký khóa học này",
    };
  }

  if (enrollment.progress < 100) {
    return {
      eligible: false,
      hasCertificate: false,
      reason: `Bạn cần hoàn thành ${100 - enrollment.progress}% khóa học để nhận chứng chỉ`,
    };
  }

  const existing = await Certificate.findOne({
    student: userId,
    course: courseId,
  });

  return {
    eligible: true,
    hasCertificate: !!existing,
    certificate: existing || null,
  };
}

export { layChungChi, layTatCaChungChi, kiemTraChungChi };
