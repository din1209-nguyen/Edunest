import request from "supertest";
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
  jest,
} from "@jest/globals";
import { initTestApp, resetDatabase, closeTestApp } from "./setup/testEnvironment.js";
import User from "../src/models/User.js";
import AuthSession from "../src/models/AuthSession.js";
import config from "../src/config/index.js";

const VALID_PASSWORD = "Test1234";
const NEW_PASSWORD = "NewPass123";

let app;
let originalFetch;
let originalGoogleConfig;

beforeAll(async () => {
  originalFetch = global.fetch;
  originalGoogleConfig = { ...config.google };
  app = await initTestApp();
});

afterAll(async () => {
  global.fetch = originalFetch;
  Object.assign(config.google, originalGoogleConfig);
  await closeTestApp();
});

afterEach(async () => {
  jest.restoreAllMocks();
  global.fetch = originalFetch;
  Object.assign(config.google, originalGoogleConfig);
  await resetDatabase();
});

async function registerUser(overrides = {}, agent = request(app)) {
  return agent.post("/api/auth/register").send({
    name: "Test User",
    email: "user@test.com",
    password: VALID_PASSWORD,
    role: "user",
    ...overrides,
  });
}

async function verifyUserEmail(email) {
  const user = await User.findOne({ email }).select("+emailVerificationToken +emailVerificationExpiresAt");
  expect(user).toBeTruthy();
  expect(user.emailVerificationToken).toBeTruthy();

  const res = await request(app)
    .get("/api/auth/verify-email")
    .query({ token: user.emailVerificationToken });

  expect(res.status).toBe(200);
  return res;
}

async function loginUser(agent, email = "user@test.com", password = VALID_PASSWORD) {
  return agent.post("/api/auth/login").send({ email, password });
}

function hasSignedAccessCookie(res) {
  return (res.headers["set-cookie"] || []).some((cookie) =>
    cookie.startsWith(`${config.auth.accessCookieName}=ey`),
  );
}

function extractStateFromGoogleRedirect(res) {
  const location = res.headers.location;
  expect(location).toContain("accounts.google.com");
  return new URL(location).searchParams.get("state");
}

describe("Auth API Tests", () => {
  describe("POST /api/auth/register", () => {
    test("201 - Register user requires email verification and does not create an authenticated session", async () => {
      const res = await registerUser();

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.verificationRequired).toBe(true);
      expect(res.body.data.user.email).toBe("user@test.com");
      expect(res.body.data.auth.tokenType).toBe("Bearer");
      expect(hasSignedAccessCookie(res)).toBe(false);

      const user = await User.findOne({ email: "user@test.com" }).select("+emailVerificationToken");
      expect(user.emailVerificationToken).toBeTruthy();
      expect(user.isEmailVerified).toBe(false);
    });

    test("201 - Register admin can create an authenticated session", async () => {
      const res = await registerUser({
        name: "Admin Test",
        email: "admin@test.com",
        role: "admin",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe("admin");
      expect(res.body.verificationRequired).toBe(false);
      expect(hasSignedAccessCookie(res)).toBe(true);
    });

    test("409 - Duplicate email registration", async () => {
      await registerUser({ email: "dup@test.com" });

      const res = await registerUser({
        name: "User Two",
        email: "dup@test.com",
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    test("400 - Invalid email and weak password are rejected", async () => {
      const invalidEmail = await registerUser({ email: "not-an-email" });
      const weakPassword = await registerUser({ email: "weak@test.com", password: "test123" });

      expect(invalidEmail.status).toBe(400);
      expect(weakPassword.status).toBe(400);
    });
  });

  describe("Email verification", () => {
    test("200 - Valid verification token verifies the account", async () => {
      await registerUser({ email: "verify@test.com" });

      const res = await verifyUserEmail("verify@test.com");
      const user = await User.findOne({ email: "verify@test.com" }).select(
        "+emailVerificationToken +emailVerificationExpiresAt",
      );

      expect(res.body.success).toBe(true);
      expect(user.isEmailVerified).toBe(true);
      expect(user.emailVerificationToken).toBeNull();
      expect(user.emailVerificationExpiresAt).toBeNull();
    });

    test("400 - Missing, invalid, and expired verification tokens fail clearly", async () => {
      const missing = await request(app).get("/api/auth/verify-email");
      const invalid = await request(app).get("/api/auth/verify-email").query({ token: "invalid" });

      await registerUser({ email: "expired@test.com" });
      const user = await User.findOne({ email: "expired@test.com" }).select(
        "+emailVerificationToken +emailVerificationExpiresAt",
      );
      user.emailVerificationExpiresAt = new Date(Date.now() - 1000);
      await user.save({ validateBeforeSave: false });

      const expired = await request(app)
        .get("/api/auth/verify-email")
        .query({ token: user.emailVerificationToken });

      expect(missing.status).toBe(400);
      expect(invalid.status).toBe(400);
      expect(expired.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await registerUser({ email: "login@test.com" });
      await verifyUserEmail("login@test.com");
    });

    test("200 - Login with verified credentials sets auth cookies", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "login@test.com", password: VALID_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("login@test.com");
      expect(hasSignedAccessCookie(res)).toBe(true);
      expect(await AuthSession.countDocuments({ user: res.body.data.user._id, revokedAt: null })).toBe(1);
    });

    test("401 - Login with wrong password or unknown email fails", async () => {
      const wrongPassword = await request(app)
        .post("/api/auth/login")
        .send({ email: "login@test.com", password: "Wrong1234" });
      const unknownEmail = await request(app)
        .post("/api/auth/login")
        .send({ email: "missing@test.com", password: VALID_PASSWORD });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
    });

    test("403 - Unverified email cannot login", async () => {
      await registerUser({ email: "pending@test.com" });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "pending@test.com", password: VALID_PASSWORD });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("EMAIL_NOT_VERIFIED");
    });

    test("400 - Google-only account must login with Google", async () => {
      await User.create({
        name: "Google Only",
        email: "google-only@test.com",
        googleId: "google-only-id",
        isEmailVerified: true,
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "google-only@test.com", password: VALID_PASSWORD });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/refresh and logout", () => {
    test("200 - Refresh token rotates cookies and keeps session valid", async () => {
      const agent = request.agent(app);
      await registerUser({ email: "refresh@test.com" }, agent);
      await verifyUserEmail("refresh@test.com");
      const loginRes = await loginUser(agent, "refresh@test.com");

      expect(loginRes.status).toBe(200);
      const sessionBefore = await AuthSession.findOne({ revokedAt: null }).select("+refreshTokenHash");
      expect(sessionBefore).toBeTruthy();
      const previousHash = sessionBefore.refreshTokenHash;

      const refreshRes = await agent.post("/api/auth/refresh");
      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.user.email).toBe("refresh@test.com");
      expect(hasSignedAccessCookie(refreshRes)).toBe(true);
      const sessionAfter = await AuthSession.findById(sessionBefore._id).select("+refreshTokenHash");
      expect(sessionAfter.refreshTokenHash).not.toBe(previousHash);
      expect(sessionAfter.lastSeenAt.getTime()).toBeGreaterThanOrEqual(sessionBefore.lastSeenAt.getTime());

      const meAfterRefresh = await agent.get("/api/auth/me");
      expect(meAfterRefresh.status).toBe(200);
      expect(meAfterRefresh.body.data.user.email).toBe("refresh@test.com");
    });

    test("400 - Refresh without cookie fails with session missing code", async () => {
      const res = await request(app).post("/api/auth/refresh");

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("AUTH_SESSION_MISSING");
    });

    test("401 - Invalid refresh token fails", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "invalid-token" });

      expect(res.status).toBe(401);
    });

    test("200 - Logout clears cookies and blocks future refresh", async () => {
      const agent = request.agent(app);
      await registerUser({ email: "logout@test.com" }, agent);
      await verifyUserEmail("logout@test.com");
      await loginUser(agent, "logout@test.com");

      const logoutRes = await agent.post("/api/auth/logout");
      const refreshRes = await agent.post("/api/auth/refresh");

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
      expect(refreshRes.status).toBe(400);
      expect(await AuthSession.countDocuments({ revokedAt: null })).toBe(0);
    });

    test("200 - Sessions API lists and revokes device sessions independently", async () => {
      const firstAgent = request.agent(app);
      const secondAgent = request.agent(app);
      await registerUser({ email: "sessions@test.com" }, firstAgent);
      await verifyUserEmail("sessions@test.com");
      await loginUser(firstAgent, "sessions@test.com");
      await loginUser(secondAgent, "sessions@test.com");

      const listRes = await firstAgent.get("/api/auth/sessions");
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.sessions).toHaveLength(2);
      expect(listRes.body.data.sessions.filter((session) => session.isCurrent)).toHaveLength(1);

      const otherSession = listRes.body.data.sessions.find((session) => !session.isCurrent);
      const revokeRes = await firstAgent.delete(`/api/auth/sessions/${otherSession._id}`);
      const firstRefresh = await firstAgent.post("/api/auth/refresh");
      const secondRefresh = await secondAgent.post("/api/auth/refresh");

      expect(revokeRes.status).toBe(200);
      expect(firstRefresh.status).toBe(200);
      expect(secondRefresh.status).toBe(401);
    });

    test("200 - Revoke other sessions keeps current session active", async () => {
      const firstAgent = request.agent(app);
      const secondAgent = request.agent(app);
      await registerUser({ email: "others@test.com" }, firstAgent);
      await verifyUserEmail("others@test.com");
      await loginUser(firstAgent, "others@test.com");
      await loginUser(secondAgent, "others@test.com");

      const revokeOthers = await firstAgent.delete("/api/auth/sessions?scope=others");
      const firstRefresh = await firstAgent.post("/api/auth/refresh");
      const secondRefresh = await secondAgent.post("/api/auth/refresh");

      expect(revokeOthers.status).toBe(200);
      expect(revokeOthers.body.data.revokedCount).toBe(1);
      expect(firstRefresh.status).toBe(200);
      expect(secondRefresh.status).toBe(401);
    });
  });

  describe("POST /api/auth/change-password", () => {
    test("401 - Change password requires auth", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .send({ currentPassword: VALID_PASSWORD, newPassword: NEW_PASSWORD });

      expect(res.status).toBe(401);
    });

    test("400 - Wrong current password fails", async () => {
      const agent = request.agent(app);
      await registerUser({ email: "wrong-current@test.com" }, agent);
      await verifyUserEmail("wrong-current@test.com");
      await loginUser(agent, "wrong-current@test.com");

      const res = await agent
        .post("/api/auth/change-password")
        .send({ currentPassword: "Wrong1234", newPassword: NEW_PASSWORD });

      expect(res.status).toBe(400);
    });

    test("200 - Change password revokes current refresh token and requires login again", async () => {
      const agent = request.agent(app);
      await registerUser({ email: "change@test.com" }, agent);
      await verifyUserEmail("change@test.com");
      await loginUser(agent, "change@test.com");

      const changeRes = await agent
        .post("/api/auth/change-password")
        .send({ currentPassword: VALID_PASSWORD, newPassword: NEW_PASSWORD });
      const refreshRes = await agent.post("/api/auth/refresh");
      const activeSessionsAfterChange = await AuthSession.countDocuments({ revokedAt: null });
      const oldPasswordLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: "change@test.com", password: VALID_PASSWORD });
      const newPasswordLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: "change@test.com", password: NEW_PASSWORD });

      expect(changeRes.status).toBe(200);
      expect(refreshRes.status).toBe(400);
      expect(activeSessionsAfterChange).toBe(0);
      expect(oldPasswordLogin.status).toBe(401);
      expect(newPasswordLogin.status).toBe(200);
    });
  });

  describe("Forgot and reset password", () => {
    test("200 - Forgot password response is neutral for existing and missing emails", async () => {
      await registerUser({ email: "forgot@test.com" });

      const existing = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "forgot@test.com" });
      const missing = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "missing-forgot@test.com" });

      expect(existing.status).toBe(200);
      expect(missing.status).toBe(200);
      expect(existing.body.message).toBe(missing.body.message);
    });

    test("200 - Reset password changes password, clears token, and revokes old refresh tokens", async () => {
      const agent = request.agent(app);
      await registerUser({ email: "reset@test.com" }, agent);
      await verifyUserEmail("reset@test.com");
      await loginUser(agent, "reset@test.com");

      await request(app).post("/api/auth/forgot-password").send({ email: "reset@test.com" });
      const user = await User.findOne({ email: "reset@test.com" }).select(
        "+passwordResetToken +passwordResetExpiresAt",
      );
      expect(user.passwordResetToken).toBeTruthy();

      const resetRes = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: user.passwordResetToken, newPassword: NEW_PASSWORD });
      const refreshRes = await agent.post("/api/auth/refresh");
      const activeSessionsAfterReset = await AuthSession.countDocuments({ revokedAt: null });
      const newLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: "reset@test.com", password: NEW_PASSWORD });
      const usedTokenAgain = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: user.passwordResetToken, newPassword: "Again1234" });

      expect(resetRes.status).toBe(200);
      expect(refreshRes.status).toBe(401);
      expect(activeSessionsAfterReset).toBe(0);
      expect(newLogin.status).toBe(200);
      expect(usedTokenAgain.status).toBe(400);
    });

    test("400 - Expired reset token fails clearly", async () => {
      await registerUser({ email: "expired-reset@test.com" });
      await request(app).post("/api/auth/forgot-password").send({ email: "expired-reset@test.com" });
      const user = await User.findOne({ email: "expired-reset@test.com" }).select(
        "+passwordResetToken +passwordResetExpiresAt",
      );
      user.passwordResetExpiresAt = new Date(Date.now() - 1000);
      await user.save({ validateBeforeSave: false });

      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: user.passwordResetToken, newPassword: NEW_PASSWORD });

      expect(res.status).toBe(400);
    });
  });

  describe("Google OAuth", () => {
    test("302 - Missing Google config redirects to login with not_configured", async () => {
      config.google.clientId = "";

      const res = await request(app).get("/api/auth/google").query({
        redirect_origin: "http://localhost:3001",
      });

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("/login");
      expect(res.headers.location).toContain("oauth_error=not_configured");
    });

    test("302 - Invalid OAuth state redirects with invalid_state", async () => {
      config.google.clientId = "google-client";
      config.google.clientSecret = "google-secret";
      config.google.callbackUrl = "http://localhost:5000/api/auth/google/callback";
      const agent = request.agent(app);

      await agent.get("/api/auth/google").query({ redirect_origin: "http://localhost:3001" });
      const res = await agent
        .get("/api/auth/google/callback")
        .query({ code: "code", state: "bad-state" });

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("oauth_error=invalid_state");
    });

    test("302 - Token exchange failure redirects with token_exchange_failed", async () => {
      config.google.clientId = "google-client";
      config.google.clientSecret = "google-secret";
      config.google.callbackUrl = "http://localhost:5000/api/auth/google/callback";
      global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({}) }));
      const agent = request.agent(app);

      const start = await agent.get("/api/auth/google").query({ redirect_origin: "http://localhost:3001" });
      const state = extractStateFromGoogleRedirect(start);
      const res = await agent
        .get("/api/auth/google/callback")
        .query({ code: "code", state });

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("oauth_error=token_exchange_failed");
    });

    test("302 - User info failure redirects with user_info_failed", async () => {
      config.google.clientId = "google-client";
      config.google.clientSecret = "google-secret";
      config.google.callbackUrl = "http://localhost:5000/api/auth/google/callback";
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "google-access" }) })
        .mockResolvedValueOnce({ ok: false, json: async () => ({}) });
      const agent = request.agent(app);

      const start = await agent.get("/api/auth/google").query({ redirect_origin: "http://localhost:3001" });
      const state = extractStateFromGoogleRedirect(start);
      const res = await agent
        .get("/api/auth/google/callback")
        .query({ code: "code", state });

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("oauth_error=user_info_failed");
    });

    test("302 - Successful Google login creates a verified user session", async () => {
      config.google.clientId = "google-client";
      config.google.clientSecret = "google-secret";
      config.google.callbackUrl = "http://localhost:5000/api/auth/google/callback";
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "google-access" }) })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: "google-sub",
            email: "google@test.com",
            name: "Google User",
            picture: "https://example.com/avatar.png",
          }),
        });
      const agent = request.agent(app);

      const start = await agent
        .get("/api/auth/google")
        .query({ redirect: "/student/dashboard", redirect_origin: "http://localhost:3001" });
      const state = extractStateFromGoogleRedirect(start);
      const res = await agent
        .get("/api/auth/google/callback")
        .query({ code: "code", state });
      const user = await User.findOne({ email: "google@test.com" });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("http://localhost:3001/student/dashboard");
      expect(hasSignedAccessCookie(res)).toBe(true);
      expect(user).toBeTruthy();
      expect(user.role).toBe("user");
      expect(user.isEmailVerified).toBe(true);
    });
  });
});
