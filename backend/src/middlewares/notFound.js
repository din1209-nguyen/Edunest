// Xử lý request đến route không tồn tại
const notFound = (req, res, next) => {
  const error = new Error(`Không tìm thấy: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export default notFound;
