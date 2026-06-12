import request from "supertest";
import User from "../../src/models/User.js";

let app;

export function setApp(appInstance) {
  app = appInstance;
}

export function getApp() {
  return app;
}

export async function registerUser(userData = {}) {
  const defaults = {
    name: "Test User",
    email: `test${Date.now()}@test.com`,
    password: "Test1234",
    role: "user",
  };
  const data = { ...defaults, ...userData };

  const res = await request(app)
    .post("/api/auth/register")
    .send(data);

  let cookie = res.headers["set-cookie"]?.join("; ") || "";

  if (res.body?.verificationRequired) {
    const user = await User.findOne({ email: data.email }).select(
      "+emailVerificationToken +emailVerificationExpiresAt"
    );

    if (user?.emailVerificationToken) {
      await request(app)
        .get("/api/auth/verify-email")
        .query({ token: user.emailVerificationToken });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: data.email, password: data.password });

      cookie = loginRes.headers["set-cookie"]?.join("; ") || cookie;

      return {
        body: loginRes.body,
        status: loginRes.status,
        cookie,
        userId: loginRes.body?.data?.user?._id || res.body?.data?.user?._id,
        ...(loginRes.body?.data || {}),
      };
    }
  }

  return {
    body: res.body,
    status: res.status,
    cookie,
    userId: res.body?.data?.user?._id,
    ...(res.body?.data || {}),
  };
}

export async function loginUser(email, password) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });

  return {
    body: res.body,
    status: res.status,
    cookie: res.headers["set-cookie"]?.join("; ") || "",
    userId: res.body?.data?.user?._id,
    ...(res.body?.data || {}),
  };
}

export async function createCourse(authorCookie, courseData = {}) {
  const defaults = {
    title: "Test Course",
    description: "Test course description",
    price: 100000,
    level: "beginner",
    category: "Grammar",
  };
  const res = await request(app)
    .post("/api/teacher/courses")
    .set("Cookie", authorCookie)
    .send({ ...defaults, ...courseData });

  return {
    body: res.body,
    status: res.status,
    courseId: res.body?.data?._id,
    ...(res.body?.data || {}),
  };
}

export async function createChapter(authorCookie, courseId, chapterData = {}) {
  const defaults = {
    title: "Test Chapter",
    description: "Test chapter description",
  };
  const res = await request(app)
    .post(`/api/teacher/courses/${courseId}/chapters`)
    .set("Cookie", authorCookie)
    .send({ ...defaults, ...chapterData });

  return {
    body: res.body,
    status: res.status,
    chapterId: res.body?.data?._id,
    ...(res.body?.data || {}),
  };
}

export async function createLesson(authorCookie, chapterId, lessonData = {}) {
  const defaults = {
    title: "Test Lesson",
    type: "video",
  };
  const res = await request(app)
    .post(`/api/teacher/chapters/${chapterId}/lessons`)
    .set("Cookie", authorCookie)
    .send({ ...defaults, ...lessonData });

  return {
    body: res.body,
    status: res.status,
    lessonId: res.body?.data?._id,
    ...(res.body?.data || {}),
  };
}

export async function addToCart(userCookie, courseId) {
  const res = await request(app)
    .post("/api/cart/items")
    .set("Cookie", userCookie)
    .send({ courseId });

  return { body: res.body, status: res.status };
}

export async function getCart(userCookie) {
  const res = await request(app)
    .get("/api/cart")
    .set("Cookie", userCookie);

  return { body: res.body, status: res.status, data: res.body?.data };
}

export async function freeEnroll(userCookie, courseId) {
  const res = await request(app)
    .post(`/api/enrollments/${courseId}/free-enroll`)
    .set("Cookie", userCookie);

  return { body: res.body, status: res.status };
}

export async function completeLesson(userCookie, courseId, lessonId) {
  const res = await request(app)
    .post(`/api/enrollments/${courseId}/lessons/${lessonId}/complete`)
    .set("Cookie", userCookie);

  return { body: res.body, status: res.status };
}
