import nodemailer from "nodemailer";
import crypto from "crypto";
import emailConfig from "../config/email.js";
import config from "../config/index.js";

let transporterPromise = null;

function appUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, config.cors.origin).toString();
}

function buildEmailVerificationUrl(token) {
  const verifyUrl = new URL(config.auth.emailVerificationPath, config.cors.origin);
  verifyUrl.searchParams.set("token", token);
  return verifyUrl.toString();
}

function buildPasswordResetUrl(token) {
  const resetUrl = new URL(config.auth.passwordResetPath, config.cors.origin);
  resetUrl.searchParams.set("token", token);
  return resetUrl.toString();
}

async function createTransporter() {
  const transportConfig = {
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    pool: emailConfig.smtp.pool,
    maxConnections: emailConfig.smtp.maxConnections,
    maxMessages: emailConfig.smtp.maxMessages,
    connectionTimeout: emailConfig.smtp.connectionTimeout,
    greetingTimeout: emailConfig.smtp.greetingTimeout,
    socketTimeout: emailConfig.smtp.socketTimeout,
  };

  if (emailConfig.provider === "gmail-oauth2") {
    transportConfig.auth = {
      type: "OAuth2",
      user: emailConfig.gmailOauth2.user,
      clientId: emailConfig.gmailOauth2.clientId,
      clientSecret: emailConfig.gmailOauth2.clientSecret,
      refreshToken: emailConfig.gmailOauth2.refreshToken,
    };
  } else {
    transportConfig.auth = {
      user: emailConfig.smtp.user,
      pass: emailConfig.smtp.pass,
    };
  }

  const transporter = nodemailer.createTransport(transportConfig);
  await transporter.verify();
  return transporter;
}

async function getTransporter() {
  if (!emailConfig.enabled) return null;
  if (emailConfig.provider === "brevo-api") return null;

  if (!transporterPromise) {
    transporterPromise = createTransporter().catch((error) => {
      transporterPromise = null;
      throw error;
    });
  }

  return transporterPromise;
}

function parseEmailAddress(value) {
  const match = String(value || "").match(/^\s*(?:"?([^"<]*)"?)?\s*<([^>]+)>\s*$/);
  if (match) {
    return {
      name: match[1]?.trim() || undefined,
      email: match[2].trim(),
    };
  }

  return {
    email: String(value || "").trim(),
  };
}

async function sendWithBrevoApi({ to, subject, html, text }) {
  const sender = parseEmailAddress(emailConfig.from);
  const recipients = String(to)
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => ({ email }));

  const response = await fetch(emailConfig.brevoApi.endpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": emailConfig.brevoApi.apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender,
      to: recipients,
      subject,
      htmlContent: html,
      ...(text ? { textContent: text } : {}),
    }),
  });

  const responseText = await response.text();
  let payload = null;

  try {
    payload = responseText ? JSON.parse(responseText) : null;
  } catch {
    payload = responseText;
  }

  if (!response.ok) {
    const errorMessage =
      payload?.message || payload?.error || responseText || `Brevo API request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.statusCode = response.status;
    error.response = payload;
    throw error;
  }

  return payload || { messageId: "brevo-api-sent" };
}

async function sendEmail({ to, subject, html, text }) {
    if (process.env.NODE_ENV === "test") {
      return { messageId: "test-email-disabled" };
    }

    if (!emailConfig.enabled) {
      const disabledError = new Error(
        emailConfig.provider === "gmail-oauth2"
          ? "Email provider chưa sẵn sàng do thiếu GOOGLE_MAIL_* credentials"
          : emailConfig.provider === "brevo-api"
            ? "Email provider chưa sẵn sàng do thiếu BREVO_API_KEY"
            : "Email provider chưa sẵn sàng do thiếu SMTP_USER hoặc SMTP_PASS",
      );
      disabledError.statusCode = 503;
      throw disabledError;
    }

  try {
    if (emailConfig.provider === "brevo-api") {
      return sendWithBrevoApi({ to, subject, html, text });
    }

    const transport = await getTransporter();
    const result = await transport.sendMail({
      from: emailConfig.from,
      to,
      subject,
      html,
      text,
    });
    return result;
  } catch (error) {
    console.error("[Email] Send failed:", {
      message: error.message,
      to,
      subject,
      provider: emailConfig.provider,
    });
    throw error;
  }
}

function wrapTemplate(content) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Be Vietnam Pro', 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px 24px; }
    .body h2 { color: #1e293b; margin: 0 0 16px; font-size: 20px; }
    .body p { color: #475569; line-height: 1.6; margin: 0 0 16px; }
    .highlight { background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .highlight strong { color: #2563eb; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px 4px; }
    .btn-outline { display: inline-block; background: transparent; color: #2563eb; padding: 12px 24px; border-radius: 8px; border: 2px solid #2563eb; text-decoration: none; font-weight: 600; margin: 8px 4px; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
    .cert-box { border: 2px solid #2563eb; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0; background: #f8fafc; }
    .cert-id { font-family: monospace; color: #2563eb; font-size: 16px; font-weight: 700; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Edunest</h1>
      <p>Nền tảng học tiếng Anh trực tuyến</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Edunest. Tất cả quyền được bảo lưu.</p>
      <p>Email này được gửi tự động. Vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>`;
}

function welcomeTemplate({ name, email }) {
  return wrapTemplate(`
    <h2>Xin chào, ${name}! 👋</h2>
    <p>Chào mừng bạn đến với <strong>Edunest</strong> — nền tảng học tiếng Anh trực tuyến hàng đầu Việt Nam.</p>
    <div class="highlight">
      <p style="margin:0"><strong>Tài khoản của bạn:</strong></p>
      <p style="margin:4px 0 0">📧 Email: ${email}</p>
      <p style="margin:4px 0 0">🎯 Vai trò: Học viên</p>
    </div>
    <p>Bạn có thể bắt đầu hành trình học tiếng Anh ngay hôm nay bằng cách:</p>
    <div style="text-align:center">
      <a href="${appUrl("/courses")}" class="btn">Khám phá khóa học</a>
    </div>
    <hr class="divider" />
    <p style="font-size:13px; color:#94a3b8">Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi.</p>
  `);
}

function emailVerificationTemplate({ name, verificationUrl }) {
  return wrapTemplate(`
    <h2>Xác minh email của bạn</h2>
    <p>Xin chào <strong>${name}</strong>, cảm ơn bạn đã đăng ký tài khoản tại Edunest.</p>
    <p>Vui lòng xác minh địa chỉ email để kích hoạt tài khoản và đăng nhập ổn định sau này.</p>
    <div style="text-align:center">
      <a href="${verificationUrl}" class="btn">Xác minh email</a>
    </div>
    <div class="highlight">
      <p style="margin:0"><strong>Liên kết xác minh:</strong></p>
      <p style="margin:8px 0 0; word-break: break-all;">${verificationUrl}</p>
    </div>
    <p>Liên kết này sẽ hết hạn sau 24 giờ. Nếu bạn chưa xác minh kịp, hãy yêu cầu gửi lại email xác minh.</p>
  `);
}

function passwordResetTemplate({ name, resetUrl }) {
  return wrapTemplate(`
    <h2>Đặt lại mật khẩu</h2>
    <p>Xin chào <strong>${name}</strong>, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Edunest của bạn.</p>
    <p>Nếu đúng là bạn yêu cầu, hãy dùng liên kết bên dưới để tạo mật khẩu mới.</p>
    <div style="text-align:center">
      <a href="${resetUrl}" class="btn">Đặt lại mật khẩu</a>
    </div>
    <div class="highlight">
      <p style="margin:0"><strong>Liên kết đặt lại mật khẩu:</strong></p>
      <p style="margin:8px 0 0; word-break: break-all;">${resetUrl}</p>
    </div>
    <p>Liên kết này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
  `);
}

function paymentTemplate({ studentName, courseName, amount, transactionId, date }) {
  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);

  return wrapTemplate(`
    <h2>Thanh toán thành công! 🎉</h2>
    <p>Xin chào <strong>${studentName}</strong>,</p>
    <p>Chúng tôi đã nhận được thanh toán của bạn cho khóa học <strong>${courseName}</strong>.</p>
    <div class="highlight">
      <p style="margin:0"><strong>Chi tiết giao dịch:</strong></p>
      <p style="margin:4px 0 0">📚 Khóa học: ${courseName}</p>
      <p style="margin:4px 0 0">💰 Số tiền: <strong style="color:#2563eb">${formattedAmount}</strong></p>
      <p style="margin:4px 0 0">🔖 Mã giao dịch: ${transactionId}</p>
      <p style="margin:4px 0 0">📅 Ngày: ${date}</p>
    </div>
    <p>Bạn có thể bắt đầu học ngay bây giờ!</p>
    <div style="text-align:center">
      <a href="${appUrl("/student/my-courses")}" class="btn">Xem khóa học của tôi</a>
    </div>
  `);
}

function certificateTemplate({ studentName, courseName, certificateId, date, instructorName }) {
  return wrapTemplate(`
    <h2>Chúc mừng bạn! 🎓</h2>
    <p>Xin chúc mừng <strong>${studentName}</strong> — bạn đã hoàn thành xuất sắc khóa học <strong>${courseName}</strong>!</p>
    <div class="cert-box">
      <p style="color:#64748b; font-size:12px; margin:0 0 8px; text-transform:uppercase; letter-spacing:1px">Chứng chỉ hoàn thành</p>
      <p style="font-size:18px; font-weight:700; color:#1e293b; margin:0 0 8px">${courseName}</p>
      <p style="color:#64748b; font-size:13px; margin:0 0 16px">Giảng viên: ${instructorName || "Edunest"}</p>
      <p class="cert-id">${certificateId}</p>
      <p style="color:#64748b; font-size:12px; margin:8px 0 0">Ngày cấp: ${date}</p>
    </div>
    <p>Bạn có thể xem và tải chứng chỉ của mình bất kỳ lúc nào.</p>
    <div style="text-align:center">
      <a href="${appUrl("/student/certificates")}" class="btn">Xem chứng chỉ</a>
    </div>
  `);
}

function courseApprovedTemplate({ teacherName, courseName }) {
  return wrapTemplate(`
    <h2>Khóa học đã được duyệt! ✅</h2>
    <p>Xin chào <strong>${teacherName}</strong>,</p>
    <p>Chúng tôi vui mừng thông báo rằng khóa học <strong>${courseName}</strong> của bạn đã được duyệt và xuất bản thành công trên Edunest.</p>
    <div style="text-align:center">
      <a href="${appUrl("/teacher/dashboard")}" class="btn">Xem Dashboard</a>
      <a href="${appUrl("/courses")}" class="btn-outline">Xem khóa học</a>
    </div>
  `);
}

export function generateEmailVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function sendWelcomeEmail(user) {
  return sendEmail({
    to: user.email,
    subject: "Chào mừng đến với Edunest! 🎓",
    html: welcomeTemplate({ name: user.name, email: user.email }),
  });
}

export async function sendEmailVerificationEmail(user, token) {
  const verificationUrl = buildEmailVerificationUrl(token);

  return sendEmail({
    to: user.email,
    subject: "Xác minh email tài khoản Edunest",
    html: emailVerificationTemplate({
      name: user.name,
      verificationUrl,
    }),
    text: `Xin chào ${user.name}, vui lòng xác minh email của bạn tại: ${verificationUrl}`,
  });
}

export async function sendPasswordResetEmail(user, token) {
  const resetUrl = buildPasswordResetUrl(token);

  return sendEmail({
    to: user.email,
    subject: "Đặt lại mật khẩu tài khoản Edunest",
    html: passwordResetTemplate({
      name: user.name,
      resetUrl,
    }),
    text: `Xin chào ${user.name}, đặt lại mật khẩu của bạn tại: ${resetUrl}`,
  });
}

export async function sendPaymentConfirmationEmail({ student, course, payment }) {
  return sendEmail({
    to: student.email,
    subject: `Thanh toán thành công cho khóa học ${course.title} 💳`,
    html: paymentTemplate({
      studentName: student.name,
      courseName: course.title,
      amount: payment.amount,
      transactionId: payment.transactionId || payment._id,
      date: new Date(payment.createdAt || Date.now()).toLocaleDateString("vi-VN"),
    }),
  });
}

export async function sendCertificateEmail({ student, course, certificate, instructor }) {
  return sendEmail({
    to: student.email,
    subject: `Chúc mừng bạn đã hoàn thành khóa học ${course.title}! 🎓`,
    html: certificateTemplate({
      studentName: student.name,
      courseName: course.title,
      certificateId: certificate.certificateId,
      date: new Date(certificate.issuedAt).toLocaleDateString("vi-VN"),
      instructorName: instructor?.name,
    }),
  });
}

export async function sendCourseApprovedEmail({ teacher, course }) {
  return sendEmail({
    to: teacher.email,
    subject: `Khóa học "${course.title}" đã được duyệt! ✅`,
    html: courseApprovedTemplate({ teacherName: teacher.name, courseName: course.title }),
  });
}
