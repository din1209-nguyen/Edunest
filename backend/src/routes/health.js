import { Router } from "express";

const router = Router();

// Health check endpoint - kiểm tra server đang chạy
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server đang hoạt động tốt",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
