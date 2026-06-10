import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Học viên là bắt buộc"],
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: [true, "Bài học là bắt buộc"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Nội dung ghi chú là bắt buộc"],
      maxlength: [5000, "Ghi chú không được vượt quá 5000 ký tự"],
    },
    timestamp: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

noteSchema.index({ student: 1, lesson: 1 });

const Note = mongoose.model("Note", noteSchema);

export default Note;
