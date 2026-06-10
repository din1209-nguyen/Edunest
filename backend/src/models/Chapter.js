import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề chương là bắt buộc"],
      trim: true,
      maxlength: [200, "Tiêu đề không được vượt quá 200 ký tự"],
    },
    description: {
      type: String,
      maxlength: [500, "Mô tả không được vượt quá 500 ký tự"],
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Khóa học là bắt buộc"],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

chapterSchema.index({ course: 1, order: 1 });

const Chapter = mongoose.model("Chapter", chapterSchema);

export default Chapter;
