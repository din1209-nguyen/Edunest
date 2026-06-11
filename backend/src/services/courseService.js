import Course from "../models/Course.js";
import Chapter from "../models/Chapter.js";
import Lesson from "../models/Lesson.js";
import Exercise from "../models/Exercise.js";
import Enrollment from "../models/Enrollment.js";
import {
  getTeacherStats,
  invalidateCourseDetail,
  invalidateOnCourseChange,
  invalidateTeacherStats,
  invalidateUserEnrollments,
} from "./cacheService.js";

function getCourseCacheKeys(courseRecord) {
  if (!courseRecord) {
    return [];
  }

  const cacheKeys = [];
  if (courseRecord._id) {
    cacheKeys.push(courseRecord._id.toString());
  }
  if (courseRecord.slug) {
    cacheKeys.push(courseRecord.slug);
  }
  return cacheKeys;
}

function createNotFoundError(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

function createForbiddenError(message) {
  const error = new Error(message);
  error.statusCode = 403;
  return error;
}

function createBadRequestError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

async function invalidateCourseCaches(courseRecord) {
  const cacheKeys = getCourseCacheKeys(courseRecord);
  await Promise.all([
    invalidateOnCourseChange(cacheKeys),
    invalidateCourseDetail(cacheKeys),
    courseRecord?.instructor ? invalidateTeacherStats(courseRecord.instructor.toString()) : Promise.resolve(),
  ]);
}

async function createCourse(teacherId, courseData) {
  const courseRecord = await Course.create({
    ...courseData,
    instructor: teacherId,
    status: "draft",
  });

  await invalidateCourseCaches(courseRecord);
  return courseRecord.populate("instructor", "name email avatar");
}

async function getTeacherCourses(teacherId, options = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  const query = { instructor: teacherId };
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  const totalCourses = await Course.countDocuments(query);
  const courseList = await Course.find(query)
    .populate("instructor", "name email avatar")
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    courses: courseList,
    pagination: {
      page,
      limit,
      total: totalCourses,
      totalPages: Math.ceil(totalCourses / limit),
    },
  };
}

async function getCourseById(courseId) {
  const courseRecord = await Course.findById(courseId).populate(
    "instructor",
    "name email avatar bio",
  );
  if (!courseRecord) {
    throw createNotFoundError("Không tìm thấy khóa học");
  }
  return courseRecord;
}

async function updateCourse(courseId, teacherId, courseData) {
  const courseRecord = await Course.findOne({
    _id: courseId,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createNotFoundError("Không tìm thấy khóa học hoặc bạn không có quyền sửa");
  }

  if (
    courseRecord.status === "published" ||
    courseRecord.status === "banned" ||
    courseRecord.status === "locked"
  ) {
    throw createBadRequestError("Không thể sửa khóa học đã được xuất bản hoặc bị khóa");
  }

  Object.keys(courseData).forEach((fieldName) => {
    if (courseData[fieldName] !== undefined) courseRecord[fieldName] = courseData[fieldName];
  });

  await courseRecord.save();
  await invalidateCourseCaches(courseRecord);
  return courseRecord.populate("instructor", "name email avatar");
}

async function deleteCourse(courseId, teacherId) {
  const courseRecord = await Course.findOne({
    _id: courseId,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createNotFoundError("Không tìm thấy khóa học hoặc bạn không có quyền xóa");
  }

  if (courseRecord.totalStudents > 0) {
    throw createBadRequestError("Không thể xóa khóa học đã có học viên");
  }

  await Exercise.deleteMany({ course: courseId });
  const chapterRecords = await Chapter.find({ course: courseId });
  const chapterIds = chapterRecords.map((chapterRecord) => chapterRecord._id);
  await Lesson.deleteMany({ chapter: { $in: chapterIds } });
  await Chapter.deleteMany({ course: courseId });
  await Course.deleteOne({ _id: courseId });
  await invalidateCourseCaches(courseRecord);

  return { message: "Xóa khóa học thành công" };
}

async function submitCourseForReview(courseId, teacherId, reviewNotes = "") {
  const courseRecord = await Course.findOne({
    _id: courseId,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createNotFoundError("Không tìm thấy khóa học");
  }

  if (courseRecord.status !== "draft" && courseRecord.status !== "rejected") {
    throw createBadRequestError("Chỉ khóa học ở trạng thái nháp hoặc bị từ chối mới có thể gửi duyệt");
  }

  if (!courseRecord.thumbnail) {
    throw createBadRequestError("Vui lòng thêm thumbnail trước khi gửi duyệt");
  }

  const chapterRecords = await Chapter.find({ course: courseId });
  if (chapterRecords.length === 0) {
    throw createBadRequestError("Vui lòng thêm ít nhất 1 chương trước khi gửi duyệt");
  }

  const lessonCount = await Lesson.countDocuments({ course: courseId });
  if (lessonCount === 0) {
    throw createBadRequestError("Vui lòng thêm ít nhất 1 bài học trước khi gửi duyệt");
  }

  courseRecord.status = "pending";
  courseRecord.rejectionReason = "";
  courseRecord._reviewNotes = reviewNotes;
  await courseRecord.save();
  await invalidateCourseCaches(courseRecord);

  return courseRecord.populate("instructor", "name email avatar");
}

async function createChapter(courseId, teacherId, chapterData) {
  const courseRecord = await Course.findOne({
    _id: courseId,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createNotFoundError("Không tìm thấy khóa học hoặc bạn không có quyền");
  }

  if (courseRecord.status === "published") {
    throw createBadRequestError("Không thể thêm chương vào khóa học đã xuất bản");
  }

  const maxOrderRecord = await Chapter.findOne({ course: courseId })
    .sort({ order: -1 })
    .select("order");
  const nextOrder =
    chapterData.order !== undefined ? chapterData.order : (maxOrderRecord?.order ?? -1) + 1;

  const chapterRecord = await Chapter.create({
    ...chapterData,
    course: courseId,
    order: nextOrder,
  });

  await invalidateCourseCaches(courseRecord);
  return chapterRecord;
}

async function getCourseChapters(courseId, teacherId) {
  const courseRecord = await Course.findOne({
    _id: courseId,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createNotFoundError("Không tìm thấy khóa học");
  }

  const chapterRecords = await Chapter.find({ course: courseId })
    .sort({ order: 1 })
    .lean();

  const lessonRecords = await Lesson.find({ course: courseId })
    .sort({ chapter: 1, order: 1 })
    .lean();

  const exerciseRecords = await Exercise.find({ course: courseId }).lean();

  return chapterRecords.map((chapterRecord) => ({
    ...chapterRecord,
    lessons: lessonRecords.filter(
      (lessonRecord) => lessonRecord.chapter.toString() === chapterRecord._id.toString(),
    ),
    exercises: exerciseRecords.filter((exerciseRecord) =>
      lessonRecords.some(
        (lessonRecord) =>
          lessonRecord._id.toString() === exerciseRecord.lesson?.toString() &&
          lessonRecord.chapter.toString() === chapterRecord._id.toString(),
      ),
    ),
  }));
}

async function updateChapter(chapterId, teacherId, chapterData) {
  const chapterRecord = await Chapter.findById(chapterId).populate("course");
  if (!chapterRecord) {
    throw createNotFoundError("Không tìm thấy chương");
  }

  const courseRecord = await Course.findOne({
    _id: chapterRecord.course._id,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createForbiddenError("Bạn không có quyền sửa chương này");
  }

  if (courseRecord.status === "published") {
    throw createBadRequestError("Không thể sửa chương của khóa học đã xuất bản");
  }

  Object.keys(chapterData).forEach((fieldName) => {
    if (chapterData[fieldName] !== undefined) chapterRecord[fieldName] = chapterData[fieldName];
  });
  await chapterRecord.save();
  await invalidateCourseCaches(courseRecord);

  return chapterRecord;
}

async function deleteChapter(chapterId, teacherId) {
  const chapterRecord = await Chapter.findById(chapterId).populate("course");
  if (!chapterRecord) {
    throw createNotFoundError("Không tìm thấy chương");
  }

  const courseRecord = await Course.findOne({
    _id: chapterRecord.course._id,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createForbiddenError("Bạn không có quyền xóa chương này");
  }

  if (courseRecord.status === "published") {
    throw createBadRequestError("Không thể xóa chương của khóa học đã xuất bản");
  }

  await Exercise.deleteMany({
    lesson: { $in: await Lesson.find({ chapter: chapterId }).distinct("_id") },
  });
  await Lesson.deleteMany({ chapter: chapterId });
  await Chapter.deleteOne({ _id: chapterId });
  await invalidateCourseCaches(courseRecord);

  return { message: "Xóa chương thành công" };
}

async function createLesson(chapterId, teacherId, lessonData) {
  const chapterRecord = await Chapter.findById(chapterId).populate("course");
  if (!chapterRecord) {
    throw createNotFoundError("Không tìm thấy chương");
  }

  const courseRecord = await Course.findOne({
    _id: chapterRecord.course._id,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createForbiddenError("Bạn không có quyền thêm bài học");
  }

  if (courseRecord.status === "published") {
    throw createBadRequestError("Không thể thêm bài học vào khóa học đã xuất bản");
  }

  const maxOrderRecord = await Lesson.findOne({ chapter: chapterId })
    .sort({ order: -1 })
    .select("order");
  const nextOrder =
    lessonData.order !== undefined ? lessonData.order : (maxOrderRecord?.order ?? -1) + 1;

  const lessonRecord = await Lesson.create({
    ...lessonData,
    chapter: chapterId,
    course: chapterRecord.course._id,
    order: nextOrder,
  });

  await Course.findByIdAndUpdate(chapterRecord.course._id, {
    $inc: { totalLessons: 1, totalDuration: lessonData.videoDuration || 0 },
  });
  await invalidateCourseCaches(chapterRecord.course);

  return lessonRecord;
}

async function getChapterLessons(chapterId, teacherId) {
  const chapterRecord = await Chapter.findById(chapterId).populate("course");
  if (!chapterRecord) {
    throw createNotFoundError("Không tìm thấy chương");
  }

  const courseRecord = await Course.findOne({
    _id: chapterRecord.course._id,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createForbiddenError("Bạn không có quyền xem");
  }

  return Lesson.find({ chapter: chapterId }).sort({ order: 1 }).lean();
}

async function updateLesson(lessonId, teacherId, lessonData) {
  const lessonRecord = await Lesson.findById(lessonId).populate({
    path: "chapter",
    populate: { path: "course" },
  });
  if (!lessonRecord) {
    throw createNotFoundError("Không tìm thấy bài học");
  }

  const courseRecord = await Course.findOne({
    _id: lessonRecord.chapter.course._id,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createForbiddenError("Bạn không có quyền sửa bài học này");
  }

  if (courseRecord.status === "published") {
    throw createBadRequestError("Không thể sửa bài học của khóa học đã xuất bản");
  }

  if (
    lessonData.videoDuration !== undefined &&
    lessonData.videoDuration !== lessonRecord.videoDuration
  ) {
    const durationDiff = lessonData.videoDuration - lessonRecord.videoDuration;
    await Course.findByIdAndUpdate(courseRecord._id, {
      $inc: { totalDuration: durationDiff },
    });
  }

  Object.keys(lessonData).forEach((fieldName) => {
    if (lessonData[fieldName] !== undefined) lessonRecord[fieldName] = lessonData[fieldName];
  });
  await lessonRecord.save();
  await invalidateCourseCaches(courseRecord);

  return lessonRecord;
}

async function deleteLesson(lessonId, teacherId) {
  const lessonRecord = await Lesson.findById(lessonId).populate({
    path: "chapter",
    populate: { path: "course" },
  });
  if (!lessonRecord) {
    throw createNotFoundError("Không tìm thấy bài học");
  }

  const courseRecord = await Course.findOne({
    _id: lessonRecord.chapter.course._id,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createForbiddenError("Bạn không có quyền xóa bài học này");
  }

  if (courseRecord.status === "published") {
    throw createBadRequestError("Không thể xóa bài học của khóa học đã xuất bản");
  }

  await Exercise.deleteMany({ lesson: lessonId });
  await Lesson.deleteOne({ _id: lessonId });
  await Course.findByIdAndUpdate(courseRecord._id, {
    $inc: { totalLessons: -1, totalDuration: -lessonRecord.videoDuration },
  });
  await invalidateCourseCaches(courseRecord);

  return { message: "Xóa bài học thành công" };
}

async function createExercise(lessonId, teacherId, exerciseData) {
  const lessonRecord = await Lesson.findById(lessonId).populate({
    path: "chapter",
    populate: { path: "course" },
  });
  if (!lessonRecord) {
    throw createNotFoundError("Không tìm thấy bài học");
  }

  const courseRecord = await Course.findOne({
    _id: lessonRecord.chapter.course._id,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createForbiddenError("Bạn không có quyền thêm bài tập");
  }

  if (courseRecord.status === "published") {
    throw createBadRequestError("Không thể thêm bài tập vào khóa học đã xuất bản");
  }

  const exerciseRecord = await Exercise.create({
    ...exerciseData,
    lesson: lessonId,
    course: lessonRecord.chapter.course._id,
  });

  await invalidateCourseCaches(courseRecord);
  return exerciseRecord;
}

async function getLessonExercises(lessonId, teacherId) {
  const lessonRecord = await Lesson.findById(lessonId).populate({
    path: "chapter",
    populate: { path: "course" },
  });
  if (!lessonRecord) {
    throw createNotFoundError("Không tìm thấy bài học");
  }

  const courseRecord = await Course.findOne({
    _id: lessonRecord.chapter.course._id,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createForbiddenError("Bạn không có quyền xem");
  }

  return Exercise.find({ lesson: lessonId }).lean();
}

async function getExerciseById(exerciseId, teacherId) {
  const exerciseRecord = await Exercise.findById(exerciseId).populate({
    path: "lesson",
    populate: { path: "chapter", populate: { path: "course" } },
  });
  if (!exerciseRecord) {
    throw createNotFoundError("Không tìm thấy bài tập");
  }

  const courseRecord = await Course.findOne({
    _id: exerciseRecord.lesson.chapter.course._id,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createForbiddenError("Bạn không có quyền xem bài tập này");
  }

  return exerciseRecord;
}

async function updateExercise(exerciseId, teacherId, exerciseData) {
  const exerciseRecord = await Exercise.findById(exerciseId).populate({
    path: "lesson",
    populate: { path: "chapter", populate: { path: "course" } },
  });
  if (!exerciseRecord) {
    throw createNotFoundError("Không tìm thấy bài tập");
  }

  const courseRecord = await Course.findOne({
    _id: exerciseRecord.lesson.chapter.course._id,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createForbiddenError("Bạn không có quyền sửa bài tập này");
  }

  if (courseRecord.status === "published") {
    throw createBadRequestError("Không thể sửa bài tập của khóa học đã xuất bản");
  }

  Object.keys(exerciseData).forEach((fieldName) => {
    if (exerciseData[fieldName] !== undefined) exerciseRecord[fieldName] = exerciseData[fieldName];
  });
  await exerciseRecord.save();
  await invalidateCourseCaches(courseRecord);

  return exerciseRecord;
}

async function deleteExercise(exerciseId, teacherId) {
  const exerciseRecord = await Exercise.findById(exerciseId).populate({
    path: "lesson",
    populate: { path: "chapter", populate: { path: "course" } },
  });
  if (!exerciseRecord) {
    throw createNotFoundError("Không tìm thấy bài tập");
  }

  const courseRecord = await Course.findOne({
    _id: exerciseRecord.lesson.chapter.course._id,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createForbiddenError("Bạn không có quyền xóa bài tập này");
  }

  if (courseRecord.status === "published") {
    throw createBadRequestError("Không thể xóa bài tập của khóa học đã xuất bản");
  }

  await Exercise.deleteOne({ _id: exerciseId });
  await invalidateCourseCaches(courseRecord);
  return { message: "Xóa bài tập thành công" };
}

async function getCourseStudents(courseId, teacherId) {
  const courseRecord = await Course.findOne({
    _id: courseId,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createNotFoundError("Không tìm thấy khóa học hoặc bạn không có quyền");
  }

  return Enrollment.find({ course: courseId })
    .populate("student", "name email avatar isActive")
    .sort({ enrolledAt: -1 })
    .lean();
}

async function banStudentFromCourse(courseId, studentId, teacherId) {
  const courseRecord = await Course.findOne({
    _id: courseId,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createNotFoundError("Không tìm thấy khóa học");
  }

  const enrollmentRecord = await Enrollment.findOne({
    course: courseId,
    student: studentId,
  });
  if (!enrollmentRecord) {
    throw createNotFoundError("Không tìm thấy enrollment");
  }

  enrollmentRecord.isActive = false;
  await enrollmentRecord.save();
  await Course.findByIdAndUpdate(courseId, { $inc: { totalStudents: -1 } });
  await invalidateCourseCaches(courseRecord);
  await invalidateTeacherStats(teacherId);
  await invalidateUserEnrollments(studentId);

  return enrollmentRecord;
}

async function inviteStudentToFreeCourse(courseId, studentId, teacherId) {
  const courseRecord = await Course.findOne({
    _id: courseId,
    instructor: teacherId,
  });
  if (!courseRecord) {
    throw createNotFoundError("Không tìm thấy khóa học");
  }

  if (!courseRecord.isFree) {
    throw createBadRequestError("Chỉ khóa học miễn phí mới cho phép mời học viên");
  }

  const existingEnrollment = await Enrollment.findOne({
    course: courseId,
    student: studentId,
  });
  if (existingEnrollment) {
    if (!existingEnrollment.isActive) {
      existingEnrollment.isActive = true;
      await existingEnrollment.save();
      await Course.findByIdAndUpdate(courseId, { $inc: { totalStudents: 1 } });
    }
    await invalidateCourseCaches(courseRecord);
    await invalidateTeacherStats(teacherId);
    await invalidateUserEnrollments(studentId);
    return existingEnrollment.populate("student", "name email avatar");
  }

  const enrollmentRecord = await Enrollment.create({
    student: studentId,
    course: courseId,
    source: "teacher",
    progress: 0,
  });

  await Course.findByIdAndUpdate(courseId, { $inc: { totalStudents: 1 } });
  await invalidateCourseCaches(courseRecord);
  await invalidateTeacherStats(teacherId);
  await invalidateUserEnrollments(studentId);

  return enrollmentRecord.populate("student", "name email avatar");
}

async function getTeacherDashboard(teacherId) {
  return getTeacherStats(teacherId, async () => {
    const courseRecords = await Course.find({ instructor: teacherId }).lean();

    const totalCourses = courseRecords.length;
    const totalLessons = courseRecords.reduce(
      (sum, courseRecord) => sum + (courseRecord.totalLessons || 0),
      0,
    );
    const totalStudents = courseRecords.reduce(
      (sum, courseRecord) => sum + (courseRecord.totalStudents || 0),
      0,
    );
    const publishedCourses = courseRecords.filter(
      (courseRecord) => courseRecord.status === "published",
    ).length;
    const draftCourses = courseRecords.filter((courseRecord) => courseRecord.status === "draft").length;
    const pendingCourses = courseRecords.filter((courseRecord) => courseRecord.status === "pending").length;
    const rejectedCourses = courseRecords.filter((courseRecord) => courseRecord.status === "rejected").length;

    const courseIds = courseRecords.map((courseRecord) => courseRecord._id);
    const totalExercises = await Exercise.countDocuments({
      course: { $in: courseIds },
    });

    const recentCourses = await Course.find({ instructor: teacherId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    return {
      totalCourses,
      totalLessons,
      totalStudents,
      totalExercises,
      publishedCourses,
      draftCourses,
      pendingCourses,
      rejectedCourses,
      recentCourses,
    };
  });
}

export {
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
  getLessonExercises,
  getExerciseById,
  updateExercise,
  deleteExercise,
  getCourseStudents,
  banStudentFromCourse,
  inviteStudentToFreeCourse,
  getTeacherDashboard,
};
