"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  BookOpen,
  DollarSign,
  GraduationCap,
  RefreshCw,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { adminCourseApi, adminDashboardApi } from "@/lib/adminApi";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import type { Course, CourseLevel, CourseStatus, Enrollment, User } from "@/types";

type AdminStatsPayload = {
  courses?: {
    total?: number;
    published?: number;
    pending?: number;
    draft?: number;
    rejected?: number;
  };
  users?: {
    total?: number;
    users?: number;
    admins?: number;
  };
  payments?: {
    totalTransactions?: number;
    totalRevenue?: number;
  };
};

type AnalyticsState = {
  stats: AdminStatsPayload;
  courses: Course[];
  recentUsers: User[];
  recentEnrollments: Enrollment[];
};

const emptyState: AnalyticsState = {
  stats: {},
  courses: [],
  recentUsers: [],
  recentEnrollments: [],
};

const statusLabels: Record<CourseStatus, string> = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  published: "Đã xuất bản",
  rejected: "Bị từ chối",
  locked: "Bị khóa",
  banned: "Bị cấm",
};

const levelLabels: Record<CourseLevel, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<T, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {} as Record<T, number>);
}

function percentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function getInstructorName(course: Course) {
  if (typeof course.instructor === "string") return "Chưa rõ giảng viên";
  return course.instructor?.name || "Chưa rõ giảng viên";
}

function AnalyticsLoading() {
  return (
    <div className="content-stack">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 4 }).map((__, rowIndex) => (
                <Skeleton key={rowIndex} className="h-9 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<AnalyticsState>(emptyState);

  const loadAnalytics = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    setWarning(null);

    try {
      const statsRes = await adminDashboardApi.getStats();
      const [recentResult, coursesResult] = await Promise.allSettled([
        adminDashboardApi.getRecentActivity(10),
        adminCourseApi.getAllCourses(1, 50),
      ]);

      const recentData = recentResult.status === "fulfilled" ? recentResult.value.data : undefined;
      const coursesData = coursesResult.status === "fulfilled" ? coursesResult.value.data : [];
      const hasPartialError = recentResult.status === "rejected" || coursesResult.status === "rejected";

      setState({
        stats: (statsRes.data ?? {}) as AdminStatsPayload,
        courses: coursesData ?? [],
        recentUsers: recentData?.recentUsers ?? [],
        recentEnrollments: recentData?.recentEnrollments ?? [],
      });

      if (hasPartialError) {
        setWarning("Một số dữ liệu phụ chưa tải được, nhưng thống kê tổng quan vẫn sẵn sàng.");
      }
    } catch {
      setState(emptyState);
      setError("Không thể tải dữ liệu thống kê hệ thống.");
      if (!silent) toast.error("Không thể tải dữ liệu thống kê. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAnalytics();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAnalytics]);

  const totalCourses = state.stats.courses?.total ?? state.courses.length;
  const publishedCourses = state.stats.courses?.published ?? state.courses.filter((course) => course.status === "published").length;
  const pendingCourses = state.stats.courses?.pending ?? state.courses.filter((course) => course.status === "pending").length;
  const totalUsers = state.stats.users?.total ?? state.recentUsers.length;
  const totalRevenue = state.stats.payments?.totalRevenue ?? 0;
  const totalTransactions = state.stats.payments?.totalTransactions ?? state.recentEnrollments.length;

  const statusBreakdown = useMemo(() => {
    const counts = countBy(state.courses.map((course) => course.status));
    const fallbackCounts: Partial<Record<CourseStatus, number>> = {
      draft: state.stats.courses?.draft,
      pending: state.stats.courses?.pending,
      published: state.stats.courses?.published,
      rejected: state.stats.courses?.rejected,
    };

    return (Object.keys(statusLabels) as CourseStatus[]).map((status) => {
      const value = counts[status] ?? fallbackCounts[status] ?? 0;
      return {
        label: statusLabels[status],
        value,
        percent: percentage(value, totalCourses),
      };
    });
  }, [state.courses, state.stats.courses, totalCourses]);

  const levelBreakdown = useMemo(() => {
    const counts = countBy(state.courses.map((course) => course.level));
    return (Object.keys(levelLabels) as CourseLevel[]).map((level) => ({
      label: levelLabels[level],
      value: counts[level] ?? 0,
      percent: percentage(counts[level] ?? 0, state.courses.length),
    }));
  }, [state.courses]);

  const topCourses = useMemo(
    () =>
      [...state.courses]
        .sort((a, b) => (b.enrolledCount ?? 0) - (a.enrolledCount ?? 0) || (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 6),
    [state.courses],
  );

  const topInstructors = useMemo(() => {
    const map = new Map<string, { name: string; courseCount: number; studentCount: number }>();

    state.courses.forEach((course) => {
      const key = typeof course.instructor === "string" ? course.instructor : course.instructor?._id;
      const name = getInstructorName(course);
      const id = key || name;
      const current = map.get(id) ?? { name, courseCount: 0, studentCount: 0 };

      current.courseCount += 1;
      current.studentCount += course.enrolledCount ?? 0;
      map.set(id, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.studentCount - a.studentCount || b.courseCount - a.courseCount)
      .slice(0, 5);
  }, [state.courses]);

  const overviewCards = [
    {
      label: "Người dùng",
      value: totalUsers.toLocaleString("vi-VN"),
      hint: `${(state.stats.users?.admins ?? 0).toLocaleString("vi-VN")} quản trị viên`,
      icon: Users,
      tone: "bg-primary-50 text-primary-700",
    },
    {
      label: "Khóa học",
      value: totalCourses.toLocaleString("vi-VN"),
      hint: `${publishedCourses.toLocaleString("vi-VN")} khóa đã xuất bản`,
      icon: BookOpen,
      tone: "bg-secondary-50 text-secondary-700",
    },
    {
      label: "Giao dịch",
      value: totalTransactions.toLocaleString("vi-VN"),
      hint: "Giao dịch thanh toán thành công",
      icon: GraduationCap,
      tone: "bg-success-light text-success",
    },
    {
      label: "Doanh thu",
      value: formatPrice(totalRevenue),
      hint: "Tổng doanh thu ghi nhận",
      icon: DollarSign,
      tone: "bg-warning-light text-warning",
    },
  ];

  if (isLoading) return <AnalyticsLoading />;

  return (
    <div className="content-stack">
      <div className="flex flex-col gap-4 rounded-lg border border-border/80 bg-white p-5 shadow-card md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
            <BarChart3 className="h-4 w-4" />
            Báo cáo vận hành
          </div>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Thống kê hệ thống</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi sức khỏe nền tảng qua người dùng, khóa học, doanh thu và hoạt động gần đây.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          isLoading={isRefreshing}
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => loadAnalytics(true)}
        >
          Làm mới
        </Button>
      </div>

      {error ? (
        <Card className="border-error/30">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Activity className="h-10 w-10 text-error" />
            <div>
              <p className="font-semibold text-foreground">Không tải được thống kê</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button type="button" onClick={() => loadAnalytics()}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {warning ? (
        <Card className="border-warning/30">
          <CardContent className="p-4 text-sm text-accent-900">{warning}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
                </div>
                <div className={`rounded-lg p-3 ${card.tone}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Phân bổ trạng thái khóa học</CardTitle>
            <CardDescription>{pendingCourses.toLocaleString("vi-VN")} khóa học đang chờ duyệt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusBreakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">{item.value.toLocaleString("vi-VN")} khóa</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-primary-600" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bổ cấp độ</CardTitle>
            <CardDescription>Cơ cấu khóa học theo độ khó hiện tại.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {levelBreakdown.map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <Badge variant="outline">{item.percent}%</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.value.toLocaleString("vi-VN")} khóa học</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              Khóa học nổi bật
            </CardTitle>
            <CardDescription>Sắp xếp theo số học viên và điểm đánh giá.</CardDescription>
          </CardHeader>
          <CardContent>
            {topCourses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[42rem]">
                  <thead>
                    <tr className="border-b border-border text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Khóa học</th>
                      <th className="pb-3 text-right font-medium">Học viên</th>
                      <th className="pb-3 text-right font-medium">Đánh giá</th>
                      <th className="pb-3 text-right font-medium">Doanh thu ước tính</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {topCourses.map((course) => {
                      const estimatedRevenue = (course.enrolledCount ?? 0) * (course.price ?? 0);

                      return (
                        <tr key={course._id}>
                          <td className="py-3 pr-4">
                            <Link href={`/courses/${course.slug}`} className="font-medium text-foreground hover:text-primary-700">
                              {course.title}
                            </Link>
                            <p className="mt-1 text-xs text-muted-foreground">{getInstructorName(course)}</p>
                          </td>
                          <td className="py-3 text-right text-sm text-foreground">
                            {(course.enrolledCount ?? 0).toLocaleString("vi-VN")}
                          </td>
                          <td className="py-3 text-right text-sm text-foreground">
                            <span className="inline-flex items-center justify-end gap-1">
                              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                              {(course.rating ?? 0).toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 text-right text-sm font-semibold text-primary-700">
                            {formatPrice(estimatedRevenue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu khóa học để thống kê.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Giảng viên nổi bật</CardTitle>
            <CardDescription>Tổng hợp từ các khóa học đang có trong hệ thống.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topInstructors.length > 0 ? (
              topInstructors.map((instructor, index) => (
                <div key={instructor.name} className="flex items-center gap-3 rounded-lg border border-border bg-white p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-50 text-sm font-bold text-secondary-700">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{instructor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {instructor.courseCount.toLocaleString("vi-VN")} khóa học
                    </p>
                  </div>
                  <Badge variant="primary-light">{instructor.studentCount.toLocaleString("vi-VN")} học viên</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu giảng viên.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
          <CardDescription>Người dùng mới và lượt ghi danh mới nhất trên nền tảng.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Người dùng mới</p>
            {state.recentUsers.length > 0 ? (
              state.recentUsers.slice(0, 5).map((user) => (
                <div key={user._id} className="flex items-center justify-between gap-3 rounded-lg bg-surface/60 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant={user.role === "admin" ? "secondary" : "outline"}>{user.role === "admin" ? "Admin" : "Người dùng"}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Chưa có người dùng mới.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Ghi danh mới</p>
            {state.recentEnrollments.length > 0 ? (
              state.recentEnrollments.slice(0, 5).map((enrollment) => {
                const course = typeof enrollment.course === "string" ? null : enrollment.course;
                const student = typeof enrollment.student === "string" ? null : enrollment.student;

                return (
                  <div key={enrollment._id} className="rounded-lg bg-surface/60 px-3 py-2">
                    <p className="truncate text-sm font-medium text-foreground">{student?.name || "Học viên"}</p>
                    <p className="truncate text-xs text-muted-foreground">{course?.title || "Khóa học"}</p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Chưa có ghi danh mới.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
