import { z } from "zod";
import { userFollowService } from "../services/userFollowService.js";

export const popularUsersQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(10).default(5),
});

async function getPopularUsers(req, res, next) {
  try {
    const viewerId = req.user.userId;
    const { limit } = req.validatedQuery;
    const users = await userFollowService.getPopularUsers(viewerId, { limit });

    res.json({
      success: true,
      message: "Lấy xếp hạng người dùng thành công",
      data: { users },
    });
  } catch (error) {
    next(error);
  }
}

async function followUser(req, res, next) {
  try {
    const result = await userFollowService.followUser(req.user.userId, req.params.userId);

    res.status(201).json({
      success: true,
      message: "Đã theo dõi người dùng",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function unfollowUser(req, res, next) {
  try {
    const result = await userFollowService.unfollowUser(req.user.userId, req.params.userId);

    res.json({
      success: true,
      message: "Đã bỏ theo dõi người dùng",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export { followUser, getPopularUsers, unfollowUser };
