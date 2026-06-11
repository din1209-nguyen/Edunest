import {
  layBaiTapTheoBaiHoc,
  layBaiTapChiTiet,
  nopBaiTap,
} from "../services/exerciseService.js";

async function getExercisesByLesson(req, res, next) {
  try {
    const exercises = await layBaiTapTheoBaiHoc(
      req.user.userId,
      req.params.lessonId,
    );
    res.json({
      success: true,
      message: "Lấy danh sách bài tập thành công",
      data: { exercises },
    });
  } catch (error) {
    next(error);
  }
}

async function getExercise(req, res, next) {
  try {
    const exercise = await layBaiTapChiTiet(req.user.userId, req.params.exerciseId);
    res.json({
      success: true,
      message: "Lấy chi tiết bài tập thành công",
      data: { exercise },
    });
  } catch (error) {
    next(error);
  }
}

async function submitExercise(req, res, next) {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      const err = new Error("Danh sách đáp án là bắt buộc");
      err.statusCode = 400;
      return next(err);
    }

    const result = await nopBaiTap(
      req.user.userId,
      req.params.exerciseId,
      answers,
    );
    res.json({
      success: true,
      message: "Nộp bài tập thành công",
      data: { result },
    });
  } catch (error) {
    next(error);
  }
}

export { getExercisesByLesson, getExercise, submitExercise };
