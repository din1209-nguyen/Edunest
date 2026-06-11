import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AuthSession from "../models/AuthSession.js";
import {
  taoAccessToken,
  taoRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import {
  generateEmailVerificationToken,
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "./emailService.js";
import {
  invalidateAuthUser,
  invalidateOnEnrollment,
} from "./cacheService.js";
import config from "../config/index.js";

function sanitizeUser(user) {
  return typeof user.toJSON === "function" ? user.toJSON() : user;
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildDeviceLabel(userAgent = "") {
  const ua = userAgent.toLowerCase();
  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("chrome")
      ? "Chrome"
      : ua.includes("firefox")
        ? "Firefox"
        : ua.includes("safari")
          ? "Safari"
          : "Trình duyệt";
  const os = ua.includes("windows")
    ? "Windows"
    : ua.includes("mac os")
      ? "macOS"
      : ua.includes("android")
        ? "Android"
        : ua.includes("iphone") || ua.includes("ipad")
          ? "iOS"
          : "Thiết bị";

  return `${browser} trên ${os}`;
}

function getRefreshExpiry(token) {
  const decoded = jwt.decode(token);
  return decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

function serializeSession(session, currentSessionId = null) {
  const id = session._id.toString();
  return {
    _id: id,
    deviceLabel: session.deviceLabel,
    userAgent: session.userAgent,
    ip: session.ip,
    lastSeenAt: session.lastSeenAt,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    revokedAt: session.revokedAt,
    isCurrent: currentSessionId ? id === currentSessionId : false,
  };
}

async function createAuthSession(user, meta = {}) {
  const session = await AuthSession.create({
    user: user._id,
    refreshTokenHash: "pending",
    userAgent: meta.userAgent || "",
    ip: meta.ip || "",
    deviceLabel: buildDeviceLabel(meta.userAgent),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    lastSeenAt: new Date(),
  });
  const refreshToken = taoRefreshToken(user, session._id.toString());

  session.refreshTokenHash = hashRefreshToken(refreshToken);
  session.expiresAt = getRefreshExpiry(refreshToken);
  await session.save();

  return { session, refreshToken };
}

async function buildAuthResult(user, meta = {}) {
  const { session, refreshToken } = await createAuthSession(user, meta);
  return {
    user: sanitizeUser(user),
    accessToken: taoAccessToken(user),
    refreshToken,
    session: serializeSession(session, session._id.toString()),
  };
}

function buildVerificationExpiryDate() {
  return new Date(Date.now() + config.auth.emailVerificationTtlMs);
}

function buildPasswordResetExpiryDate() {
  return new Date(Date.now() + config.auth.passwordResetTtlMs);
}

async function issueEmailVerification(user) {
  const token = generateEmailVerificationToken();
  user.emailVerificationToken = token;
  user.emailVerificationExpiresAt = buildVerificationExpiryDate();
  await user.save({ validateBeforeSave: false });

  const sendResult = await sendEmailVerificationEmail(user, token).catch((err) => {
    console.error("[Email] Verification email failed:", err.message);
    return {
      failed: true,
      message: err.message,
    };
  });

  return {
    token,
    emailDeliveryFailed: Boolean(sendResult?.failed),
    emailDeliveryMessage: sendResult?.message || null,
  };
}

async function getActiveUserById(userId, select = "") {
  const user = await User.findById(userId).select(select);

  if (!user) {
    const error = new Error("Không tìm thấy người dùng");
    error.statusCode = 404;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Tài khoản đã bị vô hiệu hóa");
    error.statusCode = 403;
    throw error;
  }

  return user;
}

async function revokeAllSessions(userId) {
  await AuthSession.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

async function dangKy(data, meta = {}) {
  const tonTai = await User.findOne({ email: data.email });
  if (tonTai) {
    const error = new Error("Email đã được sử dụng");
    error.statusCode = 409;
    throw error;
  }

  const shouldVerifyEmail = data.role !== "admin";
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role || "user",
    isEmailVerified: !shouldVerifyEmail,
  });

  let verification = {
    emailDeliveryFailed: false,
    emailDeliveryMessage: null,
  };

  if (shouldVerifyEmail) {
    verification = await issueEmailVerification(user);
  } else {
    sendWelcomeEmail(user).catch((err) =>
      console.error("[Email] Welcome email failed:", err.message),
    );
  }

  const authResult = shouldVerifyEmail ? {} : await buildAuthResult(user, meta);

  return {
    user: sanitizeUser(user),
    verificationRequired: shouldVerifyEmail,
    emailDeliveryFailed: verification.emailDeliveryFailed,
    emailDeliveryMessage: verification.emailDeliveryMessage,
    ...authResult,
  };
}

async function dangNhap(email, password, meta = {}) {
  const user = await User.findOne({ email }).select("+password +refreshTokenVersion");
  if (!user) {
    const error = new Error("Email hoặc mật khẩu không đúng");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Tài khoản đã bị vô hiệu hóa");
    error.statusCode = 403;
    throw error;
  }

  if (!user.password) {
    const error = new Error("Tài khoản này được tạo bằng Google. Vui lòng đăng nhập với Google.");
    error.statusCode = 400;
    throw error;
  }

  const hopLe = await user.comparePassword(password);
  if (!hopLe) {
    const error = new Error("Email hoặc mật khẩu không đúng");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isEmailVerified) {
    const error = new Error("Email của bạn chưa được xác minh. Vui lòng kiểm tra hộp thư và xác minh trước khi đăng nhập.");
    error.statusCode = 403;
    error.code = "EMAIL_NOT_VERIFIED";
    throw error;
  }

  return buildAuthResult(user, meta);
}

async function refreshToken(token, meta = {}) {
  const decoded = verifyRefreshToken(token);
  if (!decoded) {
    const error = new Error("Refresh token không hợp lệ hoặc đã hết hạn");
    error.statusCode = 401;
    throw error;
  }

  if (!decoded.sessionId) {
    const error = new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
    error.statusCode = 401;
    throw error;
  }

  const user = await getActiveUserById(decoded.userId, "+refreshTokenVersion");
  const session = await AuthSession.findOne({
    _id: decoded.sessionId,
    user: decoded.userId,
  }).select("+refreshTokenHash");

  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
    const error = new Error("Phiên đăng nhập đã hết hạn hoặc bị thu hồi");
    error.statusCode = 401;
    throw error;
  }

  if (session.refreshTokenHash !== hashRefreshToken(token)) {
    session.revokedAt = new Date();
    await session.save();

    const error = new Error("Refresh token đã được rotate hoặc không còn hợp lệ");
    error.statusCode = 401;
    throw error;
  }

  if (user.refreshTokenVersion !== decoded.version) {
    const error = new Error("Token đã bị revoke. Vui lòng đăng nhập lại.");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isEmailVerified) {
    const error = new Error("Email của bạn chưa được xác minh. Vui lòng kiểm tra hộp thư và xác minh trước khi đăng nhập.");
    error.statusCode = 403;
    error.code = "EMAIL_NOT_VERIFIED";
    throw error;
  }

  const nextRefreshToken = taoRefreshToken(user, session._id.toString());
  session.refreshTokenHash = hashRefreshToken(nextRefreshToken);
  session.expiresAt = getRefreshExpiry(nextRefreshToken);
  session.lastSeenAt = new Date();
  if (meta.userAgent) {
    session.userAgent = meta.userAgent;
    session.deviceLabel = buildDeviceLabel(meta.userAgent);
  }
  if (meta.ip) {
    session.ip = meta.ip;
  }
  await session.save();

  return {
    user: sanitizeUser(user),
    accessToken: taoAccessToken(user),
    refreshToken: nextRefreshToken,
    session: serializeSession(session, session._id.toString()),
  };
}

async function layThongTin(userId) {
  const user = await getActiveUserById(userId);
  return sanitizeUser(user);
}

async function capNhatProfile(userId, data) {
  const user = await getActiveUserById(userId);

  if (data.name !== undefined) user.name = data.name;
  if (data.bio !== undefined) user.bio = data.bio;
  if (data.avatar !== undefined) user.avatar = data.avatar;

  await user.save();
  await invalidateAuthUser(userId);
  return sanitizeUser(user);
}

async function doiMatKhau(userId, currentPassword, newPassword) {
  const user = await getActiveUserById(userId, "+password +refreshTokenVersion");

  if (!user.password) {
    const error = new Error("Tài khoản Google chưa có mật khẩu. Vui lòng dùng chức năng thiết lập mật khẩu.");
    error.statusCode = 400;
    throw error;
  }

  const hopLe = await user.comparePassword(currentPassword);
  if (!hopLe) {
    const error = new Error("Mật khẩu hiện tại không đúng");
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  user.refreshTokenVersion += 1;
  await user.save();
  await revokeAllSessions(userId);
  await invalidateAuthUser(userId);

  return { message: "Đổi mật khẩu thành công" };
}

async function yeuCauDatLaiMatKhau(email) {
  const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpiresAt");

  if (!user || !user.isActive) {
    return {
      emailDeliveryFailed: false,
      emailDeliveryMessage: null,
    };
  }

  const token = generateEmailVerificationToken();
  user.passwordResetToken = token;
  user.passwordResetExpiresAt = buildPasswordResetExpiryDate();
  await user.save({ validateBeforeSave: false });

  const sendResult = await sendPasswordResetEmail(user, token).catch((err) => {
    console.error("[Email] Password reset email failed:", err.message);
    return {
      failed: true,
      message: err.message,
    };
  });

  return {
    emailDeliveryFailed: Boolean(sendResult?.failed),
    emailDeliveryMessage: sendResult?.message || null,
  };
}

async function datLaiMatKhau(token, newPassword) {
  const user = await User.findOne({ passwordResetToken: token }).select(
    "+password +passwordResetToken +passwordResetExpiresAt +refreshTokenVersion",
  );

  if (!user) {
    const error = new Error("Liên kết đặt lại mật khẩu không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
    const error = new Error("Liên kết đặt lại mật khẩu đã hết hạn");
    error.statusCode = 400;
    error.code = "PASSWORD_RESET_EXPIRED";
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Tài khoản đã bị vô hiệu hóa");
    error.statusCode = 403;
    throw error;
  }

  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpiresAt = null;
  user.refreshTokenVersion += 1;
  await user.save();
  await revokeAllSessions(user._id.toString());
  await invalidateAuthUser(user._id.toString());

  return { message: "Đặt lại mật khẩu thành công" };
}

async function revokeToken(userId) {
  await User.findByIdAndUpdate(userId, { $inc: { refreshTokenVersion: 1 } });
  await revokeAllSessions(userId);
  await invalidateAuthUser(userId);
  return { message: "Đăng xuất thành công" };
}

async function xacMinhEmail(token) {
  const user = await User.findOne({ emailVerificationToken: token }).select(
    "+emailVerificationToken +emailVerificationExpiresAt",
  );

  if (!user) {
    const error = new Error("Liên kết xác minh không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  if (user.isEmailVerified) {
    return sanitizeUser(user);
  }

  if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now()) {
    const error = new Error("Liên kết xác minh đã hết hạn");
    error.statusCode = 400;
    error.code = "EMAIL_VERIFICATION_EXPIRED";
    throw error;
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpiresAt = null;
  await user.save({ validateBeforeSave: false });
  await invalidateAuthUser(user._id.toString());

  sendWelcomeEmail(user).catch((err) =>
    console.error("[Email] Welcome email failed:", err.message),
  );

  return sanitizeUser(user);
}

const RESEND_VERIFICATION_COOLDOWN_MS = 60 * 1000;

async function guiLaiXacMinhEmail(email) {
  const user = await User.findOne({ email }).select(
    "+emailVerificationToken +emailVerificationExpiresAt",
  );

  if (!user) {
    const error = new Error("Không tìm thấy tài khoản với email này");
    error.statusCode = 404;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Tài khoản đã bị vô hiệu hóa");
    error.statusCode = 403;
    throw error;
  }

  if (user.isEmailVerified) {
    return {
      alreadyVerified: true,
      user: sanitizeUser(user),
      emailDeliveryFailed: false,
      emailDeliveryMessage: null,
    };
  }

  if (
    user.emailVerificationExpiresAt &&
    user.emailVerificationExpiresAt.getTime() - Date.now() > config.auth.emailVerificationTtlMs - RESEND_VERIFICATION_COOLDOWN_MS
  ) {
    const error = new Error("Bạn vừa yêu cầu gửi email xác minh. Vui lòng đợi khoảng 1 phút rồi thử lại.");
    error.statusCode = 429;
    throw error;
  }

  const verificationResult = await issueEmailVerification(user);

  return {
    alreadyVerified: false,
    user: sanitizeUser(user),
    emailDeliveryFailed: verificationResult.emailDeliveryFailed,
    emailDeliveryMessage: verificationResult.emailDeliveryMessage,
  };
}

async function googleLogin(googleId, email, name, avatar, meta = {}) {
  let user = await User.findOne({ googleId }).select("+refreshTokenVersion");

  if (!user) {
    user = await User.findOne({ email }).select("+refreshTokenVersion");

    if (user) {
      user.googleId = googleId;
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpiresAt = null;
      if (avatar && !user.avatar) user.avatar = avatar;
      if (name && (!user.name || user.name === email.split("@")[0])) {
        user.name = name;
      }
      await user.save();
    } else {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        googleId,
        avatar: avatar || "",
        role: "user",
        isEmailVerified: true,
      });

      sendWelcomeEmail(user).catch((err) =>
        console.error("[Email] Welcome email failed:", err.message),
      );
    }
  }

  if (!user.isActive) {
    const error = new Error("Tài khoản đã bị vô hiệu hóa");
    error.statusCode = 403;
    throw error;
  }

  return buildAuthResult(user, meta);
}

function decodeRefreshSessionId(token) {
  const decoded = verifyRefreshToken(token);
  return decoded?.sessionId || null;
}

async function revokeSessionByRefreshToken(token) {
  const sessionId = decodeRefreshSessionId(token);
  if (!sessionId) return null;

  const session = await AuthSession.findById(sessionId);
  if (!session || session.revokedAt) return session;

  session.revokedAt = new Date();
  await session.save();
  return session;
}

async function listSessions(userId, currentSessionId = null) {
  const sessions = await AuthSession.find({
    user: userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ lastSeenAt: -1 });

  return sessions.map((session) => serializeSession(session, currentSessionId));
}

async function revokeSession(userId, sessionId) {
  const session = await AuthSession.findOne({
    _id: sessionId,
    user: userId,
    revokedAt: null,
  });

  if (!session) {
    const error = new Error("Không tìm thấy phiên đăng nhập");
    error.statusCode = 404;
    throw error;
  }

  session.revokedAt = new Date();
  await session.save();
  return serializeSession(session);
}

async function revokeOtherSessions(userId, currentSessionId = null) {
  const filter = {
    user: userId,
    revokedAt: null,
    ...(currentSessionId ? { _id: { $ne: currentSessionId } } : {}),
  };
  const result = await AuthSession.updateMany(filter, { $set: { revokedAt: new Date() } });

  return { revokedCount: result.modifiedCount || 0 };
}

async function xacThucNguoiDung(userId) {
  const user = await getActiveUserById(userId);

  return {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    user: sanitizeUser(user),
  };
}

export {
  dangKy,
  dangNhap,
  refreshToken,
  layThongTin,
  capNhatProfile,
  doiMatKhau,
  revokeToken,
  xacMinhEmail,
  guiLaiXacMinhEmail,
  googleLogin,
  yeuCauDatLaiMatKhau,
  datLaiMatKhau,
  xacThucNguoiDung,
  decodeRefreshSessionId,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  revokeSessionByRefreshToken,
};
