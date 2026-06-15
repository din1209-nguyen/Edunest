import { Router } from "express";
import { healthCheck as redisHealthCheck } from "../services/cacheService.js";

const router = Router();

// Health check endpoint - kiểm tra server đang chạy
router.get("/health", async (req, res) => {
  const redis = await redisHealthCheck();

  res.status(200).json({
    success: true,
    message: "Server đang hoạt động tốt",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      redis,
    },
  });
});

export default router;
