"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  FileText,
  GraduationCap,
  Grid3X3,
  Headphones,
  List,
  Mic,
  PenTool,
  Search,
  Smile,
  Sparkles,
  Type,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ApiResponse, Category } from "@/types";

const categoryAccents = [
  {
    bar: "bg-blue-500",
    tile: "from-blue-50 to-sky-50 text-blue-600 ring-blue-200/70",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    bar: "bg-emerald-500",
    tile: "from-emerald-50 to-teal-50 text-emerald-600 ring-emerald-200/70",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    bar: "bg-violet-500",
    tile: "from-violet-50 to-fuchsia-50 text-violet-600 ring-violet-200/70",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
  },
  {
    bar: "bg-orange-500",
    tile: "from-orange-50 to-amber-50 text-orange-600 ring-orange-200/70",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    bar: "bg-pink-500",
    tile: "from-pink-50 to-rose-50 text-pink-600 ring-pink-200/70",
    badge: "bg-pink-50 text-pink-700 border-pink-200",
  },
  {
    bar: "bg-slate-700",
    tile: "from-slate-50 to-zinc-50 text-slate-700 ring-slate-200",
    badge: "bg-slate-50 text-slate-700 border-slate-200",
  },
];

const iconMap: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  "file-text": FileText,
  "book-open": BookOpen,
  mic: Mic,
  headphones: Headphones,
  briefcase: Briefcase,
  "pen-tool": PenTool,
  smile: Smile,
  abc: Type,
  ielts: GraduationCap,
  toeic: FileText,
  grammar: BookOpen,
  vocabulary: Type,
  speaking: Mic,
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  business: Briefcase,
};

function getCategoryIcon(category: Category) {
  const key = (category.icon || category.slug || category.name || "").toLowerCase();
  return iconMap[key] || BookOpen;
}

function getTotalCourses(categories: Category[]) {
  return categories.reduce((sum, category) => sum + (category.courseCount ?? 0), 0);
}

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const res = await api.get<ApiResponse<Category[]>>("/categories");
        if (!cancelled) setCategories(res.data.data ?? []);
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => {
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        cat.description?.toLowerCase().includes(q)
      );
    });
  }, [categories, searchQuery]);

  return (
    <div className="page-shell">
      <section className="section-band border-b border-border/70 py-10 sm:py-14">
        <div className="app-container">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
            <div>
              <Badge variant="primary-light" className="mb-4 gap-1.5 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Lộ trình học theo mục tiêu
              </Badge>
              <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl lg:text-5xl">
                Danh mục khóa học
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Chọn đúng kỹ năng cần cải thiện: IELTS, TOEFL, ngữ pháp, nghe nói, đọc viết
                hoặc tiếng Anh công việc.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-course-card">
                <p className="text-2xl font-bold text-foreground">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Danh mục</p>
              </div>
              <div className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-course-card">
                <p className="text-2xl font-bold text-primary-600">{getTotalCourses(categories)}</p>
                <p className="text-sm text-muted-foreground">Khóa học</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <Input
              placeholder="Tìm kiếm danh mục, kỹ năng, chủ đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
              className="h-12 bg-white"
            />
            <div className="flex rounded-lg border border-border bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "rounded-md p-2 transition-colors",
                  viewMode === "grid" ? "bg-primary-50 text-primary-600" : "text-muted-foreground hover:bg-surface",
                )}
                aria-label="Xem dạng lưới"
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "rounded-md p-2 transition-colors",
                  viewMode === "list" ? "bg-primary-50 text-primary-600" : "text-muted-foreground hover:bg-surface",
                )}
                aria-label="Xem dạng danh sách"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className="app-container">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-title">Tất cả danh mục ({filteredCategories.length})</h2>
              <p className="page-subtitle">
                Mỗi danh mục gom các khóa học theo đúng mục tiêu học tập.
              </p>
            </div>
            <Link href="/courses" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600">
              Xem toàn bộ khóa học
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="interactive-card p-6">
                  <div className="h-12 w-12 animate-pulse rounded-lg bg-slate-200" />
                  <div className="mt-5 h-5 w-40 animate-pulse rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-200" />
                </Card>
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <Card className="p-10 text-center">
              <CardContent>
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">Chưa tìm thấy danh mục</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thử tìm bằng từ khóa khác hoặc xem toàn bộ khóa học.
                </p>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category, idx) => {
                const Icon = getCategoryIcon(category);
                const accent = categoryAccents[idx % categoryAccents.length];

                return (
                  <Link key={category._id} href={`/categories/${category.slug}`} className="group">
                    <Card className="interactive-card h-full overflow-hidden">
                      <div className={cn("h-1.5", accent.bar)} />
                      <CardContent className="flex h-full flex-col p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className={cn("learning-icon-tile h-14 w-14 bg-gradient-to-br ring-1", accent.tile)}>
                            <Icon className="h-7 w-7" />
                          </div>
                          <ArrowRight className="mt-2 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary-600" />
                        </div>

                        <h3 className="mt-5 text-xl font-bold text-foreground transition-colors group-hover:text-primary-600">
                          {category.name}
                        </h3>
                        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                          {category.description || "Khám phá lộ trình và bài học phù hợp với mục tiêu của bạn."}
                        </p>

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={cn("border", accent.badge)}>
                            <BookOpen className="mr-1 h-3.5 w-3.5" />
                            {category.courseCount ?? 0} khóa
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground">Xem lộ trình</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category, idx) => {
                const Icon = getCategoryIcon(category);
                const accent = categoryAccents[idx % categoryAccents.length];

                return (
                  <Link key={category._id} href={`/categories/${category.slug}`} className="group block">
                    <Card className="interactive-card overflow-hidden">
                      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                        <div className={cn("learning-icon-tile h-14 w-14 shrink-0 bg-gradient-to-br ring-1", accent.tile)}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold text-foreground group-hover:text-primary-600">
                            {category.name}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {category.description || "Khám phá các khóa học phù hợp trong danh mục này."}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <Badge variant="outline" className={cn("border", accent.badge)}>
                            {category.courseCount ?? 0} khóa học
                          </Badge>
                          <Button variant="outline" size="sm" className="gap-1">
                            Xem
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
