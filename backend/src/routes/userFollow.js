import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  followUser,
  getPopularUsers,
  popularUsersQuerySchema,
  unfollowUser,
} from "../controllers/userFollowController.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/popular",
  validateRequest(popularUsersQuerySchema, "query"),
  getPopularUsers,
);
router.post("/:userId/follow", followUser);
router.delete("/:userId/follow", unfollowUser);

export default router;
