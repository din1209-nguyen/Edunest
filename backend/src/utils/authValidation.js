import { z } from "zod";

const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Tên phải có ít nhất 2 ký tự")
    .max(100, "Tên không được vượt quá 100 ký tự")
    .trim(),
  email: z.string().email("Email không hợp lệ").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .max(100, "Mật khẩu không được vượt quá 100 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 số"),
  role: z.enum(["user", "admin"]).optional().default("user"),
});

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ").toLowerCase().trim(),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token là bắt buộc"),
});

const resendVerificationSchema = z.object({
  email: z.string().email("Email không hợp lệ").toLowerCase().trim(),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token xác minh là bắt buộc"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ").toLowerCase().trim(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token đặt lại mật khẩu là bắt buộc"),
  newPassword: z
    .string()
    .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
    .max(100, "Mật khẩu mới không được vượt quá 100 ký tự")
    .regex(/[A-Z]/, "Mật khẩu mới phải chứa ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Mật khẩu mới phải chứa ít nhất 1 số"),
});

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Tên phải có ít nhất 2 ký tự")
    .max(100, "Tên không được vượt quá 100 ký tự")
    .optional(),
  bio: z.string().max(500, "Bio không được vượt quá 500 ký tự").optional(),
  avatar: z
    .string()
    .url("Avatar phải là URL hợp lệ")
    .optional()
    .or(z.literal("")),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
  newPassword: z
    .string()
    .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
    .max(100, "Mật khẩu mới không được vượt quá 100 ký tự")
    .regex(/[A-Z]/, "Mật khẩu mới phải chứa ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Mật khẩu mới phải chứa ít nhất 1 số"),
});

export {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  resendVerificationSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
};
