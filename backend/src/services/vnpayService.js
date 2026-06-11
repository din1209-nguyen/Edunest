import crypto from "crypto";
import config from "../config/index.js";

function formatVNPayDate(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

function sortVNPayParams(params) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .reduce((sortedParams, key) => {
      sortedParams[key] = params[key];
      return sortedParams;
    }, {});
}

function buildSignData(params) {
  return Object.entries(sortVNPayParams(params))
    .map(([key, value]) => {
      const encodedValue = encodeURIComponent(String(value)).replace(/%20/g, "+");
      return `${key}=${encodedValue}`;
    })
    .join("&");
}

function createSecureHash(params, secret = config.vnpay.hashSecret) {
  return crypto
    .createHmac("sha512", secret)
    .update(buildSignData(params), "utf-8")
    .digest("hex");
}

function createVNPayUrl(amount, orderId, orderInfo, returnUrl, ipAddr = "127.0.0.1") {
  const vnp_TmnCode = config.vnpay.tmnCode;
  const vnp_HashSecret = config.vnpay.hashSecret;
  const vnp_Url = config.vnpay.url;

  if (!vnp_TmnCode || !vnp_HashSecret || !vnp_Url) {
    const err = new Error("VNPay chưa được cấu hình");
    err.statusCode = 503;
    throw err;
  }

  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode,
    vnp_CurrCode: "VND",
    vnp_Locale: "vn",
    vnp_OrderType: "250000",
    vnp_Amount: Math.round(amount) * 100,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_ReturnUrl: returnUrl,
    vnp_CreateDate: formatVNPayDate(),
    vnp_IpAddr: ipAddr || "127.0.0.1",
  };

  const sortedParams = sortVNPayParams(vnp_Params);
  const vnp_SecureHash = createSecureHash(sortedParams, vnp_HashSecret);
  const url = new URL(vnp_Url);

  Object.entries(sortedParams).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  url.searchParams.append("vnp_SecureHash", vnp_SecureHash);

  return url.toString();
}

function verifyVNPayReturn(query) {
  const { vnp_SecureHashType, vnp_SecureHash, ...rawParams } = query;

  if (!config.vnpay.hashSecret) {
    return { valid: false, message: "VNPay chưa được cấu hình" };
  }

  const vnp_Params = Object.keys(rawParams)
    .filter((key) => key.startsWith("vnp_"))
    .reduce((params, key) => {
      params[key] = rawParams[key];
      return params;
    }, {});

  const computedHash = createSecureHash(vnp_Params);
  if (!vnp_SecureHash || computedHash !== vnp_SecureHash) {
    return { valid: false, message: "Sai chữ ký VNPay" };
  }

  return {
    valid: true,
    code: vnp_Params.vnp_ResponseCode,
    transactionStatus: vnp_Params.vnp_TransactionStatus,
    transactionId: vnp_Params.vnp_TransactionNo,
    orderId: vnp_Params.vnp_TxnRef,
    amount: vnp_Params.vnp_Amount,
    message: vnp_Params.vnp_Message,
  };
}

export { createVNPayUrl, verifyVNPayReturn, createSecureHash };
