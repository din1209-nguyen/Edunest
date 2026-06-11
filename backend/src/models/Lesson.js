import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề bài học là bắt buộc"],
      trim: true,
      maxlength: [200, "Tiêu đề không được vượt quá 200 ký tự"],
    },
    description: {
      type: String,
      maxlength: [1000, "Mô tả không được vượt quá 1000 ký tự"],
    },
    content: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      default: "",
    },
    videoDuration: {
      type: Number,
      default: 0,
    },
    documentUrl: {
      type: String,
      default: "",
    },
    documentType: {
      type: String,
      enum: ["pdf", "doc", "ppt", "none"],
      default: "none",
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: [true, "Chương là bắt buộc"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Khóa học là bắt buộc"],
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: ["video", "document", "text", "quiz"],
      default: "video",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

lessonSchema.index({ chapter: 1, order: 1 });
lessonSchema.index({ course: 1 });

const Lesson = mongoose.model("Lesson", lessonSchema);

export default Lesson;
