import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildBackendApiUrl } from "@/lib/serverApi";
import { CourseDetailClient } from "./CourseDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCourseBySlug(slug: string) {
  try {
    const response = await fetch(buildBackendApiUrl(`/courses/slug/${slug}`), {
      next: { revalidate: 300 },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Không thể tải khóa học");
    }

    const payload = await response.json();
    return payload?.data?.course ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    return {
      title: "Không tìm thấy khóa học | Edunest",
      description: "Khóa học bạn tìm kiếm hiện không tồn tại hoặc chưa được xuất bản.",
    };
  }

  return {
    title: `${course.title} | Edunest`,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      type: "website",
      images: course.thumbnail ? [{ url: course.thumbnail }] : undefined,
    },
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  return <CourseDetailClient course={course} />;
}
