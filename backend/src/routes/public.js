import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import {
  getCourses,
  getCourseBySlug,
  getCourseById,
} from "../controllers/studentController.js";
import { paginationSchema } from "../utils/studentValidation.js";

const router = Router();

function validateQuery(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const error = new Error(
        parsed.error.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
      );
      error.statusCode = 400;
      return next(error);
    }
    req.validatedQuery = parsed.data;
    next();
  };
}

// Public routes - không cần đăng nhập
router.get("/courses", validateQuery(paginationSchema), getCourses);
router.get("/courses/slug/:slug", getCourseBySlug);
router.get("/courses/:id", getCourseById);

export default router;
