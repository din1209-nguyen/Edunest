import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";
import config from "./config/index.js";
import connectDB from "./config/database.js";
import errorHandler from "./middlewares/errorHandler.js";
import notFound from "./middlewares/notFound.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import teacherRouter from "./routes/teacher.js";
import publicRouter from "./routes/public.js";
import cartRouter from "./routes/cart.js";
import enrollmentRouter from "./routes/enrollment.js";
import noteRouter from "./routes/note.js";
import exerciseRouter from "./routes/exercise.js";
import paymentRouter from "./routes/payment.js";
import adminRouter from "./routes/admin.js";
import certificateRouter from "./routes/certificate.js";
import recommendRouter from "./routes/recommend.js";
import aiRouter from "./routes/ai.js";
import reviewRouter from "./routes/review.js";
import wishlistRouter from "./routes/wishlist.js";
import categoryRouter from "./routes/category.js";
import searchRouter from "./routes/search.js";
import userFollowRouter from "./routes/userFollow.js";
import { swaggerSpec } from "./swagger.js";
import { setupSocket } from "./services/socketService.js";

const app = express();

function logRuntimeConfig() {
  console.log("[config] Runtime URLs and auth cookie mode:");
  console.log(`[config] FRONTEND_URL/CORS origin: ${config.cors.origin}`);
  console.log(`[config] GOOGLE_CALLBACK_URL: ${config.google.callbackUrl}`);
  console.log(`[config] AUTH_COOKIE_SECURE: ${config.auth.secureCookies}`);
  console.log(`[config] AUTH_COOKIE_SAME_SITE: ${config.auth.sameSite}`);
  console.log(`[config] AUTH_COOKIE_DOMAIN: ${config.auth.cookieDomain || "(unset)"}`);
}

app.set("etag", false);

app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(cookieParser());

app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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
  res.setHeader('Content-Type', 'application/json');
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
app.use("/api/users", userFollowRouter);

app.use(notFound);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    // Create HTTP server + Socket.io
    const httpServer = http.createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
      },
      path: '/socket.io',
    });

    // Setup Socket.io handlers
    setupSocket(io);

    // Lưu io vào global để có thể emit từ services
    global._io = io;

    httpServer.listen(config.port, () => {
      console.log(`Server chạy tại http://localhost:${config.port}`);
      console.log(`Socket.io chạy tại http://localhost:${config.port}`);
      console.log(`Môi trường: ${config.nodeEnv}`);
      console.log(`Swagger API docs: http://localhost:${config.port}/api-docs`);
      logRuntimeConfig();
    });
  } catch (error) {
    console.error("Không thể khởi động server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
