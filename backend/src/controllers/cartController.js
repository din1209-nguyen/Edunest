import {
  layGioHang,
  themVaoGioHang,
  xoaKhoiGioHang,
  xoaTatCa,
} from "../services/cartService.js";

async function getCart(req, res, next) {
  try {
    const cart = await layGioHang(req.user.userId);
    res.json({
      success: true,
      message: "Lấy giỏ hàng thành công",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
}

async function addToCart(req, res, next) {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      const err = new Error("courseId là bắt buộc");
      err.statusCode = 400;
      return next(err);
    }

    const cart = await themVaoGioHang(req.user.userId, courseId);
    res.status(201).json({
      success: true,
      message: "Thêm vào giỏ hàng thành công",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
}

async function removeFromCart(req, res, next) {
  try {
    const cart = await xoaKhoiGioHang(req.user.userId, req.params.courseId);
    res.json({
      success: true,
      message: "Xóa khỏi giỏ hàng thành công",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
}

async function clearCart(req, res, next) {
  try {
    const cart = await xoaTatCa(req.user.userId);
    res.json({
      success: true,
      message: "Xóa giỏ hàng thành công",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
}

export { getCart, addToCart, removeFromCart, clearCart };
