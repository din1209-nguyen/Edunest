// Xử lý lỗi tập trung cho toàn bộ ứng dụng
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Lỗi server nội bộ";

  // Lỗi Mongoose validation
  if (err.name === "ValidationError") {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(", ");
  }

  // Lỗi Mongoose CastError (ObjectId không hợp lệ)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Giá trị '${err.value}' không hợp lệ cho trường '${err.path}'`;
  }

  // Lỗi trùng lặp MongoDB
  if (err.name === "MulterError") {
    statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File upload vuot qua dung luong cho phep"
        : err.message;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Giá trị '${err.keyValue[field]}' đã tồn tại cho trường '${field}'`;
  }

  // Lỗi JWT
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token không hợp lệ";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token đã hết hạn";
  }

  // Lỗi Zod
  if (err.name === "ZodError") {
    statusCode = 400;
    const errors = (err.errors || err.issues || []).map(
      (e) => `${e.path.join(".")}: ${e.message}`,
    );
    message = errors.join(", ");
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.code && typeof err.code === "string" && { code: err.code }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
