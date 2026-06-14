import { goiYKhoaHoc, goiYKhoaHocPublic } from "../services/recommendService.js";

async function getRecommendations(req, res, next) {
  try {
    const { limit = 6 } = req.validatedQuery;
    const courses = await goiYKhoaHoc(req.user.userId, limit);
    res.json({
      success: true,
      message: "Lấy gợi ý khóa học thành công",
      data: courses,
    });
  } catch (error) {
    next(error);
  }
}

async function getRecommendationsPublic(req, res, next) {
  try {
    const { limit = 6 } = req.query;
    const courses = await goiYKhoaHocPublic(Number(limit) || 6);
    res.json({
      success: true,
      message: "Lấy gợi ý khóa học thành công",
      data: courses,
    });
  } catch (error) {
    next(error);
  }
}

export { getRecommendations, getRecommendationsPublic };
