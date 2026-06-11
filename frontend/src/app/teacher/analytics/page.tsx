"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Avatar } from "@/components/ui/Avatar";
import { creatorDashboardApi, teacherCourseApi as creatorCourseApi } from "@/lib/teacherApi";
import { normalizeCourse } from "@/lib/courseUtils";
import { formatPrice } from "@/lib/utils";
import { Users, BookOpen, DollarSign, TrendingUp, Star, Clock, BarChart3 } from "lucide-react";
import type { Course, Enrollment, TeacherStats, User } from "@/types";

const timeRanges = [
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "90d", label: "90 ngày qua" },
  { value: "1y", label: "1 năm qua" },
];

type TeacherCourseResponse = Course[] | { courses?: Course[] };

function unwrapCourses(data: TeacherCourseResponse | undefined): Course[] {
  if (Array.isArray(data)) return data;
  return data?.courses ?? [];
}

function courseTitle(course: Enrollment["course"]): string {
  return typeof course === "string" ? course : course?.title ?? "Khóa học";
}

function studentInfo(student: Enrollment["student"]): Pick<User, "name" | "avatar"> {
  if (typeof student === "string") return { name: "Học viên", avatar: undefined };
  return { name: student?.name ?? "Học viên", avatar: student?.avatar };
}

export default function TeacherAnalyticsPage() {
  const searchParams = useSearchParams();
  const selectedCourseId = searchParams.get("courseId") || "";
  const [timeRange, setTimeRange] = useState("30d");
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");
        const [statsResponse, coursesResponse] = await Promise.all([
          creatorDashboardApi.getStats(),
          creatorCourseApi.getMyCourses(),
        ]);

        if (!mounted) return;

        setStats(statsResponse.data ?? null);
        setCourses(unwrapCourses(coursesResponse.data as TeacherCourseResponse).map(normalizeCourse));
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load creator analytics", err);
        setError("Không thể tải thống kê quản lý khóa học. Hãy đăng nhập đúng tài khoản user hoặc admin.");
        setStats(null);
        setCourses([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAnalytics();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCourses = useMemo(() => {
    if (!selectedCourseId) return courses;
    return courses.filter((course) => course._id === selectedCourseId);
  }, [courses, selectedCourseId]);

  const selectedCourse = useMemo(() => {
    return courses.find((course) => course._id === selectedCourseId) ?? null;
  }, [courses, selectedCourseId]);

  const filteredEnrollments = useMemo(() => {
    const enrollments = stats?.recentEnrollments ?? [];
    if (!selectedCourseId) return enrollments;
    return enrollments.filter((enrollment) => {
      const course = enrollment.course;
      return typeof course === "string" ? course === selectedCourseId : course?._id === selectedCourseId;
    });
  }, [selectedCourseId, stats?.recentEnrollments]);

  const analytics = useMemo(() => {
    const totalStudents = filteredCourses.reduce((sum, course) => sum + (course.enrolledCount ?? 0), 0);
    const totalRevenue = filteredCourses.reduce((sum, course) => sum + (course.price ?? 0) * (course.enrolledCount ?? 0), 0);
    const avgRating =
      filteredCourses.length > 0
        ? filteredCourses.reduce((sum, course) => sum + (course.rating ?? 0), 0) / filteredCourses.length
        : 0;
    const topCourses = [...filteredCourses]
      .sort((a, b) => (b.enrolledCount ?? 0) - (a.enrolledCount ?? 0))
      .slice(0, 5);
    const maxRevenue = Math.max(
      1,
      ...topCourses.map((course) => (course.price ?? 0) * (course.enrolledCount ?? 0))
    );

    return { totalStudents, totalRevenue, avgRating, topCourses, maxRevenue };
  }, [filteredCourses]);

  return (
    <div className="content-stack">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedCourse ? `Đang xem khóa học: ${selectedCourse.title}` : "Dữ liệu dashboard thật từ MongoDB"}
          </p>
          <Select value={timeRange} onChange={setTimeRange} options={timeRanges} className="w-full sm:w-40" />
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Tổng học viên", value: analytics.totalStudents.toLocaleString(), icon: Users, color: "bg-primary-100 text-primary-600" },
            { label: "Doanh thu", value: formatPrice(analytics.totalRevenue), icon: DollarSign, color: "bg-success-light text-success" },
            { label: "Tổng khóa học", value: filteredCourses.length, icon: BookOpen, color: "bg-secondary-100 text-secondary-600" },
            { label: "Đánh giá TB", value: analytics.avgRating.toFixed(1), icon: Star, color: "bg-warning-light text-warning" },
          ].map((item) => (
            <Card key={item.label} className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-hover">
                <item.icon className={`h-6 w-6 ${item.color.split(" ").at(-1)}`} />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground">{loading ? "..." : item.value}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-600" />
                Doanh thu theo khóa học
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topCourses.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  Chưa có khóa học để thống kê
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.topCourses.map((course) => {
                    const revenue = (course.price ?? 0) * (course.enrolledCount ?? 0);
                    return (
                      <div key={course._id} className="flex items-center gap-4">
                        <span className="w-24 truncate text-sm font-medium text-muted-foreground">
                          {course.title}
                        </span>
                        <div className="h-8 flex-1 overflow-hidden rounded-lg bg-surface">
                          <div
                            className="h-full rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500"
                            style={{ width: `${(revenue / analytics.maxRevenue) * 100}%` }}
                          />
                        </div>
                        <span className="w-28 text-right text-sm font-medium text-foreground">
                          {formatPrice(revenue)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-warning" />
                Trạng thái khóa học
              </CardTitle>
            </CardHeader>
            <CardContent>
              {["published", "pending", "draft", "rejected", "locked"].map((status) => {
                const count = filteredCourses.filter((course) => course.status === status).length;
                const percentage = filteredCourses.length ? (count / filteredCourses.length) * 100 : 0;
                return (
                  <div key={status} className="mb-3 flex items-center gap-3 last:mb-0">
                    <span className="w-24 text-sm capitalize text-muted-foreground">{status}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-warning" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="w-10 text-right text-sm text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary-600" />
                Khóa học nổi bật
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topCourses.map((course, index) => (
                  <div key={course._id} className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{course.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {(course.enrolledCount ?? 0).toLocaleString()} hoc vien - {formatPrice((course.price ?? 0) * (course.enrolledCount ?? 0))}
                      </p>
                    </div>
                  </div>
                ))}
                {!loading && analytics.topCourses.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">Chưa có dữ liệu khóa học</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-secondary-600" />
                Đăng ký gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEnrollments.map((enrollment) => {
                  const student = studentInfo(enrollment.student);
                  return (
                    <div key={enrollment._id} className="flex items-center gap-4">
                      <Avatar src={student.avatar} name={student.name} size="sm" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{courseTitle(enrollment.course)}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(enrollment.enrolledAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  );
                })}
                {!loading && filteredEnrollments.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">Chưa có đăng ký gần đây</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
