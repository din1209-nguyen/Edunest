"use client";

import { useEffect, useState } from "react";
import Hero, { Features, Testimonials, CTASection } from "@/components/home/Hero";
import { Categories } from "@/components/home/Categories";
import { CourseSection } from "@/components/course/CourseList";
import api from "@/lib/api";
import { fetchPurchasedCourseIds, markPurchasedCourses, normalizeCourse } from "@/lib/courseUtils";
import { useAuthStore } from "@/stores/auth";
import type { Category, Course, ApiResponse } from "@/types";

export default function HomePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [trendingCourses, setTrendingCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadHomeData() {
      try {
        setLoading(true);
        setError("");

        const [categoriesRes, featuredRes, trendingRes, purchasedCourseIds] = await Promise.all([
          api.get<ApiResponse<Category[]>>("/categories"),
          api.get<ApiResponse<Course[]>>("/search/top-rated", {
            params: { limit: 8 },
          }),
          api.get<ApiResponse<Course[]>>("/search/trending", {
            params: { limit: 8 },
          }),
          isAuthenticated ? fetchPurchasedCourseIds() : Promise.resolve(new Set<string>()),
        ]);

        if (!mounted) return;

        setCategories(categoriesRes.data.data ?? []);
        setFeaturedCourses(markPurchasedCourses(
          (featuredRes.data.data ?? []).map(normalizeCourse),
          purchasedCourseIds,
        ));
        setTrendingCourses(markPurchasedCourses(
          (trendingRes.data.data ?? []).map(normalizeCourse),
          purchasedCourseIds,
        ));
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load home data", err);
        setError("Không thể tải dữ liệu trang chủ. Vui lòng thử lại.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHomeData();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  return (
    <main className="min-h-screen pb-14 sm:pb-16">
      <Hero />

      {error && (
        <div className="app-container py-6">
          <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        </div>
      )}

      <Categories categories={categories} />

      <CourseSection
        title="Khóa học nổi bật"
        subtitle={loading ? "Đang tải khóa học từ MongoDB..." : "Những khóa học được đánh giá cao"}
        courses={featuredCourses}
        viewAllHref="/courses?sort=rating"
      />

      <Features />

      <CourseSection
        title="Xu hướng học tập"
        subtitle={loading ? "Đang tải dữ liệu..." : "Khóa học được quan tâm nhiều nhất"}
        courses={trendingCourses}
        viewAllHref="/courses?sort=popular"
      />

      <Testimonials />
      <CTASection />
    </main>
  );
}
