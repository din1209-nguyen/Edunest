"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatPrice, calculateDiscount, cn } from "@/lib/utils";
import { addCourseToCartAction } from "@/app/courses/[slug]/actions";
import { useCartStore, useWishlistStore, useToastStore } from "@/stores/wishlistStore";
import { useAuthStore } from "@/stores/auth";
import {
  Heart,
  ShoppingCart,
  Users,
  Star,
  BookOpen,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";
import type { Course } from "@/types";

interface CourseCardProps {
  course: Course;
  variant?: "default" | "compact" | "horizontal";
  className?: string;
}

const levelLabels = {
  beginner: "Người mới",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

const levelColors = {
  beginner: "bg-success-light text-success",
  intermediate: "bg-warning-light text-warning",
  advanced: "bg-error-light text-error",
};

function CourseBadges({
  course,
  discount,
  showDiscount = false,
}: {
  course: Course;
  discount: number;
  showDiscount?: boolean;
}) {
  return (
    <>
      {course.isPurchased && (
        <Badge className="bg-success text-white shadow-sm">Đã mua</Badge>
      )}
      {course.isBestseller && !course.isPurchased && (
        <Badge className="bg-warning shadow-sm">Bán chạy</Badge>
      )}
      {course.isFeatured && (
        <Badge variant="secondary" className="shadow-sm">
          Nổi bật
        </Badge>
      )}
      {showDiscount && discount > 20 && !course.isPurchased && (
        <Badge variant="error" className="shadow-sm">
          -{discount}%
        </Badge>
      )}
    </>
  );
}

export function CourseCard({ course, variant = "default", className }: CourseCardProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [isCartPending, startCartTransition] = useTransition();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addToast = useToastStore((state) => state.addToast);
  const { addItem: addToCart, isInCart } = useCartStore();
  const { addItem: addToWishlist, isInWishlist, removeItem: removeFromWishlist } = useWishlistStore();

  useEffect(() => {
    queueMicrotask(() => setHasMounted(true));
  }, []);

  const isPurchased = !!course.isPurchased;
  const isInCartState = hasMounted && isInCart(course._id);
  const isInWishlistState = hasMounted && isInWishlist(course._id);
  const discount = calculateDiscount(course.estimatedPrice || course.price * 1.3, course.price);
  const courseHref = `/courses/${course.slug}`;

  const handleWishlistToggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      addToast({ type: "warning", message: "Vui lòng đăng nhập để sử dụng tính năng này" });
      router.push("/login");
      return;
    }

    if (isInWishlistState) {
      removeFromWishlist(course._id);
    } else {
      addToWishlist(course);
    }
  };

  const handleAddToCart = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (isPurchased) {
      router.push("/student/my-courses");
      return;
    }

    if (!isAuthenticated) {
      addToast({ type: "warning", message: "Vui lòng đăng nhập để sử dụng tính năng này" });
      router.push("/login");
      return;
    }

    if (isInCartState || isCartPending) {
      return;
    }

    startCartTransition(async () => {
      try {
        await addCourseToCartAction(course._id);
        addToCart(course);
        addToast({ type: "success", message: "Đã thêm khóa học vào giỏ hàng" });
      } catch (error) {
        addToast({
          type: "error",
          message: error instanceof Error ? error.message : "Không thể thêm khóa học vào giỏ hàng",
        });
      }
    });
  };

  if (variant === "compact") {
    return (
      <Link href={courseHref}>
        <Card className={cn("interactive-card overflow-hidden", className)}>
          <div className="flex gap-3 p-3">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg sm:w-28">
              <Image
                src={course.thumbnail || "/placeholder-course.svg"}
                alt={course.title}
                fill
                sizes="112px"
                className="object-cover"
              />
              <div className="absolute left-1 top-1 flex max-w-[calc(100%-0.5rem)] flex-wrap gap-1">
                <CourseBadges course={course} discount={discount} />
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <h3 className="line-clamp-2 text-sm font-medium leading-tight">
                  {course.title}
                </h3>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {(course.instructor as { name?: string })?.name || "Giảng viên"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-primary-600">
                  {formatPrice(course.price)}
                </span>
                {discount > 0 && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(course.estimatedPrice || course.price * 1.3)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link href={courseHref}>
        <Card className={cn("interactive-card overflow-hidden", className)}>
          <div className="flex flex-col gap-4 p-4 sm:flex-row">
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg sm:h-32 sm:w-48">
              <Image
                src={course.thumbnail || "/placeholder-course.svg"}
                alt={course.title}
                fill
                sizes="192px"
                className="object-cover"
              />
              <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
                <CourseBadges course={course} discount={discount} />
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn("text-xs", levelColors[course.level])}>
                    {levelLabels[course.level]}
                  </Badge>
                </div>
                <h3 className="mt-2 line-clamp-2 text-lg font-semibold">
                  {course.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {course.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Avatar
                    src={(course.instructor as { avatar?: string })?.avatar}
                    name={(course.instructor as { name?: string })?.name}
                    size="xs"
                  />
                  <span className="truncate text-sm text-muted-foreground">
                    {(course.instructor as { name?: string })?.name || "Giảng viên"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course.enrolledCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.totalLessons || 0} bài
                  </span>
                  {course.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      {course.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary-600 sm:text-xl">
                    {formatPrice(course.price)}
                  </span>
                  {discount > 0 && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(course.estimatedPrice || course.price * 1.3)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden border-slate-200/90 bg-white shadow-course-card transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-course-hover",
        className,
      )}
    >
      <div className="relative aspect-video shrink-0 overflow-hidden">
        <Link
          href={courseHref}
          className="block h-full"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("button")) {
              event.preventDefault();
            }
          }}
        >
          <Image
            src={course.thumbnail || "/placeholder-course.svg"}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100">
            <PlayCircle className="h-3.5 w-3.5" />
            Xem demo
          </span>
        </Link>

        <div className="absolute left-2 top-2 z-20 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1">
          <CourseBadges course={course} discount={discount} showDiscount />
        </div>

        <button
          type="button"
          onClick={handleWishlistToggle}
          className="absolute right-2 top-2 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-110"
          aria-label={isInWishlistState ? "Bỏ yêu thích" : "Thêm yêu thích"}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isInWishlistState
                ? "fill-error text-error"
                : "text-muted-foreground hover:text-error",
            )}
          />
        </button>
      </div>

      <Link
        href={courseHref}
        className="flex h-full flex-col p-4"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("button")) {
            event.preventDefault();
          }
        }}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge className={cn("text-xs", levelColors[course.level])}>
            {levelLabels[course.level]}
          </Badge>
          <span className="text-muted-foreground">
            {(course.category as { name?: string })?.name || "Khóa học"}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-tight transition-colors group-hover:text-primary-600">
          {course.title}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <Avatar
            src={(course.instructor as { avatar?: string })?.avatar}
            name={(course.instructor as { name?: string })?.name}
            size="xs"
          />
          <span className="truncate text-sm text-muted-foreground">
            {(course.instructor as { name?: string })?.name || "Giảng viên"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm">
            <Users className="h-3.5 w-3.5" />
            {course.enrolledCount || 0}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm">
            <BookOpen className="h-3.5 w-3.5" />
            {course.totalLessons || 0} bài
          </span>
          {course.rating && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              {course.rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-4">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary-600">
              {formatPrice(course.price)}
            </span>
            {discount > 0 && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(course.estimatedPrice || course.price * 1.3)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant={isPurchased || isInCartState ? "outline" : "default"}
            onClick={handleAddToCart}
            isLoading={!isPurchased && isCartPending}
            className="w-full gap-1"
          >
            {isPurchased ? <CheckCircle2 className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {isPurchased ? "Đã mua" : isInCartState ? "Đã thêm" : "Thêm vào giỏ hàng"}
          </Button>
        </div>
      </Link>
    </Card>
  );
}
