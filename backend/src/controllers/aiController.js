import {
  generateLessonPdfExercise,
  validateGenerateInput,
  generateExerciseWithAI,
} from "../services/aiService.js";
import Exercise from "../models/Exercise.js";
import Lesson from "../models/Lesson.js";

async function generateExercises(req, res, next) {
  try {
    const validated = validateGenerateInput(req.body);
    const result = await generateExerciseWithAI(validated);
    res.json({
      success: true,
      message: "Tạo bài tập thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function saveAIExercise(req, res, next) {
  try {
    const { lessonId, title, questions } = req.body;

    const baiHoc = await Lesson.findById(lessonId);
    if (!baiHoc) {
      const err = new Error("Không tìm thấy bài học");
      err.statusCode = 404;
      throw err;
    }

    const baiTap = await Exercise.create({
      lesson: lessonId,
      course: baiHoc.course,
      title: title || "AI Generated Exercise",
      type: req.body.questionType || "single-choice",
      skill: req.body.skill || "grammar",
      questions,
      isPublished: false,
    });

    res.status(201).json({
      success: true,
      message: "Lưu bài tập thành công",
      data: baiTap,
    });
  } catch (error) {
    next(error);
  }
}

async function generateLessonExercises(req, res, next) {
  try {
    const result = await generateLessonPdfExercise(
      req.user.userId,
      req.params.lessonId,
    );

    res.json({
      success: true,
      message: "Tao bai tap AI thanh cong",
      data: result,
    });
  } catch (error) {
    if (error.statusCode === 429 && error.quota) {
      return res.status(429).json({
        success: false,
        message: error.message,
        code: error.code,
        data: { quota: error.quota },
      });
    }
    next(error);
  }
}

export { generateExercises, saveAIExercise, generateLessonExercises };
