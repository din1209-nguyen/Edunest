import Payment from "../models/Payment.js";
import Cart from "../models/Cart.js";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import { createVNPayUrl, verifyVNPayReturn } from "./vnpayService.js";
import {
  getPaymentHistory,
  invalidateOnEnrollment,
  invalidateTeacherStats,
  invalidateUserCart,
  invalidateUserPayments,
} from "./cacheService.js";
import { layGioHang } from "./cartService.js";
import { sendPaymentConfirmationEmail } from "./emailService.js";
import config from "../config/index.js";

function getCoursePrice(course) {
  if (course.isFree) {
    return 0;
  }

  return course.discountPrice && course.discountPrice > 0
    ? course.discountPrice
    : course.price;
}

function getVNPayReturnUrl() {
  return config.vnpay.returnUrl || `${process.env.BACKEND_URL || "http://localhost:5000"}/api/payments/vnpay/return`;
}

// Tao thanh toan tu gio hang
async function taoThanhToan(userId, method = "mock") {
  const cart = await layGioHang(userId);

  if (!cart.items || cart.items.length === 0) {
    const err = new Error("Giỏ hàng trống");
    err.statusCode = 400;
    throw err;
  }

  const courseIds = cart.items.map((item) => item.course._id);
  const paidCourses = await Enrollment.find({
    student: userId,
    course: { $in: courseIds },
    isActive: true,
  }).select("course");

  const alreadyEnrolled = new Set(paidCourses.map((enrollment) => enrollment.course.toString()));
  const unpaidItems = cart.items.filter(
    (item) => !alreadyEnrolled.has(item.course._id.toString()),
  );

  if (unpaidItems.length === 0) {
    const err = new Error("Tất cả khóa học trong giỏ đã được đăng ký");
    err.statusCode = 409;
    throw err;
  }

  const unpaidCourseIds = unpaidItems.map((item) => item.course._id);
  const totalAmount = unpaidItems.reduce((sum, item) => sum + getCoursePrice(item.course), 0);

  if (totalAmount === 0 && method !== "mock") {
    const err = new Error("Tổng số tiền phải lớn hơn 0");
    err.statusCode = 400;
    throw err;
  }

  const orderId = `DH${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const payment = await Payment.create({
    user: userId,
    amount: totalAmount,
    currency: "VND",
    status: "pending",
    method,
    courses: unpaidCourseIds,
    transactionId: "",
  });

  return {
    payment,
    orderId,
    totalAmount,
    items: unpaidItems,
  };
}

// Tao URL thanh toan VNPay
async function taoVNPayUrl(userId, ipAddr = "127.0.0.1") {
  const { payment, orderId, totalAmount } = await taoThanhToan(userId, "vnpay");
  const returnUrl = getVNPayReturnUrl();
  const vnpayUrl = createVNPayUrl(
    totalAmount,
    orderId,
    `Thanh toan don hang ${orderId}`,
    returnUrl,
    ipAddr,
  );

  payment.transactionId = orderId;
  payment.paymentData = { vnpayTxnRef: orderId, returnUrl };
  await payment.save();
  await invalidateUserPayments(userId);

  return { paymentId: payment._id, vnpayUrl, totalAmount };
}

async function failVNPayPayment(payment, query, message, failureCode) {
  payment.status = "failed";
  payment.paymentData = {
    ...payment.paymentData,
    vnpayReturn: query,
    vnpayFailureCode: failureCode,
  };
  await payment.save();
  await invalidateUserPayments(payment.user.toString());

  return { success: false, payment, message };
}

// Xu ly ket qua tra ve tu VNPay
async function xuLyVNPayReturn(query) {
  const result = verifyVNPayReturn(query);

  if (!result.valid) {
    const err = new Error(result.message);
    err.statusCode = 400;
    throw err;
  }

  const payment = await Payment.findOne({ transactionId: result.orderId });

  if (!payment) {
    const err = new Error("Không tìm thấy payment");
    err.statusCode = 404;
    throw err;
  }

  const expectedAmount = Math.round(payment.amount) * 100;
  const returnedAmount = Number(result.amount);

  if (returnedAmount !== expectedAmount) {
    return failVNPayPayment(
      payment,
      query,
      "Số tiền thanh toán không khớp",
      "AMOUNT_MISMATCH",
    );
  }

  if (payment.status === "success") {
    return { success: true, payment, message: "Thanh toán đã được xử lý trước đó" };
  }

  const hasSuccessfulTransactionStatus = !result.transactionStatus || result.transactionStatus === "00";
  if (result.code === "00" && hasSuccessfulTransactionStatus) {
    return xuLyThanhToanThanhCong(payment._id.toString(), result.transactionId, {
      vnpayReturn: query,
      vnpayTxnRef: result.orderId,
      vnpayTransactionNo: result.transactionId,
      vnpayResponseCode: result.code,
      vnpayTransactionStatus: result.transactionStatus,
    });
  }

  return failVNPayPayment(
    payment,
    query,
    "Thanh toán thất bại",
    result.code || result.transactionStatus || "UNKNOWN",
  );
}

// Xu ly thanh toan mock cho moi truong development
async function mockThanhToanThanhCong(userId, paymentId) {
  const payment = await Payment.findOne({
    _id: paymentId,
    user: userId,
    status: "pending",
  });

  if (!payment) {
    const err = new Error("Không tìm thấy payment hợp lệ");
    err.statusCode = 404;
    throw err;
  }

  return xuLyThanhToanThanhCong(
    paymentId,
    `MOCK-${Date.now()}`,
    { mock: true },
  );
}

// Xu ly thanh toan thanh cong va tao enrollment cho cac khoa hoc
async function xuLyThanhToanThanhCong(paymentId, transactionId, extraData = {}) {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new Error("Không tìm thấy payment");
  }

  if (payment.status === "success") {
    return { success: true, payment, enrollments: [] };
  }

  payment.status = "success";
  if (payment.method !== "vnpay") {
    payment.transactionId = transactionId;
  }
  payment.paidAt = new Date();
  payment.paymentData = { ...payment.paymentData, ...extraData };
  await payment.save();

  const enrollments = [];
  for (const courseId of payment.courses) {
    const existing = await Enrollment.findOne({
      student: payment.user,
      course: courseId,
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.progress = 0;
        existing.completedLessons = [];
        existing.source = "purchase";
        existing.enrolledAt = new Date();
        existing.completedAt = null;
        await existing.save();
        await Course.findByIdAndUpdate(courseId, { $inc: { totalStudents: 1 } });
      }
    } else {
      const enrollment = await Enrollment.create({
        student: payment.user,
        course: courseId,
        source: "purchase",
        progress: 0,
        completedLessons: [],
      });
      enrollments.push(enrollment);
      await Course.findByIdAndUpdate(courseId, { $inc: { totalStudents: 1 } });
    }
  }

  await Cart.findOneAndUpdate(
    { user: payment.user },
    { $pull: { items: { course: { $in: payment.courses } } } },
  );

  await invalidateUserCart(payment.user.toString());
  await invalidateUserPayments(payment.user.toString());
  await invalidateOnEnrollment(payment.user.toString());

  const teacherIds = await Course.find({ _id: { $in: payment.courses } }).distinct("instructor");
  await Promise.all(teacherIds.map((teacherId) => invalidateTeacherStats(teacherId.toString())));

  const user = await User.findById(payment.user);
  if (user) {
    const courseDocs = await Course.find({ _id: { $in: payment.courses } }).select("title");
    courseDocs.forEach((course) => {
      sendPaymentConfirmationEmail({
        student: user,
        course,
        payment: { ...payment.toObject(), transactionId, amount: payment.amount },
      }).catch((err) => console.error("[Email] Payment confirmation failed:", err.message));
    });
  }

  return { success: true, payment, enrollments };
}

// Lay lich su thanh toan cua nguoi dung
async function layLichSuThanhToan(userId, options = {}) {
  return getPaymentHistory(userId, options, async () => {
    const { page = 1, limit = 10 } = options;
    const total = await Payment.countDocuments({ user: userId });
    const payments = await Payment.find({ user: userId })
      .populate({
        path: "courses",
        select: "title slug thumbnail",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
}

export {
  taoThanhToan,
  taoVNPayUrl,
  xuLyVNPayReturn,
  mockThanhToanThanhCong,
  xuLyThanhToanThanhCong,
  layLichSuThanhToan,
};
