"use client";

import api from "@/lib/api";
import type { ApiResponse, Course, Enrollment, PaginatedResponse } from "@/types";

type BackendCourse = Course & {
  discountPrice?: number;
  totalStudents?: number;
  totalRatings?: number;
};

export function normalizeCourse(course: BackendCourse): Course {
  const displayPrice =
    typeof course.discountPrice === "number" && course.discountPrice > 0
      ? course.discountPrice
      : course.price;

  return {
    ...course,
    price: displayPrice,
    estimatedPrice:
      displayPrice < course.price
        ? course.price
        : course.estimatedPrice,
    enrolledCount: course.enrolledCount ?? course.totalStudents ?? 0,
    reviewCount: course.reviewCount ?? course.totalRatings ?? 0,
    isBestseller:
      course.isBestseller ?? (course.totalStudents ?? course.enrolledCount ?? 0) >= 50,
  };
}

export function categoryLabel(category: Course["category"]): string {
  return typeof category === "string" ? category : category?.name ?? "Chưa phân loại";
}

export async function fetchPurchasedCourseIds() {
  const purchasedCourseIds = new Set<string>();
  let page = 1;
  let totalPages = 1;

  do {
    const response = await api.get<
      ApiResponse<{
        enrollments: Enrollment[];
        pagination: PaginatedResponse<Enrollment>["pagination"];
      }>
    >("/enrollments/my-courses", {
      params: { page, limit: 50 },
    });

    const enrollments = response.data.data?.enrollments ?? [];
    enrollments.forEach((enrollment) => {
      if (!enrollment.isActive) return;

      const course = enrollment.course;
      const courseId = typeof course === "string" ? course : course?._id;
      if (courseId) {
        purchasedCourseIds.add(courseId);
      }
    });

    totalPages = response.data.data?.pagination?.totalPages ?? page;
    page += 1;
  } while (page <= totalPages);

  return purchasedCourseIds;
}

export function markPurchasedCourses(
  courses: Course[],
  purchasedCourseIds: Set<string>,
) {
  return courses.map((course) => ({
    ...course,
    isPurchased: purchasedCourseIds.has(course._id),
  }));
}
