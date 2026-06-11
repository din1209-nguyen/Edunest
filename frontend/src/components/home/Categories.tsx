"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  FileText,
  GraduationCap,
  Headphones,
  Mic,
  PenTool,
  Smile,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/types";

interface CategoriesProps {
  categories: Category[];
  isLoading?: boolean;
}

const categoryIcons: Record<string, LucideIcon> = {
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
  return categoryIcons[key] || BookOpen;
}

export function Categories({ categories, isLoading }: CategoriesProps) {
  if (isLoading) {
    return (
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-border bg-surface p-6 text-center"
              >
                <div className="mx-auto h-12 w-12 rounded-xl bg-primary-50" />
                <div className="mt-3 h-4 w-20 rounded bg-primary-50 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Khám phá danh mục khóa học
            </h2>
            <p className="mt-2 text-muted-foreground">
              Tìm kiếm khóa học phù hợp với nhu cầu của bạn
            </p>
          </div>
          <Link
            href="/categories"
            className="hidden items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 sm:flex"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category, index) => (
            <Link
              key={category._id}
              href={`/categories/${category.slug}`}
              className="group animate-fadeIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card className="interactive-card overflow-hidden">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 text-primary-600 transition-transform group-hover:scale-110">
                    {(() => {
                      const Icon = getCategoryIcon(category);
                      return <Icon className="h-8 w-8" />;
                    })()}
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.courseCount || 0} khóa học
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Xem tất cả danh mục
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
