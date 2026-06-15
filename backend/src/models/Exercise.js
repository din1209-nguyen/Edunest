import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề bài tập là bắt buộc"],
      trim: true,
      maxlength: [200, "Tiêu đề không được vượt quá 200 ký tự"],
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
    type: {
      type: String,
      enum: ["single-choice", "multiple-choice", "fill-blank", "short-answer"],
      default: "single-choice",
    },
    skill: {
      type: String,
      enum: ["reading", "listening", "writing", "grammar", "vocabulary"],
      default: "grammar",
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    questions: [
      {
        questionText: {
          type: String,
          required: true,
        },
        options: [
          {
            type: String,
          },
        ],
        correctAnswers: [
          {
            type: String,
          },
        ],
        explanation: {
          type: String,
          default: "",
        },
        points: {
          type: Number,
          default: 1,
          min: 1,
        },
      },
    ],
    timeLimit: {
      type: Number,
      default: 0,
    },
    passingScore: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    contentStatus: {
      type: String,
      enum: ["approved", "pending"],
      default: "approved",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

exerciseSchema.index({ lesson: 1 });

const Exercise = mongoose.model("Exercise", exerciseSchema);

export default Exercise;
