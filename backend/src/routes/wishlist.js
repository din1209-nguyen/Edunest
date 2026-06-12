import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  checkWishlist,
  getWishlistIds,
  addWishlistSchema,
  paginationSchema,
} from "../controllers/wishlistController.js";

const router = Router();

// Tất cả routes đều cần đăng nhập
router.use(authMiddleware);

// Lấy wishlist của user
router.get(
  "/",
  validateRequest(paginationSchema, "query"),
  getWishlist
);

// Lấy danh sách course IDs trong wishlist
router.get("/ids", getWishlistIds);

// Kiểm tra wishlist status cho 1 course
router.get("/check/:courseId", checkWishlist);

// Thêm vào wishlist
router.post(
  "/",
  validateRequest(addWishlistSchema),
  addToWishlist
);

// Toggle wishlist
router.post("/toggle", toggleWishlist);

// Xóa khỏi wishlist
router.delete("/:courseId", removeFromWishlist);

export default router;
