"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/stores/auth";
import { enrollmentApi, userFollowApi } from "@/lib/studentApi";
import { categoryLabel, normalizeCourse } from "@/lib/courseUtils";
import { BookOpen, Clock, Award, ArrowRight, Play, Calendar, ChevronDown, ChevronUp, Check, Trophy, UserPlus } from "lucide-react";
import type { Course, Enrollment, PopularUser } from "@/types";

type EnrollmentWithCourse = Enrollment & { course: Course };
const COURSE_THUMBNAIL_FALLBACK = "/placeholder-course.svg";

function hasCourse(enrollment: Enrollment): enrollment is EnrollmentWithCourse {
  return typeof enrollment.course !== "string" && Boolean(enrollment.course);
}

export default function StudentDashboard() {
  const user = useAuthStore((state) => state.user);
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [popularUsers, setPopularUsers] = useState<PopularUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [popularUsersLoading, setPopularUsersLoading] = useState(true);
  const [error, setError] = useState("");
  const [followUpdatingId, setFollowUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadEnrollments() {
      try {
        setLoading(true);
        setError("");
        const response = await enrollmentApi.getMyEnrollments(1, 20);
        if (!mounted) return;
        setEnrollments(
          (response.data?.enrollments ?? [])
            .filter(hasCourse)
            .map((enrollment) => ({
              ...enrollment,
              course: normalizeCourse(enrollment.course),
            }))
        );
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load student dashboard", err);
        setError("Không thể tải khóa học của bạn. Hãy đăng nhập và thử lại.");
        setEnrollments([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadEnrollments();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadPopularUsers() {
      try {
        setPopularUsersLoading(true);
        const response = await userFollowApi.getPopularUsers(5);
        if (!mounted) return;
        setPopularUsers(response.data?.users ?? []);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load popular users", err);
        setPopularUsers([]);
      } finally {
        if (mounted) setPopularUsersLoading(false);
      }
    }

    loadPopularUsers();
    return () => {
      mounted = false;
    };
  }, []);

  const handleFollowToggle = async (popularUser: PopularUser) => {
    const nextFollowing = !popularUser.isFollowing;
    setFollowUpdatingId(popularUser._id);
    setPopularUsers((current) =>
      current.map((item) =>
        item._id === popularUser._id
          ? {
              ...item,
              isFollowing: nextFollowing,
              followersCount: Math.max(0, item.followersCount + (nextFollowing ? 1 : -1)),
            }
          : item
      )
    );

    try {
      const response = nextFollowing
        ? await userFollowApi.followUser(popularUser._id)
        : await userFollowApi.unfollowUser(popularUser._id);
      const result = response.data;
      if (!result) return;

      setPopularUsers((current) =>
        current.map((item) =>
          item._id === popularUser._id
            ? { ...item, isFollowing: result.isFollowing, followersCount: result.followersCount }
            : item
        )
      );
    } catch (err) {
      console.error("Failed to update follow status", err);
      setPopularUsers((current) =>
        current.map((item) =>
          item._id === popularUser._id
            ? {
                ...item,
                isFollowing: popularUser.isFollowing,
                followersCount: popularUser.followersCount,
              }
            : item
        )
      );
    } finally {
      setFollowUpdatingId(null);
    }
  };

  const stats = useMemo(() => {
    const completed = enrollments.filter((enrollment) => enrollment.progress >= 100).length;
    const active = enrollments.filter((enrollment) => enrollment.isActive && enrollment.progress < 100).length;
    const completedLessons = enrollments.reduce(
      (sum, enrollment) => sum + (enrollment.completedLessons?.length ?? 0),
      0
    );

    return [
      { label: "Khóa học đã đăng ký", value: enrollments.length, icon: BookOpen, color: "text-primary-600" },
      { label: "Đang học", value: active, icon: Play, color: "text-warning" },
      { label: "Hoàn thành", value: completed, icon: Award, color: "text-success" },
      { label: "Bài đã học", value: completedLessons, icon: Clock, color: "text-secondary-600" },
    ];
  }, [enrollments]);

  const today = new Date();
  const calendarYear = today.getFullYear();
  const calendarMonth = today.getMonth();
  const monthStart = new Date(calendarYear, calendarMonth, 1);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7));
  const calendarDays = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });

  return (
    <div className="content-stack">
      <div className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-card backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="primary-light" className="mb-3 w-fit px-3 py-1.5">
              <Play className="mr-1 h-3.5 w-3.5" />
              Nhịp học hôm nay
            </Badge>
            <h1 className="page-title">Xin chào, {user?.name || "Học viên"}!</h1>
            <p className="page-subtitle">
              Tiếp tục hành trình học tập với dữ liệu khóa học mới nhất.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-border bg-surface/80 px-4 py-3 text-sm">
              <p className="text-muted-foreground">Tổng khóa học</p>
              <p className="text-xl font-bold text-foreground">{enrollments.length}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/80 px-4 py-3 text-sm">
              <p className="text-muted-foreground">Hoàn thành</p>
              <p className="text-xl font-bold text-success">
                {enrollments.filter((enrollment) => enrollment.progress >= 100).length}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <Link href="/courses">
            <Button className="gap-2">
              Khám phá khóa học
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.72fr)_minmax(360px,1fr)_360px]">
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Tổng quan học tập</h2>
                <p className="text-xs text-muted-foreground">Tiến độ chính của các khóa học đã đăng ký</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border/70 bg-surface/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                      <p className="mt-1 text-xl font-bold text-foreground">{loading ? "..." : stat.value}</p>
                    </div>
                    <div className={`rounded-lg bg-white p-2 shadow-sm ${stat.color}`}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Xếp hạng theo dõi</h2>
                <p className="text-xs text-muted-foreground">Người học nổi bật trong cộng đồng</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
                <Trophy className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-2">
              {popularUsersLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface/60 p-2.5">
                    <div className="h-7 w-7 animate-pulse rounded-lg bg-surface-hover" />
                    <div className="h-6 w-6 animate-pulse rounded-full bg-surface-hover" />
                    <div className="min-w-0 flex-1">
                      <div className="h-3 w-24 animate-pulse rounded bg-surface-hover" />
                      <div className="mt-2 h-3 w-32 animate-pulse rounded bg-surface-hover" />
                    </div>
                    <div className="h-8 w-20 animate-pulse rounded-lg bg-surface-hover" />
                  </div>
                ))
              ) : popularUsers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-surface/50 p-4 text-center text-sm text-muted-foreground">
                  Chưa có dữ liệu xếp hạng người dùng.
                </div>
              ) : (
                popularUsers.map((popularUser, index) => {
                  const isUpdating = followUpdatingId === popularUser._id;

                  return (
                    <div key={popularUser._id} className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface/60 p-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-primary-600 shadow-sm">
                      #{index + 1}
                    </div>
                    <Avatar name={popularUser.name} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{popularUser.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {(popularUser.bio || `${popularUser.learningCount} khóa học`).trim()} · {popularUser.followersCount.toLocaleString("vi-VN")} theo dõi
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={popularUser.isFollowing ? "secondary" : "outline"}
                      size="sm"
                      className="h-8 shrink-0 px-2 text-[11px]"
                      disabled={isUpdating}
                      onClick={() => handleFollowToggle(popularUser)}
                    >
                      {popularUser.isFollowing ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                      {popularUser.isFollowing ? "Đang theo dõi" : "Theo dõi"}
                    </Button>
                  </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-primary-200 bg-white shadow-[0_24px_58px_-34px_rgba(55,118,232,0.35)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-foreground shadow-sm">
                <ChevronUp className="h-4 w-4" />
              </button>
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-2">
                  <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                    {today.toLocaleDateString("vi-VN", { month: "long" })}
                  </h2>
                  <span className="text-xl font-extrabold tracking-tight text-muted-foreground/50">
                    {calendarYear}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Lịch học cá nhân</p>
              </div>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-foreground shadow-sm">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="my-3 border-t border-dotted border-border" />

            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-muted-foreground">
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1.5 text-center">
              {calendarDays.map((date) => {
                const isCurrentMonth = date.getMonth() === calendarMonth;
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <div
                    key={date.toISOString()}
                    className={`flex h-8 items-center justify-center rounded-lg text-xs font-bold ${
                      isToday
                        ? "border-2 border-primary-600 bg-primary-50 text-primary-700 shadow-[0_0_0_4px_rgba(55,118,232,0.08)]"
                        : isCurrentMonth
                          ? "text-foreground hover:bg-primary-50 hover:text-primary-700"
                          : "text-muted-foreground/45"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-50 to-secondary-50 p-3 dark:from-primary-500/15 dark:to-secondary-500/15">
              <Calendar className="h-4 w-4 shrink-0 text-primary-600" />
              <p className="text-xs font-medium text-foreground">Hôm nay: hoàn thành ít nhất 1 bài học hoặc 15 phút luyện tập.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Tiếp tục học</h2>
          <Link href="/student/my-courses" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Xem tất cả
          </Link>
        </div>

        {loading || enrollments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                {loading ? "Đang tải khóa học..." : "Bạn chưa có khóa học nào"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading ? "Đang đồng bộ dữ liệu ghi danh" : "Đăng ký khóa học để bắt đầu học tập"}
              </p>
              {!loading && (
                <Link href="/courses" className="mt-4">
                  <Button className="gap-2">
                    Khám phá khóa học
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 md:gap-5">
            {enrollments.map((enrollment) => (
              <Card key={enrollment._id} className="overflow-hidden transition-shadow hover:shadow-lg">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative h-32 w-full shrink-0 overflow-hidden sm:h-auto sm:w-48">
                    <Image
                      src={enrollment.course.thumbnail || COURSE_THUMBNAIL_FALLBACK}
                      alt={enrollment.course.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 192px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                      <Link href={`/student/learn/${enrollment.course.slug}`}>
                        <Button size="icon" variant="secondary" className="rounded-full">
                          <Play className="h-6 w-6" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <CardContent className="flex-1 p-4">
                    <Badge variant="secondary" size="sm" className="mb-2">
                      {categoryLabel(enrollment.course.category)}
                    </Badge>
                    <h3 className="line-clamp-1 font-semibold text-foreground">{enrollment.course.title}</h3>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar
                        src={(enrollment.course.instructor as { avatar?: string })?.avatar}
                        name={(enrollment.course.instructor as { name?: string })?.name}
                        size="xs"
                      />
                      <span>{(enrollment.course.instructor as { name?: string })?.name ?? "Giảng viên"}</span>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tiến độ</span>
                        <span className="font-medium text-primary-600">{enrollment.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-hover">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      href={`/student/learn/${enrollment.course.slug}`}
                      className="mt-4 block"
                    >
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Play className="h-4 w-4" />
                        Tiếp tục học
                      </Button>
                    </Link>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Hoạt động gần đây</h2>
        </div>

        <Card>
          <CardContent className="divide-y divide-border p-0">
            {enrollments.slice(0, 5).map((enrollment) => (
              <div key={enrollment._id} className="flex items-start gap-3 p-4 sm:items-center sm:gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                  <Calendar className="h-5 w-5 text-primary-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">Đã ghi danh khóa học</p>
                  <p className="text-sm text-muted-foreground">{enrollment.course.title}</p>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {new Date(enrollment.enrolledAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            ))}
            {!loading && enrollments.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">Chưa có hoạt động học tập</div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
