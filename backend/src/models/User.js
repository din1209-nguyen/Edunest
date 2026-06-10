import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên người dùng là bắt buộc"],
      trim: true,
      maxlength: [100, "Tên không được vượt quá 100 ký tự"],
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
    },
    password: {
      type: String,
      default: null,
      select: false,
      validate: {
        validator(value) {
          if (this.googleId && !value) {
            return true;
          }

          if (typeof value === "string" && value.startsWith("$2")) {
            return true;
          }

          return typeof value === "string" && /^(?=.*[A-Z])(?=.*\d).{8,100}$/.test(value);
        },
        message: "Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa và 1 số",
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: [500, "Bio không được vượt quá 500 ký tự"],
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },
    emailVerificationExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    refreshTokenVersion: {
      type: Number,
      default: 1,
    },
    googleId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("validate", function () {
  if (!this.googleId && !this.password) {
    this.invalidate("password", "Mật khẩu là bắt buộc");
  }
});

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }

  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokenVersion;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpiresAt;
  delete user.passwordResetToken;
  delete user.passwordResetExpiresAt;
  delete user.__v;
  return user;
};

userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ googleId: 1 }, { sparse: true });

const User = mongoose.model("User", userSchema);

export default User;
