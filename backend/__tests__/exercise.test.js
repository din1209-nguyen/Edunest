import request from "supertest";
import { describe, test, expect, beforeAll, beforeEach, afterAll, afterEach } from "@jest/globals";
import { initTestApp, resetDatabase, closeTestApp } from "./setup/testEnvironment.js";
import { freeEnroll, registerUser } from "./helpers/testHelper.js";

let app;
let adminToken;
let userToken;
let courseId;
let chapterId;
let lessonId;
let exerciseId;

beforeAll(async () => {
  app = await initTestApp();
});

afterAll(async () => {
  await closeTestApp();
});

afterEach(async () => {
  await resetDatabase();
});

async function setupExercise() {
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
      title: "Grammar Course",
      description: "Learn grammar with enough detail",
      price: 0,
      isFree: true,
      level: "beginner",
      category: "Grammar",
    });
  courseId = courseRes.body.data._id;

  await freeEnroll(userToken, courseId);

  const chapterRes = await request(app)
    .post(`/api/teacher/courses/${courseId}/chapters`)
    .set("Cookie", adminToken)
    .send({ title: "Chapter 1" });
  chapterId = chapterRes.body.data._id;

  const lessonRes = await request(app)
    .post(`/api/teacher/chapters/${chapterId}/lessons`)
    .set("Cookie", adminToken)
    .send({ title: "Lesson 1", type: "video" });
  lessonId = lessonRes.body.data._id;

  const exerciseRes = await request(app)
    .post(`/api/teacher/lessons/${lessonId}/exercises`)
    .set("Cookie", adminToken)
    .send({
      title: "Grammar Quiz",
      type: "single-choice",
      skill: "grammar",
      level: "beginner",
      questions: [
        {
          questionText: "What is the correct form?",
          options: ["She go", "She goes", "She going", "She went"],
          correctAnswers: ["She goes"],
          explanation: "Third person singular requires 's'.",
          points: 1,
        },
        {
          questionText: "Choose the correct sentence:",
          options: ["I am happy.", "I is happy.", "I are happy.", "I be happy."],
          correctAnswers: ["I am happy."],
          explanation: "'I' takes 'am'.",
          points: 1,
        },
        {
          questionText: "Which is correct?",
          options: ["He have a car.", "He has a car.", "He having a car.", "He to have a car."],
          correctAnswers: ["He has a car."],
          explanation: "Has is used with third person singular.",
          points: 1,
        },
      ],
    });
  exerciseId = exerciseRes.body.data._id;
}

describe("Exercise Auto-Grading Tests", () => {
  beforeEach(async () => {
    await setupExercise();
  });

  describe("GET /api/exercises/lessons/:lessonId/exercises", () => {
    test("200 - Can get exercises for a lesson", async () => {
      const res = await request(app)
        .get(`/api/exercises/lessons/${lessonId}/exercises`)
        .set("Cookie", userToken);

      expect(res.status).toBe(200);
      expect(res.body.data.exercises.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/exercises/:exerciseId/submit", () => {
    test("200 - Submit all correct answers - full score", async () => {
      const answers = [
        ["She goes"],
        ["I am happy."],
        ["He has a car."],
      ];

      const res = await request(app)
        .post(`/api/exercises/${exerciseId}/submit`)
        .set("Cookie", userToken)
        .send({ answers });

      expect(res.status).toBe(200);
      expect(res.body.data.result.passed).toBe(true);
      expect(res.body.data.result.score).toBe(100);
      expect(res.body.data.result.earnedPoints).toBe(3);
    });

    test("200 - Submit all wrong answers - zero score", async () => {
      const answers = [
        ["She go"],
        ["I is happy."],
        ["He have a car."],
      ];

      const res = await request(app)
        .post(`/api/exercises/${exerciseId}/submit`)
        .set("Cookie", userToken)
        .send({ answers });

      expect(res.status).toBe(200);
      expect(res.body.data.result.score).toBe(0);
      expect(res.body.data.result.passed).toBe(false);
    });

    test("200 - Submit partial correct - partial score", async () => {
      const answers = [
        ["She goes"],
        ["I is happy."],
        ["He have a car."],
      ];

      const res = await request(app)
        .post(`/api/exercises/${exerciseId}/submit`)
        .set("Cookie", userToken)
        .send({ answers });

      expect(res.status).toBe(200);
      expect(res.body.data.result.score).toBeGreaterThan(0);
      expect(res.body.data.result.score).toBeLessThan(100);
    });

    test("401 - Cannot submit without authentication", async () => {
      const res = await request(app)
        .post(`/api/exercises/${exerciseId}/submit`)
        .send({ answers: [["She goes"], ["I am happy."], ["He has a car."]] });

      expect(res.status).toBe(401);
    });

    test("200 - Each question shows correct/incorrect status", async () => {
      const answers = [
        ["She goes"],
        ["I am happy."],
        ["He have a car."],
      ];

      const res = await request(app)
        .post(`/api/exercises/${exerciseId}/submit`)
        .set("Cookie", userToken)
        .send({ answers });

      expect(res.status).toBe(200);
      expect(res.body.data.result.questions.length).toBe(3);
      expect(res.body.data.result.questions[0].isCorrect).toBe(true);
      expect(res.body.data.result.questions[1].isCorrect).toBe(true);
      expect(res.body.data.result.questions[2].isCorrect).toBe(false);
    });

    test("200 - Explanations are included in results", async () => {
      const answers = [["She goes"], ["I am happy."], ["He has a car."]];

      const res = await request(app)
        .post(`/api/exercises/${exerciseId}/submit`)
        .set("Cookie", userToken)
        .send({ answers });

      expect(res.status).toBe(200);
      expect(res.body.data.result.questions[0].explanation).toBeDefined();
    });
  });
});
