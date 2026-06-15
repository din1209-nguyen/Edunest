"use client";

import api from "./api";
import type {
  Course,
  Enrollment,
  Cart,
  Note,
  Review,
  Exercise,
  ExerciseSubmissionResult,
  Certificate,
  CourseFilters,
  PaginatedResponse,
  ApiResponse,
  AiExerciseQuota,
  PopularUser,
} from "@/types";

type ReviewListApiResponse = ApiResponse<{ reviews: Review[]; pagination: PaginatedResponse<Review>["pagination"] }> & {
  reviews?: Review[];
  pagination?: PaginatedResponse<Review>["pagination"];
};

type ReviewStats = {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
};

type SearchApiResponse = ApiResponse<Course[]> & {
  courses?: Course[];
  pagination?: PaginatedResponse<Course>["pagination"];
};

// Public courses
export const courseApi = {
  getCourses: async (filters?: CourseFilters) => {
    const response = await api.get<ApiResponse<{ courses: Course[]; pagination: PaginatedResponse<Course>["pagination"] }>>("/courses", {
      params: filters,
    });
    return response.data;
  },

  getCourseBySlug: async (slug: string) => {
    const response = await api.get<ApiResponse<{ course: Course }>>(
      `/courses/slug/${slug}`
    );
    return response.data;
  },
};

// Enrollments
export const enrollmentApi = {
  getMyEnrollments: async (page = 1, limit = 10) => {
    const response = await api.get<ApiResponse<{ enrollments: Enrollment[] }>>(
      "/enrollments/my-courses",
      { params: { page, limit } }
    );
    return response.data;
  },

  enrollCourse: async (courseId: string) => {
    const response = await api.post<ApiResponse<{ enrollment: Enrollment }>>(
      `/enrollments/${courseId}/free-enroll`
    );
    return response.data;
  },

  getProgress: async (courseId: string) => {
    const response = await api.get<ApiResponse<{ progress: Enrollment }>>(
      `/enrollments/${courseId}/progress`
    );
    return response.data;
  },

  markLessonComplete: async (courseId: string, lessonId: string) => {
    const response = await api.post<
      ApiResponse<{ progress: { progress: number; completedLessons: string[] } }>
    >(`/enrollments/${courseId}/lessons/${lessonId}/complete`);
    return response.data;
  },
};

// Cart
export const cartApi = {
  getMyCart: async () => {
    const response = await api.get<ApiResponse<Cart>>("/cart");
    return response.data;
  },

  addToCart: async (courseId: string) => {
    const response = await api.post<ApiResponse<Cart>>("/cart/items", {
      courseId,
    });
    return response.data;
  },

  removeFromCart: async (courseId: string) => {
    const response = await api.delete<ApiResponse<Cart>>(`/cart/items/${courseId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete<ApiResponse<Cart>>("/cart/clear");
    return response.data;
  },
};

// Notes
export const noteApi = {
  getNotesByLesson: async (lessonId: string) => {
    const response = await api.get<ApiResponse<{ notes: Note[] }>>(`/lessons/${lessonId}/notes`);
    return response.data;
  },

  createNote: async (lessonId: string, content: string, timestamp?: number) => {
    const response = await api.post<ApiResponse<{ note: Note }>>(`/lessons/${lessonId}/notes`, {
      content,
      timestamp,
    });
    return response.data;
  },

  updateNote: async (noteId: string, content: string) => {
    const response = await api.patch<ApiResponse<{ note: Note }>>(`/notes/${noteId}`, {
      content,
    });
    return response.data;
  },

  deleteNote: async (noteId: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `/notes/${noteId}`
    );
    return response.data;
  },
};

// Reviews
export const reviewApi = {
  getReviewsByCourse: async (
    courseId: string,
    page = 1,
    limit = 10
  ) => {
    const response = await api.get<ReviewListApiResponse>(
      `/courses/${courseId}/reviews`,
      {
        params: { page, limit },
      }
    );
    const payload = response.data;
    return {
      ...payload,
      data: payload.data ?? {
        reviews: payload.reviews ?? [],
        pagination: payload.pagination ?? {
          page,
          limit,
          total: payload.reviews?.length ?? 0,
          totalPages: 1,
        },
      },
    };
  },

  getMyReview: async (courseId: string) => {
    const response = await api.get<ApiResponse<Review | null>>(
      `/reviews/my-review/${courseId}`
    );
    return response.data;
  },

  getReviewStats: async (courseId: string) => {
    const response = await api.get<ApiResponse<ReviewStats>>(
      `/courses/${courseId}/reviews/stats`
    );
    return response.data;
  },

  createReview: async (
    courseId: string,
    rating: number,
    comment: string
  ) => {
    const response = await api.post<ApiResponse<Review>>("/reviews", {
      courseId,
      rating,
      comment,
    });
    return response.data;
  },

  updateReview: async (
    reviewId: string,
    rating: number,
    comment: string
  ) => {
    const response = await api.patch<ApiResponse<Review>>(`/reviews/${reviewId}`, {
      rating,
      comment,
    });
    return response.data;
  },

  deleteReview: async (reviewId: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `/reviews/${reviewId}`
    );
    return response.data;
  },
};

// Exercises
export const exerciseApi = {
  getExercisesByLesson: async (lessonId: string) => {
    const response = await api.get<ApiResponse<{ exercises: Exercise[] }>>(
      `/exercises/lessons/${lessonId}/exercises`
    );
    return response.data;
  },

  submitExercise: async (
    exerciseId: string,
    answers: Array<string | string[]>
  ) => {
    const response = await api.post<ApiResponse<{ result: ExerciseSubmissionResult }>>(`/exercises/${exerciseId}/submit`, {
      answers,
    });
    return response.data;
  },

  generateAIExerciseForLesson: async (lessonId: string) => {
    const response = await api.post<
      ApiResponse<{ exercise: Exercise; quota: AiExerciseQuota }>
    >(`/ai/lessons/${lessonId}/exercises/generate`);
    return response.data;
  },
};

// Certificates
export const certificateApi = {
  getMyCertificates: async () => {
    const response = await api.get<ApiResponse<Certificate[]>>("/certificates/my-certificates");
    return response.data;
  },

  getCertificate: async (courseId: string) => {
    const response = await api.get<ApiResponse<Certificate>>(
      `/certificates/${courseId}`
    );
    return response.data;
  },

  checkEligibility: async (courseId: string) => {
    const response = await api.get<ApiResponse<Certificate>>(
      `/certificates/${courseId}/check`
    );
    return response.data;
  },
};

// User follows
export const userFollowApi = {
  getPopularUsers: async (limit = 5) => {
    const response = await api.get<ApiResponse<{ users: PopularUser[] }>>(
      "/users/popular",
      { params: { limit } }
    );
    return response.data;
  },

  followUser: async (userId: string) => {
    const response = await api.post<ApiResponse<{ userId: string; isFollowing: boolean; followersCount: number }>>(
      `/users/${userId}/follow`
    );
    return response.data;
  },

  unfollowUser: async (userId: string) => {
    const response = await api.delete<ApiResponse<{ userId: string; isFollowing: boolean; followersCount: number }>>(
      `/users/${userId}/follow`
    );
    return response.data;
  },
};

// Search
export const searchApi = {
  search: async (filters: CourseFilters) => {
    const response = await api.get<SearchApiResponse>("/search", {
      params: filters,
    });
    return {
      success: response.data.success,
      data: response.data.courses ?? response.data.data ?? [],
      pagination: response.data.pagination ?? {
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
        total: response.data.courses?.length ?? response.data.data?.length ?? 0,
        totalPages: 1,
      },
    };
  },

  getTrending: async (limit = 10) => {
    const response = await api.get<ApiResponse<Course[]>>("/search/trending", {
      params: { limit },
    });
    return response.data;
  },
};
