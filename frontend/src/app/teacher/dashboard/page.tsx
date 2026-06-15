"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { DashboardStatsSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { teacherCourseApi, teacherDashboardApi } from "@/lib/teacherApi";
import { formatPrice } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Edit,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import type { Course, Enrollment, CourseStatus } from "@/types";

const statusColors: Record<CourseStatus, string> = {
  draft: "bg-surface-hover text-muted-foreground",
  pending: "bg-warning-light text-warning",
  published: "bg-success-light text-success",
  rejected: "bg-error-light text-error",
  locked: "bg-surface-hover text-muted-foreground",
  banned: "bg-error-light text-error",
};

const statusLabels: Record<CourseStatus, string> = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  published: "Đã xuất bản",
  rejected: "Bị từ chối",
  locked: "Đã khóa",
  banned: "Bị cấm",
};

interface TeacherDashboardData {
  stats: {
    totalCourses: number;
    totalStudents: number;
    totalRevenue: number;
    pendingCourses: number;
  };
  recentEnrollments: Enrollment[];
  recentCourses: Course[];
}

type TeacherCourseResponse = Course[] | { courses?: Course[] };
const COURSE_THUMBNAIL_FALLBACK = "/placeholder-course.svg";

function unwrapCourses(data: TeacherCourseResponse | undefined): Course[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.courses ?? [];
}

function getCurrentCoursePrice(course: Course) {
  return course.discountPrice && course.discountPrice > 0 ? course.discountPrice : course.price;
}

function getPendingCoursePrice(course: Course) {
  if (course.pendingDiscountPrice !== null && course.pendingDiscountPrice !== undefined && course.pendingDiscountPrice > 0) {
    return course.pendingDiscountPrice;
  }

  return course.pendingPrice ?? null;
}

function TeacherDashboardLoading() {
  return (
    <div className="content-stack">
      <DashboardStatsSkeleton />
      <div className="grid gap-4 lg:grid-cols-2 md:gap-5">
        <Card>
          <CardContent className="space-y-4 p-4 md:p-5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-4 md:p-5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex gap-4">
                <Skeleton className="h-20 w-32 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const toast = useToast();
  const { socket } = useSocket();
  const hasLoadedInitiallyRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TeacherDashboardData>({
    stats: {
      totalCourses: 0,
      totalStudents: 0,
      totalRevenue: 0,
      pendingCourses: 0,
    },
    recentEnrollments: [],
    recentCourses: [],
  });

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [statsRes, enrollmentsRes, coursesRes] = await Promise.all([
        teacherDashboardApi.getStats(),
        teacherDashboardApi.getRecentEnrollments(5),
        teacherCourseApi.getMyCourses(),
      ]);

      const statsData = statsRes.data as {
        totalCourses?: number;
        totalStudents?: number;
        totalRevenue?: number;
        pendingCourses?: number;
        recentCourses?: Course[];
      } | undefined;

      const enrollmentData = enrollmentsRes.data ?? [];
      const courseData = unwrapCourses(coursesRes.data as TeacherCourseResponse);
      const recentCourses =
        statsData?.recentCourses?.length
          ? statsData.recentCourses
          : [...courseData].sort((a, b) => {
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }).slice(0, 5);

      setData({
        stats: {
          totalCourses: statsData?.totalCourses ?? courseData.length,
          totalStudents: statsData?.totalStudents ?? 0,
          totalRevenue: statsData?.totalRevenue ?? 0,
          pendingCourses: statsData?.pendingCourses ?? courseData.filter((course) => course.status === "pending").length,
        },
        recentEnrollments: enrollmentData,
        recentCourses,
      });
    } catch {
      setError("Không thể tải bảng điều khiển giảng viên lúc này.");
      if (!silent) {
        toast.error("Không thể tải bảng điều khiển giảng viên. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (hasLoadedInitiallyRef.current) {
      return;
    }

    hasLoadedInitiallyRef.current = true;
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!socket) return;

    const handleStatsUpdate = (payload?: { type?: string }) => {
      if (payload?.type !== "connected") {
        toast.info("Dashboard đã được cập nhật dữ liệu mới.");
      }
      loadDashboard(true);
    };

    socket.on("creator:stats-update", handleStatsUpdate);
    return () => {
      socket.off("creator:stats-update", handleStatsUpdate);
    };
  }, [socket, loadDashboard, toast]);

  const stats = useMemo(
    () => [
      { label: "Tổng khóa học", value: data.stats.totalCourses, icon: BookOpen, color: "bg-primary-100 text-primary-600" },
      { label: "Tổng học viên", value: data.stats.totalStudents, icon: Users, color: "bg-secondary-100 text-secondary-600" },
      { label: "Doanh thu", value: data.stats.totalRevenue, icon: DollarSign, color: "bg-success-light text-success" },
      { label: "Đang chờ duyệt", value: data.stats.pendingCourses, icon: AlertCircle, color: "bg-warning-light text-warning" },
    ],
    [data.stats]
  );

  if (isLoading) {
    return <TeacherDashboardLoading />;
  }

  return (
    <div className="content-stack">
      {error ? (
        <Card className="border-error/30">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <AlertCircle className="h-10 w-10 text-error" />
            <div>
              <p className="font-semibold text-foreground">Không tải được dữ liệu bảng điều khiển</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={() => loadDashboard()}>Thử lại</Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-xl font-extrabold tracking-tight text-foreground md:text-2xl">
                    {stat.label.includes("Doanh thu") ? formatPrice(stat.value) : stat.value.toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className={`rounded-xl p-2.5 shadow-sm ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 md:gap-5">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
            <h2 className="text-base font-semibold text-foreground">Học viên mới</h2>
            <Link href="/teacher/students" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <CardContent className="p-0">
              {data.recentEnrollments.length > 0 ? (
                <div className="divide-y divide-border">
                  {data.recentEnrollments.map((enrollment) => {
                    const student = typeof enrollment.student === "string" ? null : enrollment.student;
                    const course = typeof enrollment.course === "string" ? null : enrollment.course;
                    return (
                      <div key={enrollment._id} className="flex items-center gap-3 px-4 py-3">
                        <Avatar src={student?.avatar} name={student?.name || "Học viên"} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{student?.name || "Học viên"}</p>
                          <p className="truncate text-xs text-muted-foreground">{course?.title || "Khóa học"}</p>
                        </div>
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(enrollment.enrolledAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold text-foreground">Chưa có học viên mới</p>
                  <p className="mt-1 text-sm text-muted-foreground">Danh sách này sẽ tự cập nhật khi có lượt ghi danh mới.</p>
                </div>
              )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
            <h2 className="text-base font-semibold text-foreground">Khóa học của bạn</h2>
            <Link href="/teacher/courses" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
              Quản trị khóa học
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <CardContent className="p-0">
            {data.recentCourses.length > 0 ? (
              <div className="divide-y divide-border">
                {data.recentCourses.map((course) => {
                  const currentPrice = getCurrentCoursePrice(course);
                  const pendingPrice = getPendingCoursePrice(course);

                  return (
                  <div key={course._id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                    <Link href={`/teacher/courses/${course._id}/edit`} className="relative block h-24 w-full shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-28">
                      <Image src={course.thumbnail || COURSE_THUMBNAIL_FALLBACK} alt={course.title} fill sizes="64px" className="object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/teacher/courses/${course._id}/edit`} className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground transition-colors hover:text-primary-600">
                          {course.title}
                        </Link>
                        <Badge size="sm" className={statusColors[course.status]}>
                          {statusLabels[course.status]}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {(course.enrolledCount ?? 0).toLocaleString("vi-VN")}
                        </span>
                        {(course.rating ?? 0) > 0 ? (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {(course.rating ?? 0).toFixed(1)}
                          </span>
                        ) : null}
                        <span className="font-semibold text-primary-600">{formatPrice(currentPrice)}</span>
                      </div>
                      {pendingPrice !== null && pendingPrice !== currentPrice ? (
                        <p className="mt-1 text-xs font-medium text-warning">
                          Giá chờ duyệt: {formatPrice(pendingPrice)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link href={`/teacher/courses/${course._id}/edit`}>
                        <Button size="sm" className="gap-2">
                          <Edit className="h-4 w-4" />
                          {course.status === "draft" ? "Mở" : "Sửa"}
                        </Button>
                      </Link>
                      <Link href={`/teacher/analytics?courseId=${course._id}`}>
                        <Button size="sm" variant="outline">
                          Thống kê
                        </Button>
                      </Link>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold text-foreground">Bạn chưa có khóa học nào</p>
                <p className="mt-1 text-sm text-muted-foreground">Hãy tạo khóa học đầu tiên để bắt đầu theo dõi hiệu suất.</p>
                <Link href="/teacher/courses/create" className="mt-4 inline-block">
                  <Button size="sm">Tạo khóa học</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
