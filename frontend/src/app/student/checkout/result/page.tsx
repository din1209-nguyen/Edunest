"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useCartStore, useToastStore } from "@/stores/wishlistStore";
import { CheckCircle2, CircleAlert, ArrowRight, Wallet, ShieldCheck } from "lucide-react";

function CheckoutResultContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const paymentId = searchParams.get("paymentId");
  const method = searchParams.get("method") || "vnpay";
  const message = searchParams.get("message") || "";
  const clearCart = useCartStore((state) => state.clearCart);
  const addToast = useToastStore((state) => state.addToast);
  const hasSyncedVNPayResult = useRef(false);

  useEffect(() => {
    if (!success || method !== "vnpay" || hasSyncedVNPayResult.current) {
      return;
    }

    hasSyncedVNPayResult.current = true;
    clearCart();
    addToast({
      type: "success",
      message: "Thanh toán VNPay thành công. Giỏ hàng đã được cập nhật.",
    });
  }, [addToast, clearCart, method, success]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="overflow-hidden border-white/70 bg-white/90 shadow-card">
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary-50 via-white to-secondary-50">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                success ? "bg-success-light text-success" : "bg-error-light text-error"
              }`}
            >
              {success ? <CheckCircle2 className="h-7 w-7" /> : <CircleAlert className="h-7 w-7" />}
            </div>
            <div>
              <Badge variant={success ? "success" : "error"} className="mb-2">
                {success ? "Thanh toán thành công" : "Thanh toán chưa hoàn tất"}
              </Badge>
              <CardTitle className="text-2xl">
                {success ? "Đăng ký khóa học thành công" : "Không thể hoàn tất thanh toán"}
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                {method === "mock" ? (
                  <ShieldCheck className="h-4 w-4 text-primary-600" />
                ) : (
                  <Wallet className="h-4 w-4 text-secondary-600" />
                )}
                Phương thức
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {method === "mock" ? "Mock checkout (development/demo)" : "VNPay sandbox"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface/70 p-4">
              <p className="text-sm font-medium text-foreground">Mã giao dịch</p>
              <p className="mt-2 break-all text-sm text-muted-foreground">
                {paymentId || "Sẽ xuất hiện sau khi cổng thanh toán trả kết quả"}
              </p>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 text-sm ${
              success
                ? "border-success/20 bg-success-light/60 text-success"
                : "border-error/20 bg-error-light/60 text-error"
            }`}
          >
            {success
              ? "Khóa học đã được thêm vào thư viện học tập của bạn. Bạn có thể bắt đầu học ngay bây giờ."
              : message ||
                "VNPay hoặc phiên thanh toán chưa hoàn tất. Hãy kiểm tra lại cấu hình môi trường hoặc thử lại sau."}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={success ? "/student/my-courses" : "/student/cart"} className="flex-1">
              <Button className="w-full" size="lg">
                {success ? "Đi tới khóa học của tôi" : "Quay lại giỏ hàng"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/courses" className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                Khám phá thêm khóa học
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutResultContent />
    </Suspense>
  );
}
