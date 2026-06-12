import mongoose from "mongoose";
import User from "../models/User.js";
import UserFollow from "../models/UserFollow.js";

function ensureObjectId(value, message = "ID người dùng không hợp lệ") {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }

  return new mongoose.Types.ObjectId(value);
}

async function getPopularUsers(viewerId, { limit = 5 } = {}) {
  const viewerObjectId = viewerId && mongoose.Types.ObjectId.isValid(viewerId)
    ? new mongoose.Types.ObjectId(viewerId)
    : null;

  const users = await User.aggregate([
    {
      $match: {
        isActive: true,
        ...(viewerObjectId ? { _id: { $ne: viewerObjectId } } : {}),
      },
    },
    {
      $lookup: {
        from: "userfollows",
        localField: "_id",
        foreignField: "following",
        as: "followers",
      },
    },
    {
      $lookup: {
        from: "enrollments",
        localField: "_id",
        foreignField: "student",
        as: "enrollments",
      },
    },
    {
      $addFields: {
        followersCount: { $size: "$followers" },
        learningCount: { $size: "$enrollments" },
        isFollowing: viewerObjectId
          ? {
              $in: [
                viewerObjectId,
                {
                  $map: {
                    input: "$followers",
                    as: "follow",
                    in: "$$follow.follower",
                  },
                },
              ],
            }
          : false,
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        avatar: 1,
        bio: 1,
        followersCount: 1,
        learningCount: 1,
        isFollowing: 1,
        createdAt: 1,
      },
    },
    { $sort: { followersCount: -1, learningCount: -1, createdAt: -1 } },
    { $limit: Number(limit) },
  ]);

  return users;
}

async function followUser(followerId, followingId) {
  const follower = ensureObjectId(followerId);
  const following = ensureObjectId(followingId);

  if (follower.equals(following)) {
    const error = new Error("Bạn không thể theo dõi chính mình");
    error.statusCode = 400;
    throw error;
  }

  const targetUser = await User.findOne({ _id: following, isActive: true }).select("_id");
  if (!targetUser) {
    const error = new Error("Không tìm thấy người dùng cần theo dõi");
    error.statusCode = 404;
    throw error;
  }

  await UserFollow.updateOne(
    { follower, following },
    { $setOnInsert: { follower, following } },
    { upsert: true },
  );

  const followersCount = await UserFollow.countDocuments({ following });
  return { userId: followingId, isFollowing: true, followersCount };
}

async function unfollowUser(followerId, followingId) {
  const follower = ensureObjectId(followerId);
  const following = ensureObjectId(followingId);

  await UserFollow.deleteOne({ follower, following });

  const followersCount = await UserFollow.countDocuments({ following });
  return { userId: followingId, isFollowing: false, followersCount };
}

export const userFollowService = {
  followUser,
  getPopularUsers,
  unfollowUser,
};
