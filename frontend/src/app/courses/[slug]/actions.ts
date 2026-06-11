"use server";

import { revalidatePath } from "next/cache";
import { requestBackendJson } from "@/lib/serverApi";

export async function enrollInFreeCourseAction(courseId: string, courseSlug: string) {
  const data = await requestBackendJson(`/enrollments/${courseId}/free-enroll`, {
    method: "POST",
  });

  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/student/my-courses");
  revalidatePath("/student/dashboard");

  return data;
}

export async function addCourseToCartAction(courseId: string) {
  const data = await requestBackendJson("/cart/items", {
    method: "POST",
    body: JSON.stringify({ courseId }),
  });

  revalidatePath("/student/cart");
  return data;
}

export async function completeLessonAction(courseId: string, lessonId: string, courseSlug: string) {
  const data = await requestBackendJson(`/enrollments/${courseId}/lessons/${lessonId}/complete`, {
    method: "POST",
  });

  revalidatePath(`/student/learn/${courseSlug}`);
  revalidatePath("/student/my-courses");
  revalidatePath("/student/dashboard");

  return data;
}
