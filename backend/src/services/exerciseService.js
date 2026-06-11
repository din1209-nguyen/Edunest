import Exercise from "../models/Exercise.js";
import Enrollment from "../models/Enrollment.js";

async function ensureExerciseAccess(userId, exercise) {
  const enrollment = await Enrollment.findOne({
    student: userId,
    course: exercise.course,
    isActive: true,
  }).select("_id");

  if (!enrollment) {
    const err = new Error("Ban can dang ky khoa hoc de lam bai tap nay");
    err.statusCode = 403;
    throw err;
  }
}

async function layBaiTapTheoBaiHoc(userId, lessonId) {
  const exercises = await Exercise.find({
    lesson: lessonId,
    isPublished: true,
  })
    .select("-questions.correctAnswers")
    .lean();

  if (exercises.length > 0) {
    await ensureExerciseAccess(userId, exercises[0]);
  }

  return exercises;
}

async function layBaiTapChiTiet(userId, baiTapId) {
  const exercise = await Exercise.findOne({ _id: baiTapId, isPublished: true });

  if (!exercise) {
    const err = new Error("Không tìm thấy bài tập");
    err.statusCode = 404;
    throw err;
  }

  await ensureExerciseAccess(userId, exercise);

  return exercise;
}

async function nopBaiTap(userId, baiTapId, answers) {
  const exercise = await Exercise.findOne({ _id: baiTapId, isPublished: true });

  if (!exercise) {
    const err = new Error("Không tìm thấy bài tập");
    err.statusCode = 404;
    throw err;
  }

  await ensureExerciseAccess(userId, exercise);

  const result = {
    exerciseId: exercise._id,
    title: exercise.title,
    totalQuestions: exercise.questions.length,
    totalPoints: 0,
    earnedPoints: 0,
    score: 0,
    passingScore: exercise.passingScore,
    passed: false,
    questions: [],
  };

  for (let i = 0; i < exercise.questions.length; i++) {
    const question = exercise.questions[i];
    const userAnswer = answers[i];

    const correctSet = new Set(
      question.correctAnswers.map((a) => a.trim().toLowerCase()),
    );
    const userSet = new Set(
      (Array.isArray(userAnswer) ? userAnswer : [userAnswer]).map((a) =>
        (a || "").trim().toLowerCase(),
      ),
    );

    const isCorrect =
      correctSet.size === userSet.size &&
      [...correctSet].every((a) => userSet.has(a));

    result.totalPoints += question.points || 1;
    if (isCorrect) result.earnedPoints += question.points || 1;

    result.questions.push({
      questionIndex: i,
      questionText: question.questionText,
      options: question.options,
      userAnswer: Array.isArray(userAnswer) ? userAnswer : [userAnswer],
      correctAnswers: question.correctAnswers,
      explanation: question.explanation || "",
      points: question.points || 1,
      earned: isCorrect ? question.points || 1 : 0,
      isCorrect,
    });
  }

  result.score =
    result.totalPoints > 0
      ? Math.round((result.earnedPoints / result.totalPoints) * 100)
      : 0;
  result.passed = result.score >= result.passingScore;

  return result;
}

export { layBaiTapTheoBaiHoc, layBaiTapChiTiet, nopBaiTap };
