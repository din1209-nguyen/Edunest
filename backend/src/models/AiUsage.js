import mongoose from "mongoose";

const aiUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    resetAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

aiUsageSchema.index({ user: 1, dateKey: 1 }, { unique: true });

const AiUsage = mongoose.model("AiUsage", aiUsageSchema);

export default AiUsage;
