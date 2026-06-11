import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { xacThucNguoiDung } from "../services/authService.js";
import { getAuthUser } from "../services/cacheService.js";

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return req.cookies?.[config.auth.accessCookieName] || null;
};

const authMiddleware = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Không có token xác thực",
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const authenticatedUser = process.env.NODE_ENV === "test"
      ? await xacThucNguoiDung(decoded.userId)
      : await getAuthUser(decoded.userId, () => xacThucNguoiDung(decoded.userId));

    req.user = authenticatedUser;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
};

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa xác thực người dùng",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập tài nguyên này",
      });
    }

    next();
  };
};

export { authMiddleware, roleMiddleware };
