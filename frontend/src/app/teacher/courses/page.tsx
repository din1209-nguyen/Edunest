"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { teacherCourseApi as creatorCourseApi } from "@/lib/teacherApi";
import { normalizeCourse } from "@/lib/courseUtils";
import { formatPrice } from "@/lib/utils";
import {
  BarChart,
  BookOpen,
  CalendarClock,
  DollarSign,
  Edit,
  Eye,
  FileWarning,
  Plus,
  Search,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Course } from "@/types";

type TeacherCourseResponse = Course[] | { courses?: Course[] };
const COURSE_THUMBNAIL_FALLBACK = "/placeholder-course.svg";

function getCourseViewLink(course: Course) {
  if (course.status === "published" && course.slug) {
    return `/courses/${course.slug}`;
  }

  return `/teacher/courses/${course._id}/edit`;
}

const statusConfig = {
  published: { label: "Đã xuất bản", color: "bg-success text-white" },
  draft: { label: "Bản nháp", color: "bg-muted text-white" },
  pending: { label: "Chờ duyệt", color: "bg-warning text-white" },
  rejected: { label: "Bị từ chối", color: "bg-error text-white" },
  locked: { label: "Bị khóa", color: "bg-error text-white" },
  banned: { label: "Bị cấm", color: "bg-error text-white" },
};

function unwrapCourses(data: TeacherCourseResponse | undefined): Course[] {
  if (Array.isArray(data)) return data;
  return data?.courses ?? [];
}

export default function TeacherCoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCourses() {
      try {
        setLoading(true);
        setError("");
        const response = await creatorCourseApi.getMyCourses();
        if (!mounted) return;
        setCourses(unwrapCourses(response.data as TeacherCourseResponse).map(normalizeCourse));
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load creator courses", err);
        setError("Không thể tải danh sách khóa học. Hãy đăng nhập bằng tài khoản phù hợp rồi thử lại.");
        setCourses([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCourses();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        if (filterStatus !== "all" && course.status !== filterStatus) return false;
        if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      }),
    [courses, filterStatus, searchQuery],
  );

  const stats = useMemo(() => {
    const totalStudents = courses.reduce((sum, course) => sum + (course.enrolledCount ?? 0), 0);
    const totalRevenue = courses.reduce(
      (sum, course) => sum + (course.price ?? 0) * (course.enrolledCount ?? 0),
      0,
    );

    return {
      total: courses.length,
      published: courses.filter((course) => course.status === "published").length,
      totalStudents,
      totalRevenue,
    };
  }, [courses]);

  return (
    <div className="content-stack">
      <div>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Tổng khóa học", value: stats.total, icon: BookOpen, color: "bg-primary-100 text-primary-600" },
            { label: "Đã xuất bản", value: stats.published, icon: TrendingUp, color: "bg-success-light text-success" },
            { label: "Học viên", value: stats.totalStudents.toLocaleString(), icon: Users, color: "bg-secondary-100 text-secondary-600" },
            { label: "Doanh thu ước tính", value: formatPrice(stats.totalRevenue), icon: DollarSign, color: "bg-accent-100 text-accent-600" },
          ].map((stat) => (
            <Card key={stat.label} className="p-3.5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-5 grid gap-3 lg:grid-cols-2">
          <Card className="border-warning/20 bg-warning/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15 text-warning">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Bản nháp cần hoàn thiện</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mở bản nháp để bổ sung thumbnail, nội dung và gửi duyệt khi đã sẵn sàng.
                </p>
              </div>
            </div>
          </Card>
          <Card className="border-primary-200 bg-primary-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <FileWarning className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Flow tạo khóa học đã sẵn sàng</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Khóa học mới sẽ được lưu nháp và mở trong trang chỉnh sửa nội bộ để tránh lỗi trang công khai chưa xuất bản.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full sm:w-80">
            <Input
              placeholder="Tìm kiếm khóa học..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "published", "draft", "pending", "rejected", "locked"].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status === "all"
                  ? "Tất cả"
                  : statusConfig[status as keyof typeof statusConfig]?.label ?? status}
              </Button>
            ))}
            <Link href="/teacher/courses/create">
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                Tạo khóa học
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {loading || filteredCourses.length === 0 ? (
          <Card className="p-8 text-center md:p-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {loading ? "Đang tải khóa học..." : "Không có khóa học"}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {loading
                ? "Đang đồng bộ dữ liệu khóa học"
                : searchQuery
                  ? "Không tìm thấy khóa học phù hợp"
                  : "Tài khoản này chưa tạo khóa học nào"}
            </p>
            {!loading && (
              <Link href="/teacher/courses/create" className="mt-6 inline-block">
                <Button leftIcon={<Plus className="h-4 w-4" />}>Tạo khóa học đầu tiên</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => {
              const statusMeta = statusConfig[course.status as keyof typeof statusConfig] ?? statusConfig.draft;
              return (
                <Card key={course._id} className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg sm:h-32 sm:w-48">
                      <Image
                        src={course.thumbnail || COURSE_THUMBNAIL_FALLBACK}
                        alt={course.title}
                        fill
                        sizes="192px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={statusMeta.color}>{statusMeta.label}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(course.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <h3 className="mt-2 font-semibold text-foreground">{course.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {(course.enrolledCount ?? 0).toLocaleString()} học viên
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {course.totalLessons ?? 0} bài học
                          </span>
                          {(course.rating ?? 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-warning text-warning" />
                              {course.rating} ({course.reviewCount ?? 0})
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatPrice((course.price ?? 0) * (course.enrolledCount ?? 0))}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={getCourseViewLink(course)}>
                          <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                            {course.status === "published" ? "Xem" : "Mở bản nháp"}
                          </Button>
                        </Link>
                        <Link href={`/teacher/courses/${course._id}/edit`}>
                          <Button variant="outline" size="sm" leftIcon={<Edit className="h-4 w-4" />}>
                            Sửa
                          </Button>
                        </Link>
                        <Link href={`/teacher/students?courseId=${course._id}`}>
                          <Button variant="outline" size="sm" leftIcon={<Users className="h-4 w-4" />}>
                            Học viên
                          </Button>
                        </Link>
                        <Link href={`/teacher/courses/${course._id}/analytics`}>
                          <Button variant="outline" size="sm" leftIcon={<BarChart className="h-4 w-4" />}>
                            Thống kê
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
