import {
  layChungChi,
  layTatCaChungChi,
  kiemTraChungChi,
} from "../services/certificateService.js";

async function getCertificate(req, res, next) {
  try {
    const chungChi = await layChungChi(req.user.userId, req.params.courseId);
    res.json({
      success: true,
      message: "Lấy chứng chỉ thành công",
      data: chungChi,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyCertificates(req, res, next) {
  try {
    const certificates = await layTatCaChungChi(req.user.userId);
    res.json({
      success: true,
      message: "Lấy danh sách chứng chỉ thành công",
      data: certificates,
    });
  } catch (error) {
    next(error);
  }
}

async function checkEligibility(req, res, next) {
  try {
    const result = await kiemTraChungChi(req.user.userId, req.params.courseId);
    res.json({
      success: true,
      message: "Kiểm tra chứng chỉ thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export { getCertificate, getMyCertificates, checkEligibility };
