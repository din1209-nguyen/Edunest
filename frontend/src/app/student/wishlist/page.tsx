"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useCartStore, useWishlistStore, useToastStore } from "@/stores/wishlistStore";
import { useAuthStore } from "@/stores/auth";
import { formatPrice, cn } from "@/lib/utils";
import {
  Search,
  Heart,
  ShoppingCart,
  Trash2,
  Grid3X3,
  List,
  Star,
  BookOpen,
} from "lucide-react";
import type { Course } from "@/types";

const COURSE_THUMBNAIL_FALLBACK = "/placeholder-course.svg";

export default function WishlistPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const wishlistItems = useWishlistStore((s) => s.items);
  const removeWishlistItem = useWishlistStore((s) => s.removeItem);

  const addCartItem = useCartStore((s) => s.addItem);
  const isInCart = useCartStore((s) => s.isInCart);

  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    queueMicrotask(() => setHasMounted(true));
  }, []);

  useEffect(() => {
    if (hasMounted && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasMounted, isAuthenticated, router]);

  const filteredCourses = useMemo(() => {
    const visibleWishlistItems = hasMounted ? wishlistItems : [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return visibleWishlistItems;
    return visibleWishlistItems.filter((course) => course.title.toLowerCase().includes(q));
  }, [hasMounted, wishlistItems, searchQuery]);

  const handleRemove = (id: string) => {
    removeWishlistItem(id);
  };

  const handleAddToCart = (course: Course) => {
    if (hasMounted && isInCart(course._id)) {
      addToast({ type: "info", message: "Khóa học đã có trong giỏ hàng" });
      return;
    }

    addCartItem(course);
    addToast({ type: "success", message: "Đã thêm vào giỏ hàng" });
  };
  if (!hasMounted || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-muted-foreground">
        Đang tải dữ liệu...
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Danh sách yêu thích</h1>
            <p className="mt-2 text-muted-foreground">
              {filteredCourses.length} khóa học trong danh sách
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Input
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex rounded-lg border border-border">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-primary-50 text-primary-600"
                    : "text-muted-foreground hover:bg-surface"
                )}
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list"
                    ? "bg-primary-50 text-primary-600"
                    : "text-muted-foreground hover:bg-surface"
                )}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Danh sách trống</h3>
            <p className="mt-2 text-muted-foreground">
              {searchQuery
                ? "Không tìm thấy khóa học phù hợp"
                : "Bạn chưa thêm khóa học nào vào danh sách yêu thích"}
            </p>
            <Link href="/courses" className="mt-6 inline-block">
              <Button>Khám phá khóa học</Button>
            </Link>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card key={course._id} className="overflow-hidden group">
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={course.thumbnail || COURSE_THUMBNAIL_FALLBACK}
                    alt={course.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute left-2 top-2 flex flex-col gap-1">
                    {course.isBestseller && <Badge className="bg-warning">Bán chạy</Badge>}
                    {course.isFeatured && <Badge variant="secondary">Nổi bật</Badge>}
                  </div>
                  <button
                    onClick={() => handleRemove(course._id)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-error shadow-sm transition-transform hover:scale-110"
                    aria-label="Xóa khỏi yêu thích"
                  >
                    <Heart className="h-4 w-4 fill-error" />
                  </button>
                </div>
                <CardContent className="p-4">
                  <Badge className="mb-2 text-xs" variant="primary-light">
                    {typeof course.category === "string" ? course.category : course.category.name}
                  </Badge>
                  <h3 className="line-clamp-2 font-semibold text-foreground hover:text-primary-600">
                    <Link href={`/courses/${course.slug}`}>{course.title}</Link>
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(course.instructor as { name?: string }).name}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course.totalLessons} bài
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      {course.rating?.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-primary-600">
                        {formatPrice(course.price)}
                      </span>
                      {course.estimatedPrice && (
                        <span className="ml-2 text-sm text-muted-foreground line-through">
                          {formatPrice(course.estimatedPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={() => handleAddToCart(course)}
                      leftIcon={<ShoppingCart className="h-4 w-4" />}
                      disabled={hasMounted && isInCart(course._id)}
                    >
                      {hasMounted && isInCart(course._id) ? "Đã có trong giỏ" : "Thêm vào giỏ"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemove(course._id)}
                      className="text-error hover:bg-error-light hover:text-error"
                      aria-label="Xóa khỏi yêu thích"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <Card key={course._id} className="p-4">
                <div className="flex gap-4">
                  <div className="relative h-40 w-56 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={course.thumbnail || COURSE_THUMBNAIL_FALLBACK}
                      alt={course.title}
                      fill
                      sizes="224px"
                      className="object-cover"
                    />
                    <button
                      onClick={() => handleRemove(course._id)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-error shadow-sm"
                      aria-label="Xóa khỏi yêu thích"
                    >
                      <Heart className="h-4 w-4 fill-error" />
                    </button>
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="primary-light">
                          {typeof course.category === "string" ? course.category : course.category.name}
                        </Badge>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          {course.rating?.toFixed(1)} ({course.reviewCount} đánh giá)
                        </span>
                      </div>
                      <h3 className="mt-2 font-semibold text-foreground">
                        <Link href={`/courses/${course.slug}`} className="hover:text-primary-600">
                          {course.title}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {(course.instructor as { name?: string }).name} • {course.totalLessons} bài học
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-primary-600">
                          {formatPrice(course.price)}
                        </span>
                        {course.estimatedPrice && (
                          <span className="text-muted-foreground line-through">
                            {formatPrice(course.estimatedPrice)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemove(course._id)}
                          className="text-error hover:bg-error-light"
                          leftIcon={<Trash2 className="h-4 w-4" />}
                        >
                          Xóa
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(course)}
                          leftIcon={<ShoppingCart className="h-4 w-4" />}
                          disabled={hasMounted && isInCart(course._id)}
                        >
                          {hasMounted && isInCart(course._id) ? "Đã có trong giỏ" : "Thêm vào giỏ"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
