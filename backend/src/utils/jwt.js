import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../config/index.js";

// Tạo access token
function taoAccessToken(user) {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
}

// Tạo refresh token
function taoRefreshToken(user, sessionId) {
  const payload = {
    userId: user._id,
    version: user.refreshTokenVersion,
    sessionId,
    jti: crypto.randomUUID(),
  };
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

// Verify access token
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch {
    return null;
  }
}

// Verify refresh token
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch {
    return null;
  }
}

export {
  taoAccessToken,
  taoRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
