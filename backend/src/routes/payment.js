import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  createPayment,
  createVNPayPayment,
  vnpayReturn,
  mockSuccess,
  getPaymentHistory,
} from "../controllers/paymentController.js";
import { paginationSchema } from "../utils/studentValidation.js";

const router = Router();

router.post(
  "/create",
  authMiddleware,
  roleMiddleware("user", "admin"),
  createPayment,
);

router.post(
  "/vnpay/create",
  authMiddleware,
  roleMiddleware("user", "admin"),
  createVNPayPayment,
);

router.get("/vnpay/return", vnpayReturn);

router.post(
  "/mock-success",
  authMiddleware,
  roleMiddleware("user", "admin"),
  mockSuccess,
);

router.get(
  "/history",
  authMiddleware,
  validateRequest(paginationSchema, "query"),
  getPaymentHistory,
);

export default router;
