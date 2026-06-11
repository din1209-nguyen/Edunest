import {
  getEnrolledCourses,
  enrollFreeCourse,
  getCourseProgress,
  markLessonComplete,
} from "../services/enrollmentService.js";

async function getMyCourses(req, res, next) {
  try {
    const result = await getEnrolledCourses(
      req.user.userId,
      req.validatedQuery,
    );
    res.json({
      success: true,
      message: "Lấy danh sách khóa học thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function freeEnroll(req, res, next) {
  try {
    const enrollment = await enrollFreeCourse(
      req.user.userId,
      req.params.courseId,
    );
    res.status(201).json({
      success: true,
      message: "Đăng ký khóa học miễn phí thành công",
      data: { enrollment },
    });
  } catch (error) {
    next(error);
  }
}

async function getProgress(req, res, next) {
  try {
    const progress = await getCourseProgress(
      req.user.userId,
      req.params.courseId,
    );
    res.json({
      success: true,
      message: "Lấy tiến độ thành công",
      data: { progress },
    });
  } catch (error) {
    next(error);
  }
}

async function completeLesson(req, res, next) {
  try {
    const result = await markLessonComplete(
      req.user.userId,
      req.params.courseId,
      req.params.lessonId,
    );
    res.json({
      success: true,
      message: result.lessonMarked
        ? "Đánh dấu hoàn thành bài học thành công"
        : "Bài học đã được đánh dấu hoàn thành trước đó",
      data: { progress: result },
    });
  } catch (error) {
    next(error);
  }
}

export { getMyCourses, freeEnroll, getProgress, completeLesson };
