import request from "supertest";
import { describe, test, expect, beforeAll, afterAll, afterEach, beforeEach } from "@jest/globals";
import { initTestApp, resetDatabase, closeTestApp } from "./setup/testEnvironment.js";
import { registerUser } from "./helpers/testHelper.js";

let app;
let adminToken;
let userToken;
let adminId;
let userId;
let freeCourseId;
let paidCourseId;
let lessonId1;
let lessonId2;

beforeAll(async () => {
  app = await initTestApp();
});

afterAll(async () => {
  await closeTestApp();
});

afterEach(async () => {
  await resetDatabase();
});

async function setupData() {
  const adminRes = await request(app)
    .post("/api/auth/register")
    .send({ name: "Admin", email: `a${Date.now()}@test.com`, password: "Test1234", role: "admin" });
  adminToken = adminRes.headers["set-cookie"]?.join("; ") || "";
  adminId = adminRes.body.data.user._id;

  const userRes = await registerUser({
    name: "User",
    email: `u${Date.now()}@test.com`,
    password: "Test1234",
    role: "user",
  });
  userToken = userRes.cookie;
  userId = userRes.userId;

  const freeCourse = await request(app)
    .post("/api/teacher/courses")
    .set("Cookie", adminToken)
    .send({
      title: "Free Course",
      description: "Free course description",
      price: 0,
      level: "beginner",
      category: "Grammar",
      isFree: true,
    });
  freeCourseId = freeCourse.body.data?._id ?? freeCourse.body.data?.course?._id;

  const paidCourse = await request(app)
    .post("/api/teacher/courses")
    .set("Cookie", adminToken)
    .send({
      title: "Paid Course",
      description: "Paid course description",
      price: 100000,
      level: "intermediate",
      category: "Vocabulary",
      isFree: false,
    });
  paidCourseId = paidCourse.body.data?._id ?? paidCourse.body.data?.course?._id;

  const chapter = await request(app)
    .post(`/api/teacher/courses/${freeCourseId}/chapters`)
    .set("Cookie", adminToken)
    .send({ title: "Chapter 1" });

  const chapterId = chapter.body.data?._id ?? chapter.body.data?.chapter?._id;

  const lesson1 = await request(app)
    .post(`/api/teacher/chapters/${chapterId}/lessons`)
    .set("Cookie", adminToken)
    .send({ title: "Lesson 1", type: "video" });
  lessonId1 = lesson1.body.data?._id ?? lesson1.body.data?.lesson?._id;

  const lesson2 = await request(app)
    .post(`/api/teacher/chapters/${chapterId}/lessons`)
    .set("Cookie", adminToken)
    .send({ title: "Lesson 2", type: "video" });
  lessonId2 = lesson2.body.data?._id ?? lesson2.body.data?.lesson?._id;
}

describe("Enrollment & Progress Tests", () => {
  beforeEach(async () => {
    await setupData();
  });

  describe("POST /api/enrollments/:courseId/free-enroll", () => {
    test("201 - User can enroll in a free course", async () => {
      const res = await request(app)
        .post(`/api/enrollments/${freeCourseId}/free-enroll`)
        .set("Cookie", userToken);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.enrollment.progress).toBe(0);
    });

    test("400 - Cannot enroll twice in the same free course", async () => {
      await request(app)
        .post(`/api/enrollments/${freeCourseId}/free-enroll`)
        .set("Cookie", userToken);

      const res = await request(app)
        .post(`/api/enrollments/${freeCourseId}/free-enroll`)
        .set("Cookie", userToken);

      expect(res.status).toBe(409);
    });

    test("400 - Cannot free enroll in a paid course", async () => {
      const res = await request(app)
        .post(`/api/enrollments/${paidCourseId}/free-enroll`)
        .set("Cookie", userToken);

      expect(res.status).toBe(400);
    });

    test("401 - Cannot enroll without authentication", async () => {
      const res = await request(app)
        .post(`/api/enrollments/${freeCourseId}/free-enroll`);

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/enrollments/my-courses", () => {
    test("200 - User can get their enrolled courses", async () => {
      await request(app)
        .post(`/api/enrollments/${freeCourseId}/free-enroll`)
        .set("Cookie", userToken);

      const res = await request(app)
        .get("/api/enrollments/my-courses")
        .set("Cookie", userToken);

      expect(res.status).toBe(200);
      expect(res.body.data.enrollments.length).toBeGreaterThan(0);
    });

    test("200 - Empty list for user with no enrollments", async () => {
      const newUserRes = await registerUser({
        name: "New User",
        email: `nu${Date.now()}@test.com`,
        password: "Test1234",
        role: "user",
      });
      const newToken = newUserRes.cookie;

      const res = await request(app)
        .get("/api/enrollments/my-courses")
        .set("Cookie", newToken);

      expect(res.status).toBe(200);
      expect(res.body.data.enrollments.length).toBe(0);
    });
  });

  describe("POST /api/enrollments/:courseId/lessons/:lessonId/complete", () => {
    test("200 - User can mark lesson as complete", async () => {
      const newUserRes = await registerUser({
        name: "Progress User",
        email: `pu${Date.now()}@test.com`,
        password: "Test1234",
        role: "user",
      });
      const newToken = newUserRes.cookie;

      await request(app)
        .post(`/api/enrollments/${freeCourseId}/free-enroll`)
        .set("Cookie", newToken);

      const res = await request(app)
        .post(`/api/enrollments/${freeCourseId}/lessons/${lessonId1}/complete`)
        .set("Cookie", newToken);

      expect(res.status).toBe(200);
      expect(res.body.data.progress.progress).toBeGreaterThan(0);
    });

    test("200 - Re-completing same lesson returns same progress", async () => {
      const newUserRes = await registerUser({
        name: "Retest User",
        email: `ru${Date.now()}@test.com`,
        password: "Test1234",
        role: "user",
      });
      const newToken = newUserRes.cookie;

      await request(app)
        .post(`/api/enrollments/${freeCourseId}/free-enroll`)
        .set("Cookie", newToken);

      await request(app)
        .post(`/api/enrollments/${freeCourseId}/lessons/${lessonId1}/complete`)
        .set("Cookie", newToken);

      const res2 = await request(app)
        .post(`/api/enrollments/${freeCourseId}/lessons/${lessonId1}/complete`)
        .set("Cookie", newToken);

      expect(res2.status).toBe(200);
      expect(res2.body.data.progress.lessonMarked).toBe(false);
    });

    test("200 - Progress reaches 100% when all lessons complete", async () => {
      const newUserRes = await registerUser({
        name: "Cert User",
        email: `cu${Date.now()}@test.com`,
        password: "Test1234",
        role: "user",
      });
      const newToken = newUserRes.cookie;

      await request(app)
        .post(`/api/enrollments/${freeCourseId}/free-enroll`)
        .set("Cookie", newToken);

      await request(app)
        .post(`/api/enrollments/${freeCourseId}/lessons/${lessonId1}/complete`)
        .set("Cookie", newToken);

      const res2 = await request(app)
        .post(`/api/enrollments/${freeCourseId}/lessons/${lessonId2}/complete`)
        .set("Cookie", newToken);

      expect(res2.status).toBe(200);
      expect(res2.body.data.progress.progress).toBe(100);
      expect(res2.body.data.progress.completedAt).toBeDefined();
    });
  });
});
