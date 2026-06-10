import crypto from "crypto";
import {
  dangKy,
  dangNhap,
  refreshToken,
  layThongTin,
  capNhatProfile,
  doiMatKhau,
  revokeToken,
  googleLogin,
  xacMinhEmail,
  guiLaiXacMinhEmail,
  yeuCauDatLaiMatKhau,
  datLaiMatKhau,
  decodeRefreshSessionId,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  revokeSessionByRefreshToken,
} from "../services/authService.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
  resendVerificationSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../utils/authValidation.js";
import config from "../config/index.js";

function buildCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: config.auth.secureCookies,
    sameSite: config.auth.sameSite,
    domain: config.auth.cookieDomain || undefined,
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  };
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(
    config.auth.accessCookieName,
    accessToken,
    buildCookieOptions(15 * 60 * 1000),
  );
  res.cookie(
    config.auth.refreshCookieName,
    refreshToken,
    buildCookieOptions(7 * 24 * 60 * 60 * 1000),
  );
}

function getRequestSessionMeta(req) {
  return {
    userAgent: req.get("user-agent") || "",
    ip: req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "",
  };
}

function clearAuthCookies(res) {
  res.clearCookie(config.auth.accessCookieName, buildCookieOptions());
  res.clearCookie(config.auth.refreshCookieName, buildCookieOptions());
  res.clearCookie(config.auth.oauthStateCookieName, buildCookieOptions());
  res.clearCookie(config.auth.oauthRedirectCookieName, buildCookieOptions());
  res.clearCookie(config.auth.oauthRedirectOriginCookieName, buildCookieOptions());
}

function buildFrontendRedirect(targetPath, params = {}, originOverride) {
  const baseUrl = originOverride || config.cors.origin;
  const url = new URL(targetPath, baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

function buildAuthResponse(result, message) {
  return {
    success: true,
    message,
    data: {
      user: result.user,
      auth: {
        accessTokenExpiresIn: config.jwt.accessExpiresIn,
        refreshTokenExpiresIn: config.jwt.refreshExpiresIn,
        tokenType: "Bearer",
      },
    },
  };
}

function buildPendingVerificationResponse(result) {
  return {
    success: true,
    message: result.emailDeliveryFailed
      ? `Đăng ký thành công nhưng chưa gửi được email xác minh: ${result.emailDeliveryMessage}`
      : "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.",
    verificationRequired: true,
    data: {
      user: result.user,
      auth: {
        accessTokenExpiresIn: config.jwt.accessExpiresIn,
        refreshTokenExpiresIn: config.jwt.refreshExpiresIn,
        tokenType: "Bearer",
      },
      email: result.user.email,
      emailDeliveryFailed: result.emailDeliveryFailed,
      emailDeliveryMessage: result.emailDeliveryMessage,
    },
  };
}

function getDefaultFrontendSuccessPath(user) {
  if (user?.isEmailVerified === false) {
    return config.auth.emailVerificationPath;
  }

  if (user?.role === "admin") {
    return "/admin/dashboard";
  }

  return "/teacher/dashboard";
}

function buildValidationError(parsed) {
  const error = new Error(
    parsed.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", "),
  );
  error.statusCode = 400;
  return error;
}

async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(buildValidationError(parsed));
    }

    const result = await dangKy(parsed.data, getRequestSessionMeta(req));

    if (!result.verificationRequired) {
      setAuthCookies(res, result.accessToken, result.refreshToken);
      return res.status(201).json({
        ...buildAuthResponse(result, "Đăng ký thành công"),
        verificationRequired: false,
      });
    }

    clearAuthCookies(res);
    res.status(201).json(buildPendingVerificationResponse(result));
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(buildValidationError(parsed));
    }

    const { email, password } = parsed.data;
    const result = await dangNhap(email, password, getRequestSessionMeta(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json(buildAuthResponse(result, "Đăng nhập thành công"));
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshTokenFromCookie = req.cookies?.[config.auth.refreshCookieName];
    const refreshTokenFromBody = req.body?.refreshToken;
    const token = refreshTokenFromCookie || refreshTokenFromBody;

    if (!token) {
      clearAuthCookies(res);
      return res.status(400).json({
        success: false,
        message: "Không có phiên đăng nhập hợp lệ",
        code: "AUTH_SESSION_MISSING",
      });
    }

    const parsed = refreshTokenSchema.safeParse({ refreshToken: token });
    if (!parsed.success) {
      return next(buildValidationError(parsed));
    }

    const result = await refreshToken(parsed.data.refreshToken, getRequestSessionMeta(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json(buildAuthResponse(result, "Token đã được làm mới"));
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await layThongTin(req.user.userId);

    res.status(200).json({
      success: true,
      message: "Lấy thông tin thành công",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(buildValidationError(parsed));
    }

    const user = await capNhatProfile(req.user.userId, parsed.data);

    res.status(200).json({
      success: true,
      message: "Cập nhật profile thành công",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(buildValidationError(parsed));
    }

    const { currentPassword, newPassword } = parsed.data;
    await doiMatKhau(req.user.userId, currentPassword, newPassword);
    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
    });
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(buildValidationError(parsed));
    }

    await yeuCauDatLaiMatKhau(parsed.data.email);

    res.status(200).json({
      success: true,
      message: "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
    });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(buildValidationError(parsed));
    }

    await datLaiMatKhau(parsed.data.token, parsed.data.newPassword);
    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.[config.auth.refreshCookieName] || req.body?.refreshToken;

    if (token) {
      try {
        await revokeSessionByRefreshToken(token);
      } catch {
        // Bỏ qua token truy cập không hợp lệ để vẫn xóa cookie sạch sẽ
      }
    }

    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    next(error);
  }
}

async function getSessions(req, res, next) {
  try {
    const refreshToken = req.cookies?.[config.auth.refreshCookieName];
    const currentSessionId = refreshToken ? decodeRefreshSessionId(refreshToken) : null;
    const sessions = await listSessions(req.user.userId, currentSessionId);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách phiên đăng nhập thành công",
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
}

async function deleteSession(req, res, next) {
  try {
    const session = await revokeSession(req.user.userId, req.params.sessionId);
    const refreshToken = req.cookies?.[config.auth.refreshCookieName];
    const currentSessionId = refreshToken ? decodeRefreshSessionId(refreshToken) : null;

    if (session._id === currentSessionId) {
      clearAuthCookies(res);
    }

    res.status(200).json({
      success: true,
      message: "Đã đăng xuất phiên đăng nhập",
      data: { session },
    });
  } catch (error) {
    next(error);
  }
}

async function deleteSessions(req, res, next) {
  try {
    const refreshToken = req.cookies?.[config.auth.refreshCookieName];
    const currentSessionId = refreshToken ? decodeRefreshSessionId(refreshToken) : null;
    const scope = req.query?.scope || req.body?.scope || "others";

    if (scope === "all") {
      await revokeToken(req.user.userId);
      clearAuthCookies(res);

      return res.status(200).json({
        success: true,
        message: "Đã đăng xuất tất cả phiên đăng nhập",
        data: { revokedCurrentSession: true },
      });
    }

    const result = await revokeOtherSessions(req.user.userId, currentSessionId);

    res.status(200).json({
      success: true,
      message: "Đã đăng xuất các thiết bị khác",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

function makeCookieOptions(overrides = {}) {
  return {
    httpOnly: true,
    secure: config.auth.secureCookies,
    sameSite: config.auth.sameSite,
    domain: config.auth.cookieDomain || undefined,
    path: "/",
    ...overrides,
  };
}

async function resendVerification(req, res, next) {
  try {
    const parsed = resendVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(buildValidationError(parsed));
    }

    const result = await guiLaiXacMinhEmail(parsed.data.email);

    res.status(200).json({
      success: true,
      message: result.alreadyVerified
        ? "Email này đã được xác minh trước đó. Bạn có thể đăng nhập ngay."
        : result.emailDeliveryFailed
          ? `Đã tạo lại liên kết xác minh nhưng chưa gửi được email: ${result.emailDeliveryMessage}`
          : "Đã gửi lại email xác minh. Vui lòng kiểm tra hộp thư của bạn.",
      data: {
        user: result.user,
        alreadyVerified: result.alreadyVerified,
        emailDeliveryFailed: result.emailDeliveryFailed,
        emailDeliveryMessage: result.emailDeliveryMessage,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const parsed = verifyEmailSchema.safeParse({ token: req.query?.token });
    if (!parsed.success) {
      return next(buildValidationError(parsed));
    }

    const user = await xacMinhEmail(parsed.data.token);

    res.status(200).json({
      success: true,
      message: "Xác minh email thành công",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

async function googleRedirect(req, res, next) {
  try {
    const { google, auth } = config;
    const redirect = req.query?.redirect;
    const redirectOrigin = req.query?.redirect_origin;
    const safeRedirectOrigin =
      typeof redirectOrigin === "string" && /^https?:\/\/localhost(?::\d+)?$/i.test(redirectOrigin)
        ? redirectOrigin
        : config.cors.origin;

    if (!google.clientId) {
      const redirectUrl = new URL(`${safeRedirectOrigin}/login`);
      redirectUrl.searchParams.set("oauth_error", "not_configured");
      return res.redirect(redirectUrl.toString());
    }

    const state = crypto.randomBytes(32).toString("hex");

    const cookieOptions = makeCookieOptions({
      maxAge: auth.oauthStateTtlMs,
    });

    res.cookie(auth.oauthStateCookieName, state, cookieOptions);

    if (typeof redirect === "string" && redirect.startsWith("/")) {
      res.cookie(auth.oauthRedirectCookieName, redirect, cookieOptions);
    }

    res.cookie(auth.oauthRedirectOriginCookieName, safeRedirectOrigin, cookieOptions);

    const params = new URLSearchParams({
      client_id: google.clientId,
      redirect_uri: google.callbackUrl,
      response_type: "code",
      scope: "email profile openid",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  } catch (error) {
    next(error);
  }
}

async function googleCallback(req, res, next) {
  let redirectOrigin = config.cors.origin;

  try {
    const { google, auth } = config;
    const { code, state, error: googleError } = req.query;
    const savedState = req.cookies?.[auth.oauthStateCookieName];
    const redirectPath = req.cookies?.[auth.oauthRedirectCookieName];
    redirectOrigin = req.cookies?.[auth.oauthRedirectOriginCookieName] || config.cors.origin;

    clearAuthCookies(res);

    if (googleError) {
      return res.redirect(
        buildFrontendRedirect(auth.frontendErrorRedirect, { oauth_error: googleError }, redirectOrigin),
      );
    }

    if (!code) {
      return res.redirect(
        buildFrontendRedirect(auth.frontendErrorRedirect, { oauth_error: "no_code" }, redirectOrigin),
      );
    }

    if (!savedState || state !== savedState) {
      return res.redirect(
        buildFrontendRedirect(auth.frontendErrorRedirect, { oauth_error: "invalid_state" }, redirectOrigin),
      );
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: google.clientId,
        client_secret: google.clientSecret,
        redirect_uri: google.callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return res.redirect(
        buildFrontendRedirect(auth.frontendErrorRedirect, { oauth_error: "token_exchange_failed" }, redirectOrigin),
      );
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoRes.ok) {
      return res.redirect(
        buildFrontendRedirect(auth.frontendErrorRedirect, { oauth_error: "user_info_failed" }, redirectOrigin),
      );
    }

    const profile = await userInfoRes.json();

    if (!profile.email) {
      return res.redirect(
        buildFrontendRedirect(auth.frontendErrorRedirect, { oauth_error: "no_email" }, redirectOrigin),
      );
    }

    const result = await googleLogin(
      profile.sub,
      profile.email,
      profile.name,
      profile.picture,
      getRequestSessionMeta(req),
    );

    setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.redirect(
      buildFrontendRedirect(redirectPath || getDefaultFrontendSuccessPath(result.user), {}, redirectOrigin),
    );
  } catch (error) {
    return res.redirect(
      buildFrontendRedirect(config.auth.frontendErrorRedirect, { oauth_error: "server_error" }, redirectOrigin),
    );
  }
}

export {
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
};
