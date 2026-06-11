"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CourseList } from "@/components/course/CourseList";
import api from "@/lib/api";
import { fetchPurchasedCourseIds, markPurchasedCourses, normalizeCourse } from "@/lib/courseUtils";
import { useAuthStore } from "@/stores/auth";
import { Search as SearchIcon, SlidersHorizontal, X, Grid3X3, List } from "lucide-react";
import type { Category, Course, CourseLevel, PaginatedResponse, ApiResponse } from "@/types";

const sortOptions = [
  { value: "relevance", label: "Liên quan" },
  { value: "students", label: "Phổ biến nhất" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "price_asc", label: "Giá: Thấp đến cao" },
  { value: "price_desc", label: "Giá: Cao đến thấp" },
  { value: "newest", label: "Mới nhất" },
];

const levelOptions = [
  { value: "all", label: "Tất cả cấp độ" },
  { value: "beginner", label: "Người mới" },
  { value: "intermediate", label: "Trung cấp" },
  { value: "advanced", label: "Nâng cao" },
];

const ratingOptions = [
  { value: "all", label: "Tất cả đánh giá" },
  { value: "4.5", label: "4.5 sao trở lên" },
  { value: "4", label: "4 sao trở lên" },
  { value: "3.5", label: "3.5 sao trở lên" },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [sortBy, setSortBy] = useState("relevance");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
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

        const [response, purchasedCourseIds] = await Promise.all([
          api.get<PaginatedResponse<Course>>("/search", {
            params: {
              q: searchQuery || undefined,
              category: filterCategory === "all" ? undefined : filterCategory,
              level: filterLevel === "all" ? undefined : (filterLevel as CourseLevel),
              minRating: filterRating === "all" ? undefined : Number(filterRating),
              sortBy,
              page: 1,
              limit: 50,
            },
          }),
          isAuthenticated ? fetchPurchasedCourseIds() : Promise.resolve(new Set<string>()),
        ]);

        if (!mounted) return;

        setResults(markPurchasedCourses(
          (response.data.data ?? []).map(normalizeCourse),
          purchasedCourseIds,
        ));
        setTotal(response.data.pagination?.total ?? response.data.data?.length ?? 0);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to search courses", err);
        setError("Không thể tìm kiếm khóa học. Vui lòng thử lại.");
        setResults([]);
        setTotal(0);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 250);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [filterCategory, filterLevel, filterRating, isAuthenticated, searchQuery, sortBy]);

  const hasActiveFilters =
    filterCategory !== "all" || filterLevel !== "all" || filterRating !== "all";

  const clearFilters = () => {
    setFilterCategory("all");
    setFilterLevel("all");
    setFilterRating("all");
  };

  return (
    <div className="page-shell">
      <div className="app-container">
        <div className="mb-8">
          <h1 className="page-title">Tìm kiếm khóa học</h1>
          <p className="page-subtitle">
            {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : "Khám phá khóa học từ MongoDB"}
          </p>
        </div>

        <div className="mb-6">
          <form className="relative" onSubmit={(event) => event.preventDefault()}>
            <Input
              placeholder="Tìm kiếm khóa học..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              leftIcon={<SearchIcon className="h-5 w-5" />}
              className="h-11 text-sm md:h-12 md:text-base"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </form>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<SlidersHorizontal className="h-4 w-4" />}
            >
              Bộ lọc
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <p className="text-sm text-muted-foreground">{total} khóa học</p>
            <Select value={sortBy} onChange={setSortBy} options={sortOptions} className="w-full sm:w-40" />
            <div className="flex rounded-lg border border-border">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${
                  viewMode === "grid"
                    ? "bg-primary-50 text-primary-600"
                    : "text-muted-foreground hover:bg-surface"
                }`}
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${
                  viewMode === "list"
                    ? "bg-primary-50 text-primary-600"
                    : "text-muted-foreground hover:bg-surface"
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6 p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Danh mục</label>
                <Select
                  value={filterCategory}
                  onChange={setFilterCategory}
                  options={[
                    { value: "all", label: "Tất cả danh mục" },
                    ...categories.map((category) => ({
                      value: category.name,
                      label: category.name,
                    })),
                  ]}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Cấp độ</label>
                <Select value={filterLevel} onChange={setFilterLevel} options={levelOptions} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Đánh giá</label>
                <Select value={filterRating} onChange={setFilterRating} options={ratingOptions} />
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <Card className="p-8 text-center text-muted-foreground md:p-12">
            Đang tìm kiếm...
          </Card>
        ) : (
          <CourseList
            courses={results}
            variant={viewMode}
            emptyMessage="Không tìm thấy khóa học phù hợp."
          />
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <SearchContent />
    </Suspense>
  );
}
