"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CourseCard } from "@/components/course/CourseCard";
import { fetchPurchasedCourseIds, markPurchasedCourses } from "@/lib/courseUtils";
import { useAuthStore } from "@/stores/auth";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import type { ApiResponse, Category, Course } from "@/types";

const PLACEHOLDER_THUMBNAIL =
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop";

function normalizeCourse(course: Course): Course {
  return {
    ...course,
    thumbnail: course.thumbnail?.trim() || PLACEHOLDER_THUMBNAIL,
  };
}

export default function CategoryDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<(Category & { subcategories?: Category[] }) | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCategory() {
      setIsLoading(true);
      try {
        const catRes = await api.get<ApiResponse<Category>>(`/categories/${slug}`);
        const cat = catRes.data.data;

        if (!cat) {
          throw new Error("Category not found");
        }

        const [courseRes, purchasedCourseIds] = await Promise.all([
          api.get<ApiResponse<{ courses: Course[] }>>("/courses", {
            params: { category: cat.name, limit: 24 },
          }),
          isAuthenticated ? fetchPurchasedCourseIds() : Promise.resolve(new Set<string>()),
        ]);

        if (cancelled) return;
        setCategory(cat);
        setCourses(markPurchasedCourses(
          (courseRes.data.data?.courses ?? []).map(normalizeCourse),
          purchasedCourseIds,
        ));
      } catch {
        if (!cancelled) {
          setCategory(null);
          setCourses([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadCategory();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, slug]);

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((course) =>
      [course.title, course.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [courses, searchQuery]);

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="app-container">
          <Card>
            <CardContent className="flex items-center justify-center gap-3 p-8 text-muted-foreground">
              <BookOpen className="h-5 w-5 animate-pulse" />
              Đang tải danh mục...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="page-shell">
        <div className="app-container">
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 font-medium text-foreground">Không tìm thấy danh mục</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Danh mục này có thể đã bị xóa hoặc chưa được xuất bản.
              </p>
              <Link href="/categories" className={buttonVariants({ className: "mt-5" })}>
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh mục
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="app-container content-stack">
        <div className="page-header">
          <div>
            <Link
              href="/categories"
              className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Danh mục
            </Link>
            <h1 className="page-title mt-2">{category.name}</h1>
            {category.description && (
              <p className="page-subtitle">{category.description}</p>
            )}
          </div>
          <Badge variant="secondary" className="w-fit">
            {category.courseCount ?? courses.length} khóa học
          </Badge>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="Tìm kiếm khóa học trong danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center md:p-12">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 font-medium text-foreground">
                Chưa có khóa học phù hợp
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Thử xóa từ khóa tìm kiếm hoặc quay lại danh sách danh mục.
              </p>
              {searchQuery ? (
                <Button
                  variant="outline"
                  className="mt-5"
                  onClick={() => setSearchQuery("")}
                >
                  Xóa tìm kiếm
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-5">
            {filteredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
