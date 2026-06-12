"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Course } from "@/types";
import { useAuthStore } from "@/stores/auth";

interface WishlistState {
  items: Course[];
  isLoading: boolean;

  addItem: (course: Course) => boolean;
  removeItem: (courseId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (courseId: string) => boolean;
  toggleItem: (course: Course) => boolean;
  setLoading: (isLoading: boolean) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      // Thêm khóa học vào wishlist khi người dùng đã đăng nhập
      addItem: (course) => {
        if (!useAuthStore.getState().isAuthenticated) {
          return false;
        }

        const hasCourseInWishlist = get().items.some((item) => item._id === course._id);
        if (!hasCourseInWishlist) {
          set((state) => ({
            items: [...state.items, course],
          }));
        }
        return true;
      },

      removeItem: (courseId) => {
        set((state) => ({
          items: state.items.filter((item) => item._id !== courseId),
        }));
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      isInWishlist: (courseId) => {
        return get().items.some((item) => item._id === courseId);
      },

      // Đảo trạng thái wishlist để dùng chung cho cả nút thêm và nút bỏ thích
      toggleItem: (course) => {
        if (!useAuthStore.getState().isAuthenticated) {
          return false;
        }

        const hasCourseInWishlist = get().isInWishlist(course._id);
        if (hasCourseInWishlist) {
          get().removeItem(course._id);
        } else {
          set((state) => ({
            items: [...state.items, course],
          }));
        }
        return true;
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },
    }),
    {
      name: "edunest-wishlist",
    }
  )
);

interface CartState {
  items: Course[];
  isLoading: boolean;

  // Actions
  addItem: (course: Course) => boolean;
  removeItem: (courseId: string) => void;
  clearCart: () => void;
  isInCart: (courseId: string) => boolean;
  getTotalPrice: () => number;
  setLoading: (isLoading: boolean) => void;
  setItems: (items: Course[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      // Thêm khóa học vào giỏ hàng khi người dùng đã đăng nhập
      addItem: (course) => {
        if (!useAuthStore.getState().isAuthenticated) {
          return false;
        }

        const hasCourseInCart = get().items.some((item) => item._id === course._id);
        if (!hasCourseInCart) {
          set((state) => ({
            items: [...state.items, course],
          }));
        }
        return true;
      },

      removeItem: (courseId) => {
        set((state) => ({
          items: state.items.filter((item) => item._id !== courseId),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      isInCart: (courseId) => {
        return get().items.some((item) => item._id === courseId);
      },

      // Cộng dồn giá tất cả khóa học trong giỏ hàng để phục vụ thanh toán
      getTotalPrice: () => {
        return get().items.reduce((totalPrice, item) => totalPrice + item.price, 0);
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setItems: (items) => {
        set({ items });
      },
    }),
    {
      name: "edunest-cart",
    }
  )
);

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  // Thêm toast mới và tự dọn sau khoảng thời gian cấu hình
  addToast: (toast) => {
    const toastId = Math.random().toString(36).substring(2);
    const nextToast = { ...toast, id: toastId };

    set((state) => ({
      toasts: [...state.toasts, nextToast],
    }));

    const duration = toast.duration || 5000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toastItem) => toastItem.id !== toastId),
      }));
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toastItem) => toastItem.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));
