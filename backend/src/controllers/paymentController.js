import {
  taoThanhToan,
  taoVNPayUrl,
  xuLyVNPayReturn,
  mockThanhToanThanhCong,
  layLichSuThanhToan,
} from "../services/paymentService.js";

function getFrontendCheckoutResultUrl(params) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
  const url = new URL("/student/checkout/result", frontendUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0];
  }

  return forwardedFor?.split(",")[0]?.trim() || req.ip || req.socket?.remoteAddress || "127.0.0.1";
}

async function createPayment(req, res, next) {
  try {
    const { method = "mock" } = req.body;
    const result = await taoThanhToan(req.user.userId, method);
    res.status(201).json({
      success: true,
      message: "Tạo thanh toán thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function createVNPayPayment(req, res, next) {
  try {
    const result = await taoVNPayUrl(req.user.userId, getClientIp(req));
    res.status(201).json({
      success: true,
      message: "Tạo URL thanh toán VNPay thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function vnpayReturn(req, res) {
  try {
    const result = await xuLyVNPayReturn(req.query);

    if (result.success) {
      return res.redirect(getFrontendCheckoutResultUrl({
        success: "true",
        paymentId: result.payment._id.toString(),
        method: "vnpay",
      }));
    }

    return res.redirect(getFrontendCheckoutResultUrl({
      success: "false",
      paymentId: result.payment?._id?.toString(),
      method: "vnpay",
      message: result.message,
    }));
  } catch (error) {
    return res.redirect(getFrontendCheckoutResultUrl({
      success: "false",
      method: "vnpay",
      message: error.message || "Thanh toán thất bại",
    }));
  }
}

async function mockSuccess(req, res, next) {
  try {
    const { paymentId } = req.body;
    const result = await mockThanhToanThanhCong(req.user.userId, paymentId);
    res.json({
      success: true,
      message: "Thanh toán mock thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getPaymentHistory(req, res, next) {
  try {
    const result = await layLichSuThanhToan(req.user.userId, req.validatedQuery);
    res.json({
      success: true,
      message: "Lấy lịch sử thanh toán thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export {
  createPayment,
  createVNPayPayment,
  vnpayReturn,
  mockSuccess,
  getPaymentHistory,
};
