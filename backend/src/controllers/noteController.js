import {
  layGhiChuTheoBaiHoc,
  taoGhiChu,
  capNhatGhiChu,
  xoaGhiChu,
} from "../services/noteService.js";

async function getNotes(req, res, next) {
  try {
    const notes = await layGhiChuTheoBaiHoc(
      req.user.userId,
      req.params.lessonId,
    );
    res.json({
      success: true,
      message: "Lấy danh sách ghi chú thành công",
      data: { notes },
    });
  } catch (error) {
    next(error);
  }
}

async function createNote(req, res, next) {
  try {
    const { content, courseId, timestamp } = req.body;
    const { lessonId } = req.params;

    if (!content) {
      const err = new Error("Nội dung ghi chú là bắt buộc");
      err.statusCode = 400;
      return next(err);
    }

    if (!courseId) {
      const err = new Error("courseId là bắt buộc");
      err.statusCode = 400;
      return next(err);
    }

    const note = await taoGhiChu(
      req.user.userId,
      lessonId,
      courseId,
      content,
      timestamp || 0,
    );
    res.status(201).json({
      success: true,
      message: "Tạo ghi chú thành công",
      data: { note },
    });
  } catch (error) {
    next(error);
  }
}

async function updateNote(req, res, next) {
  try {
    const { content } = req.body;

    if (!content) {
      const err = new Error("Nội dung ghi chú là bắt buộc");
      err.statusCode = 400;
      return next(err);
    }

    const note = await capNhatGhiChu(
      req.params.noteId,
      req.user.userId,
      content,
    );
    res.json({
      success: true,
      message: "Cập nhật ghi chú thành công",
      data: { note },
    });
  } catch (error) {
    next(error);
  }
}

async function deleteNote(req, res, next) {
  try {
    await xoaGhiChu(req.params.noteId, req.user.userId);
    res.json({
      success: true,
      message: "Xóa ghi chú thành công",
    });
  } catch (error) {
    next(error);
  }
}

export { getNotes, createNote, updateNote, deleteNote };
