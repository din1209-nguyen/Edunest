"use client";

import api from "./api";
import type { ApiResponse, Category } from "@/types";

export const categoryApi = {
  getCategories: async () => {
    const response = await api.get<ApiResponse<Category[]>>("/categories");
    return response.data;
  },
};
