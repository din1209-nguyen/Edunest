import { Router } from "express";
import {
  searchCourses,
  getSuggestions,
  getTrending,
  getNewest,
  getTopRated,
  getFreeCourses,
  getRelated,
  getStats,
  searchQuerySchema,
} from "../controllers/searchController.js";
import { validateRequest } from "../middlewares/validateRequest.js";

const router = Router();

// Tìm kiếm khóa học
router.get("/", validateRequest(searchQuerySchema, "query"), searchCourses);

// Gợi ý tìm kiếm (autocomplete)
router.get("/suggestions", getSuggestions);

// Thống kê cho filters
router.get("/stats", getStats);

// Khóa học trending
router.get("/trending", getTrending);

// Khóa học mới nhất
router.get("/newest", getNewest);

// Khóa học được đánh giá cao
router.get("/top-rated", getTopRated);

// Khóa học miễn phí
router.get("/free", getFreeCourses);

// Khóa học liên quan
router.get("/related/:courseId", getRelated);

export default router;
