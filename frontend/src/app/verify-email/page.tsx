"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck, RefreshCcw } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

function VerifyEmailContent() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailFromQuery = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromQuery);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(emailFromQuery ? 60 : 0);

  const hasToken = useMemo(() => Boolean(token), [token]);

  useEffect(() => {
    if (!hasToken) {
      return;
    }

    if (user?.isEmailVerified) {
      router.replace("/login");
    }
  }, [hasToken, router, user?.isEmailVerified]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (!token || isVerifying) return;

    setIsVerifying(true);
    setError("");
    setMessage("");

    try {
      await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
      setVerified(true);
      setMessage("Email đã được xác minh thành công. Bạn có thể đăng nhập ngay.");
      setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } catch (err: unknown) {
      const requestError = err as { response?: { data?: { message?: string; error?: string } } };
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Không thể xác minh email. Vui lòng thử lại.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || isSubmitting || resendCooldown > 0) return;

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/auth/resend-verification", { email });
      const deliveryFailed = Boolean(response.data?.data?.emailDeliveryFailed);
      setMessage(
        response.data?.message || "Đã gửi lại email xác minh. Vui lòng kiểm tra hộp thư của bạn.",
      );
      setResendCooldown(60);

      if (deliveryFailed) {
        setError(
          `Brevo đang hết credit nên email chưa rời hệ thống. Khi nạp lại credit trong vòng 36 giờ, Brevo sẽ tự retry email backlog.`,
        );
      }
    } catch (err: unknown) {
      const requestError = err as { response?: { data?: { message?: string; error?: string } } };
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Không thể gửi lại email xác minh.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 text-foreground">
      <div className="w-full max-w-lg">
        <Card className="border-border bg-background shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <MailCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">Xác minh email</CardTitle>
            <CardDescription>
              {hasToken
                ? "Nhấn nút bên dưới để hoàn tất xác minh email của bạn."
                : "Chúng tôi đã gửi email xác minh. Nếu chưa nhận được, bạn có thể yêu cầu gửi lại."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && <div className="rounded-lg bg-success-light p-3 text-sm text-success">{message}</div>}
            {error && <div className="rounded-lg bg-error-light p-3 text-sm text-error">{error}</div>}

            {hasToken ? (
              <>
                <Button className="w-full" size="lg" onClick={handleVerify} isLoading={isVerifying || verified}>
                  {verified ? "Đã xác minh" : "Xác minh ngay"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Nếu liên kết đã hết hạn, bạn có thể yêu cầu gửi lại email xác minh.
                </p>
              </>
            ) : (
              <>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your@email.com"
                />
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleResend}
                  isLoading={isSubmitting}
                  disabled={resendCooldown > 0}
                  leftIcon={<RefreshCcw className="h-4 w-4" />}
                >
                  {resendCooldown > 0
                    ? `Gửi lại sau ${resendCooldown}s`
                    : "Gửi lại email xác minh"}
                </Button>
              </>
            )}

            <div className="pt-2 text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
                Quay lại đăng nhập
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
