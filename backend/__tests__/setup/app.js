import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { Server } from "socket.io";
import config from "../../src/config/index.js";
import errorHandler from "../../src/middlewares/errorHandler.js";
import notFound from "../../src/middlewares/notFound.js";
import healthRouter from "../../src/routes/health.js";
import authRouter from "../../src/routes/auth.js";
import teacherRouter from "../../src/routes/teacher.js";
import publicRouter from "../../src/routes/public.js";
import cartRouter from "../../src/routes/cart.js";
import enrollmentRouter from "../../src/routes/enrollment.js";
import noteRouter from "../../src/routes/note.js";
import exerciseRouter from "../../src/routes/exercise.js";
import paymentRouter from "../../src/routes/payment.js";
import adminRouter from "../../src/routes/admin.js";
import certificateRouter from "../../src/routes/certificate.js";
import recommendRouter from "../../src/routes/recommend.js";
import aiRouter from "../../src/routes/ai.js";
import reviewRouter from "../../src/routes/review.js";
import wishlistRouter from "../../src/routes/wishlist.js";
import categoryRouter from "../../src/routes/category.js";
import searchRouter from "../../src/routes/search.js";
import { swaggerSpec } from "../../src/swagger.js";
import { setupSocket } from "../../src/services/socketService.js";

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use("/api", healthRouter);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Edunest API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
    },
  }));
  app.use("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
  app.use("/api/auth", authRouter);
  app.use("/api", publicRouter);
  app.use("/api/categories", categoryRouter);
  app.use("/api/search", searchRouter);
  app.use("/api", recommendRouter);
  app.use("/api", reviewRouter);
  app.use("/api/teacher", teacherRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/enrollments", enrollmentRouter);
  app.use("/api/payments", paymentRouter);
  app.use("/api", noteRouter);
  app.use("/api/exercises", exerciseRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/certificates", certificateRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/wishlist", wishlistRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export function createTestApp() {
  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
    path: "/socket.io",
  });

  setupSocket(io);
  global._io = io;

  return { app, io, server };
}

export default createApp;
