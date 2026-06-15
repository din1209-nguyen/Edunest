import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề khóa học là bắt buộc"],
      trim: true,
      maxlength: [200, "Tiêu đề không được vượt quá 200 ký tự"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Mô tả khóa học là bắt buộc"],
      maxlength: [2000, "Mô tả không được vượt quá 2000 ký tự"],
    },
    shortDescription: {
      type: String,
      maxlength: [300, "Mô tả ngắn không được vượt quá 300 ký tự"],
    },
    thumbnail: {
      type: String,
      default: "",
    },
    previewVideo: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Giá khóa học là bắt buộc"],
      min: [0, "Giá không được âm"],
      default: 0,
    },
    discountPrice: {
      type: Number,
      min: [0, "Giá giảm không được âm"],
      default: 0,
    },
    pendingPrice: {
      type: Number,
      min: [0, "Giá chờ duyệt không được âm"],
      default: null,
    },
    pendingDiscountPrice: {
      type: Number,
      min: [0, "Giá bán chờ duyệt không được âm"],
      default: null,
    },
    pendingIsFree: {
      type: Boolean,
      default: null,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    category: {
      type: String,
      required: [true, "Danh mục là bắt buộc"],
      trim: true,
    },
    language: {
      type: String,
      default: "English",
    },
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    outcomes: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected", "locked", "banned"],
      default: "draft",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Giảng viên là bắt buộc"],
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    totalLessons: {
      type: Number,
      default: 0,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Tạo slug tự động từ title
courseSchema.pre("save", function () {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
});

// Virtual cho giá cuối cùng
courseSchema.virtual("finalPrice").get(function () {
  if (this.isFree) {
    return 0;
  }

  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

// Index cho search
courseSchema.index({ title: "text", description: "text" });
courseSchema.index({ instructor: 1, status: 1 });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ status: 1, rating: -1 });
courseSchema.index({ status: 1, createdAt: -1 });
courseSchema.index({ isFeatured: 1, createdAt: -1 });
courseSchema.index({ price: 1 });
courseSchema.index({ isFree: 1, status: 1 });
courseSchema.index({ isFree: 1, createdAt: -1 });
courseSchema.index({ instructor: 1, status: 1, isFeatured: -1 });

const Course = mongoose.model("Course", courseSchema);

export default Course;
