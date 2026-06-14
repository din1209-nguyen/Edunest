import request from "supertest";
import { describe, test, expect, beforeAll, beforeEach, afterAll, afterEach } from "@jest/globals";
import { initTestApp, resetDatabase, closeTestApp } from "./setup/testEnvironment.js";
import {
  createChapter,
  createCourse,
  createLesson,
  freeEnroll,
  registerUser,
} from "./helpers/testHelper.js";
import { validateLessonExerciseOutput } from "../src/services/aiService.js";

let app;
let adminCookie;
let userCookie;
let otherUserCookie;
let courseId;
let lessonId;

beforeAll(async () => {
  app = await initTestApp();
});

afterAll(async () => {
  await closeTestApp();
});

afterEach(async () => {
  await resetDatabase();
});

async function setupPdfLesson({ enrollUser = true, lessonData = {} } = {}) {
  process.env.AI_MOCK_MODE = "true";

  const admin = await registerUser({
    name: "Admin",
    email: `admin${Date.now()}@test.com`,
    password: "Test1234",
    role: "admin",
  });
  adminCookie = admin.cookie;

  const user = await registerUser({
    name: "Student",
    email: `student${Date.now()}@test.com`,
    password: "Test1234",
    role: "user",
  });
  userCookie = user.cookie;

  const otherUser = await registerUser({
    name: "Other Student",
    email: `other${Date.now()}@test.com`,
    password: "Test1234",
    role: "user",
  });
  otherUserCookie = otherUser.cookie;

  const course = await createCourse(adminCookie, {
    title: `AI PDF Course ${Date.now()}`,
    price: 0,
    isFree: true,
  });
  courseId = course.courseId;

  const chapter = await createChapter(adminCookie, courseId, {
    title: "PDF Chapter",
  });

  const lesson = await createLesson(adminCookie, chapter.chapterId, {
    title: "PDF Lesson",
    type: "document",
    documentType: "pdf",
    documentUrl: "https://example.com/lesson.pdf",
    ...lessonData,
  });
  lessonId = lesson.lessonId;

  if (enrollUser) {
    await freeEnroll(userCookie, courseId);
  }
}

describe("AI PDF exercise generation", () => {
  beforeEach(async () => {
    await setupPdfLesson();
  });

  test("200 - enrolled student can generate a session-only AI exercise", async () => {
    const res = await request(app)
      .post(`/api/ai/lessons/${lessonId}/exercises/generate`)
      .set("Cookie", userCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.exercise._id).toMatch(/^ai-/);
    expect(res.body.data.exercise.isAiGenerated).toBe(true);
    expect(res.body.data.exercise.questions).toHaveLength(5);
    expect(res.body.data.exercise.questions[0].options).toHaveLength(4);
    expect(res.body.data.exercise.questions[0].correctAnswers).toHaveLength(1);
    expect(res.body.data.quota.used).toBe(1);
    expect(res.body.data.quota.remaining).toBe(4);
  });

  test("403 - student must be enrolled in the course", async () => {
    const res = await request(app)
      .post(`/api/ai/lessons/${lessonId}/exercises/generate`)
      .set("Cookie", otherUserCookie);

    expect(res.status).toBe(403);
  });

  test("400 - lesson must have a PDF document", async () => {
    await resetDatabase();
    await setupPdfLesson({
      lessonData: {
        type: "video",
        documentType: "none",
        documentUrl: "",
      },
    });

    const res = await request(app)
      .post(`/api/ai/lessons/${lessonId}/exercises/generate`)
      .set("Cookie", userCookie);

    expect(res.status).toBe(400);
  });

  test("429 - quota allows only 5 generations per student per day", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post(`/api/ai/lessons/${lessonId}/exercises/generate`)
        .set("Cookie", userCookie);
      expect(res.status).toBe(200);
    }

    const limited = await request(app)
      .post(`/api/ai/lessons/${lessonId}/exercises/generate`)
      .set("Cookie", userCookie);

    expect(limited.status).toBe(429);
    expect(limited.body.code).toBe("AI_DAILY_LIMIT_REACHED");
    expect(limited.body.data.quota.remaining).toBe(0);

    await freeEnroll(otherUserCookie, courseId);

    const otherUserRes = await request(app)
      .post(`/api/ai/lessons/${lessonId}/exercises/generate`)
      .set("Cookie", otherUserCookie);

    expect(otherUserRes.status).toBe(200);
    expect(otherUserRes.body.data.quota.used).toBe(1);
  });

  test("502 path - AI output validation rejects malformed questions", () => {
    expect(() =>
      validateLessonExerciseOutput({
        title: "Bad AI Exercise",
        questions: [
          {
            questionText: "Missing enough options",
            options: ["A", "B"],
            correctAnswers: ["A"],
            explanation: "Bad shape",
            points: 1,
          },
        ],
      }),
    ).toThrow("AI tra du lieu bai tap khong dung schema");
  });
});
