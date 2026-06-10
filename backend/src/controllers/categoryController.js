import { z } from "zod";
import { categoryService } from "../services/categoryService.js";

// Validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, "Tên danh mục là bắt buộc").max(100),
  slug: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
  parent: z.string().optional().nullable(),
  order: z.number().min(0).default(0),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
  parent: z.string().optional().nullable(),
  order: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Lấy tất cả danh mục (public)
 * GET /api/categories
 */
export async function getCategories(req, res, next) {
  try {
    const categories = await categoryService.getCategoriesForPublic();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy danh mục theo slug
 * GET /api/categories/:slug
 */
export async function getCategoryBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const category = await categoryService.getCategoryBySlug(slug);

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tạo danh mục (Admin)
 * POST /api/admin/categories
 */
export async function createCategory(req, res, next) {
  try {
    const category = await categoryService.createCategory(req.validatedBody);

    res.status(201).json({
      success: true,
      message: "Tạo danh mục thành công",
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật danh mục (Admin)
 * PATCH /api/admin/categories/:id
 */
export async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const category = await categoryService.updateCategory(id, req.validatedBody);

    res.json({
      success: true,
      message: "Cập nhật danh mục thành công",
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa danh mục (Admin)
 * DELETE /api/admin/categories/:id
 */
export async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);

    res.json({
      success: true,
      message: "Xóa danh mục thành công",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy tất cả danh mục kể cả inactive (Admin)
 * GET /api/admin/categories
 */
export async function getAllCategoriesAdmin(req, res, next) {
  try {
    const categories = await categoryService.getAllCategories({ includeInactive: true });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}
