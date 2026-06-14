import {
  layDashboardStats,
  layKhoaHocChoDuyet,
  duyetKhoaHoc,
  layDanhSachUser,
  capNhatTrangThaiUser,
  layDanhSachKhoaHoc,
  layChiTietKhoaHoc,
  layRecentActivity,
} from "../services/adminService.js";

async function getStats(req, res, next) {
  try {
    const stats = await layDashboardStats();
    res.json({
      success: true,
      message: "Lấy thống kê thành công",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

async function getRecentActivity(req, res, next) {
  try {
    const limit = Number(req.query.limit || 20);
    const data = await layRecentActivity({ limit });
    res.json({
      success: true,
      message: "Lấy hoạt động gần đây thành công",
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getPendingCourses(req, res, next) {
  try {
    const result = await layKhoaHocChoDuyet({
      ...req.validatedQuery,
      status: "pending",
    });
    res.json({
      success: true,
      message: "Lấy danh sách khóa chờ duyệt thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

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

async function getCourse(req, res, next) {
  try {
    const result = await layChiTietKhoaHoc(req.params.courseId);
    res.json({
      success: true,
      message: "Láº¥y chi tiáº¿t khÃ³a há»c thÃ nh cÃ´ng",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function approveCourse(req, res, next) {
  try {
    const result = await duyetKhoaHoc(
      req.params.courseId,
      req.user.userId,
      "approve",
    );
    res.json({
      success: true,
      message: result.message,
      data: result.course,
    });
  } catch (error) {
    next(error);
  }
}

async function rejectCourse(req, res, next) {
  try {
    const { reason } = req.body;
    const result = await duyetKhoaHoc(
      req.params.courseId,
      req.user.userId,
      "reject",
      reason,
    );
    res.json({
      success: true,
      message: result.message,
      data: result.course,
    });
  } catch (error) {
    next(error);
  }
}

async function banCourse(req, res, next) {
  try {
    const { reason } = req.body;
    const result = await duyetKhoaHoc(
      req.params.courseId,
      req.user.userId,
      "ban",
      reason,
    );
    res.json({
      success: true,
      message: result.message,
      data: result.course,
    });
  } catch (error) {
    next(error);
  }
}

async function lockCourse(req, res, next) {
  try {
    const { reason } = req.body;
    const result = await duyetKhoaHoc(
      req.params.courseId,
      req.user.userId,
      "lock",
      reason,
    );
    res.json({
      success: true,
      message: result.message,
      data: result.course,
    });
  } catch (error) {
    next(error);
  }
}

async function unlockCourse(req, res, next) {
  try {
    const result = await duyetKhoaHoc(
      req.params.courseId,
      req.user.userId,
      "unlock",
    );
    res.json({
      success: true,
      message: result.message,
      data: result.course,
    });
  } catch (error) {
    next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const result = await layDanhSachUser(req.validatedQuery);
    res.json({
      success: true,
      message: "Lấy danh sách người dùng thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function lockUser(req, res, next) {
  try {
    const result = await capNhatTrangThaiUser(
      req.params.userId,
      req.user.userId,
      "lock",
    );
    res.json({
      success: true,
      message: result.message,
      data: result.user,
    });
  } catch (error) {
    next(error);
  }
}

async function unlockUser(req, res, next) {
  try {
    const result = await capNhatTrangThaiUser(
      req.params.userId,
      req.user.userId,
      "unlock",
    );
    res.json({
      success: true,
      message: result.message,
      data: result.user,
    });
  } catch (error) {
    next(error);
  }
}

async function makeAdmin(req, res, next) {
  try {
    const result = await capNhatTrangThaiUser(
      req.params.userId,
      req.user.userId,
      "makeAdmin",
    );
    res.json({
      success: true,
      message: result.message,
      data: result.user,
    });
  } catch (error) {
    next(error);
  }
}

async function makeUser(req, res, next) {
  try {
    const result = await capNhatTrangThaiUser(
      req.params.userId,
      req.user.userId,
      "makeUser",
    );
    res.json({
      success: true,
      message: result.message,
      data: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export {
  getStats,
  getRecentActivity,
  getPendingCourses,
  getCourses,
  getCourse,
  approveCourse,
  rejectCourse,
  banCourse,
  lockCourse,
  unlockCourse,
  getUsers,
  lockUser,
  unlockUser,
  makeAdmin,
  makeUser,
};
