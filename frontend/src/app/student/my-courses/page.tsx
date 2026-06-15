"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { enrollmentApi } from "@/lib/studentApi";
import { useIsAuthenticated } from "@/stores/auth";
import { useToastStore } from "@/stores/wishlistStore";
import {
  Search,
  Play,
  BookOpen,
  Award,
  Filter,
  Grid3X3,
  List,
  ChevronRight,
  Star,
} from "lucide-react";

const tabs = [
  { id: "all", label: "Tất cả" },
  { id: "in-progress", label: "Đang học" },
  { id: "completed", label: "Hoàn thành" },
] as const;

type TabId = (typeof tabs)[number]["id"];
const COURSE_THUMBNAIL_FALLBACK = "/placeholder-course.svg";

type UiCourse = {
  enrollmentId: string;
  courseId: string;
  title: string;
  slug: string;
  thumbnail: string;
  instructorName?: string;
  progress: number;
  totalLessons?: number;
  completedLessonsCount?: number;
};

export default function MyCoursesPage() {
  const addToast = useToastStore((state) => state.addToast);
  const isAuthenticated = useIsAuthenticated();

  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<UiCourse[]>([]);
  const [isLoading, setIsLoading] = useState(isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const res = await enrollmentApi.getMyEnrollments(1, 50);
        const enrollments = res.data?.enrollments ?? [];

        const mapped: UiCourse[] = enrollments
          .map((e) => {
            const course = typeof e.course === "string" ? null : e.course;
            if (!course) return null;

            return {
              enrollmentId: e._id,
              courseId: course._id,
              title: course.title,
              slug: course.slug,
              thumbnail: course.thumbnail,
              instructorName:
                typeof course.instructor === "string" ? undefined : course.instructor?.name,
              progress: e.progress ?? 0,
              totalLessons: course.totalLessons,
              completedLessonsCount: e.completedLessons?.length ?? 0,
            };
          })
          .filter(Boolean) as UiCourse[];

        if (!cancelled) setCourses(mapped);
      } catch {
        addToast({ type: "error", message: "Không thể tải danh sách khóa học. Vui lòng thử lại." });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [addToast, isAuthenticated]);

  const filteredCourses = useMemo(() => {
    const visibleCourses = isAuthenticated ? courses : [];
    const q = searchQuery.trim().toLowerCase();

    let list = visibleCourses;
    if (activeTab === "in-progress") list = list.filter((c) => c.progress < 100);
    if (activeTab === "completed") list = list.filter((c) => c.progress >= 100);
    if (q) list = list.filter((c) => c.title.toLowerCase().includes(q));

    return list;
  }, [isAuthenticated, courses, activeTab, searchQuery]);

  const visibleCourses = isAuthenticated ? courses : [];

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-card backdrop-blur-sm sm:p-6 lg:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge variant="primary-light" className="mb-3 w-fit px-3 py-1.5">
                <BookOpen className="mr-1 h-3.5 w-3.5" />
                Trung tâm học tập cá nhân
              </Badge>
              <h1 className="page-title">Khóa học của tôi</h1>
              <p className="page-subtitle">
                Theo dõi tiến độ, quay lại đúng bài đang học và giữ nhịp học tập mỗi ngày
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
              <div className="rounded-2xl border border-border bg-surface/80 p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{visibleCourses.length}</p>
                <p className="text-xs text-muted-foreground">Khóa đã ghi danh</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface/80 p-4 text-center">
                <p className="text-2xl font-bold text-primary-600">
                  {Math.round(
                    visibleCourses.reduce((sum, course) => sum + course.progress, 0) /
                      Math.max(visibleCourses.length, 1),
                  )}
                  %
                </p>
                <p className="text-xs text-muted-foreground">Tiến độ trung bình</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-card backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Input
                placeholder="Tìm kiếm khóa học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-xl border border-border bg-background/80 p-1 shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-lg p-2 ${
                    viewMode === "grid"
                      ? "bg-primary-50 text-primary-600"
                      : "text-muted-foreground hover:bg-surface"
                  }`}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg p-2 ${
                    viewMode === "list"
                      ? "bg-primary-50 text-primary-600"
                      : "text-muted-foreground hover:bg-surface"
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
              <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                Bộ lọc nhanh
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary-600 text-white shadow-sm"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Đang tải...</p>
          </Card>
        ) : filteredCourses.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Chưa có khóa học</h3>
            <p className="mt-2 text-muted-foreground">Bạn chưa đăng ký khóa học nào</p>
            <Link href="/courses" className="mt-6 inline-block">
              <Button>Khám phá khóa học</Button>
            </Link>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card key={course.enrollmentId} className="overflow-hidden">
                <div className="relative aspect-video">
                  <Image src={course.thumbnail || COURSE_THUMBNAIL_FALLBACK} alt={course.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                    <Link href={`/student/learn/${course.slug}`}>
                      <Button size="icon" variant="secondary" className="h-14 w-14 rounded-full">
                        <Play className="h-6 w-6" />
                      </Button>
                    </Link>
                  </div>
                  {course.progress >= 100 && (
                    <Badge className="absolute left-2 top-2 bg-accent-500">
                      <Award className="mr-1 h-3 w-3" />
                      Hoàn thành
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground line-clamp-2">{course.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{course.instructorName}</p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tiến độ</span>
                      <span className="font-medium text-foreground">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    {typeof course.totalLessons === "number" && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {course.completedLessonsCount ?? 0}/{course.totalLessons} bài
                        </span>
                      </div>
                    )}
                  </div>

                  <Link href={`/student/learn/${course.slug}`} className="mt-4 block">
                    <Button className="w-full" size="sm">
                      Vào học
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  {course.progress >= 100 ? (
                    <Link href={`/courses/${course.slug}#reviews`} className="mt-2 block">
                      <Button className="w-full" variant="outline" size="sm" leftIcon={<Star className="h-4 w-4" />}>
                        Đánh giá
                      </Button>
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <Card key={course.enrollmentId} className="p-4">
                <div className="flex gap-4">
                  <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-lg">
                    <Image src={course.thumbnail || COURSE_THUMBNAIL_FALLBACK} alt={course.title} fill sizes="128px" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={course.progress >= 100 ? "bg-success" : "bg-primary-600"}>
                          {course.progress >= 100 ? "Hoàn thành" : "Đang học"}
                        </Badge>
                      </div>
                      <h3 className="mt-2 font-semibold text-foreground">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">{course.instructorName}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-muted-foreground">Tiến độ</span>
                          <span className="font-medium text-foreground">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>

                      <div className="ml-4 flex shrink-0 flex-wrap gap-2">
                        {course.progress >= 100 ? (
                          <Link href={`/courses/${course.slug}#reviews`}>
                            <Button variant="outline" size="sm" leftIcon={<Star className="h-4 w-4" />}>
                              Đánh giá
                            </Button>
                          </Link>
                        ) : null}
                      <Link href={`/student/learn/${course.slug}`}>
                        <Button size="sm">
                          Vào học
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
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
