"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { DashboardStatsSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/stores/auth";
import { adminCourseApi, adminDashboardApi } from "@/lib/adminApi";
import { AdminCoursePreviewModal } from "@/components/admin/AdminCoursePreviewModal";
import { useSocket } from "@/hooks/useSocket";
import { formatPrice } from "@/lib/utils";
import {
  Users,
  BookOpen,
  GraduationCap,
  DollarSign,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Wifi,
  ShieldCheck,
} from "lucide-react";
import type { Course, User } from "@/types";

const COURSE_THUMBNAIL_FALLBACK = "/placeholder-course.svg";

interface AdminDashboardState {
  totals: {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    totalRevenue: number;
  };
  recentUsers: User[];
  pendingCourses: Course[];
  topCourses: Course[];
}

function AdminDashboardLoading() {
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
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-4 md:p-5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const toast = useToast();
  const { socket, isConnected } = useSocket();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null);
  const [isRejectingId, setIsRejectingId] = useState<string | null>(null);
  const [previewCourseId, setPreviewCourseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<AdminDashboardState>({
    totals: {
      totalUsers: 0,
      totalCourses: 0,
      totalEnrollments: 0,
      totalRevenue: 0,
    },
    recentUsers: [],
    pendingCourses: [],
    topCourses: [],
  });

  const loadDashboard = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [statsRes, recentRes, coursesRes] = await Promise.all([
        adminDashboardApi.getStats(),
        adminDashboardApi.getRecentActivity(5),
        adminCourseApi.getAllCourses(1, 50),
      ]);

      const statsData = statsRes.data as
        | {
            courses?: { total?: number; pending?: number };
            users?: { total?: number };
            payments?: { totalTransactions?: number; totalRevenue?: number };
          }
        | undefined;

      const recentData = recentRes.data ?? {
        recentEnrollments: [],
        recentUsers: [],
        recentCourses: [],
      };

      const allCourses = coursesRes.data ?? [];
      const pendingCourses = allCourses.filter((course) => course.status === "pending").slice(0, 5);
      const topCourses = [...allCourses]
        .sort((a, b) => (b.enrolledCount ?? 0) - (a.enrolledCount ?? 0) || (b.price ?? 0) - (a.price ?? 0))
        .slice(0, 5);

      setState({
        totals: {
          totalUsers: statsData?.users?.total ?? recentData.recentUsers.length,
          totalCourses: statsData?.courses?.total ?? allCourses.length,
          totalEnrollments: statsData?.payments?.totalTransactions ?? recentData.recentEnrollments.length,
          totalRevenue: statsData?.payments?.totalRevenue ?? 0,
        },
        recentUsers: recentData.recentUsers ?? [],
        pendingCourses,
        topCourses,
      });
    } catch {
      setError("Không thể tải bảng điều khiển quản trị lúc này.");
      if (!silent) {
        toast.error("Không thể tải bảng điều khiển quản trị. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    if (!socket) return;

    const handleAdminNotification = () => {
      toast.info("Có cập nhật mới cho khu vực quản trị.");
      loadDashboard(true);
    };

    socket.on("admin:notification", handleAdminNotification);
    return () => {
      socket.off("admin:notification", handleAdminNotification);
    };
  }, [socket, loadDashboard, toast]);

  const handleApprove = async (courseId: string) => {
    setIsApprovingId(courseId);
    try {
      await adminCourseApi.approveCourse(courseId);
      toast.success("Đã duyệt khóa học thành công.");
      setPreviewCourseId(null);
      await loadDashboard(true);
    } catch {
      toast.error("Không thể duyệt khóa học. Vui lòng thử lại.");
    } finally {
      setIsApprovingId(null);
    }
  };

  const handleReject = async (courseId: string) => {
    const reason = typeof window !== "undefined" ? window.prompt("Nhập lý do từ chối khóa học", "Vui lòng bổ sung nội dung cần thiết trước khi xuất bản.") : null;
    if (!reason) return;

    setIsRejectingId(courseId);
    try {
      await adminCourseApi.rejectCourse(courseId, reason);
      toast.success("Đã từ chối khóa học.");
      setPreviewCourseId(null);
      await loadDashboard(true);
    } catch {
      toast.error("Không thể từ chối khóa học. Vui lòng thử lại.");
    } finally {
      setIsRejectingId(null);
    }
  };

  const stats = useMemo(
    () => [
      { label: "Tổng người dùng", value: state.totals.totalUsers, icon: Users, color: "bg-primary-100 text-primary-600" },
      { label: "Tổng khóa học", value: state.totals.totalCourses, icon: BookOpen, color: "bg-secondary-100 text-secondary-600" },
      { label: "Tổng giao dịch", value: state.totals.totalEnrollments, icon: GraduationCap, color: "bg-success-light text-success" },
      { label: "Tổng doanh thu", value: state.totals.totalRevenue, icon: DollarSign, color: "bg-warning-light text-warning" },
    ],
    [state.totals]
  );

  if (isLoading) {
    return <AdminDashboardLoading />;
  }

  return (
    <div className="content-stack">
      <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,#0f172a_0%,#172554_54%,#134e4a_100%)] text-white shadow-xl shadow-slate-950/10">
        <div className="grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-8 lg:py-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin control center
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Xin chào, {user?.name || "Quản trị viên"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75 md:text-base">
              Theo dõi toàn hệ thống, xử lý khóa học chờ duyệt và phản ứng nhanh với các thay đổi mới từ nền tảng
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/80">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1">
                <Wifi className={`h-3.5 w-3.5 ${isConnected ? "text-emerald-200" : "text-amber-200"}`} />
                {isConnected ? "Kết nối trực tiếp đang bật" : "Kết nối trực tiếp đang gián đoạn"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/10 px-3 py-1 text-white/75">
                <AlertCircle className="h-3.5 w-3.5" />
                Ưu tiên xử lý khu vực chờ duyệt và tăng trưởng hệ thống
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button variant="outline" onClick={() => loadDashboard(true)} isLoading={isRefreshing} className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
            <Link href="/admin/courses">
              <Button className="w-full gap-2 sm:w-auto lg:w-full xl:w-auto">
                <Eye className="h-4 w-4" />
                Quản lý khóa học
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error ? (
        <Card className="border-error/30">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <AlertCircle className="h-10 w-10 text-error" />
            <div>
              <p className="font-semibold text-foreground">Không tải được dữ liệu quản trị</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={() => loadDashboard()}>Thử lại</Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {stat.label.includes("Doanh thu") ? formatPrice(stat.value) : stat.value.toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 md:gap-5">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Khóa học chờ duyệt
            </h2>
            <Badge variant="warning">{state.pendingCourses.length} mới</Badge>
          </div>

          <Card>
            {state.pendingCourses.length > 0 ? (
              <CardContent className="divide-y divide-border p-0">
                {state.pendingCourses.map((course) => {
                  const instructor = typeof course.instructor === "string" ? null : course.instructor;
                  return (
                    <div key={course._id} className="flex items-start gap-3 p-4 sm:items-center sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{course.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Avatar src={instructor?.avatar} name={instructor?.name || "Giảng viên"} size="xs" />
                          <span className="text-sm text-muted-foreground">{instructor?.name || "Giảng viên"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setPreviewCourseId(course._id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-success"
                          onClick={() => handleApprove(course._id)}
                          isLoading={isApprovingId === course._id}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-error"
                          onClick={() => handleReject(course._id)}
                          isLoading={isRejectingId === course._id}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            ) : (
              <CardContent className="py-8 text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-success" />
                <p className="mt-2 text-muted-foreground">Không có khóa học nào chờ duyệt</p>
              </CardContent>
            )}
            <div className="border-t border-border p-4">
              <Link href="/admin/courses?status=pending">
                <Button variant="ghost" size="sm" className="w-full gap-2">
                  Xem tất cả
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Người dùng mới</h2>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="gap-2">
                Xem tất cả
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-0">
              {state.recentUsers.length > 0 ? (
                <div className="divide-y divide-border">
                  {state.recentUsers.map((recentUser) => (
                    <div key={recentUser._id} className="flex items-center gap-3 p-4 sm:gap-4">
                      <Avatar src={recentUser.avatar} name={recentUser.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{recentUser.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{recentUser.email}</p>
                      </div>
                      <Badge
                        variant={recentUser.role === "admin" ? "secondary" : "outline"}
                        size="sm"
                      >
                        {recentUser.role === "admin" ? "Admin" : "Người dùng"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Users className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 font-medium text-foreground">Chưa có người dùng mới</p>
                  <p className="mt-1 text-sm text-muted-foreground">Danh sách tài khoản đăng ký gần đây sẽ hiển thị tại đây.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Khóa học nổi bật theo dữ liệu hiện tại</h2>
          <Link href="/admin/analytics">
            <Button variant="ghost" size="sm" className="gap-2">
              Xem chi tiết
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-0">
            {state.topCourses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-[44rem] w-full">
                  <thead className="border-b border-border bg-surface">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Khóa học</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Học viên</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Giá</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {state.topCourses.map((course) => (
                      <tr key={course._id} className="transition-colors hover:bg-surface">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-16 overflow-hidden rounded">
                              <Image src={course.thumbnail || COURSE_THUMBNAIL_FALLBACK} alt={course.title} fill sizes="64px" className="object-cover" />
                            </div>
                            <span className="font-medium text-foreground">{course.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {(course.enrolledCount ?? 0).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-primary-600">
                          {formatPrice(course.price)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/courses/${course.slug}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <CardContent className="p-8 text-center text-muted-foreground">
                Chưa có dữ liệu khóa học để hiển thị.
              </CardContent>
            )}
          </CardContent>
        </Card>
      </section>
      <AdminCoursePreviewModal
        courseId={previewCourseId}
        isOpen={Boolean(previewCourseId)}
        onClose={() => setPreviewCourseId(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        approvingCourseId={isApprovingId}
        rejectingCourseId={isRejectingId}
      />
    </div>
  );
}
