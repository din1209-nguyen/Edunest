import { z } from "zod";
import config from "../config/index.js";
import AiUsage from "../models/AiUsage.js";
import Enrollment from "../models/Enrollment.js";
import Lesson from "../models/Lesson.js";

const AI_DAILY_LIMIT = 5;
const AI_QUESTION_COUNT = 5;

const generateExerciseSchema = z.object({
  topic: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  skill: z.enum(["reading", "listening", "writing", "grammar", "vocabulary"]).default("reading"),
  questionType: z.enum(["single-choice", "multiple-choice", "fill-blank", "short-answer"]).default("single-choice"),
  numberOfQuestions: z.number().int().min(3).max(10).default(AI_QUESTION_COUNT),
  lessonId: z.string().optional(),
});

const singleChoiceQuestionSchema = z.object({
  questionText: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).length(4),
  correctAnswers: z.array(z.string().trim().min(1)).length(1),
  explanation: z.string().trim().min(1),
  points: z.number().int().min(1).default(1),
}).refine(
  (question) => question.options.includes(question.correctAnswers[0]),
  {
    message: "Correct answer must be one of the options",
    path: ["correctAnswers"],
  },
);

const aiLessonExerciseOutputSchema = z.object({
  title: z.string().trim().min(1),
  questions: z.array(singleChoiceQuestionSchema).length(AI_QUESTION_COUNT),
});

const exerciseOutputSchema = z.object({
  title: z.string(),
  level: z.string(),
  skill: z.string(),
  questionType: z.string(),
  questions: z.array(
    z.object({
      questionText: z.string(),
      options: z.array(z.string()).optional(),
      correctAnswers: z.array(z.string()),
      explanation: z.string(),
      points: z.number().int().min(1).default(1),
    }),
  ),
});

function createHttpError(message, statusCode, code) {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (code) err.code = code;
  return err;
}

function isMockMode() {
  return config.ai.mockMode || process.env.AI_MOCK_MODE === "true";
}

function getDailyWindow(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const resetAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const yyyy = String(start.getFullYear());
  const mm = String(start.getMonth() + 1).padStart(2, "0");
  const dd = String(start.getDate()).padStart(2, "0");

  return {
    dateKey: `${yyyy}-${mm}-${dd}`,
    resetAt,
  };
}

function formatQuota(usage) {
  return {
    used: usage.count,
    limit: AI_DAILY_LIMIT,
    remaining: Math.max(AI_DAILY_LIMIT - usage.count, 0),
    resetAt: usage.resetAt,
  };
}

async function consumeDailyQuota(userId) {
  const { dateKey, resetAt } = getDailyWindow();

  const incremented = await AiUsage.findOneAndUpdate(
    {
      user: userId,
      dateKey,
      count: { $lt: AI_DAILY_LIMIT },
    },
    {
      $inc: { count: 1 },
      $set: { resetAt },
    },
    { returnDocument: "after" },
  );

  if (incremented) return formatQuota(incremented);

  try {
    const created = await AiUsage.create({
      user: userId,
      dateKey,
      count: 1,
      resetAt,
    });
    return formatQuota(created);
  } catch (error) {
    if (error.code === 11000) {
      const current = await AiUsage.findOne({ user: userId, dateKey });
      const err = createHttpError(
        "Ban da dung het 5 luot tao bai tap AI trong ngay hom nay",
        429,
        "AI_DAILY_LIMIT_REACHED",
      );
      err.quota = current
        ? formatQuota(current)
        : { used: AI_DAILY_LIMIT, limit: AI_DAILY_LIMIT, remaining: 0, resetAt };
      throw err;
    }
    throw error;
  }
}

function validateGenerateInput(data) {
  const validationResult = generateExerciseSchema.safeParse(data);
  if (!validationResult.success) {
    const err = createHttpError(
      validationResult.error.issues.map((validationError) => validationError.message).join(", "),
      400,
    );
    err.details = validationResult.error.issues;
    throw err;
  }
  return validationResult.data;
}

function parseJsonContent(rawContent) {
  try {
    return typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
  } catch {
    throw createHttpError("AI tra du lieu khong dung format JSON", 502, "AI_INVALID_JSON");
  }
}

function validateOutput(rawContent) {
  try {
    return exerciseOutputSchema.parse(parseJsonContent(rawContent));
  } catch (error) {
    if (error.statusCode) throw error;
    throw createHttpError("AI tra du lieu khong dung schema", 502, "AI_INVALID_SCHEMA");
  }
}

function validateLessonExerciseOutput(rawContent) {
  try {
    return aiLessonExerciseOutputSchema.parse(parseJsonContent(rawContent));
  } catch (error) {
    if (error.statusCode) throw error;
    throw createHttpError("AI tra du lieu bai tap khong dung schema", 502, "AI_INVALID_SCHEMA");
  }
}

async function ensureLessonPdfAccess(userId, lessonId) {
  const lesson = await Lesson.findById(lessonId)
    .select("title documentUrl documentType course isPublished")
    .lean();

  if (!lesson || !lesson.isPublished) {
    throw createHttpError("Khong tim thay bai hoc", 404, "LESSON_NOT_FOUND");
  }

  if (lesson.documentType !== "pdf" || !lesson.documentUrl) {
    throw createHttpError("Bai hoc nay chua co tai lieu PDF de tao bai tap AI", 400, "LESSON_PDF_REQUIRED");
  }

  const enrollment = await Enrollment.findOne({
    student: userId,
    course: lesson.course,
    isActive: true,
  }).select("_id");

  if (!enrollment) {
    throw createHttpError("Ban can dang ky khoa hoc de tao bai tap AI", 403, "ENROLLMENT_REQUIRED");
  }

  return lesson;
}

async function fetchPdfBlob(documentUrl) {
  const response = await fetch(documentUrl);
  if (!response.ok) {
    throw createHttpError("Khong the tai file PDF cua bai hoc", 502, "PDF_FETCH_FAILED");
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Blob([arrayBuffer], { type: "application/pdf" });
}

async function waitForGeminiFile(ai, file) {
  if (!file?.name) return file;

  let current = file;
  for (let attempt = 0; attempt < 12; attempt++) {
    if (current.state && current.state !== "PROCESSING") break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    current = await ai.files.get({ name: file.name });
  }

  if (current.state === "FAILED") {
    throw createHttpError("Gemini khong xu ly duoc file PDF", 502, "GEMINI_FILE_FAILED");
  }

  return current;
}

function buildLessonExercisePrompt(lesson) {
  return `Create exactly ${AI_QUESTION_COUNT} English learning multiple-choice questions from the attached PDF for the lesson "${lesson.title}".
Requirements:
- Use only information supported by the PDF.
- Each question must have exactly 4 answer options.
- Each question must have exactly 1 correct answer, and the correct answer must exactly match one option.
- Include a short explanation for each answer.
- Return only JSON that matches the response schema.`;
}

function getGeminiExerciseSchema() {
  return {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      questions: {
        type: "ARRAY",
        minItems: String(AI_QUESTION_COUNT),
        maxItems: String(AI_QUESTION_COUNT),
        items: {
          type: "OBJECT",
          properties: {
            questionText: { type: "STRING" },
            options: {
              type: "ARRAY",
              minItems: "4",
              maxItems: "4",
              items: { type: "STRING" },
            },
            correctAnswers: {
              type: "ARRAY",
              minItems: "1",
              maxItems: "1",
              items: { type: "STRING" },
            },
            explanation: { type: "STRING" },
            points: { type: "INTEGER" },
          },
          required: ["questionText", "options", "correctAnswers", "explanation", "points"],
        },
      },
    },
    required: ["title", "questions"],
  };
}

function toRuntimeExercise(aiOutput, lesson) {
  return {
    _id: `ai-${Date.now()}`,
    lesson: lesson._id.toString(),
    course: lesson.course.toString(),
    title: aiOutput.title,
    type: "single-choice",
    skill: "reading",
    level: "beginner",
    questions: aiOutput.questions.map((question) => ({
      ...question,
      points: question.points || 1,
    })),
    timeLimit: 0,
    passingScore: 60,
    isPublished: true,
    isAiGenerated: true,
  };
}

async function generateLessonExerciseMock(lesson) {
  return toRuntimeExercise(
    {
      title: `AI Practice - ${lesson.title}`,
      questions: Array.from({ length: AI_QUESTION_COUNT }, (_, index) => ({
        questionText: `Question ${index + 1}: What is an important idea from this PDF lesson?`,
        options: [
          `Correct idea ${index + 1}`,
          `Distractor ${index + 1}A`,
          `Distractor ${index + 1}B`,
          `Distractor ${index + 1}C`,
        ],
        correctAnswers: [`Correct idea ${index + 1}`],
        explanation: "This answer is supported by the lesson PDF.",
        points: 1,
      })),
    },
    lesson,
  );
}

async function generateLessonExerciseWithGemini(lesson) {
  if (!config.gemini.apiKey) {
    throw createHttpError("Gemini API key chua duoc cau hinh", 503, "GEMINI_API_KEY_MISSING");
  }

  const { GoogleGenAI, createPartFromUri } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  const pdfBlob = await fetchPdfBlob(lesson.documentUrl);
  const uploadedFile = await ai.files.upload({
    file: pdfBlob,
    config: {
      displayName: `${lesson._id}.pdf`,
      mimeType: "application/pdf",
    },
  });

  try {
    const processedFile = await waitForGeminiFile(ai, uploadedFile);
    const response = await ai.models.generateContent({
      model: config.gemini.model,
      contents: [
        buildLessonExercisePrompt(lesson),
        createPartFromUri(processedFile.uri, processedFile.mimeType || "application/pdf"),
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: getGeminiExerciseSchema(),
        temperature: 0.4,
      },
    });

    const aiOutput = validateLessonExerciseOutput(response.text);
    return toRuntimeExercise(aiOutput, lesson);
  } finally {
    if (uploadedFile?.name) {
      ai.files.delete({ name: uploadedFile.name }).catch(() => {});
    }
  }
}

async function generateLessonPdfExercise(userId, lessonId) {
  const lesson = await ensureLessonPdfAccess(userId, lessonId);
  const quota = await consumeDailyQuota(userId);
  const exercise = isMockMode()
    ? await generateLessonExerciseMock(lesson)
    : await generateLessonExerciseWithGemini(lesson);

  return { exercise, quota };
}

async function generateExerciseWithAI(input) {
  const validated = validateGenerateInput(input);
  return generateExerciseMock(validated);
}

function generateExerciseMock(input) {
  const questions = Array.from({ length: input.numberOfQuestions }, (_, index) => ({
    questionText: `${index + 1}. ${input.topic || input.skill} practice question`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswers: ["Option A"],
    explanation: "Option A is the sample correct answer.",
    points: input.questionType === "multiple-choice" ? 2 : 1,
  }));

  return {
    title: input.topic || `${input.skill} Practice`,
    level: input.level,
    skill: input.skill,
    questionType: input.questionType,
    questions,
  };
}

export {
  AI_DAILY_LIMIT,
  AI_QUESTION_COUNT,
  consumeDailyQuota,
  generateExerciseMock,
  generateExerciseWithAI,
  generateLessonPdfExercise,
  validateGenerateInput,
  validateLessonExerciseOutput,
  validateOutput,
};
