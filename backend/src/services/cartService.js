import {
  getUserCart,
  invalidateUserCart,
} from "./cacheService.js";
import Cart from "../models/Cart.js";

function getCoursePrice(course) {
  if (course.isFree) {
    return 0;
  }

  return course.discountPrice && course.discountPrice > 0
    ? course.discountPrice
    : course.price;
}

// Lấy giỏ hàng của người dùng
async function layGioHang(userId) {
  return getUserCart(userId, async () => {
    // Tìm giỏ hàng và populate thông tin khóa học
    let cart = await Cart.findOne({ user: userId }).populate({
      path: "items.course",
      select:
        "title slug thumbnail finalPrice price discountPrice isFree level category instructor totalStudents",
      populate: { path: "instructor", select: "name avatar" },
    });

    // Nếu không có giỏ hàng, trả về giỏ rỗng
    if (!cart) {
      cart = { items: [], _id: null };
    }

    // Lọc bỏ các items có khóa học bị xóa (null)
    const validItems = (cart.items || []).filter((item) => item.course !== null);

    // Cập nhật giỏ hàng nếu có items không hợp lệ
    if (cart._id && validItems.length !== (cart.items || []).length) {
      cart.items = validItems;
      await cart.save();
    }

    return {
      items: validItems,
      totalItems: validItems.length,
      totalPrice: validItems.reduce((sum, item) => {
        return sum + getCoursePrice(item.course);
      }, 0),
    };
  });
}

// Thêm khóa học vào giỏ hàng
async function themVaoGioHang(userId, courseId) {
  // Tìm hoặc tạo giỏ hàng mới
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // Kiểm tra khóa học đã có trong giỏ hàng chưa
  const alreadyInCart = cart.items.some(
    (item) => item.course.toString() === courseId.toString(),
  );

  if (alreadyInCart) {
    const err = new Error("Khóa học đã có trong giỏ hàng");
    err.statusCode = 409;
    throw err;
  }

  // Thêm khóa học vào giỏ hàng
  cart.items.push({ course: courseId });
  await cart.save();
  await invalidateUserCart(userId);

  return layGioHang(userId);
}

// Xóa khóa học khỏi giỏ hàng
async function xoaKhoiGioHang(userId, courseId) {
  // Tìm giỏ hàng của người dùng
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    const err = new Error("Giỏ hàng không tồn tại");
    err.statusCode = 404;
    throw err;
  }

  // Lọc bỏ khóa học cần xóa
  cart.items = cart.items.filter(
    (item) => item.course.toString() !== courseId.toString(),
  );
  await cart.save();
  await invalidateUserCart(userId);

  return layGioHang(userId);
}

// Xóa tất cả items trong giỏ hàng
async function xoaTatCa(userId) {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    return { items: [], totalItems: 0, totalPrice: 0 };
  }

  cart.items = [];
  await cart.save();
  await invalidateUserCart(userId);

  return { items: [], totalItems: 0, totalPrice: 0 };
}

export { layGioHang, themVaoGioHang, xoaKhoiGioHang, xoaTatCa };
