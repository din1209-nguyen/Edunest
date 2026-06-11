"use client";

import api from "./api";
import type {
  Course,
  Chapter,
  User,
  Enrollment,
  AdminStats,
  CourseStatus,
  ApiResponse,
  PaginatedResponse,
} from "@/types";

export type AdminCourseDetail = {
  course: Course;
  chapters: Chapter[];
};

type BackendListResponse<T, K extends string> = ApiResponse<Record<K, T[]> & {
  pagination: PaginatedResponse<T>["pagination"];
}>;

function normalizeListResponse<T, K extends string>(
  response: BackendListResponse<T, K>,
  key: K,
): PaginatedResponse<T> {
  const payload = response.data;
  return {
    success: response.success,
    data: payload?.[key] ?? [],
    pagination: payload?.pagination ?? {
      page: 1,
      limit: 0,
      total: 0,
      totalPages: 0,
    },
  };
}

// Admin Dashboard
export const adminDashboardApi = {
  getStats: async () => {
    const response = await api.get<ApiResponse<AdminStats>>("/admin/stats");
    return response.data;
  },

  getRecentActivity: async (limit = 20) => {
    const response = await api.get<
      ApiResponse<{
        recentEnrollments: Enrollment[];
        recentUsers: User[];
        recentCourses: Course[];
      }>
    >("/admin/dashboard/recent", {
      params: { limit },
    });
    return response.data;
  },
};

// User Management
export const adminUserApi = {
  getAllUsers: async (
    page = 1,
    limit = 20,
    role?: string,
    search?: string
  ) => {
    const response = await api.get<BackendListResponse<User, "users">>("/admin/users", {
      params: { page, limit, role, search },
    });
    return normalizeListResponse(response.data, "users");
  },

  getUser: async (userId: string) => {
    void userId;
    throw new Error("Backend does not support fetching a single user yet.");
  },

  updateUser: async (userId: string, data: Partial<User>) => {
    void userId;
    void data;
    throw new Error("Backend does not support updating arbitrary user fields yet.");
  },

  banUser: async (userId: string, reason?: string) => {
    const response = await api.patch<ApiResponse<User>>(`/admin/users/${userId}/lock`, {
      reason,
    });
    return response.data;
  },

  unbanUser: async (userId: string) => {
    const response = await api.patch<ApiResponse<User>>(`/admin/users/${userId}/unlock`);
    return response.data;
  },

  changeUserRole: async (userId: string, role: "user" | "admin") => {
    const endpoint = role === "admin" ? "make-admin" : "make-user";
    const response = await api.patch<ApiResponse<User>>(`/admin/users/${userId}/${endpoint}`);
    return response.data;
  },
};

// Course Management
export const adminCourseApi = {
  getAllCourses: async (
    page = 1,
    limit = 20,
    status?: CourseStatus,
    search?: string
  ) => {
    const response = await api.get<BackendListResponse<Course, "courses">>("/admin/courses", {
      params: { page, limit, status, search },
    });
    return normalizeListResponse(response.data, "courses");
  },

  getCourse: async (courseId: string) => {
    const response = await api.get<ApiResponse<AdminCourseDetail>>(`/admin/courses/${courseId}`);
    return response.data;
  },

  approveCourse: async (courseId: string) => {
    const response = await api.patch<ApiResponse<Course>>(
      `/admin/courses/${courseId}/approve`
    );
    return response.data;
  },

  rejectCourse: async (courseId: string, reason: string) => {
    const response = await api.patch<ApiResponse<Course>>(
      `/admin/courses/${courseId}/reject`,
      { reason }
    );
    return response.data;
  },

  banCourse: async (courseId: string, reason: string) => {
    const response = await api.patch<ApiResponse<Course>>(`/admin/courses/${courseId}/ban`, {
      reason,
    });
    return response.data;
  },

  unbanCourse: async (courseId: string) => {
    const response = await api.patch<ApiResponse<Course>>(`/admin/courses/${courseId}/unlock`);
    return response.data;
  },

  featureCourse: async (courseId: string) => {
    void courseId;
    throw new Error("Backend does not support featuring courses yet.");
  },

  unfeatureCourse: async (courseId: string) => {
    void courseId;
    throw new Error("Backend does not support unfeaturing courses yet.");
  },
};

// Category Management
export const adminCategoryApi = {
  getAllCategories: async () => {
    const response = await api.get<ApiResponse<import("@/types").Category[]>>(
      "/categories/admin/all"
    );
    return response.data;
  },

  createCategory: async (data: {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
  }) => {
    const response = await api.post<ApiResponse<import("@/types").Category>>(
      "/categories/admin",
      data
    );
    return response.data;
  },

  updateCategory: async (categoryId: string, data: {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
  }) => {
    const response = await api.patch<ApiResponse<import("@/types").Category>>(
      `/categories/admin/${categoryId}`,
      data
    );
    return response.data;
  },

  deleteCategory: async (categoryId: string) => {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `/categories/admin/${categoryId}`
    );
    return response.data;
  },
};

// Analytics
export const adminAnalyticsApi = {
  getOverview: async () => {
    const stats = await adminDashboardApi.getStats();
    return {
      success: stats.success,
      message: stats.message,
      data: stats.data
        ? {
            ...stats.data,
            userGrowth: [],
            enrollmentGrowth: [],
            topCourses: [],
            topInstructors: [],
          }
        : undefined,
    } satisfies ApiResponse<AdminStats & {
      userGrowth: { month: string; count: number }[];
      enrollmentGrowth: { month: string; count: number }[];
      topCourses: Course[];
      topInstructors: { user: User; courseCount: number; studentCount: number }[];
    }>;
  },
};
