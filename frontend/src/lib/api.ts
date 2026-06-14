"use client";

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let refreshRequestPromise: Promise<void> | null = null;
let hasForcedLogout = false;

const PROTECTED_PATH_PREFIXES = ["/admin", "/student", "/teacher"];

// Kiểm tra request hiện tại có thuộc nhóm endpoint xác thực cần bỏ qua refresh tự động hay không
function isAuthLifecycleRequest(config?: InternalAxiosRequestConfig) {
  const url = config?.url || "";
  return [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-email",
    "/auth/refresh",
    "/auth/logout",
  ].some((path) => url.includes(path));
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

// Đăng xuất cưỡng bức đúng một lần khi refresh token không còn hợp lệ
async function forceLogoutOnce() {
  if (hasForcedLogout) return;
  hasForcedLogout = true;

  await useAuthStore.getState().logout();
  if (typeof window !== "undefined" && isProtectedPath(window.location.pathname)) {
    window.location.href = "/login";
  }
}

api.interceptors.response.use(
  (response) => {
    hasForcedLogout = false;
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Ngăn lặp vô hạn khi phiên đã bị buộc đăng xuất trước đó
    if (hasForcedLogout) {
      return Promise.reject(error);
    }

    // Bỏ qua các endpoint auth để tránh vòng lặp refresh lồng nhau
    if (originalRequest._retry || isAuthLifecycleRequest(originalRequest)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // Gộp các request 401 đồng thời vào cùng một promise refresh token
      if (!refreshRequestPromise) {
        refreshRequestPromise = axios
          .post(
            `${API_URL}/auth/refresh`,
            {},
            {
              withCredentials: true,
            }
          )
          .then(() => undefined)
          .finally(() => {
            refreshRequestPromise = null;
          });
      }

      await refreshRequestPromise;
      return api(originalRequest);
    } catch (refreshError) {
      await forceLogoutOnce();
      return Promise.reject(refreshError);
    }
  }
);

export default api;

export const apiGet = async <T>(url: string, params?: Record<string, unknown>) => {
  const response = await api.get<T>(url, { params });
  return response.data;
};

export const apiPost = async <T>(url: string, data?: unknown) => {
  const response = await api.post<T>(url, data);
  return response.data;
};

export const apiPut = async <T>(url: string, data?: unknown) => {
  const response = await api.put<T>(url, data);
  return response.data;
};

export const apiPatch = async <T>(url: string, data?: unknown) => {
  const response = await api.patch<T>(url, data);
  return response.data;
};

export const apiDelete = async <T>(url: string) => {
  const response = await api.delete<T>(url);
  return response.data;
};
