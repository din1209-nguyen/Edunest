"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useCartStore, useToastStore } from "@/stores/wishlistStore";
import { useAuthStore } from "@/stores/auth";
import { checkoutCartAction } from "./actions";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { Trash2, ShoppingCart, ArrowRight, Tag, ShieldCheck, Wallet } from "lucide-react";

const COURSE_THUMBNAIL_FALLBACK = "/placeholder-course.svg";

export default function CartPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { items, removeItem, getTotalPrice, clearCart } = useCartStore();
  const addToast = useToastStore((s) => s.addToast);

  const [hasMounted, setHasMounted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<"mock" | "vnpay">("mock");
  const visibleItems = hasMounted ? items : [];

  useEffect(() => {
    queueMicrotask(() => setHasMounted(true));
  }, []);

  useEffect(() => {
    if (hasMounted && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasMounted, isAuthenticated, router]);

  if (!hasMounted || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-muted-foreground">
        Đang tải dữ liệu...
      </div>
    );
  }

  const subtotal = hasMounted ? getTotalPrice() : 0;
  const discount = visibleItems.reduce((acc, item) => {
    const originalPrice = item.estimatedPrice || item.price * 1.3;
    return acc + (originalPrice - item.price);
  }, 0);

  const handleCheckout = async () => {
    if (visibleItems.length === 0 || isCheckingOut) return;

    setIsCheckingOut(true);
    try {
      const result = await checkoutCartAction(checkoutMethod);

      if (checkoutMethod === "vnpay" && result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      clearCart();
      addToast({ type: "success", message: "Thanh toán thành công. Bạn có thể bắt đầu học ngay." });
      router.push(result.redirectUrl || "/student/checkout/result?success=true&method=mock");
    } catch (err) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Thanh toán thất bại. Vui lòng thử lại." });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (visibleItems.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Giỏ hàng</h1>
          <p className="mt-1 text-muted-foreground">{visibleItems.length} khóa học trong giỏ hàng</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-surface-2 p-6">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-foreground">Giỏ hàng trống</h2>
            <p className="mt-2 text-center text-muted-foreground max-w-sm">
              Bạn chưa thêm khóa học nào vào giỏ hàng. Hãy khám phá các khóa học thú vị của chúng tôi!
            </p>
            <Link href="/courses" className="mt-6">
              <Button className="gap-2">
                Khám phá khóa học
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Giỏ hàng</h1>
        <p className="mt-1 text-muted-foreground">{visibleItems.length} khóa học trong giỏ hàng</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {visibleItems.map((course) => {
            const discountAmount = calculateDiscount(
              course.estimatedPrice || course.price * 1.3,
              course.price
            );

            return (
              <Card key={course._id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative h-40 w-full sm:h-auto sm:w-48 shrink-0">
                    <Image
                      src={course.thumbnail || COURSE_THUMBNAIL_FALLBACK}
                      alt={course.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 192px"
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant="secondary" size="sm" className="mb-2">
                          {typeof course.category === "string" ? course.category : course.category.name}
                        </Badge>
                        <Link
                          href={`/courses/${course.slug}`}
                          className="text-lg font-semibold text-foreground hover:text-primary-600 transition-colors line-clamp-1"
                        >
                          {course.title}
                        </Link>
                        <div className="mt-2 flex items-center gap-2">
                          <Avatar
                            src={(course.instructor as { avatar?: string })?.avatar}
                            name={(course.instructor as { name?: string })?.name}
                            size="xs"
                          />
                          <span className="text-sm text-muted-foreground">
                            {(course.instructor as { name?: string })?.name}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-xl font-bold text-primary-600">
                            {formatPrice(course.price)}
                          </span>
                          {discountAmount > 0 && (
                            <>
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(course.estimatedPrice || course.price * 1.3)}
                              </span>
                              <Badge variant="error" size="sm">
                                -{discountAmount}%
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-error"
                        onClick={() => removeItem(course._id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tóm tắt đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tạm tính ({visibleItems.length} khóa)</span>
                  <span className="text-foreground">{formatPrice(subtotal + discount)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-success">Giảm giá</span>
                    <span className="text-success">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2" />
                <div className="flex justify-between font-semibold">
                  <span className="text-foreground">Tổng cộng</span>
                  <span className="text-xl text-primary-600">{formatPrice(subtotal)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface/70 p-4">
                <p className="text-sm font-medium text-foreground">Phương thức thanh toán</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutMethod("mock")}
                    className={`rounded-xl border p-3 text-left transition ${
                      checkoutMethod === "mock"
                        ? "border-primary-500 bg-primary-50"
                        : "border-border bg-background hover:border-primary-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary-600" />
                      Thanh toán mock
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Dùng cho môi trường dev/demo để ghi danh ngay lập tức
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutMethod("vnpay")}
                    className={`rounded-xl border p-3 text-left transition ${
                      checkoutMethod === "vnpay"
                        ? "border-primary-500 bg-primary-50"
                        : "border-border bg-background hover:border-primary-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Wallet className="h-4 w-4 text-secondary-600" />
                      VNPay Sandbox
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Chuyển sang cổng VNPay sandbox nếu env đã cấu hình đầy đủ
                    </p>
                  </button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleCheckout}
                isLoading={isCheckingOut}
              >
                Thanh toán
                <ArrowRight className="h-5 w-5" />
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Bằng việc thanh toán, bạn đồng ý với{" "}
                <Link href="/terms" className="underline hover:text-primary-600">
                  Điều khoản sử dụng
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
