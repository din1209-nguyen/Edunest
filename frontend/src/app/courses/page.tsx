"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CourseList } from "@/components/course/CourseList";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { courseApi } from "@/lib/studentApi";
import { fetchPurchasedCourseIds, markPurchasedCourses, normalizeCourse } from "@/lib/courseUtils";
import { useAuthStore } from "@/stores/auth";
import { Search, SlidersHorizontal, X, Grid, List } from "lucide-react";
import type { Course, Category, CourseLevel, ApiResponse, CourseFilters } from "@/types";

const levelOptions = [
  { value: "", label: "Tất cả trình độ" },
  { value: "beginner", label: "Người mới bắt đầu" },
  { value: "intermediate", label: "Trung cấp" },
  { value: "advanced", label: "Nâng cao" },
];

const sortOptions = [
  { value: "popular", label: "Phổ biến nhất" },
  { value: "newest", label: "Mới nhất" },
  { value: "price_low", label: "Giá: Thấp đến cao" },
  { value: "price_high", label: "Giá: Cao đến thấp" },
  { value: "rating", label: "Đánh giá cao nhất" },
];

function getSortParams(sort: string): Pick<CourseFilters, "sortBy" | "sortOrder"> {
  switch (sort) {
    case "newest":
      return { sortBy: "createdAt", sortOrder: "desc" };
    case "price_low":
      return { sortBy: "price", sortOrder: "asc" };
    case "price_high":
      return { sortBy: "price", sortOrder: "desc" };
    case "rating":
      return { sortBy: "rating", sortOrder: "desc" };
    case "popular":
    default:
      return { sortBy: "totalStudents", sortOrder: "desc" };
  }
}

function CoursesContent() {
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedLevel, setSelectedLevel] = useState(searchParams.get("level") || "");
  const [selectedSort, setSelectedSort] = useState(searchParams.get("sort") || "popular");
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      try {
        const response = await api.get<ApiResponse<Category[]>>("/categories");
        if (mounted) setCategories(response.data.data ?? []);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    }

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const sortParams = getSortParams(selectedSort);
        const filters: CourseFilters = {
          page: 1,
          limit: 50,
          ...sortParams,
        };

        if (search.trim()) {
          filters.search = search.trim();
        }
        if (selectedCategory) {
          filters.category = selectedCategory;
        }
        if (selectedLevel) {
          filters.level = selectedLevel as CourseLevel;
        }

        const [response, purchasedCourseIds] = await Promise.all([
          courseApi.getCourses(filters),
          isAuthenticated ? fetchPurchasedCourseIds() : Promise.resolve(new Set<string>()),
        ]);

        if (!mounted) return;

        setCourses(markPurchasedCourses(
          (response.data?.courses ?? []).map(normalizeCourse),
          purchasedCourseIds,
        ));
        setTotalCourses(response.data?.pagination?.total ?? response.data?.courses?.length ?? 0);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load courses", err);
        setError("Không thể tải khóa học. Vui lòng thử lại.");
        setCourses([]);
        setTotalCourses(0);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 250);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [isAuthenticated, search, selectedCategory, selectedLevel, selectedSort]);

  const activeFilters = useMemo(
    () =>
      [
        selectedCategory,
        selectedLevel && levelOptions.find((level) => level.value === selectedLevel)?.label,
      ].filter(Boolean) as string[],
    [selectedCategory, selectedLevel]
  );

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedLevel("");
    setSearch("");
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="bg-gradient-hero py-8 md:py-10">
        <div className="app-container">
          <div className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-card backdrop-blur-sm sm:p-6 lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <Badge variant="primary-light" className="mb-3 w-fit px-3 py-1.5">
                  <Search className="mr-1 h-3.5 w-3.5" />
                  Thư viện khóa học
                </Badge>
                <h1 className="page-title">Khóa học</h1>
                <p className="page-subtitle">
                  Khám phá {totalCourses} khóa học đang có trên nền tảng và lọc theo mục tiêu học tập của bạn
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
                <div className="rounded-2xl border border-border bg-surface/80 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{totalCourses}</p>
                  <p className="text-xs text-muted-foreground">Khóa học đang mở</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface/80 p-4 text-center">
                  <p className="text-2xl font-bold text-primary-600">{categories.length}</p>
                  <p className="text-xs text-muted-foreground">Danh mục đào tạo</p>
                </div>
              </div>
            </div>

            <div className="mt-5 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Tìm kiếm khóa học..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-background/90 pl-12 pr-4 text-sm text-foreground transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 md:h-12 md:text-base"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="app-container py-6 md:py-8">
        {error && (
          <div className="mb-5 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24 rounded-lg border border-border bg-background p-5 shadow-sm">
              <h3 className="font-semibold text-foreground">Danh mục</h3>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    !selectedCategory
                      ? "bg-primary-50 text-primary-700"
                      : "text-muted-foreground hover:bg-surface-hover"
                  }`}
                >
                  Tất cả danh mục
                </button>
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedCategory === category.name
                        ? "bg-primary-50 text-primary-700"
                        : "text-muted-foreground hover:bg-surface-hover"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <h3 className="font-semibold text-foreground">Trình độ</h3>
                <div className="mt-4 space-y-2">
                  {levelOptions.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setSelectedLevel(level.value)}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        selectedLevel === level.value
                          ? "bg-primary-50 text-primary-700"
                          : "text-muted-foreground hover:bg-surface-hover"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {(selectedCategory || selectedLevel || search) && (
                <button
                  onClick={clearFilters}
                  className="mt-6 w-full text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Bộ lọc
                  {activeFilters.length > 0 && (
                    <Badge variant="default" size="sm">
                      {activeFilters.length}
                    </Badge>
                  )}
                </Button>

                {activeFilters.map((filter) => (
                  <Badge key={filter} variant="outline" className="gap-1">
                    {filter}
                    <button
                      onClick={() => {
                        if (filter === selectedCategory) setSelectedCategory("");
                        if (filter !== selectedCategory) setSelectedLevel("");
                      }}
                      className="ml-1 rounded hover:bg-surface-hover"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                <Select
                  options={sortOptions}
                  value={selectedSort}
                  onChange={setSelectedSort}
                  className="w-full sm:w-48"
                />
                <div className="hidden rounded-lg border border-border sm:flex">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-surface text-foreground" : "text-muted-foreground"}`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-surface text-foreground" : "text-muted-foreground"}`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="mb-5 animate-slideIn rounded-lg border border-border bg-background p-4 shadow-sm lg:hidden">
                <div className="mb-4">
                  <h3 className="mb-2 font-medium text-foreground">Danh mục</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory("")}
                      className={`rounded-lg px-3 py-1.5 text-sm ${
                        !selectedCategory
                          ? "bg-primary-600 text-white"
                          : "bg-surface-hover text-muted-foreground"
                      }`}
                    >
                      Tất cả
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category._id}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`rounded-lg px-3 py-1.5 text-sm ${
                          selectedCategory === category.name
                            ? "bg-primary-600 text-white"
                            : "bg-surface-hover text-muted-foreground"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 font-medium text-foreground">Trình độ</h3>
                  <div className="flex flex-wrap gap-2">
                    {levelOptions.slice(1).map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setSelectedLevel(level.value)}
                        className={`rounded-lg px-3 py-1.5 text-sm ${
                          selectedLevel === level.value
                            ? "bg-primary-600 text-white"
                            : "bg-surface-hover text-muted-foreground"
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={clearFilters}>
                    Xóa bộ lọc
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => setShowFilters(false)}>
                    Áp dụng
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="rounded-lg border border-border bg-background p-8 text-center text-muted-foreground">
                Đang tải khóa học...
              </div>
            ) : (
              <CourseList
                courses={courses}
                variant={viewMode}
                emptyMessage="Không tìm thấy khóa học nào phù hợp với bộ lọc của bạn."
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <CoursesContent />
    </Suspense>
  );
}
