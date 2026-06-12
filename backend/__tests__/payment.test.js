import request from "supertest";
import { describe, test, expect, beforeAll, beforeEach, afterAll, afterEach } from "@jest/globals";
import { initTestApp, resetDatabase, closeTestApp } from "./setup/testEnvironment.js";
import { registerUser } from "./helpers/testHelper.js";
import config from "../src/config/index.js";
import Payment from "../src/models/Payment.js";
import Enrollment from "../src/models/Enrollment.js";
import Course from "../src/models/Course.js";
import { createSecureHash } from "../src/services/vnpayService.js";

let app;
let adminToken;
let userToken;
let courseId;

beforeAll(async () => {
  process.env.FRONTEND_URL = "http://localhost:3001";
  config.vnpay.tmnCode = "TEST_TMN";
  config.vnpay.hashSecret = "TEST_HASH_SECRET";
  config.vnpay.url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  config.vnpay.returnUrl = "http://localhost:5000/api/payments/vnpay/return";
  app = await initTestApp();
});

afterAll(async () => {
  await closeTestApp();
});

afterEach(async () => {
  await resetDatabase();
});

async function setupPaidCourse() {
  const adminRes = await request(app)
    .post("/api/auth/register")
    .send({ name: "Admin", email: `a${Date.now()}@test.com`, password: "Test1234", role: "admin" });
  adminToken = adminRes.headers["set-cookie"]?.join("; ") || "";

  const userRes = await registerUser({
    name: "User",
    email: `u${Date.now()}@test.com`,
    password: "Test1234",
    role: "user",
  });
  userToken = userRes.cookie;

  const courseRes = await request(app)
    .post("/api/teacher/courses")
    .set("Cookie", adminToken)
    .send({
      title: "Paid Course",
      description: "This is a paid course with enough detail",
      price: 100000,
      level: "beginner",
      category: "Grammar",
    });
  courseId = courseRes.body.data._id;
}

async function createVNPayPaymentForCart(token) {
  await request(app)
    .post("/api/cart/items")
    .set("Cookie", token)
    .send({ courseId });

  const paymentRes = await request(app)
    .post("/api/payments/vnpay/create")
    .set("Cookie", token);

  expect(paymentRes.status).toBe(201);
  return paymentRes.body.data;
}

function getVNPayParams(vnpayUrl) {
  const url = new URL(vnpayUrl);
  return Object.fromEntries(url.searchParams.entries());
}

function createSignedReturnQuery(vnpayUrl, overrides = {}) {
  const params = {
    ...getVNPayParams(vnpayUrl),
    vnp_ResponseCode: "00",
    vnp_TransactionStatus: "00",
    vnp_TransactionNo: "14123456",
    vnp_PayDate: "20260610123000",
    ...overrides,
  };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;
  params.vnp_SecureHash = createSecureHash(params, config.vnpay.hashSecret);
  return params;
}

describe("Payment Mock Success Tests", () => {
  beforeEach(async () => {
    await setupPaidCourse();
  });

  describe("POST /api/cart/items", () => {
    test("201 - User can add course to cart", async () => {
      const res = await request(app)
        .post("/api/cart/items")
        .set("Cookie", userToken)
        .send({ courseId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test("409 - Cannot add same course twice to cart", async () => {
      await request(app)
        .post("/api/cart/items")
        .set("Cookie", userToken)
        .send({ courseId });

      const res = await request(app)
        .post("/api/cart/items")
        .set("Cookie", userToken)
        .send({ courseId });

      expect(res.status).toBe(409);
    });

    test("401 - Cannot add to cart without authentication", async () => {
      const res = await request(app)
        .post("/api/cart/items")
        .send({ courseId });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/cart", () => {
    test("200 - User can view their cart", async () => {
      await request(app)
        .post("/api/cart/items")
        .set("Cookie", userToken)
        .send({ courseId });

      const res = await request(app)
        .get("/api/cart")
        .set("Cookie", userToken);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.totalPrice).toBeGreaterThan(0);
    });

    test("200 - Empty cart returns empty items", async () => {
      const newUserRes = await registerUser({
        name: "Empty Cart",
        email: `ec${Date.now()}@test.com`,
        password: "Test1234",
        role: "user",
      });
      const newToken = newUserRes.cookie;

      const res = await request(app)
        .get("/api/cart")
        .set("Cookie", newToken);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });
  });

  describe("POST /api/payments/mock-success", () => {
    test("201 - Mock payment creates enrollment", async () => {
      await request(app)
        .post("/api/cart/items")
        .set("Cookie", userToken)
        .send({ courseId });

      const paymentRes = await request(app)
        .post("/api/payments/create")
        .set("Cookie", userToken)
        .send({ method: "mock" });

      expect(paymentRes.status).toBe(201);
      const paymentId = paymentRes.body.data.payment._id;

      const mockRes = await request(app)
        .post("/api/payments/mock-success")
        .set("Cookie", userToken)
        .send({ paymentId });

      expect(mockRes.status).toBe(200);
      expect(mockRes.body.success).toBe(true);
      expect(mockRes.body.data.payment.status).toBe("success");
    });

    test("200 - User is enrolled after mock payment", async () => {
      const newUserRes = await registerUser({
        name: "Enroll Test",
        email: `et${Date.now()}@test.com`,
        password: "Test1234",
        role: "user",
      });
      const newToken = newUserRes.cookie;

      await request(app)
        .post("/api/cart/items")
        .set("Cookie", newToken)
        .send({ courseId });

      const paymentRes = await request(app)
        .post("/api/payments/create")
        .set("Cookie", newToken)
        .send({ method: "mock" });
      const paymentId = paymentRes.body.data.payment._id;

      await request(app)
        .post("/api/payments/mock-success")
        .set("Cookie", newToken)
        .send({ paymentId });

      const enrollRes = await request(app)
        .get("/api/enrollments/my-courses")
        .set("Cookie", newToken);

      expect(enrollRes.status).toBe(200);
      expect(enrollRes.body.data.enrollments.some(
        (e) => e.course._id === courseId
      )).toBe(true);
    });

    test("404 - Mock success with invalid payment ID", async () => {
      const res = await request(app)
        .post("/api/payments/mock-success")
        .set("Cookie", userToken)
        .send({ paymentId: "invalid-id" });

      expect(res.status).toBe(400);
    });

    test("200 - Cart is cleared after successful payment", async () => {
      const newUserRes = await registerUser({
        name: "Cart Clear",
        email: `cc${Date.now()}@test.com`,
        password: "Test1234",
        role: "user",
      });
      const newToken = newUserRes.cookie;

      await request(app)
        .post("/api/cart/items")
        .set("Cookie", newToken)
        .send({ courseId });

      const paymentRes = await request(app)
        .post("/api/payments/create")
        .set("Cookie", newToken)
        .send({ method: "mock" });
      const paymentId = paymentRes.body.data.payment._id;

      await request(app)
        .post("/api/payments/mock-success")
        .set("Cookie", newToken)
        .send({ paymentId });

      const cartRes = await request(app)
        .get("/api/cart")
        .set("Cookie", newToken);

      expect(cartRes.status).toBe(200);
      expect(cartRes.body.data.items.length).toBe(0);
    });
  });

  describe("VNPay sandbox flow", () => {
    test("201 - VNPay payment URL contains signed sandbox params", async () => {
      const result = await createVNPayPaymentForCart(userToken);
      const url = new URL(result.vnpayUrl);

      expect(`${url.origin}${url.pathname}`).toBe(config.vnpay.url);
      expect(url.searchParams.get("vnp_TmnCode")).toBe(config.vnpay.tmnCode);
      expect(url.searchParams.get("vnp_TxnRef")).toBeTruthy();
      expect(url.searchParams.get("vnp_Amount")).toBe("10000000");
      expect(url.searchParams.get("vnp_ReturnUrl")).toBe(config.vnpay.returnUrl);
      expect(url.searchParams.get("vnp_SecureHash")).toBeTruthy();
    });

    test("302 - Valid VNPay callback enrolls user and clears cart", async () => {
      const result = await createVNPayPaymentForCart(userToken);
      const query = createSignedReturnQuery(result.vnpayUrl);

      const callbackRes = await request(app)
        .get("/api/payments/vnpay/return")
        .query(query);

      expect(callbackRes.status).toBe(302);
      expect(callbackRes.headers.location).toContain("success=true");
      expect(callbackRes.headers.location).toContain("method=vnpay");

      const payment = await Payment.findById(result.paymentId);
      expect(payment.status).toBe("success");
      expect(payment.transactionId).toBe(query.vnp_TxnRef);
      expect(payment.paymentData.vnpayTransactionNo).toBe(query.vnp_TransactionNo);

      const enrollment = await Enrollment.findOne({ student: payment.user, course: courseId });
      expect(enrollment).toBeTruthy();

      const cartRes = await request(app)
        .get("/api/cart")
        .set("Cookie", userToken);
      expect(cartRes.body.data.items.length).toBe(0);
    });

    test("302 - Invalid VNPay signature does not enroll user", async () => {
      const result = await createVNPayPaymentForCart(userToken);
      const query = createSignedReturnQuery(result.vnpayUrl);
      query.vnp_SecureHash = "invalid-signature";

      const callbackRes = await request(app)
        .get("/api/payments/vnpay/return")
        .query(query);

      expect(callbackRes.status).toBe(302);
      expect(callbackRes.headers.location).toContain("success=false");

      const payment = await Payment.findById(result.paymentId);
      expect(payment.status).toBe("pending");
      const enrollmentCount = await Enrollment.countDocuments({ course: courseId });
      expect(enrollmentCount).toBe(0);
    });

    test("302 - Amount mismatch marks payment failed and does not enroll", async () => {
      const result = await createVNPayPaymentForCart(userToken);
      const query = createSignedReturnQuery(result.vnpayUrl, {
        vnp_Amount: "1",
      });

      const callbackRes = await request(app)
        .get("/api/payments/vnpay/return")
        .query(query);

      expect(callbackRes.status).toBe(302);
      expect(callbackRes.headers.location).toContain("success=false");

      const payment = await Payment.findById(result.paymentId);
      expect(payment.status).toBe("failed");
      expect(payment.paymentData.vnpayFailureCode).toBe("AMOUNT_MISMATCH");
      const enrollmentCount = await Enrollment.countDocuments({ course: courseId });
      expect(enrollmentCount).toBe(0);
    });

    test("302 - Failed VNPay response marks payment failed", async () => {
      const result = await createVNPayPaymentForCart(userToken);
      const query = createSignedReturnQuery(result.vnpayUrl, {
        vnp_ResponseCode: "24",
        vnp_TransactionStatus: "02",
      });

      const callbackRes = await request(app)
        .get("/api/payments/vnpay/return")
        .query(query);

      expect(callbackRes.status).toBe(302);
      expect(callbackRes.headers.location).toContain("success=false");

      const payment = await Payment.findById(result.paymentId);
      expect(payment.status).toBe("failed");
      expect(payment.paymentData.vnpayFailureCode).toBe("24");
    });

    test("302 - Repeated success callback is idempotent", async () => {
      const result = await createVNPayPaymentForCart(userToken);
      const query = createSignedReturnQuery(result.vnpayUrl);

      await request(app)
        .get("/api/payments/vnpay/return")
        .query(query);
      await request(app)
        .get("/api/payments/vnpay/return")
        .query(query);

      const payment = await Payment.findById(result.paymentId);
      const enrollmentCount = await Enrollment.countDocuments({ student: payment.user, course: courseId });
      const course = await Course.findById(courseId);

      expect(payment.status).toBe("success");
      expect(enrollmentCount).toBe(1);
      expect(course.totalStudents).toBe(1);
    });
  });
});
