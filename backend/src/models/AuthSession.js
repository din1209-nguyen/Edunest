import mongoose from "mongoose";

const authSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },
    userAgent: {
      type: String,
      default: "",
      maxlength: 500,
    },
    ip: {
      type: String,
      default: "",
      maxlength: 120,
    },
    deviceLabel: {
      type: String,
      default: "Thiết bị không xác định",
      maxlength: 120,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

authSessionSchema.index({ user: 1, revokedAt: 1, lastSeenAt: -1 });

const AuthSession = mongoose.model("AuthSession", authSessionSchema);

export default AuthSession;
