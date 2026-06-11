import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategoriesAdmin,
  createCategorySchema,
  updateCategorySchema,
} from "../controllers/categoryController.js";

const router = Router();

router.get(
  "/admin/all",
  authMiddleware,
  roleMiddleware("admin"),
  getAllCategoriesAdmin,
);

router.post(
  "/admin",
  authMiddleware,
  roleMiddleware("admin"),
  validateRequest(createCategorySchema),
  createCategory,
);

router.patch(
  "/admin/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validateRequest(updateCategorySchema),
  updateCategory,
);

router.delete(
  "/admin/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteCategory,
);

router.get("/", getCategories);
router.get("/:slug", getCategoryBySlug);

export default router;
