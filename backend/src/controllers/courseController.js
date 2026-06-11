import multer from "multer";
import {
  createCourse,
  getTeacherCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  submitCourseForReview,
  createChapter,
  getCourseChapters,
  updateChapter,
  deleteChapter,
  createLesson,
  getChapterLessons,
  updateLesson,
  deleteLesson,
  createExercise,
  getLessonExercises as getLessonExercisesService,
  getExerciseById,
  updateExercise,
  deleteExercise,
  getCourseStudents,
  banStudentFromCourse,
  inviteStudentToFreeCourse,
  getTeacherDashboard,
} from "../services/courseService.js";
import { uploadToCloudinary } from "../services/uploadService.js";
import {
  createCourseSchema,
  updateCourseSchema,
  createChapterSchema,
  updateChapterSchema,
  createLessonSchema,
  updateLessonSchema,
  createExerciseSchema,
  updateExerciseSchema,
  submitReviewSchema,
  paginationSchema,
} from "../utils/courseValidation.js";

const themChuong = createChapter;
const layDanhSachChuong = getCourseChapters;
const capNhatChuong = updateChapter;
const xoaChuong = deleteChapter;
const themBaiHoc = createLesson;
const capNhatBaiHoc = updateLesson;
const xoaBaiHoc = deleteLesson;
const themBaiTap = createExercise;
const layBaiTapTheoId = getExerciseById;
const capNhatBaiTap = updateExercise;
const xoaBaiTap = deleteExercise;
const layHocVienKhoaHoc = getCourseStudents;
const camHocVien = banStudentFromCourse;
const moiHocVienMienPhi = inviteStudentToFreeCourse;
const uploadMaxFileSizeMb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 1024);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: uploadMaxFileSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "video/mp4",
      "video/mpeg",
      "video/webm",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Loại file không được hỗ trợ"));
    }
  },
});

function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const error = new Error(
        parsed.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
      );
      error.statusCode = 400;
      return next(error);
    }
    req.validatedBody = parsed.data;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const error = new Error(
        parsed.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
      );
      error.statusCode = 400;
      return next(error);
    }
    req.validatedQuery = parsed.data;
    next();
  };
}

async function getDashboard(req, res, next) {
  try {
    const stats = await getTeacherDashboard(req.user.userId);
    res.json({
      success: true,
      message: "Lấy dashboard thành công",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

async function getCourseList(req, res, next) {
  try {
    const result = await getTeacherCourses(
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

async function createCourseHandler(req, res, next) {
  try {
    const courseRecord = await createCourse(req.user.userId, req.validatedBody);
    res.status(201).json({
      success: true,
      message: "Tạo khóa học thành công",
      data: courseRecord,
    });
  } catch (error) {
    next(error);
  }
}

async function getCourse(req, res, next) {
  try {
    const courseRecord = await getCourseById(req.params.id);
    res.json({
      success: true,
      message: "Lấy khóa học thành công",
      data: { course: courseRecord },
    });
  } catch (error) {
    next(error);
  }
}

async function updateCourseHandler(req, res, next) {
  try {
    const courseRecord = await updateCourse(
      req.params.id,
      req.user.userId,
      req.validatedBody,
    );
    res.json({
      success: true,
      message: "Cập nhật khóa học thành công",
      data: courseRecord,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCourseHandler(req, res, next) {
  try {
    await deleteCourse(req.params.id, req.user.userId);
    res.json({ success: true, message: "Xóa khóa học thành công" });
  } catch (error) {
    next(error);
  }
}

async function submitReviewHandler(req, res, next) {
  try {
    const courseRecord = await submitCourseForReview(
      req.params.id,
      req.user.userId,
      req.body.notes || "",
    );
    res.json({
      success: true,
      message: "Đã gửi khóa học để duyệt",
      data: courseRecord,
    });
  } catch (error) {
    next(error);
  }
}

async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error("Không có file được upload");
      err.statusCode = 400;
      return next(err);
    }

    const folderMap = {
      thumbnail: "edunest/courses/thumbnails",
      document: "edunest/courses/documents",
      video: "edunest/courses/videos",
      avatar: "edunest/avatars",
    };
    const folder = folderMap[req.body.type] || "edunest/misc";

    const result = await uploadToCloudinary(req.file, folder);
    res.json({ success: true, message: "Upload thành công", data: result });
  } catch (error) {
    if (error.message === "Cloudinary chưa được cấu hình") {
      const err = new Error(
        "Cloudinary chưa được cấu hình. Vui lòng thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET vào .env",
      );
      err.statusCode = 503;
      return next(err);
    }
    next(error);
  }
}

async function themChuongHandler(req, res, next) {
  try {
    const chuong = await themChuong(
      req.params.courseId,
      req.user.userId,
      req.validatedBody,
    );
    res
      .status(201)
      .json({ success: true, message: "Thêm chương thành công", data: chuong });
  } catch (error) {
    next(error);
  }
}

async function layChuongVaBaiHoc(req, res, next) {
  try {
    const chapters = await layDanhSachChuong(
      req.params.courseId,
      req.user.userId,
    );
    res.json({
      success: true,
      message: "Lấy cấu trúc chương thành công",
      data: { chapters },
    });
  } catch (error) {
    next(error);
  }
}

async function capNhatChuongHandler(req, res, next) {
  try {
    const chuong = await capNhatChuong(
      req.params.chapterId,
      req.user.userId,
      req.validatedBody,
    );
    res.json({
      success: true,
      message: "Cập nhật chương thành công",
      data: chuong,
    });
  } catch (error) {
    next(error);
  }
}

async function xoaChuongHandler(req, res, next) {
  try {
    await xoaChuong(req.params.chapterId, req.user.userId);
    res.json({ success: true, message: "Xóa chương thành công" });
  } catch (error) {
    next(error);
  }
}

async function themBaiHocHandler(req, res, next) {
  try {
    const baiHoc = await themBaiHoc(
      req.params.chapterId,
      req.user.userId,
      req.validatedBody,
    );
    res.status(201).json({
      success: true,
      message: "Thêm bài học thành công",
      data: baiHoc,
    });
  } catch (error) {
    next(error);
  }
}

async function capNhatBaiHocHandler(req, res, next) {
  try {
    const baiHoc = await capNhatBaiHoc(
      req.params.lessonId,
      req.user.userId,
      req.validatedBody,
    );
    res.json({
      success: true,
      message: "Cập nhật bài học thành công",
      data: baiHoc,
    });
  } catch (error) {
    next(error);
  }
}

async function xoaBaiHocHandler(req, res, next) {
  try {
    await xoaBaiHoc(req.params.lessonId, req.user.userId);
    res.json({ success: true, message: "Xóa bài học thành công" });
  } catch (error) {
    next(error);
  }
}

async function themBaiTapHandler(req, res, next) {
  try {
    const baiTap = await themBaiTap(
      req.params.lessonId,
      req.user.userId,
      req.validatedBody,
    );
    res.status(201).json({
      success: true,
      message: "Thêm bài tập thành công",
      data: baiTap,
    });
  } catch (error) {
    next(error);
  }
}

async function layDanhSachBaiTap(req, res, next) {
  try {
    const exercises = await layDanhSachBaiTapService(
      req.params.lessonId,
      req.user.userId,
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

async function layBaiTap(req, res, next) {
  try {
    const baiTap = await layBaiTapTheoId(
      req.params.exerciseId,
      req.user.userId,
    );
    res.json({
      success: true,
      message: "Lấy bài tập thành công",
      data: baiTap,
    });
  } catch (error) {
    next(error);
  }
}

async function capNhatBaiTapHandler(req, res, next) {
  try {
    const baiTap = await capNhatBaiTap(
      req.params.exerciseId,
      req.user.userId,
      req.validatedBody,
    );
    res.json({
      success: true,
      message: "Cập nhật bài tập thành công",
      data: baiTap,
    });
  } catch (error) {
    next(error);
  }
}

async function xoaBaiTapHandler(req, res, next) {
  try {
    await xoaBaiTap(req.params.exerciseId, req.user.userId);
    res.json({ success: true, message: "Xóa bài tập thành công" });
  } catch (error) {
    next(error);
  }
}

async function layHocVien(req, res, next) {
  try {
    const enrollments = await layHocVienKhoaHoc(
      req.params.courseId,
      req.user.userId,
    );
    res.json({
      success: true,
      message: "Lấy danh sách học viên thành công",
      data: { enrollments },
    });
  } catch (error) {
    next(error);
  }
}

async function camHocVienHandler(req, res, next) {
  try {
    const result = await camHocVien(
      req.params.courseId,
      req.params.studentId,
      req.user.userId,
    );
    res.json({
      success: true,
      message: "Đã cấm học viên khỏi khóa học",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function moiHocVienHandler(req, res, next) {
  try {
    const result = await moiHocVienMienPhi(
      req.params.courseId,
      req.params.studentId,
      req.user.userId,
    );
    res.json({
      success: true,
      message: "Đã mời học viên học miễn phí",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export {
  upload,
  validate,
  validateQuery,
  getDashboard,
  getCourseList,
  createCourseHandler,
  getCourse,
  updateCourseHandler,
  deleteCourseHandler,
  submitReviewHandler,
  uploadFile,
  themChuongHandler,
  layChuongVaBaiHoc,
  capNhatChuongHandler,
  xoaChuongHandler,
  themBaiHocHandler,
  capNhatBaiHocHandler,
  xoaBaiHocHandler,
  themBaiTapHandler,
  layDanhSachBaiTap,
  layBaiTap,
  capNhatBaiTapHandler,
  xoaBaiTapHandler,
  layHocVien,
  camHocVienHandler,
  moiHocVienHandler,
  createCourseSchema,
  updateCourseSchema,
  createChapterSchema,
  updateChapterSchema,
  createLessonSchema,
  updateLessonSchema,
  createExerciseSchema,
  updateExerciseSchema,
  submitReviewSchema,
  paginationSchema,
};
