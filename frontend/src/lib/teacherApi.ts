"use client";

import api from "./api";
import type {
  Course,
  Chapter,
  Lesson,
  Exercise,
  Enrollment,
  TeacherStats,
  CourseFormData,
  ApiResponse,
  PaginatedResponse,
} from "@/types";

const creatorBasePath = "/teacher";

export type TeacherCourseDetailResponse = Course | { course?: Course };
export type TeacherCourseCurriculumResponse = Chapter[] | { chapters?: Chapter[] };
export type TeacherUploadType = "thumbnail" | "video" | "document";
export type TeacherUploadResponse = {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
};

export const teacherUploadApi = {
  uploadFile: async (file: File, type: TeacherUploadType) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await api.post<ApiResponse<TeacherUploadResponse>>(
      `${creatorBasePath}/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },
};

export const teacherCourseApi = {
  getMyCourses: async () => {
    const response = await api.get<ApiResponse<Course[]>>(`${creatorBasePath}/courses`);
    return response.data;
  },

  createCourse: async (data: CourseFormData) => {
    const response = await api.post<ApiResponse<Course>>(`${creatorBasePath}/courses`, data);
    return response.data;
  },

  getCourse: async (courseId: string) => {
    const response = await api.get<ApiResponse<TeacherCourseDetailResponse>>(`${creatorBasePath}/courses/${courseId}`);
    return response.data;
  },

  getCourseCurriculum: async (courseId: string) => {
    const response = await api.get<ApiResponse<TeacherCourseCurriculumResponse>>(`${creatorBasePath}/courses/${courseId}/chapters`);
    return response.data;
  },

  updateCourse: async (courseId: string, data: Partial<CourseFormData>) => {
    const response = await api.patch<ApiResponse<Course>>(
      `${creatorBasePath}/courses/${courseId}`,
      data
    );
    return response.data;
  },

  deleteCourse: async (courseId: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `${creatorBasePath}/courses/${courseId}`
    );
    return response.data;
  },

  publishCourse: async (courseId: string) => {
    const response = await api.patch<ApiResponse<Course>>(
      `${creatorBasePath}/courses/${courseId}/submit-review`,
      {}
    );
    return response.data;
  },

  unpublishCourse: async (_courseId: string) => {
    throw new Error("Backend does not support unpublishing courses yet.");
  },

  getCourseStudents: async (
    courseId: string,
    page = 1,
    limit = 20
  ) => {
    const response = await api.get<PaginatedResponse<Enrollment>>(
      `${creatorBasePath}/courses/${courseId}/students`,
      {
        params: { page, limit },
      }
    );
    return response.data;
  },

  removeStudent: async (courseId: string, studentId: string) => {
    const response = await api.patch<ApiResponse<{ message: string }>>(
      `${creatorBasePath}/courses/${courseId}/students/${studentId}/ban`,
      {}
    );
    return response.data;
  },

  inviteStudent: async (courseId: string, email: string) => {
    const response = await api.patch<ApiResponse<{ message: string }>>(
      `${creatorBasePath}/courses/${courseId}/students/${email}/invite`,
      { email }
    );
    return response.data;
  },
};

// Chapter Management
export const chapterApi = {
  createChapter: async (courseId: string, title: string) => {
    const response = await api.post<ApiResponse<Chapter>>(
      `${creatorBasePath}/courses/${courseId}/chapters`,
      { title }
    );
    return response.data;
  },

  // Gọi route theo chapterId nên không cần courseId ở tầng client
  updateChapter: async (
    _courseId: string,
    chapterId: string,
    data: Partial<Chapter>
  ) => {
    const response = await api.patch<ApiResponse<Chapter>>(
      `${creatorBasePath}/chapters/${chapterId}`,
      data
    );
    return response.data;
  },

  // Gọi route theo chapterId nên không cần courseId ở tầng client
  deleteChapter: async (_courseId: string, chapterId: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `${creatorBasePath}/chapters/${chapterId}`
    );
    return response.data;
  },

  reorderChapters: async (_courseId: string, _chapterIds: string[]) => {
    throw new Error("Backend does not support chapter reordering yet.");
  },
};

// Lesson Management
export const lessonApi = {
  createLesson: async (
    _courseId: string,
    chapterId: string,
    data: Partial<Lesson>
  ) => {
    const response = await api.post<ApiResponse<Lesson>>(
      `${creatorBasePath}/chapters/${chapterId}/lessons`,
      data
    );
    return response.data;
  },

  // Gọi route theo lessonId nên chỉ giữ lại tham số để tương thích chữ ký cũ
  updateLesson: async (
    _courseId: string,
    _chapterId: string,
    lessonId: string,
    data: Partial<Lesson>
  ) => {
    const response = await api.patch<ApiResponse<Lesson>>(
      `${creatorBasePath}/lessons/${lessonId}`,
      data
    );
    return response.data;
  },

  // Gọi route theo lessonId nên chỉ giữ lại tham số để tương thích chữ ký cũ
  deleteLesson: async (
    _courseId: string,
    _chapterId: string,
    lessonId: string
  ) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `${creatorBasePath}/lessons/${lessonId}`
    );
    return response.data;
  },

  reorderLessons: async (
    _courseId: string,
    _chapterId: string,
    _lessonIds: string[]
  ) => {
    throw new Error("Backend does not support lesson reordering yet.");
  },
};

// Exercise Management
export const creatorExerciseApi = {
  createExercise: async (
    _courseId: string,
    _chapterId: string,
    lessonId: string,
    data: Partial<Exercise>
  ) => {
    const response = await api.post<ApiResponse<Exercise>>(
      `${creatorBasePath}/lessons/${lessonId}/exercises`,
      data
    );
    return response.data;
  },

  // Gọi route theo exerciseId nên chỉ giữ lại tham số để tương thích chữ ký cũ
  updateExercise: async (
    _courseId: string,
    _chapterId: string,
    _lessonId: string,
    exerciseId: string,
    data: Partial<Exercise>
  ) => {
    const response = await api.patch<ApiResponse<Exercise>>(
      `${creatorBasePath}/exercises/${exerciseId}`,
      data
    );
    return response.data;
  },

  // Gọi route theo exerciseId nên chỉ giữ lại tham số để tương thích chữ ký cũ
  deleteExercise: async (
    _courseId: string,
    _chapterId: string,
    _lessonId: string,
    exerciseId: string
  ) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `${creatorBasePath}/exercises/${exerciseId}`
    );
    return response.data;
  },

  getLessonExercises: async (lessonId: string) => {
    const response = await api.get<ApiResponse<Exercise[]>>(
      `${creatorBasePath}/lessons/${lessonId}/exercises`
    );
    return response.data;
  },

  getExercise: async (exerciseId: string) => {
    const response = await api.get<ApiResponse<Exercise>>(
      `${creatorBasePath}/exercises/${exerciseId}`
    );
    return response.data;
  },
};

// Dashboard Management
export const creatorDashboardApi = {
  getStats: async () => {
    const response = await api.get<ApiResponse<TeacherStats>>(`${creatorBasePath}/dashboard`);
    return response.data;
  },

  getRecentEnrollments: async (limit = 5) => {
    const dashboard = await creatorDashboardApi.getStats();
    return {
      ...dashboard,
      data: dashboard.data?.recentEnrollments?.slice(0, limit) ?? [],
    };
  },
};

export const teacherDashboardApi = creatorDashboardApi;
export const teacherExerciseApi = creatorExerciseApi;
