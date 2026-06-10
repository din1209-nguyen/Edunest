import Category from "../models/Category.js";
import Course from "../models/Course.js";
import {
  getPublicCategories,
  invalidateCategories,
} from "./cacheService.js";

/**
 * Tạo danh mục mới (Admin only)
 */
async function createCategory(data) {
  const existing = await Category.findOne({ slug: data.slug || data.name.toLowerCase() });
  if (existing) {
    const error = new Error("Danh mục đã tồn tại");
    error.statusCode = 409;
    throw error;
  }

  const category = await Category.create({
    name: data.name,
    slug: data.slug,
    description: data.description || "",
    icon: data.icon || "",
    image: data.image || "",
    parent: data.parent || null,
    order: data.order || 0,
  });

  await invalidateCategories();
  return category;
}

/**
 * Lấy tất cả danh mục (public)
 */
async function getAllCategories(options = {}) {
  const { includeInactive = false } = options;

  const query = includeInactive ? {} : { isActive: true };

  const categories = await Category.find(query)
    .populate("parent", "name slug")
    .sort({ order: 1, name: 1 })
    .lean();

  // Build tree structure
  const categoryMap = new Map();
  const rootCategories = [];

  // First pass: create map
  categories.forEach((cat) => {
    categoryMap.set(cat._id.toString(), { ...cat, children: [] });
  });

  // Second pass: build tree
  categories.forEach((cat) => {
    const categoryNode = categoryMap.get(cat._id.toString());
    if (cat.parent) {
      const parent = categoryMap.get(cat.parent.toString());
      if (parent) {
        parent.children.push(categoryNode);
      } else {
        rootCategories.push(categoryNode);
      }
    } else {
      rootCategories.push(categoryNode);
    }
  });

  return rootCategories;
}

/**
 * Lấy danh mục theo slug
 */
async function getCategoryBySlug(slug) {
  const category = await Category.findOne({ slug, isActive: true })
    .populate("parent", "name slug")
    .lean();

  if (!category) {
    const error = new Error("Danh mục không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  // Get subcategories
  const subcategories = await Category.find({
    parent: category._id,
    isActive: true,
  })
    .sort({ order: 1, name: 1 })
    .lean();

  // Get course count
  const courseCount = await Course.countDocuments({
    category: category.name,
    status: "published",
  });

  return {
    ...category,
    subcategories,
    courseCount,
  };
}

/**
 * Lấy danh mục theo ID
 */
async function getCategoryById(categoryId) {
  const category = await Category.findById(categoryId).lean();

  if (!category) {
    const error = new Error("Danh mục không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  return category;
}

/**
 * Cập nhật danh mục (Admin only)
 */
async function updateCategory(categoryId, data) {
  const category = await Category.findById(categoryId);

  if (!category) {
    const error = new Error("Danh mục không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  // Update fields
  if (data.name !== undefined) category.name = data.name;
  if (data.slug !== undefined) category.slug = data.slug;
  if (data.description !== undefined) category.description = data.description;
  if (data.icon !== undefined) category.icon = data.icon;
  if (data.image !== undefined) category.image = data.image;
  if (data.parent !== undefined) category.parent = data.parent;
  if (data.order !== undefined) category.order = data.order;
  if (data.isActive !== undefined) category.isActive = data.isActive;

  await category.save();
  await invalidateCategories();

  return category;
}

/**
 * Xóa danh mục (Admin only)
 */
async function deleteCategory(categoryId) {
  // Check if has subcategories
  const subcategories = await Category.countDocuments({ parent: categoryId });
  if (subcategories > 0) {
    const error = new Error("Không thể xóa danh mục có danh mục con");
    error.statusCode = 400;
    throw error;
  }

  // Check if has courses
  const category = await Category.findById(categoryId);
  if (category) {
    const courseCount = await Course.countDocuments({ category: category.name });
    if (courseCount > 0) {
      const error = new Error(`Danh mục có ${courseCount} khóa học. Cần xóa hoặc chuyển khóa học trước.`);
      error.statusCode = 400;
      throw error;
    }
  }

  await Category.findByIdAndDelete(categoryId);
  await invalidateCategories();

  return { message: "Xóa danh mục thành công" };
}

/**
 * Lấy danh sách categories cho sidebar/public (flatten, không nested)
 */
async function getCategoriesForPublic() {
  return getPublicCategories(async () => {
    const categories = await Category.find({ isActive: true })
      .select("name slug icon image courseCount")
      .sort({ order: 1, name: 1 })
      .lean();

    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Course.countDocuments({
          category: cat.name,
          status: "published",
        });
        return { ...cat, courseCount: count };
      })
    );

    return categoriesWithCount;
  });
}

/**
 * Cập nhật course count cho tất cả categories
 */
async function recalculateCourseCounts() {
  const categories = await Category.find({});

  await Promise.all(
    categories.map(async (cat) => {
      const count = await Course.countDocuments({
        category: cat.name,
        status: "published",
      });
      cat.courseCount = count;
      await cat.save();
    })
  );

  return { message: "Đã cập nhật số lượng khóa học" };
}

export const categoryService = {
  createCategory,
  getAllCategories,
  getCategoryBySlug,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoriesForPublic,
  recalculateCourseCounts,
};
