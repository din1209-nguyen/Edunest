"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import api from "@/lib/api";

let authBootstrapPromise: Promise<void> | null = null;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasBootstrapped: boolean;

  login: (user: User) => void;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  bootstrapAuth: (options?: { force?: boolean }) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasBootstrapped: false,

      // Đồng bộ trạng thái đăng nhập ngay sau khi nhận được người dùng hợp lệ
      login: (user) => {
        const isVerified = user?.isEmailVerified !== false;
        set({
          user,
          isAuthenticated: isVerified,
          isLoading: false,
          hasBootstrapped: true,
        });
      },

      // Xóa trạng thái local kể cả khi request logout phía server thất bại
      logout: async () => {
        try {
          if (get().isAuthenticated) {
            await api.post("/auth/logout");
          }
        } catch {
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            hasBootstrapped: true,
          });
        }
      },

      // Cập nhật user hiện tại và suy ra trạng thái xác thực từ dữ liệu mới
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user && user.isEmailVerified !== false,
          hasBootstrapped: true,
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      // Hợp nhất từng trường cập nhật vào user hiện tại mà không làm mất dữ liệu cũ
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      // Gọi /auth/me một lần duy nhất. Nếu access token hết hạn, interceptor sẽ refresh
      // và retry, rồi mới trả về response cho đây. Bootstrap chỉ đơn giản lấy user.
      bootstrapAuth: async (options) => {
        const force = options?.force ?? false;
        const hasPersistedUser = !!get().user;

        if (get().isLoading) return;
        if (!force && get().hasBootstrapped) return;
        if (authBootstrapPromise) return authBootstrapPromise;

        set({ isLoading: hasPersistedUser, ...(force ? { hasBootstrapped: false } : {}) });

        authBootstrapPromise = (async () => {
          try {
            const authResponse = await api.get("/auth/me");
            const authPayload = authResponse.data?.data ?? authResponse.data;
            const authenticatedUser = authPayload.user ?? authPayload ?? null;

            set({
              user: authenticatedUser,
              isAuthenticated: !!authenticatedUser && authenticatedUser.isEmailVerified !== false,
              isLoading: false,
              hasBootstrapped: true,
            });
          } catch {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              hasBootstrapped: true,
            });
          } finally {
            authBootstrapPromise = null;
          }
        })();

        return authBootstrapPromise;
      },
    }),
    {
      name: "edunest-auth",
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useUserRole = () => useAuthStore((state) => state.user?.role);
