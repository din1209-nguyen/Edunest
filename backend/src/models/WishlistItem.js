import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Mỗi user chỉ có 1 wishlist item cho mỗi course
wishlistItemSchema.index({ user: 1, course: 1 }, { unique: true });

const WishlistItem = mongoose.model("WishlistItem", wishlistItemSchema);

export default WishlistItem;
