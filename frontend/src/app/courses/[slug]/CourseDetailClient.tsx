"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { AxiosError } from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardContent } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { enrollInFreeCourseAction, addCourseToCartAction } from "./actions";
import api from "@/lib/api";
import { reviewApi } from "@/lib/studentApi";
import { formatPrice, formatDuration, calculateDiscount, cn } from "@/lib/utils";
import { useCartStore, useWishlistStore } from "@/stores/wishlistStore";
import { useAuthStore } from "@/stores/auth";
import {
  ShoppingCart,
  Heart,
  Share2,
  PlayCircle,
  Clock,
  Users,
  BookOpen,
  Star,
  Award,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  Play,
  FileText,
  BarChart3,
  ArrowRight,
  Trash2,
} from "lucide-react";
import type { Chapter, Course, Lesson, Review, User } from "@/types";

interface CourseDetailClientProps {
  course: Course;
}

type CourseReview = Review & {
  user: User;
};

const COURSE_THUMBNAIL_FALLBACK = "/placeholder-course.svg";

const levelLabels = {
  beginner: "Người mới bắt đầu",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

const levelColors = {
  beginner: "bg-success-light text-success",
  intermediate: "bg-warning-light text-warning",
  advanced: "bg-error-light text-error",
};

function getEmbeddableVideoUrl(url?: string) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    if (parsed.hostname === "youtu.be") {
      const videoId = parsed.pathname.replace(/^\//, "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    return url;
  } catch {
    return url;
  }
}

// Trả về icon tương ứng với loại bài học để giữ UI nhất quán giữa các section
function isAlreadyInCartError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.includes("giỏ hàng") || error.message.toLowerCase().includes("gio hang");
}

function lessonIcon(type: Lesson["type"]) {
  if (type === "video") return <Play className="h-4 w-4 text-primary-500" />;
  if (type === "pdf") return <FileText className="h-4 w-4 text-secondary-500" />;
  return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
}

function isPopulatedUser(user: Review["user"]): user is User {
  return typeof user !== "string" && Boolean(user);
}

function getReviewUserName(review: Review) {
  return isPopulatedUser(review.user) ? review.user.name : "Học viên";
}

function getReviewUserAvatar(review: Review) {
  return isPopulatedUser(review.user) ? review.user.avatar : undefined;
}

export function CourseDetailClient({ course }: CourseDetailClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [hasMounted, setHasMounted] = useState(false);

  const chapters = useMemo(() => course.chapters ?? [], [course.chapters]);
  const [expandedChapters, setExpandedChapters] = useState<string[]>(() =>
    chapters[0]?._id ? [chapters[0]._id] : []
  );
  const expandedChapterIds = useMemo(() => {
    const chapterIds = new Set(chapters.map((chapter) => chapter._id));
    const validExpandedChapterIds = expandedChapters.filter((chapterId) => chapterIds.has(chapterId));
    return validExpandedChapterIds.length > 0 || !chapters[0]?._id ? validExpandedChapterIds : [chapters[0]._id];
  }, [chapters, expandedChapters]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [isReviewDeleting, setIsReviewDeleting] = useState(false);
  const [reviewSummary, setReviewSummary] = useState({
    rating: course.rating ?? 0,
    count: course.reviewCount ?? 0,
  });
  const [isCartPending, startCartTransition] = useTransition();
  const [isEnrollPending, startEnrollTransition] = useTransition();

  const { addItem: addToCart, isInCart } = useCartStore();
  const { addItem: addToWishlist, isInWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isInCartState = hasMounted && isInCart(course._id);
  const isInWishlistState = hasMounted && isInWishlist(course._id);
  const isFreeCourse = Boolean(course.isFree) || course.price <= 0;
  const discount = calculateDiscount(course.estimatedPrice || course.price * 1.3, course.price);
  const totalLessons = chapters.reduce((acc, chapter) => acc + (chapter.lessons?.length ?? 0), 0);
  const totalDuration = chapters.reduce(
    (acc, chapter) => acc + (chapter.lessons ?? []).reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration || 0), 0),
    0
  );

  useEffect(() => {
    queueMicrotask(() => setHasMounted(true));
  }, []);

  useEffect(() => {
    let isCancelled = false;

    if (!isAuthenticated) {
      queueMicrotask(() => {
        if (!isCancelled) {
          setIsEnrolled(false);
        }
      });
      return () => {
        isCancelled = true;
      };
    }

    async function checkEnrollment() {
      try {
        await api.get(`/enrollments/${course._id}/progress`);
        if (!isCancelled) setIsEnrolled(true);
      } catch (err: unknown) {
        if (!isCancelled) {
          const status = (err as AxiosError)?.response?.status;
          if (status === 404 || status === 401) setIsEnrolled(false);
        }
      }
    }

    // Kiểm tra trạng thái ghi danh để quyết định CTA chính khi mở trang chi tiết khóa học
    void checkEnrollment();

    return () => {
      isCancelled = true;
    };
  }, [course._id, isAuthenticated]);

  useEffect(() => {
    let isCancelled = false;

    async function loadReviews() {
      setIsLoadingReviews(true);
      try {
        const [reviewsResponse, myReviewResponse, statsResponse] = await Promise.all([
          reviewApi.getReviewsByCourse(course._id, 1, 5),
          isAuthenticated ? reviewApi.getMyReview(course._id).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
          reviewApi.getReviewStats(course._id),
        ]);

        if (isCancelled) return;

        const nextReviews = (reviewsResponse.data?.reviews ?? []) as CourseReview[];
        const nextStats = statsResponse.data;
        const nextMyReview = myReviewResponse.data ?? null;

        setReviews(nextReviews);
        setMyReview(nextMyReview);
        if (nextMyReview) {
          setReviewRating(nextMyReview.rating);
          setReviewComment(nextMyReview.comment || "");
        }
        setReviewSummary((current) => ({
          rating: nextStats?.averageRating ?? course.rating ?? current.rating,
          count: nextStats?.totalReviews ?? course.reviewCount ?? current.count,
        }));
      } catch {
        if (!isCancelled) {
          setReviews([]);
        }
      } finally {
        if (!isCancelled) setIsLoadingReviews(false);
      }
    }

    void loadReviews();

    return () => {
      isCancelled = true;
    };
  }, [course._id, course.rating, course.reviewCount, isAuthenticated]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterId) ? prev.filter((id) => id !== chapterId) : [...prev, chapterId]
    );
  };

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      toast.warning("Vui lòng đăng nhập để sử dụng tính năng này");
      router.push("/login");
      return;
    }
    if (isInWishlistState) {
      removeFromWishlist(course._id);
      toast.info("Đã xóa khỏi danh sách yêu thích");
    } else {
      addToWishlist(course);
      toast.success("Đã thêm vào danh sách yêu thích");
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.warning("Vui lòng đăng nhập để sử dụng tính năng này");
      router.push("/login");
      return;
    }

    if (isInCartState || isCartPending) {
      toast.info("Khóa học đã có trong giỏ hàng");
      return;
    }

    startCartTransition(async () => {
      try {
        await ensureCourseInCart();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể thêm vào giỏ hàng");
      }
    });
  };

  const ensureCourseInCart = async () => {
    let wasAlreadyInCart = false;

    try {
      await addCourseToCartAction(course._id);
    } catch (error) {
      if (!isAlreadyInCartError(error)) {
        throw error;
      }
      wasAlreadyInCart = true;
    }

    addToCart(course);
    if (wasAlreadyInCart) {
      toast.info("Khóa học đã có trong giỏ hàng");
    } else {
      toast.success("Đã thêm khóa học vào giỏ hàng");
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.warning("Vui lòng đăng nhập để mua khóa học");
      router.push("/login");
      return;
    }
    if (isEnrolled) {
      router.push(`/student/learn/${course.slug}`);
      return;
    }

    if (isBuyingNow || isEnrollPending) {
      return;
    }

    setIsBuyingNow(true);
    startEnrollTransition(async () => {
      try {
        if (!isFreeCourse) {
          if (!isInCartState) {
            await ensureCourseInCart();
          }

          router.push("/student/cart");
          return;
        }

        await enrollInFreeCourseAction(course._id, course.slug);
        setIsEnrolled(true);
        toast.success("Ghi danh khóa học thành công");
        router.push(`/student/learn/${course.slug}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Mua khóa học thất bại. Vui lòng thử lại.");
      } finally {
        setIsBuyingNow(false);
      }
    });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: course.title,
          text: course.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Đã sao chép liên kết khóa học");
      }
    } catch {
      toast.error("Không thể chia sẻ khóa học lúc này");
    }
  };

  const refreshReviews = async () => {
    const [reviewsResponse, statsResponse] = await Promise.all([
      reviewApi.getReviewsByCourse(course._id, 1, 5),
      reviewApi.getReviewStats(course._id),
    ]);
    const nextReviews = (reviewsResponse.data?.reviews ?? []) as CourseReview[];
    const nextStats = statsResponse.data;

    setReviews(nextReviews);
    setReviewSummary((current) => ({
      rating: nextStats?.averageRating ?? current.rating,
      count: nextStats?.totalReviews ?? reviewsResponse.data?.pagination?.total ?? nextReviews.length,
    }));
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.warning("Vui lòng đăng nhập để đánh giá khóa học");
      router.push("/login");
      return;
    }

    if (!isEnrolled) {
      toast.warning("Bạn cần ghi danh khóa học trước khi đánh giá");
      return;
    }

    setIsReviewSubmitting(true);
    try {
      const trimmedComment = reviewComment.trim();
      const response = myReview
        ? await reviewApi.updateReview(myReview._id, reviewRating, trimmedComment)
        : await reviewApi.createReview(course._id, reviewRating, trimmedComment);

      if (response.data) {
        setMyReview(response.data);
        setReviewRating(response.data.rating);
        setReviewComment(response.data.comment || "");
      }

      await refreshReviews();
      toast.success(myReview ? "Đã cập nhật đánh giá" : "Đã gửi đánh giá khóa học");
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(apiError.response?.data?.message || apiError.message || "Không thể gửi đánh giá lúc này");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview || isReviewDeleting) return;

    setIsReviewDeleting(true);
    try {
      await reviewApi.deleteReview(myReview._id);
      setMyReview(null);
      setReviewRating(5);
      setReviewComment("");
      await refreshReviews();
      toast.success("Đã xóa đánh giá");
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(apiError.response?.data?.message || apiError.message || "Không thể xóa đánh giá lúc này");
    } finally {
      setIsReviewDeleting(false);
    }
  };

  const benefits = course.benefits?.length
    ? course.benefits
    : [
        "Học theo lộ trình rõ ràng, dễ theo dõi",
        "Rèn luyện kỹ năng thực hành sát nhu cầu thực tế",
        "Có thể học mọi lúc trên mọi thiết bị",
        "Nhận chứng chỉ khi hoàn thành khóa học",
      ];

  const requirements = course.requirements?.length
    ? course.requirements
    : [
        "Có thiết bị kết nối internet ổn định",
        "Sẵn sàng dành thời gian học đều đặn",
        "Chuẩn bị tinh thần học tập và thực hành nghiêm túc",
      ];

  const instructor = typeof course.instructor === "string" ? null : course.instructor;
  const categoryName = typeof course.category === "string" ? course.category : course.category?.name;
  const previewVideoUrl = getEmbeddableVideoUrl(course.previewVideo);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className={cn("text-xs", levelColors[course.level])}>{levelLabels[course.level]}</Badge>
                {categoryName ? <Badge variant="secondary">{categoryName}</Badge> : null}
                {course.isBestseller ? <Badge className="bg-warning">Bán chạy</Badge> : null}
                {course.isFeatured ? <Badge>Nổi bật</Badge> : null}
              </div>

              <h1 className="text-3xl font-bold text-white lg:text-4xl">{course.title}</h1>
              <p className="mt-4 text-lg text-white/80">{course.description}</p>

              <div className="mt-6 flex items-center gap-3">
                <Avatar src={instructor?.avatar} name={instructor?.name || "Giảng viên"} size="lg" />
                <div>
                  <p className="font-medium text-white">{instructor?.name || "Giảng viên"}</p>
                  <p className="text-sm text-white/70">Giảng viên</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-6 text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {reviewSummary.rating.toFixed(1)} ({reviewSummary.count} đánh giá)
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {(course.enrolledCount ?? 0).toLocaleString("vi-VN")} học viên
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {totalLessons} bài học
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(totalDuration)}
                </span>
              </div>
            </div>

            <div className="hidden lg:block">
              <Card className="overflow-hidden shadow-2xl">
                <div className="relative aspect-video">
                  {previewVideoUrl ? (
                    <iframe
                      src={previewVideoUrl}
                      title={`Video giới thiệu ${course.title}`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      <Image src={course.thumbnail || COURSE_THUMBNAIL_FALLBACK} alt={course.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90">
                          <PlayCircle className="h-8 w-8 text-primary-600" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-primary-600">{formatPrice(course.price)}</span>
                    {discount > 0 ? (
                      <>
                        <span className="text-lg text-muted-foreground line-through">
                          {formatPrice(course.estimatedPrice || course.price * 1.3)}
                        </span>
                        <Badge variant="error">-{discount}%</Badge>
                      </>
                    ) : null}
                  </div>

                  {isEnrolled ? (
                    <Button size="lg" className="mt-4 w-full gap-2" onClick={() => router.push(`/student/learn/${course.slug}`)}>
                      <Play className="h-5 w-5" />
                      Vào học
                    </Button>
                  ) : (
                    <Button size="lg" className="mt-4 w-full gap-2" onClick={handleBuyNow} isLoading={isBuyingNow}>
                      <ArrowRight className="h-5 w-5" />
                      Mua ngay
                    </Button>
                  )}

                  <Button variant="outline" size="lg" className="mt-3 w-full gap-2" onClick={handleAddToCart} disabled={isInCartState}>
                    <ShoppingCart className="h-5 w-5" />
                    {isInCartState ? "Đã thêm vào giỏ" : "Thêm vào giỏ hàng"}
                  </Button>

                  <Button variant="outline" size="lg" className="mt-3 w-full gap-2" onClick={handleWishlistToggle}>
                    <Heart className={cn("h-5 w-5", isInWishlistState && "fill-error text-error")} />
                    {isInWishlistState ? "Đã thêm vào yêu thích" : "Thêm vào yêu thích"}
                  </Button>

                  <Button variant="ghost" size="lg" className="mt-3 w-full gap-2" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                    Chia sẻ khóa học
                  </Button>

                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Học trọn đời</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Chứng chỉ hoàn thành</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Hỗ trợ 24/7</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground">Bạn sẽ học được gì?</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {benefits.map((item, i) => (
                    <div key={`${item}-${i}`} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground">Nội dung khóa học</h2>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{chapters.length} chương</span>
                  <span>{totalLessons} bài học</span>
                  <span>{formatDuration(totalDuration)}</span>
                </div>

                {chapters.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    {chapters.map((chapter: Chapter) => (
                      <div key={chapter._id} className="overflow-hidden rounded-lg border border-border">
                        <button
                          onClick={() => toggleChapter(chapter._id)}
                          className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded bg-primary-100 text-xs font-medium text-primary-700">
                              {chapter.order}
                            </span>
                            <div>
                              <p className="font-medium text-foreground">{chapter.title}</p>
                              <p className="text-sm text-muted-foreground">{chapter.lessons?.length ?? 0} bài học</p>
                            </div>
                          </div>
                          {expandedChapterIds.includes(chapter._id) ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>

                        {expandedChapterIds.includes(chapter._id) ? (
                          <div className="border-t border-border">
                            {(chapter.lessons ?? []).length > 0 ? (
                              chapter.lessons.map((lesson) => (
                                <div key={lesson._id} className="flex items-center justify-between p-4 pl-14 text-sm transition-colors hover:bg-surface">
                                  <div className="flex items-center gap-3">
                                    {lessonIcon(lesson.type)}
                                    <span className="text-foreground">{lesson.title}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    {lesson.isFree || isEnrolled ? (
                                      <span className="text-xs text-success">{lesson.isFree ? "Miễn phí" : "Có thể truy cập"}</span>
                                    ) : (
                                      <Lock className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="text-muted-foreground">{lesson.duration ? `${lesson.duration} phút` : "--"}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 pl-14 text-sm text-muted-foreground">Chương này chưa có bài học nào.</div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-dashed border-border p-6 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-3 font-medium text-foreground">Khóa học đang được cập nhật nội dung</p>
                    <p className="mt-1 text-sm text-muted-foreground">Hiện chưa có chương hoặc bài học công khai để hiển thị.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground">Yêu cầu</h2>
                <ul className="mt-4 space-y-2">
                  {requirements.map((req, i) => (
                    <li key={`${req}-${i}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-500" />
                      {req}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground">Giảng viên</h2>
                <div className="mt-4 flex gap-4">
                  <Avatar src={instructor?.avatar} name={instructor?.name || "Giảng viên"} size="xl" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">{instructor?.name || "Giảng viên"}</p>
                    <p className="text-sm text-muted-foreground">{instructor?.bio || "Thông tin giảng viên sẽ được cập nhật sớm."}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        {reviewSummary.rating.toFixed(1)}/5 đánh giá
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {(course.enrolledCount ?? 0).toLocaleString("vi-VN")} học viên
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        {course.isFeatured ? "Giảng viên nổi bật" : "Giảng viên đang hoạt động"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="reviews" className="mb-8 scroll-mt-24">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Đánh giá học viên</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Chia sẻ trải nghiệm học tập để giúp học viên khác chọn khóa học phù hợp.
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-4xl font-bold text-primary-600">{reviewSummary.rating.toFixed(1)}</div>
                    <div className="mt-1 flex gap-0.5 sm:justify-end">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-4 w-4",
                            star <= Math.round(reviewSummary.rating) ? "fill-warning text-warning" : "text-muted"
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{reviewSummary.count} đánh giá</p>
                  </div>
                </div>

                <div className="mt-6 rounded-lg border border-border bg-surface/40 p-4">
                  {isAuthenticated && isEnrolled ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {myReview ? "Cập nhật đánh giá của bạn" : "Đánh giá khóa học này"}
                        </p>
                        <div className="mt-2 flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="rounded-md p-1 transition hover:bg-warning/10"
                              aria-label={`${star} sao`}
                            >
                              <Star
                                className={cn(
                                  "h-6 w-6",
                                  star <= reviewRating ? "fill-warning text-warning" : "text-muted-foreground"
                                )}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <Textarea
                        value={reviewComment}
                        onChange={(event) => setReviewComment(event.target.value)}
                        maxLength={2000}
                        placeholder="Khóa học này giúp bạn tiến bộ như thế nào?"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={handleSubmitReview} isLoading={isReviewSubmitting}>
                          {myReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                        </Button>
                        {myReview ? (
                          <Button
                            variant="outline"
                            onClick={handleDeleteReview}
                            isLoading={isReviewDeleting}
                            leftIcon={<Trash2 className="h-4 w-4" />}
                          >
                            Xóa đánh giá
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {isAuthenticated
                        ? "Bạn cần ghi danh khóa học trước khi đánh giá."
                        : "Đăng nhập và ghi danh khóa học để gửi đánh giá."}
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  {isLoadingReviews ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      Đang tải đánh giá...
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      Khóa học này chưa có đánh giá nào.
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review._id} className="rounded-lg border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar src={getReviewUserAvatar(review)} name={getReviewUserName(review)} size="md" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{getReviewUserName(review)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-4 w-4",
                                  star <= review.rating ? "fill-warning text-warning" : "text-muted"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                            {review.comment}
                          </p>
                        ) : null}
                        {review.instructorReply?.comment ? (
                          <div className="mt-3 rounded-lg bg-primary-50 p-3 text-sm text-primary-900">
                            <p className="font-medium">Phản hồi của giảng viên</p>
                            <p className="mt-1 whitespace-pre-wrap">{review.instructorReply.comment}</p>
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {false ? <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground">Đánh giá học viên</h2>
                <div className="mt-4 flex flex-wrap items-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary-600">{(course.rating ?? 0).toFixed(1)}</div>
                    <div className="mt-1 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-4 w-4",
                            star <= Math.round(course.rating || 0) ? "fill-warning text-warning" : "text-muted"
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{course.reviewCount ?? 0} đánh giá</p>
                  </div>

                  {(course.reviewCount ?? 0) === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      Khóa học này chưa có đánh giá nào. Hãy là người đầu tiên phản hồi sau khi học.
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Phần danh sách đánh giá chi tiết sẽ được bổ sung ở bước tiếp theo. Hiện tại bạn đã có tổng điểm và số lượng đánh giá thực từ hệ thống.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card> : null}
          </div>

          <div className="lg:hidden">
            <Card className="sticky top-24 overflow-hidden shadow-lg">
              <div className="relative aspect-video">
                <Image src={course.thumbnail || COURSE_THUMBNAIL_FALLBACK} alt={course.title} fill sizes="100vw" className="object-cover" />
              </div>
              <CardContent className="p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary-600">{formatPrice(course.price)}</span>
                  {discount > 0 ? (
                    <span className="text-muted-foreground line-through">{formatPrice(course.estimatedPrice || course.price * 1.3)}</span>
                  ) : null}
                </div>
                {isEnrolled ? (
                  <Button size="lg" className="mt-4 w-full gap-2" onClick={() => router.push(`/student/learn/${course.slug}`)}>
                    <Play className="h-5 w-5" />
                    Vào học
                  </Button>
                ) : (
                  <Button size="lg" className="mt-4 w-full gap-2" onClick={handleBuyNow} isLoading={isBuyingNow}>
                    <ArrowRight className="h-5 w-5" />
                    Mua ngay
                  </Button>
                )}

                <Button variant="outline" size="lg" className="mt-3 w-full gap-2" onClick={handleAddToCart} disabled={isInCartState}>
                  <ShoppingCart className="h-5 w-5" />
                  {isInCartState ? "Đã thêm vào giỏ" : "Thêm vào giỏ hàng"}
                </Button>
                <Button variant="outline" size="lg" className="mt-2 w-full gap-2" onClick={handleWishlistToggle}>
                  <Heart className={cn("h-5 w-5", isInWishlistState && "fill-error text-error")} />
                  {isInWishlistState ? "Đã yêu thích" : "Yêu thích"}
                </Button>
                <Button variant="ghost" size="lg" className="mt-2 w-full gap-2" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                  Chia sẻ khóa học
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

