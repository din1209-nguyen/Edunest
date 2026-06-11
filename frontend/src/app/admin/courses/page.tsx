"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Ban, BookOpen, CheckCircle, Clock, Download, Edit, Eye, Lock, Plus, Search, Star, Trash2, Users, XCircle } from "lucide-react";
import { AdminCoursePreviewModal } from "@/components/admin/AdminCoursePreviewModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import api from "@/lib/api";
import { adminCourseApi } from "@/lib/adminApi";
import type { ApiResponse, Category, Course, CourseStatus } from "@/types";

const COURSE_THUMBNAIL_FALLBACK = "/placeholder-course.svg";

const statusConfig: Record<CourseStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  published: { label: "Đã duyệt", color: "bg-success text-white", icon: CheckCircle },
  pending: { label: "Chờ duyệt", color: "bg-warning text-white", icon: Clock },
  draft: { label: "Bản nháp", color: "bg-muted text-white", icon: Clock },
  rejected: { label: "Bị từ chối", color: "bg-error text-white", icon: XCircle },
  locked: { label: "Bị khóa", color: "bg-muted text-white", icon: Lock },
  banned: { label: "Bị cấm", color: "bg-error text-white", icon: Ban },
};

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "published", label: "Đã duyệt" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "draft", label: "Bản nháp" },
  { value: "rejected", label: "Bị từ chối" },
  { value: "locked", label: "Bị khóa" },
  { value: "banned", label: "Bị cấm" },
];

type UiCourse = {
  _id: string;
  title: string;
  slug?: string;
  thumbnail: string;
  instructor: { name: string };
  status: CourseStatus;
  category: { name: string };
  price: number;
  enrolledCount: number;
  rating: number;
  reviewCount: number;
  totalLessons: number;
  createdAt: string;
  rejectionReason?: string;
};

type UiCourseSource = Course & {
  totalStudents?: number;
  totalRatings?: number;
  rejectionReason?: string;
};

function mapCourse(course: UiCourseSource): UiCourse {
  return {
    _id: course._id,
    title: course.title,
    slug: course.slug,
    thumbnail: course.thumbnail,
    instructor: { name: typeof course.instructor === "string" ? "" : course.instructor?.name ?? "" },
    status: course.status,
    category: {
      name: typeof course.category === "string" ? course.category : course.category?.name ?? "",
    },
    price: course.price ?? 0,
    enrolledCount: course.enrolledCount ?? course.totalStudents ?? 0,
    rating: course.rating ?? 0,
    reviewCount: course.reviewCount ?? course.totalRatings ?? 0,
    totalLessons: course.totalLessons ?? 0,
    createdAt: course.createdAt,
    rejectionReason: course.rejectionReason,
  };
}

export default function AdminCoursesPage() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<UiCourse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [previewCourseId, setPreviewCourseId] = useState<string | null>(null);
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null);
  const [isRejectingId, setIsRejectingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await api.get<ApiResponse<Category[]>>("/categories");
        if (!cancelled) setCategories(response.data.data ?? []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        setIsLoading(true);
        const status = filterStatus === "all" ? undefined : (filterStatus as CourseStatus);
        const search = searchQuery.trim() || undefined;
        const response = await adminCourseApi.getAllCourses(1, 50, status, search);
        const mapped = (response.data ?? []).map((course) => mapCourse(course as UiCourseSource));
        const finalList = filterCategory === "all" ? mapped : mapped.filter((course) => course.category.name === filterCategory);
        if (!cancelled) setCourses(finalList);
      } catch {
        if (!cancelled) {
          setCourses([]);
          toast.error("Không thể tải danh sách khóa học.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadCourses();
    return () => {
      cancelled = true;
    };
  }, [filterStatus, searchQuery, filterCategory, reloadKey, toast]);

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "Tất cả danh mục" },
      ...categories.map((category) => ({ value: category.name, label: category.name })),
    ],
    [categories],
  );

  const stats = useMemo(
    () => ({
      total: courses.length,
      published: courses.filter((course) => course.status === "published").length,
      pending: courses.filter((course) => course.status === "pending").length,
      totalStudents: courses.reduce((sum, course) => sum + (course.enrolledCount || 0), 0),
      totalRevenue: courses.reduce((sum, course) => sum + (course.price || 0) * (course.enrolledCount || 0), 0),
    }),
    [courses],
  );

  const refreshCourses = () => setReloadKey((current) => current + 1);

  const handleApprove = async (courseId: string) => {
    try {
      setIsApprovingId(courseId);
      await adminCourseApi.approveCourse(courseId);
      toast.success("Đã duyệt khóa học.");
      setPreviewCourseId(null);
      refreshCourses();
    } catch {
      toast.error("Không thể duyệt khóa học. Vui lòng thử lại.");
    } finally {
      setIsApprovingId(null);
    }
  };

  const handleReject = async (courseId: string) => {
    const reason = window.prompt("Nhập lý do từ chối khóa học", "Vui lòng bổ sung nội dung cần thiết trước khi xuất bản.");
    if (!reason) return;

    try {
      setIsRejectingId(courseId);
      await adminCourseApi.rejectCourse(courseId, reason);
      toast.success("Đã từ chối khóa học.");
      setPreviewCourseId(null);
      refreshCourses();
    } catch {
      toast.error("Không thể từ chối khóa học. Vui lòng thử lại.");
    } finally {
      setIsRejectingId(null);
    }
  };

  return (
    <div className="content-stack">
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Quản lý khóa học</h1>
          <p className="page-subtitle">Quản lý, xem trước và duyệt khóa học trên nền tảng.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          <span>Thêm khóa học</span>
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-100">
              <BookOpen className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Tổng khóa học</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success-light">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.published}</p>
              <p className="text-sm text-muted-foreground">Đã duyệt</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-warning-light">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Chờ duyệt</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary-100">
              <Users className="h-6 w-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.totalStudents.toLocaleString("vi-VN")}</p>
              <p className="text-sm text-muted-foreground">Học viên</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-100">
              <BookOpen className="h-6 w-6 text-accent-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{(stats.totalRevenue / 1000000).toFixed(0)}M</p>
              <p className="text-sm text-muted-foreground">Doanh thu (VND)</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Input
            className="w-full sm:max-w-md"
            placeholder="Tìm kiếm khóa học..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Select value={filterCategory} onChange={setFilterCategory} options={categoryOptions} className="w-full sm:w-44" />
          <Select value={filterStatus} onChange={setFilterStatus} options={statusOptions} className="w-full sm:w-44" />
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4" />
          <span>Xuất báo cáo</span>
        </Button>
      </div>

      <div className="space-y-4">
        {courses.map((course) => {
          const statusMeta = statusConfig[course.status] ?? statusConfig.draft;
          const StatusIcon = statusMeta.icon;
          return (
            <Card key={course._id} className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg sm:h-32 sm:w-48">
                  <Image src={course.thumbnail || COURSE_THUMBNAIL_FALLBACK} alt={course.title} fill sizes="192px" className="object-cover" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusMeta.color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusMeta.label}
                      </Badge>
                      <Badge variant="primary-light">{course.category.name || "Chưa phân loại"}</Badge>
                      <span className="text-sm text-muted-foreground">{new Date(course.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <h3 className="mt-2 font-semibold text-foreground">{course.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Giảng viên: {course.instructor.name || "Chưa rõ"}</p>
                    {course.status === "rejected" && course.rejectionReason && (
                      <p className="mt-2 text-sm text-error">Lý do từ chối: {course.rejectionReason}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.enrolledCount.toLocaleString("vi-VN")} học viên
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.totalLessons} bài học
                      </span>
                      {course.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          {course.rating} ({course.reviewCount})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPreviewCourseId(course._id)}>
                      <Eye className="h-4 w-4" />
                      <span>Xem</span>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                      <span>Sửa</span>
                    </Button>
                    {course.status === "pending" && (
                      <>
                        <Button variant="success" size="sm" onClick={() => handleApprove(course._id)} isLoading={isApprovingId === course._id}>
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Duyệt
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleReject(course._id)} isLoading={isRejectingId === course._id}>
                          <XCircle className="mr-1 h-4 w-4" />
                          Từ chối
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" className="text-error hover:bg-error-light">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!isLoading && courses.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">Không tìm thấy khóa học</h3>
          <p className="mt-2 text-muted-foreground">Không có khóa học nào phù hợp với điều kiện tìm kiếm.</p>
        </Card>
      )}

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
