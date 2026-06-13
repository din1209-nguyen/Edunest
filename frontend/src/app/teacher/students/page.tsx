"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { teacherCourseApi, teacherDashboardApi } from "@/lib/teacherApi";
import { normalizeCourse } from "@/lib/courseUtils";
import { formatPrice } from "@/lib/utils";
import { ArrowRight, BookOpen, GraduationCap, RefreshCw, Search, Users } from "lucide-react";
import type { Course, Enrollment, TeacherStats, User } from "@/types";

type TeacherCourseResponse = Course[] | { courses?: Course[] };

function unwrapCourses(data: TeacherCourseResponse | undefined): Course[] {
  if (Array.isArray(data)) return data;
  return data?.courses ?? [];
}

function getStudentInfo(student: Enrollment["student"]): Pick<User, "_id" | "name" | "email" | "avatar"> {
  if (typeof student === "string") {
    return { _id: student, name: "Học viên", email: "", avatar: undefined };
  }

  return {
    _id: student?._id ?? "",
    name: student?.name ?? "Học viên",
    email: student?.email ?? "",
    avatar: student?.avatar,
  };
}

function getCourseInfo(course: Enrollment["course"], courses: Course[]) {
  if (typeof course !== "string") return course;
  return courses.find((item) => item._id === course) ?? null;
}

export default function TeacherStudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCourseId = searchParams.get("courseId") || "all";
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [statsResponse, coursesResponse] = await Promise.all([
        teacherDashboardApi.getStats(),
        teacherCourseApi.getMyCourses(),
      ]);

      setStats(statsResponse.data ?? null);
      setCourses(unwrapCourses(coursesResponse.data as TeacherCourseResponse).map(normalizeCourse));
    } catch (requestError) {
      console.error("Failed to load teacher students", requestError);
      setError("Không thể tải dữ liệu học viên. Vui lòng thử lại sau.");
      setStats(null);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStudents();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadStudents]);

  const courseOptions = useMemo(
    () => [
      { value: "all", label: "Tất cả khóa học" },
      ...courses.map((course) => ({ value: course._id, label: course.title })),
    ],
    [courses],
  );

  const selectedCourse = useMemo(
    () => courses.find((course) => course._id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );

  const filteredCourses = useMemo(() => {
    if (selectedCourseId === "all") return courses;
    return courses.filter((course) => course._id === selectedCourseId);
  }, [courses, selectedCourseId]);

  const filteredEnrollments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const enrollments = stats?.recentEnrollments ?? [];

    return enrollments.filter((enrollment) => {
      const course = getCourseInfo(enrollment.course, courses);
      const student = getStudentInfo(enrollment.student);
      const matchesCourse = selectedCourseId === "all" || course?._id === selectedCourseId;
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        (course?.title ?? "").toLowerCase().includes(query);

      return matchesCourse && matchesSearch;
    });
  }, [courses, searchQuery, selectedCourseId, stats?.recentEnrollments]);

  const totals = useMemo(() => {
    const totalStudents = filteredCourses.reduce((sum, course) => sum + (course.enrolledCount ?? course.totalStudents ?? 0), 0);
    const totalRevenue = filteredCourses.reduce(
      (sum, course) => sum + (course.price ?? 0) * (course.enrolledCount ?? course.totalStudents ?? 0),
      0,
    );

    return {
      totalCourses: filteredCourses.length,
      totalStudents,
      totalRevenue,
      recentEnrollments: filteredEnrollments.length,
    };
  }, [filteredCourses, filteredEnrollments.length]);

  return (
    <div className="content-stack">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng học viên", value: loading ? "..." : totals.totalStudents.toLocaleString("vi-VN"), icon: Users, color: "bg-primary-100 text-primary-600" },
          { label: "Khóa học", value: loading ? "..." : totals.totalCourses.toLocaleString("vi-VN"), icon: BookOpen, color: "bg-secondary-100 text-secondary-600" },
          { label: "Ghi danh gần đây", value: loading ? "..." : totals.recentEnrollments.toLocaleString("vi-VN"), icon: GraduationCap, color: "bg-accent-100 text-accent-600" },
          { label: "Doanh thu ước tính", value: loading ? "..." : formatPrice(totals.totalRevenue), icon: ArrowRight, color: "bg-success-light text-success" },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,280px)_auto]">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm học viên hoặc khóa học..."
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Select
            value={selectedCourseId}
            onChange={(value) => {
              router.replace(value === "all" ? "/teacher/students" : `/teacher/students?courseId=${value}`);
            }}
            options={courseOptions}
          />
          <Button variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => loadStudents()} isLoading={loading}>
            Tải lại
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{selectedCourse ? `Học viên của ${selectedCourse.title}` : "Học viên gần đây"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Đang tải danh sách học viên...</div>
            ) : filteredEnrollments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/60 p-8 text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 font-semibold text-foreground">Chưa có học viên phù hợp</p>
                <p className="mt-1 text-sm text-muted-foreground">Dữ liệu sẽ xuất hiện khi khóa học có lượt ghi danh mới.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredEnrollments.map((enrollment) => {
                  const student = getStudentInfo(enrollment.student);
                  const course = getCourseInfo(enrollment.course, courses);

                  return (
                    <div key={enrollment._id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                      <Avatar src={student.avatar} name={student.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{student.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{student.email || "Chưa có email hiển thị"}</p>
                        <p className="mt-1 truncate text-sm text-primary-600">{course?.title ?? "Khóa học"}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <Badge variant={enrollment.isActive ? "success" : "secondary-light"}>
                          {enrollment.isActive ? "Đang học" : "Tạm dừng"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(enrollment.enrolledAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Khóa học liên quan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredCourses.length === 0 && !loading ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/60 p-5 text-center text-sm text-muted-foreground">
                Không tìm thấy khóa học phù hợp.
              </div>
            ) : (
              filteredCourses.map((course) => (
                <div key={course._id} className="rounded-xl border border-border bg-surface/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{course.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {(course.enrolledCount ?? course.totalStudents ?? 0).toLocaleString("vi-VN")} học viên
                      </p>
                    </div>
                    <Badge variant={course.status === "published" ? "success" : "secondary-light"}>{course.status}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/teacher/courses/${course._id}/edit`}>Sửa khóa học</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/teacher/analytics?courseId=${course._id}`}>Thống kê</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
