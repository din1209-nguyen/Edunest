import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Người dùng là bắt buộc"],
    },
    items: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

cartSchema.index({ user: 1 }, { unique: true });
cartSchema.index({ "items.course": 1 });
cartSchema.index({ createdAt: -1 });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
