import { Router } from "express";
import {
  register,
  login,
  refresh,
  getMe,
  updateProfile,
  changePassword,
  logout,
  getSessions,
  deleteSession,
  deleteSessions,
  forgotPassword,
  resetPassword,
  resendVerification,
  verifyEmail,
  googleRedirect,
  googleCallback,
} from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { createRateLimit } from "../middlewares/rateLimit.js";

const router = Router();

const loginRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyPrefix: "auth-login",
  message: "Bạn thao tác đăng nhập quá nhanh. Vui lòng đợi 1 phút rồi thử lại.",
  resolveKey: (req) => `${req.ip || "unknown"}:${String(req.body?.email || "").toLowerCase()}`,
});

const registerRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyPrefix: "auth-register",
  message: "Bạn gửi đăng ký quá nhiều lần. Vui lòng đợi 1 phút rồi thử lại.",
  resolveKey: (req) => `${req.ip || "unknown"}:${String(req.body?.email || "").toLowerCase()}`,
});

const resendVerificationRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 3,
  keyPrefix: "auth-resend-verification",
  message: "Bạn đã yêu cầu gửi lại email xác minh quá nhiều lần. Vui lòng đợi 1 phút rồi thử lại.",
  resolveKey: (req) => `${req.ip || "unknown"}:${String(req.body?.email || "").toLowerCase()}`,
});

const forgotPasswordRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 3,
  keyPrefix: "auth-forgot-password",
  message: "Bạn đã yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng đợi 1 phút rồi thử lại.",
  resolveKey: (req) => `${req.ip || "unknown"}:${String(req.body?.email || "").toLowerCase()}`,
});

router.post("/register", registerRateLimit, register);
router.post("/login", loginRateLimit, login);
router.post("/refresh", refresh);
router.post("/forgot-password", forgotPasswordRateLimit, forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/resend-verification", resendVerificationRateLimit, resendVerification);
router.get("/verify-email", verifyEmail);
router.get("/google", googleRedirect);
router.get("/google/callback", googleCallback);
router.get("/me", authMiddleware, getMe);
router.patch("/profile", authMiddleware, updateProfile);
router.post("/change-password", authMiddleware, changePassword);
router.get("/sessions", authMiddleware, getSessions);
router.delete("/sessions/:sessionId", authMiddleware, deleteSession);
router.delete("/sessions", authMiddleware, deleteSessions);
router.post("/logout", logout);

export default router;
