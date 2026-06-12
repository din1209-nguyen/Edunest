import Note from "../models/Note.js";

async function layGhiChuTheoBaiHoc(userId, lessonId) {
  const notes = await Note.find({ student: userId, lesson: lessonId })
    .sort({ createdAt: -1 })
    .lean();
  return notes;
}

async function taoGhiChu(userId, lessonId, courseId, content, timestamp = 0) {
  const note = await Note.create({
    student: userId,
    lesson: lessonId,
    course: courseId,
    content,
    timestamp,
  });
  return note;
}

async function capNhatGhiChu(noteId, userId, content) {
  const note = await Note.findOne({ _id: noteId, student: userId });

  if (!note) {
    const err = new Error("Không tìm thấy ghi chú hoặc bạn không có quyền");
    err.statusCode = 404;
    throw err;
  }

  note.content = content;
  await note.save();
  return note;
}

async function xoaGhiChu(noteId, userId) {
  const note = await Note.findOneAndDelete({ _id: noteId, student: userId });

  if (!note) {
    const err = new Error("Không tìm thấy ghi chú hoặc bạn không có quyền");
    err.statusCode = 404;
    throw err;
  }

  return { message: "Xóa ghi chú thành công" };
}

export { layGhiChuTheoBaiHoc, taoGhiChu, capNhatGhiChu, xoaGhiChu };
