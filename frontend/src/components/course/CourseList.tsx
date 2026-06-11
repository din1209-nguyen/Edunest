"use client";

import { CourseCard } from "./CourseCard";
import { CourseListSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { SearchX } from "lucide-react";
import type { Course } from "@/types";

interface CourseListProps {
  courses: Course[];
  variant?: "grid" | "list" | "compact";
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function CourseList({
  courses,
  variant = "grid",
  isLoading = false,
  emptyMessage = "Không tìm thấy khóa học nào",
  className,
}: CourseListProps) {
  if (isLoading) {
    return <CourseListSkeleton count={8} />;
  }

  if (courses.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16", className)}>
        <SearchX className="h-16 w-16 text-muted-foreground/50" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">{emptyMessage}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác
        </p>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-4", className)}>
        {courses.map((course, index) => (
          <div
            key={course._id}
            className="animate-fadeIn"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CourseCard course={course} variant="horizontal" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("space-y-3", className)}>
        {courses.map((course, index) => (
          <div
            key={course._id}
            className="animate-fadeIn"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CourseCard course={course} variant="compact" />
          </div>
        ))}
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {courses.map((course, index) => (
        <div
          key={course._id}
          className="animate-fadeIn flex"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CourseCard course={course} className="w-full" />
        </div>
      ))}
    </div>
  );
}

// Course Grid with Section Header
interface CourseSectionProps {
  title: string;
  subtitle?: string;
  courses: Course[];
  variant?: "grid" | "list" | "compact";
  isLoading?: boolean;
  viewAllHref?: string;
  className?: string;
}

export function CourseSection({
  title,
  subtitle,
  courses,
  variant = "grid",
  isLoading = false,
  viewAllHref,
  className,
}: CourseSectionProps) {
  return (
    <section className={cn("py-12 sm:py-14 lg:py-16", className)}>
      <div className="app-container">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h2>
            {subtitle && <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{subtitle}</p>}
          </div>
          {viewAllHref && (
            <a
              href={viewAllHref}
              className="inline-flex items-center text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
            >
              Xem tất cả
            </a>
          )}
        </div>
        <CourseList
          courses={courses}
          variant={variant}
          isLoading={isLoading}
          className={variant === "grid" ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : ""}
        />
      </div>
    </section>
  );
}
