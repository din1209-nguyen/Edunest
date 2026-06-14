"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TeacherFileUploadButton } from "@/components/teacher/TeacherFileUploadButton";
import { categoryApi } from "@/lib/categoryApi";
import { teacherCourseApi } from "@/lib/teacherApi";
import type { Category, CourseFormData, CourseLevel } from "@/types";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  ImageIcon,
  ListChecks,
  Target,
  UploadCloud,
  Video,
} from "lucide-react";

const levelOptions = [
  { value: "beginner", label: "Người mới bắt đầu" },
  { value: "intermediate", label: "Trung cấp" },
  { value: "advanced", label: "Nâng cao" },
];

const languageOptions = [
  { value: "English", label: "English" },
  { value: "Vietnamese", label: "Tiếng Việt" },
  { value: "English & Vietnamese", label: "Song ngữ Anh - Việt" },
];

const steps = [
  { id: "basic", label: "Cơ bản", icon: FileText },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "goals", label: "Mục tiêu", icon: Target },
  { id: "review", label: "Hoàn tất", icon: CheckCircle2 },
] as const;

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidOptionalUrl(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return true;

  try {
    const url = new URL(trimmedValue);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function unwrapCategories(data: Category[] | { categories?: Category[] } | undefined) {
  if (Array.isArray(data)) return data;
  return data?.categories ?? [];
}

export default function TeacherCreateCoursePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryLoadError, setCategoryLoadError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: "",
    description: "",
    shortDescription: "",
    thumbnail: "",
    previewVideo: "",
    price: "0",
    discountPrice: "0",
    category: "",
    level: "beginner" as CourseLevel,
    language: "English",
    requirements: "",
    outcomes: "",
    isFeatured: false,
  });

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        setIsLoadingCategories(true);
        setCategoryLoadError("");
        const response = await categoryApi.getCategories();
        if (!mounted) return;
        setCategories(unwrapCategories(response.data));
      } catch (loadError) {
        if (!mounted) return;
        console.error("Failed to load categories", loadError);
        setCategoryLoadError("Không thể tải danh mục. Bạn vẫn có thể nhập danh mục thủ công.");
      } finally {
        if (mounted) setIsLoadingCategories(false);
      }
    }

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.name, label: category.name })),
    [categories],
  );

  const shouldUseCategorySelect = categoryOptions.length > 0 && !categoryLoadError;

  const previewStats = useMemo(
    () => [
      { label: "Tiêu đề", value: form.title.trim() ? "Đã có" : "Chưa nhập" },
      { label: "Thumbnail", value: form.thumbnail.trim() ? "Sẵn sàng" : "Thiếu" },
      { label: "Mô tả", value: form.description.trim().length >= 20 ? "Đạt" : "Cần bổ sung" },
      { label: "Yêu cầu", value: splitLines(form.requirements).length > 0 ? "Đã có" : "Chưa có" },
    ],
    [form.description, form.requirements, form.thumbnail, form.title],
  );

  const updateForm = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));
    setError("");
  };

  const validateStep = (stepIndex: number) => {
    const nextFieldErrors: Record<string, string> = {};
    const title = form.title.trim();
    const description = form.description.trim();
    const shortDescription = form.shortDescription.trim();
    const requirements = splitLines(form.requirements);
    const outcomes = splitLines(form.outcomes);
    const price = Number(form.price || 0);
    const discountPrice = Number(form.discountPrice || 0);

    if (stepIndex === 0) {
      if (title.length < 5) nextFieldErrors.title = "Tiêu đề phải có ít nhất 5 ký tự";
      if (title.length > 200) nextFieldErrors.title = "Tiêu đề không được vượt quá 200 ký tự";
      if (description.length < 20) nextFieldErrors.description = "Mô tả phải có ít nhất 20 ký tự";
      if (description.length > 2000) nextFieldErrors.description = "Mô tả không được vượt quá 2000 ký tự";
      if (shortDescription.length > 300) nextFieldErrors.shortDescription = "Mô tả ngắn không được vượt quá 300 ký tự";
      if (!form.category.trim()) nextFieldErrors.category = "Danh mục là bắt buộc";
      if (!Number.isFinite(price) || price < 0) nextFieldErrors.price = "Giá bán không được âm";
      if (!Number.isFinite(discountPrice) || discountPrice < 0) nextFieldErrors.discountPrice = "Giá giảm không được âm";
    }

    if (stepIndex === 1) {
      if (!isValidOptionalUrl(form.thumbnail)) nextFieldErrors.thumbnail = "Thumbnail phải là URL hợp lệ";
      if (!isValidOptionalUrl(form.previewVideo)) nextFieldErrors.previewVideo = "Preview video phải là URL hợp lệ";
    }

    if (stepIndex === 2) {
      if (requirements.length > 10) nextFieldErrors.requirements = "Yêu cầu đầu vào tối đa 10 dòng";
      if (outcomes.length > 15) nextFieldErrors.outcomes = "Kết quả đầu ra tối đa 15 dòng";
      if (requirements.some((item) => item.length > 200)) nextFieldErrors.requirements = "Mỗi yêu cầu tối đa 200 ký tự";
      if (outcomes.some((item) => item.length > 200)) nextFieldErrors.outcomes = "Mỗi kết quả tối đa 200 ký tự";
    }

    setFieldErrors((current) => ({ ...current, ...nextFieldErrors }));

    if (Object.keys(nextFieldErrors).length > 0) {
      setError("Vui lòng kiểm tra lại các trường cần chỉnh trước khi tiếp tục.");
      return false;
    }

    return true;
  };

  const validateAllSteps = () => {
    for (let index = 0; index < steps.length - 1; index += 1) {
      if (!validateStep(index)) {
        setCurrentStep(index);
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const handlePreviousStep = () => {
    setCurrentStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateAllSteps()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    const price = Number(form.price || 0);
    const discountPrice = Number(form.discountPrice || 0);

    const payload: CourseFormData = {
      title: form.title.trim(),
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim(),
      thumbnail: form.thumbnail.trim(),
      previewVideo: form.previewVideo.trim(),
      price: Number.isFinite(price) ? Math.max(price, 0) : 0,
      discountPrice: Number.isFinite(discountPrice) ? Math.max(discountPrice, 0) : 0,
      category: form.category.trim(),
      level: form.level,
      language: form.language,
      requirements: splitLines(form.requirements),
      outcomes: splitLines(form.outcomes),
      isFree: price <= 0,
      isFeatured: form.isFeatured,
    };

    try {
      const response = await teacherCourseApi.createCourse(payload);
      const createdCourseId = response.data?._id;

      if (!createdCourseId) {
        throw new Error("Không nhận được mã khóa học mới từ server");
      }

      router.push(`/teacher/courses/${createdCourseId}/edit?tab=content`);
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể tạo khóa học mới");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryField = () => {
    if (shouldUseCategorySelect) {
      return (
        <Select
          label="Danh mục"
          options={categoryOptions}
          value={form.category}
          onChange={(value) => updateForm("category", value)}
          error={fieldErrors.category}
          placeholder={isLoadingCategories ? "Đang tải danh mục..." : "Chọn danh mục"}
          disabled={isLoadingCategories}
        />
      );
    }

    return (
      <Input
        label="Danh mục"
        required
        value={form.category}
        onChange={(event) => updateForm("category", event.target.value)}
        error={fieldErrors.category}
        hint={categoryLoadError || "Nhập tên danh mục nếu danh sách chưa được cấu hình."}
        placeholder="Ví dụ: IELTS, Grammar, Speaking"
      />
    );
  };

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-600" />
              Thông tin cơ bản
            </CardTitle>
            <CardDescription>Nhập những dữ liệu quan trọng nhất để hệ thống tạo bản nháp chất lượng.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Tiêu đề khóa học"
                required
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                error={fieldErrors.title}
                placeholder="Ví dụ: IELTS Foundation cho người mới bắt đầu"
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="Mô tả chi tiết"
                required
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                error={fieldErrors.description}
                placeholder="Mô tả mục tiêu, đối tượng học viên và kết quả đạt được sau khóa học"
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="Mô tả ngắn"
                value={form.shortDescription}
                onChange={(event) => updateForm("shortDescription", event.target.value)}
                error={fieldErrors.shortDescription}
                hint="Tối đa 300 ký tự, dùng cho card hoặc phần tóm tắt"
                placeholder="Tóm tắt giá trị chính của khóa học"
              />
            </div>
            {renderCategoryField()}
            <Select
              label="Trình độ"
              options={levelOptions}
              value={form.level}
              onChange={(value) => updateForm("level", value as CourseLevel)}
            />
            <Select
              label="Ngôn ngữ giảng dạy"
              options={languageOptions}
              value={form.language}
              onChange={(value) => updateForm("language", value)}
            />
            <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
              <Input
                label="Giá bán"
                type="number"
                min={0}
                value={form.price}
                onChange={(event) => updateForm("price", event.target.value)}
                error={fieldErrors.price}
                placeholder="0"
              />
              <Input
                label="Giá giảm"
                type="number"
                min={0}
                value={form.discountPrice}
                onChange={(event) => updateForm("discountPrice", event.target.value)}
                error={fieldErrors.discountPrice}
                placeholder="0"
              />
            </div>
          </CardContent>
        </Card>
      );
    }

    if (currentStep === 1) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-secondary-600" />
              Media và hiển thị
            </CardTitle>
            <CardDescription>Thêm ảnh bìa và video giới thiệu để khóa học trông thu hút hơn ngay từ đầu.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Input
                label="Thumbnail URL"
                value={form.thumbnail}
                onChange={(event) => updateForm("thumbnail", event.target.value)}
                error={fieldErrors.thumbnail}
                placeholder="https://..."
                hint="Để trống nếu chưa có ảnh bìa"
              />
              <TeacherFileUploadButton
                accept="image/jpeg,image/png,image/webp,image/gif"
                label="Upload ảnh bìa"
                uploadType="thumbnail"
                onUploaded={(url) => updateForm("thumbnail", url)}
                onError={setError}
              />
            </div>
            <div className="space-y-2">
              <Input
                label="Preview video URL"
                value={form.previewVideo}
                onChange={(event) => updateForm("previewVideo", event.target.value)}
                error={fieldErrors.previewVideo}
                placeholder="https://youtube.com/..."
                hint="Có thể thêm sau nếu chưa sẵn sàng"
              />
              <TeacherFileUploadButton
                accept="video/mp4,video/mpeg,video/webm"
                label="Upload video giới thiệu"
                uploadType="video"
                onUploaded={(url) => updateForm("previewVideo", url)}
                onError={setError}
              />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-border bg-surface/70 p-4 text-sm text-foreground md:col-span-2">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => updateForm("isFeatured", event.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Đánh dấu khóa học nổi bật trong danh sách nội bộ
            </label>
          </CardContent>
        </Card>
      );
    }

    if (currentStep === 2) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-accent-600" />
              Yêu cầu và kết quả đầu ra
            </CardTitle>
            <CardDescription>Mỗi dòng sẽ được lưu thành một mục riêng để hiển thị trên trang chi tiết khóa học.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Textarea
              label="Yêu cầu đầu vào"
              value={form.requirements}
              onChange={(event) => updateForm("requirements", event.target.value)}
              error={fieldErrors.requirements}
              placeholder={"Máy tính hoặc điện thoại\nTinh thần học tập đều đặn\nCó mục tiêu rõ ràng"}
            />
            <Textarea
              label="Kết quả đầu ra"
              value={form.outcomes}
              onChange={(event) => updateForm("outcomes", event.target.value)}
              error={fieldErrors.outcomes}
              placeholder={"Hiểu cấu trúc đề thi\nTăng vốn từ theo chủ đề\nTự tin giao tiếp hơn"}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Xác nhận trước khi tạo
          </CardTitle>
          <CardDescription>Rà soát nhanh thông tin trước khi lưu khóa học ở trạng thái nháp.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tiêu đề</p>
              <p className="mt-1 font-semibold text-foreground">{form.title || "Chưa nhập"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Danh mục</p>
              <p className="mt-1 font-semibold text-foreground">{form.category || "Chưa nhập"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ngôn ngữ</p>
              <p className="mt-1 font-semibold text-foreground">{form.language}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Giá hiện tại</p>
              <p className="mt-1 font-semibold text-foreground">
                {Number(form.price || 0) <= 0 ? "Miễn phí" : `${Number(form.discountPrice || form.price || 0).toLocaleString("vi-VN")}đ`}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
            Sau khi tạo xong, bạn sẽ được chuyển sang trang chỉnh sửa nội bộ để tiếp tục bổ sung nội dung, chương và bài học.
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="content-stack">
      <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
        Khóa học sẽ được lưu ở trạng thái <span className="font-semibold">nháp</span>, không hiển thị công khai cho đến khi bạn hoàn thiện và gửi duyệt.
      </div>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-5">
              <div className="grid gap-3 md:grid-cols-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isDone = index < currentStep;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        if (index <= currentStep) setCurrentStep(index);
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        isActive
                          ? "border-primary-200 bg-primary-50 shadow-soft"
                          : isDone
                            ? "border-success/20 bg-success-light"
                            : "border-border bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            isActive
                              ? "bg-primary-100 text-primary-600"
                              : isDone
                                ? "bg-success text-white"
                                : "bg-surface text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Bước {index + 1}</p>
                          <p className="text-sm font-semibold text-foreground">{step.label}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {renderStepContent()}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button variant="outline" type="button" onClick={handlePreviousStep} disabled={currentStep === 0} leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Quay lại
            </Button>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link href="/teacher/courses">
                <Button variant="ghost" type="button">Hủy</Button>
              </Link>
              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={handleNextStep} rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Tiếp tục
                </Button>
              ) : (
                <Button type="button" isLoading={isSubmitting} leftIcon={<BookOpen className="h-4 w-4" />} onClick={handleSubmit}>
                  Tạo khóa học nháp
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary-600" />
                Xem nhanh trạng thái
              </CardTitle>
              <CardDescription>Kiểm tra độ sẵn sàng trước khi lưu nháp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {previewStats.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border bg-gradient-to-r from-white to-surface/80 px-4 py-3 text-sm shadow-soft">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
              <div className="rounded-2xl border border-primary-100 bg-primary-50/80 p-4">
                <div className="flex items-start gap-3">
                  <CircleDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {Number(form.price || 0) <= 0 ? "Khóa học miễn phí" : "Khóa học trả phí"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {Number(form.price || 0) <= 0
                        ? "Hệ thống sẽ tự đánh dấu là miễn phí khi giá bán bằng 0."
                        : `Giá hiện tại: ${Number(form.discountPrice || form.price || 0).toLocaleString("vi-VN")}đ`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lưu ý khi tạo khóa học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3 rounded-2xl border border-border bg-surface/70 p-4">
                <UploadCloud className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                <p>Sau khi tạo xong khóa học nháp, bạn sẽ được chuyển sang trang chỉnh sửa nội bộ để tiếp tục bổ sung chi tiết.</p>
              </div>
              <div className="flex gap-3 rounded-2xl border border-border bg-surface/70 p-4">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-secondary-600" />
                <p>Để gửi duyệt, khóa học cần có thumbnail, ít nhất một chương và ít nhất một bài học theo rule backend hiện tại.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
