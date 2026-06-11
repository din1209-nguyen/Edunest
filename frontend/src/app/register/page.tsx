"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { buildApiUrl } from "@/lib/url";

const registerSchema = z
  .object({
    name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    password: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ hoa")
      .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 số"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function getRoleDashboard(role?: string | null) {
  if (role === "admin") return "/admin/dashboard";
  return "/teacher/dashboard";
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      const payload = response.data?.data ?? response.data;
      const verificationRequired = Boolean(response.data?.verificationRequired);
      const registeredEmail = payload.email || data.email;
      const user = payload.user ?? null;
      setSuccess(true);

      setTimeout(() => {
        if (verificationRequired) {
          router.replace(`/verify-email?email=${encodeURIComponent(registeredEmail)}`);
          return;
        }

        router.replace(getRoleDashboard(user?.role));
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } } };
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    const url = new URL(buildApiUrl("/auth/google"));
    url.searchParams.set("redirect", "/teacher/dashboard");
    url.searchParams.set("redirect_origin", window.location.origin);
    window.location.href = url.toString();
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 text-foreground">
        <Card className="w-full max-w-md border-border bg-background text-center shadow-lg">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Đăng ký thành công!</h2>
            <p className="mt-2 text-muted-foreground">
              Tài khoản của bạn đã được tạo. Đang chuyển hướng...
            </p>
            <div className="mt-6">
              <div className="h-1 w-full overflow-hidden rounded-full bg-surface-hover">
                <div className="h-full animate-pulse rounded-full bg-primary-600" style={{ width: "100%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 shadow-lg">
              <svg
                className="h-7 w-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span className="text-3xl font-bold">
              <span className="text-primary-600">Din</span>
              <span className="text-secondary-600">HaoHoc</span>
            </span>
          </Link>
          <p className="mt-4 text-muted-foreground">Tạo tài khoản mới để bắt đầu học!</p>
        </div>

        <Card className="border-border bg-background shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Đăng ký</CardTitle>
            <CardDescription className="text-center">
              Điền thông tin bên dưới để tạo tài khoản mới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-error-light p-3 text-sm text-error">
                  {error}
                </div>
              )}

              <Input
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
              />

              <div className="relative">
                <Input
                  label="Mật khẩu"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                  error={errors.password?.message}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Xác nhận mật khẩu"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                {isLoading ? "Đang đăng ký..." : "Đăng ký"}
              </Button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Hoặc tiếp tục với
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogleRegister}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Đăng ký với Google
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Đăng ký bằng Google hiện sẽ tạo tài khoản học viên mặc định.
              </p>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
                Đăng nhập ngay
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Bằng việc đăng ký, bạn đồng ý với{" "}
          <Link href="/terms" className="underline hover:text-primary-600">
            Điều khoản sử dụng
          </Link>{" "}
          và{" "}
          <Link href="/privacy" className="underline hover:text-primary-600">
            Chính sách bảo mật
          </Link>{" "}
          của chúng tôi.
        </p>
      </div>
    </div>
  );
}
