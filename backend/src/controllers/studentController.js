import {
  layDanhSachKhoaHoc,
  layKhoaHocTheoSlug,
} from "../services/studentService.js";

async function getCourses(req, res, next) {
  try {
    const result = await layDanhSachKhoaHoc(req.validatedQuery);
    res.json({
      success: true,
      message: "Lấy danh sách khóa học thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getCourseBySlug(req, res, next) {
  try {
    const userId = req.user?.userId || null;
    const { slug } = req.params;
    const course = await layKhoaHocTheoSlug(slug, userId);
    res.json({
      success: true,
      message: "Lấy chi tiết khóa học thành công",
      data: { course },
    });
  } catch (error) {
    next(error);
  }
}

async function getCourseById(req, res, next) {
  try {
    const userId = req.user?.userId || null;
    const { id } = req.params;
    const course = await layKhoaHocTheoSlug(id, userId);
    res.json({
      success: true,
      message: "Lấy chi tiết khóa học thành công",
      data: { course },
    });
  } catch (error) {
    next(error);
  }
}

export { getCourses, getCourseBySlug, getCourseById };
