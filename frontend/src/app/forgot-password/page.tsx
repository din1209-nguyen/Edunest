"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await api.post("/auth/forgot-password", { email });
      setMessage(
        response.data?.message ||
          "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
      );
    } catch (err: unknown) {
      const requestError = err as { response?: { data?: { message?: string; error?: string } } };
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 text-foreground">
      <div className="w-full max-w-md">
        <Card className="border-border bg-background shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Quên mật khẩu</CardTitle>
            <CardDescription>
              Nhập email tài khoản để nhận liên kết đặt lại mật khẩu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div className="rounded-lg bg-success-light p-3 text-sm text-success">
                  {message}
                </div>
              )}
              {error && (
                <div className="rounded-lg bg-error-light p-3 text-sm text-error">
                  {error}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.com"
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />

              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                Gửi hướng dẫn
              </Button>
            </form>

            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
