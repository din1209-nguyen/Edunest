"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AxiosError } from "axios";
import { AlertCircle, BookOpen, CheckCircle, Clock, FileQuestion, PlayCircle, User, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { adminCourseApi, type AdminCourseDetail } from "@/lib/adminApi";
import { formatPrice } from "@/lib/utils";
import type { Chapter, CourseStatus, Exercise, Lesson } from "@/types";

const COURSE_THUMBNAIL_FALLBACK = "/placeholder-course.svg";

const statusMeta: Record<CourseStatus, { label: string; variant: "success" | "warning" | "error" | "secondary-light" | "primary-light" }> = {
  draft: { label: "Bản nháp", variant: "secondary-light" },
  pending: { label: "Chờ duyệt", variant: "warning" },
  published: { label: "Đã duyệt", variant: "success" },
  rejected: { label: "Bị từ chối", variant: "error" },
  locked: { label: "Bị khóa", variant: "secondary-light" },
  banned: { label: "Bị cấm", variant: "error" },
};

type PreviewLesson = Lesson & {
  videoDuration?: number;
  exercises?: Exercise[];
};

type PreviewChapter = Chapter & {
  lessons: PreviewLesson[];
};

function getEmbedUrl(url?: string) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
  } catch {
    return "";
  }
  return url;
}

function getInstructorName(detail?: AdminCourseDetail) {
  const instructor = detail?.course.instructor;
  return typeof instructor === "string" ? "Giảng viên" : instructor?.name || "Giảng viên";
}

export function AdminCoursePreviewModal({
  courseId,
  isOpen,
  onClose,
  onApprove,
  onReject,
  approvingCourseId,
  rejectingCourseId,
}: {
  courseId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (courseId: string) => Promise<void> | void;
  onReject: (courseId: string) => Promise<void> | void;
  approvingCourseId?: string | null;
  rejectingCourseId?: string | null;
}) {
  const [detail, setDetail] = useState<AdminCourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadDetail() {
      if (!isOpen || !courseId) return;
      try {
        setIsLoading(true);
        setError("");
        const response = await adminCourseApi.getCourse(courseId);
        if (!cancelled) setDetail(response.data ?? null);
      } catch (requestError) {
        const axiosError = requestError as AxiosError<{ message?: string }>;
        if (!cancelled) {
          setError(axiosError.response?.data?.message || axiosError.message || "Không thể tải chi tiết khóa học.");
          setDetail(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [courseId, isOpen]);

  const course = detail?.course;
  const chapters = (detail?.chapters ?? []) as PreviewChapter[];
  const previewVideoUrl = useMemo(() => getEmbedUrl(course?.previewVideo), [course?.previewVideo]);
  const instructor = typeof course?.instructor === "string" ? null : course?.instructor;
  const meta = course ? statusMeta[course.status] ?? statusMeta.draft : statusMeta.draft;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" title="Xem chi tiết khóa học" description="Kiểm tra nội dung trước khi duyệt hoặc từ chối." className="max-h-[90vh] overflow-y-auto">
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Đang tải chi tiết khóa học...</div>
      ) : error ? (
        <div className="rounded-lg border border-error/30 bg-error/10 p-4 text-sm text-error">
          {error}
        </div>
      ) : course ? (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={meta.variant}>{meta.label}</Badge>
                <Badge variant="primary-light">{typeof course.category === "string" ? course.category : course.category?.name}</Badge>
                <Badge variant="outline">{course.level}</Badge>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">{course.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{course.description}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-surface/60 p-3">
                  <p className="text-xs text-muted-foreground">Giá</p>
                  <p className="mt-1 font-semibold text-foreground">{formatPrice(course.price ?? 0)}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface/60 p-3">
                  <p className="text-xs text-muted-foreground">Bài học</p>
                  <p className="mt-1 font-semibold text-foreground">{course.totalLessons ?? chapters.reduce((sum, chapter) => sum + (chapter.lessons?.length || 0), 0)}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface/60 p-3">
                  <p className="text-xs text-muted-foreground">Học viên</p>
                  <p className="mt-1 font-semibold text-foreground">{(course.totalStudents ?? 0).toLocaleString("vi-VN")}</p>
                </div>
              </div>

              {course.rejectionReason && (
                <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
                  Lý do từ chối: {course.rejectionReason}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
                <Image src={course.thumbnail || COURSE_THUMBNAIL_FALLBACK} alt={course.title} fill sizes="288px" className="object-cover" />
              </div>
              <div className="rounded-lg border border-border bg-surface/60 p-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary-600" />
                  <p className="font-medium text-foreground">{getInstructorName(detail)}</p>
                </div>
                {instructor?.email && <p className="mt-1 text-sm text-muted-foreground">{instructor.email}</p>}
              </div>
            </div>
          </div>

          {previewVideoUrl && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <PlayCircle className="h-4 w-4" />
                Video giới thiệu
              </h4>
              <div className="aspect-video overflow-hidden rounded-lg border border-border bg-black">
                <iframe src={previewVideoUrl} className="h-full w-full" allowFullScreen title="Course preview video" />
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <h4 className="font-semibold text-foreground">Yêu cầu đầu vào</h4>
              {(course.requirements?.length ?? 0) > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {course.requirements?.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Chưa có yêu cầu.</p>
              )}
            </div>
            <div className="rounded-lg border border-border p-4">
              <h4 className="font-semibold text-foreground">Kết quả học tập</h4>
              {((course.outcomes ?? course.benefits)?.length ?? 0) > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {(course.outcomes ?? course.benefits)?.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Chưa có kết quả học tập.</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <BookOpen className="h-4 w-4" />
              Nội dung khóa học
            </h4>
            <div className="space-y-3">
              {chapters.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Khóa học chưa có chương/bài học.
                </div>
              ) : (
                chapters.map((chapter, chapterIndex) => (
                  <div key={chapter._id} className="rounded-lg border border-border">
                    <div className="border-b border-border bg-surface/60 px-4 py-3">
                      <p className="font-medium text-foreground">Chương {chapterIndex + 1}: {chapter.title}</p>
                    </div>
                    <div className="divide-y divide-border">
                      {(chapter.lessons || []).map((lesson, lessonIndex) => (
                        <div key={lesson._id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{lessonIndex + 1}. {lesson.title}</p>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>{lesson.type}</span>
                              {lesson.isFree && <span>Miễn phí</span>}
                              {(lesson.exercises?.length ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <FileQuestion className="h-3 w-3" />
                                  {lesson.exercises?.length} bài tập
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" size="sm">{lesson.isPublished === false ? "Ẩn" : "Hiển thị"}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>Đóng</Button>
            {course.status === "pending" && (
              <>
                <Button variant="destructive" onClick={() => onReject(course._id)} isLoading={rejectingCourseId === course._id} leftIcon={<XCircle className="h-4 w-4" />}>
                  Từ chối
                </Button>
                <Button variant="success" onClick={() => onApprove(course._id)} isLoading={approvingCourseId === course._id} leftIcon={<CheckCircle className="h-4 w-4" />}>
                  Duyệt khóa học
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-border p-4 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          Chưa chọn khóa học.
        </div>
      )}
    </Modal>
  );
}
