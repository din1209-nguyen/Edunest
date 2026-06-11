import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getCart);
router.post("/items", roleMiddleware("user"), addToCart);
router.delete("/items/:courseId", roleMiddleware("user"), removeFromCart);
router.delete("/clear", roleMiddleware("user"), clearCart);

export default router;
