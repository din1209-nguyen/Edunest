"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import api from "@/lib/api";
import { buildApiUrl } from "@/lib/url";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Bạn đã từ chối quyền truy cập Google.",
  invalid_state: "Yêu cầu không hợp lệ. Vui lòng thử lại.",
  token_exchange_failed: "Không thể xác thực với Google. Vui lòng thử lại.",
  user_info_failed: "Không thể lấy thông tin từ Google.",
  no_email: "Google không cung cấp email. Vui lòng sử dụng đăng nhập thường.",
  server_error: "Đã xảy ra lỗi server. Vui lòng thử lại sau.",
  not_configured: "Đăng nhập Google chưa được bật.",
  no_code: "Không nhận được phản hồi từ Google.",
};

function getRoleDashboard(role?: string | null, isEmailVerified?: boolean) {
  if (isEmailVerified === false) {
    return null;
  }

  if (role === "admin") return "/admin/dashboard";
  return "/teacher/dashboard";
}

// Kiểm tra redirect nội bộ hợp lệ để tránh điều hướng ra ngoài hoặc quay lại trang login
function getSafeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (value.startsWith("/login")) {
    return null;
  }

  return value;
}

function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthErrorParam = searchParams.get("oauth_error");
  const oauthSuccess = searchParams.get("oauth");
  const loginMessageParam = searchParams.get("message");
  const emailParam = searchParams.get("email");
  const redirectParam = getSafeRedirect(searchParams.get("redirect"));
  const [oauthError] = useState(() =>
    oauthErrorParam
      ? OAUTH_ERROR_MESSAGES[oauthErrorParam] || "Đăng nhập Google thất bại. Vui lòng thử lại."
      : oauthSuccess === "success"
        ? "Phiên đăng nhập Google chưa được thiết lập. Vui lòng thử lại."
        : ""
  );
  const [loginMessage] = useState(() => loginMessageParam || "");

  const login = useAuthStore((state) => state.login);
  const hasBootstrapped = useAuthStore((state) => state.hasBootstrapped);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const hasRedirectedRef = useRef(false);
  const userRole = user?.role;

  useEffect(() => {
    if (!hasBootstrapped || isLoading || hasRedirectedRef.current) {
      return;
    }

    if (isAuthenticated && userRole) {
      const target = redirectParam || getRoleDashboard(userRole, user?.isEmailVerified);
      if (!target) {
        return;
      }

      hasRedirectedRef.current = true;
      router.replace(target);
    }
  }, [hasBootstrapped, isAuthenticated, isLoading, redirectParam, router, userRole, user?.isEmailVerified]);

  useEffect(() => {
    // Xóa query lỗi OAuth khỏi URL sau khi đã hiển thị thông báo cho người dùng
    if (!oauthErrorParam) {
      return;
    }

    router.replace("/login");
  }, [oauthErrorParam, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!emailParam) {
      return;
    }

    setValue("email", emailParam);
  }, [emailParam, setValue]);

  const onSubmit = async (formData: LoginFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const authResponse = await api.post("/auth/login", formData);
      const authPayload = authResponse.data?.data ?? authResponse.data;
      const authenticatedUser = authPayload.user ?? authPayload;

      // Đồng bộ user vào store rồi điều hướng ngay theo role sau khi đăng nhập thành công
      login(authenticatedUser);
      const target = redirectParam || getRoleDashboard(authenticatedUser.role, authenticatedUser.isEmailVerified);
      if (target) {
        router.replace(target);
      }
    } catch (err: unknown) {
      const requestError = err as {
        response?: { data?: { message?: string; error?: string; code?: string } };
      };
      const message =
        requestError.response?.data?.message ||
        requestError.response?.data?.error ||
        "Email hoặc mật khẩu không đúng";

      setError(message);
      setIsSubmitting(false);

      if (requestError.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        return;
      }
    }
  };

  const handleGoogleLogin = () => {
    const redirectPath = redirectParam;
    const oauthUrl = new URL(buildApiUrl("/auth/google"));

    // Gắn redirect hợp lệ để quay lại đúng màn hình sau khi hoàn tất OAuth
    if (redirectPath?.startsWith("/")) {
      oauthUrl.searchParams.set("redirect", redirectPath);
    }

    oauthUrl.searchParams.set("redirect_origin", window.location.origin);
    window.location.href = oauthUrl.toString();
  };

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
          <p className="mt-4 text-muted-foreground">Chào mừng bạn quay trở lại!</p>
        </div>

        <Card className="border-border bg-background shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center text-2xl">Đăng nhập</CardTitle>
            <CardDescription className="text-center">
              Nhập email và mật khẩu để đăng nhập vào tài khoản
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {(error || oauthError || loginMessage) && (
                <div className="rounded-lg bg-error-light p-3 text-sm text-error">
                  {oauthError || error || loginMessage}
                </div>
              )}

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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
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
                onClick={handleGoogleLogin}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Đăng nhập với Google
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Đăng ký ngay
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Bằng việc đăng nhập, bạn đồng ý với{" "}
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

function LoginPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 text-foreground">
      <div className="w-full max-w-md animate-pulse rounded-2xl border border-border bg-background p-8 shadow-lg">
        <div className="mb-6 h-8 rounded bg-surface" />
        <div className="space-y-4">
          <div className="h-12 rounded bg-surface" />
          <div className="h-12 rounded bg-surface" />
          <div className="h-12 rounded bg-surface" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginContent />
    </Suspense>
  );
}
