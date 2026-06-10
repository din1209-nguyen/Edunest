import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Người dùng là bắt buộc"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Khóa học là bắt buộc"],
    },
    rating: {
      type: Number,
      required: [true, "Đánh giá là bắt buộc"],
      min: [1, "Đánh giá tối thiểu là 1 sao"],
      max: [5, "Đánh giá tối đa là 5 sao"],
    },
    comment: {
      type: String,
      maxlength: [2000, "Bình luận không được vượt quá 2000 ký tự"],
      trim: true,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpful: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulVotes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        votedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    instructorReply: {
      type: {
        comment: {
          type: String,
          maxlength: [1000, "Phản hồi không được vượt quá 1000 ký tự"],
        },
        repliedAt: {
          type: Date,
        },
      },
      default: null,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index cho query hiệu quả
reviewSchema.index({ course: 1, createdAt: -1 });
reviewSchema.index({ user: 1, course: 1 }, { unique: true });
reviewSchema.index({ course: 1, rating: 1 });

// Virtual để populate user info
reviewSchema.virtual("userInfo", {
  ref: "User",
  localField: "user",
  foreignField: "_id",
  justOne: true,
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
