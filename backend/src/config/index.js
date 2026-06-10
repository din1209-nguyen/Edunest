import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const isProduction = process.env.NODE_ENV === "production";
const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
const parseBoolean = (value, fallback = false) => {
  if (typeof value !== "string") return fallback;
  return value === "true";
};

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/edunest",
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  cors: {
    origin: frontendUrl,
  },
  auth: {
    accessCookieName: process.env.AUTH_ACCESS_COOKIE_NAME || "edunest_access_token",
    refreshCookieName: process.env.AUTH_REFRESH_COOKIE_NAME || "edunest_refresh_token",
    oauthStateCookieName: process.env.AUTH_OAUTH_STATE_COOKIE_NAME || "edunest_oauth_state",
    oauthRedirectCookieName: process.env.AUTH_OAUTH_REDIRECT_COOKIE_NAME || "edunest_oauth_redirect",
    oauthRedirectOriginCookieName: process.env.AUTH_OAUTH_REDIRECT_ORIGIN_COOKIE_NAME || "edunest_oauth_redirect_origin",
    cookieDomain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    sameSite: process.env.AUTH_COOKIE_SAME_SITE || (isProduction ? "lax" : "lax"),
    secureCookies: process.env.AUTH_COOKIE_SECURE
      ? parseBoolean(process.env.AUTH_COOKIE_SECURE)
      : isProduction,
    frontendSuccessRedirect: process.env.AUTH_SUCCESS_REDIRECT_PATH || "/teacher/dashboard",
    frontendErrorRedirect: process.env.AUTH_ERROR_REDIRECT_PATH || "/login",
    oauthStateTtlMs: parseInt(process.env.AUTH_OAUTH_STATE_TTL_MS || "600000", 10),
    emailVerificationTtlMs: parseInt(process.env.AUTH_EMAIL_VERIFICATION_TTL_MS || `${24 * 60 * 60 * 1000}`, 10),
    emailVerificationPath: process.env.AUTH_EMAIL_VERIFICATION_PATH || "/verify-email",
    passwordResetTtlMs: parseInt(process.env.AUTH_PASSWORD_RESET_TTL_MS || `${60 * 60 * 1000}`, 10),
    passwordResetPath: process.env.AUTH_PASSWORD_RESET_PATH || "/reset-password",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE,
    hashSecret: process.env.VNPAY_HASH_SECRET,
    url: process.env.VNPAY_URL,
    returnUrl: process.env.VNPAY_RETURN_URL,
  },
  ai: {
    provider: process.env.AI_PROVIDER || "gemini",
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || "gpt-4o-mini",
    mockMode: process.env.AI_MOCK_MODE === "true",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || `${backendUrl}/api/auth/google/callback`,
  },
};

export default config;
