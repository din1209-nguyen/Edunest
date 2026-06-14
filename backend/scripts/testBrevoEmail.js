import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const TEST_RECIPIENT = process.argv[2];

if (!TEST_RECIPIENT) {
  console.error("\n[ERROR] Ban can truyen email nhan de test.");
  console.error("Cach dung: node scripts/testBrevoEmail.js your-email@gmail.com\n");
  process.exit(1);
}

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || "smtp-relay.brevo.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
const smtpFrom = process.env.SMTP_FROM || `Edunest <${smtpUser}>`;

console.log("\n========== BREVO SMTP TEST (Edunest) ==========");
console.log(`Host:        ${smtpHost}`);
console.log(`Port:        ${smtpPort}`);
console.log(`Secure:      ${smtpSecure}`);
console.log(`User:        ${smtpUser}`);
console.log(`Pass length: ${smtpPass ? smtpPass.length : 0}`);
console.log(`From:        ${smtpFrom}`);
console.log(`Recipient:   ${TEST_RECIPIENT}`);
console.log("================================================\n");

if (!smtpUser || !smtpPass) {
  console.error("[ERROR] SMTP_USER hoac SMTP_PASS chua duoc set trong .env");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: { user: smtpUser, pass: smtpPass },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

const wrapTemplate = (content) => `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; }
    .body { padding: 32px 24px; }
    .body h2 { color: #1e293b; margin: 0 0 16px; }
    .body p { color: #475569; line-height: 1.6; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Edunest</h1></div>
    <div class="body">${content}</div>
    <div class="footer"><p>© ${new Date().getFullYear()} Edunest - He thong email test</p></div>
  </div>
</body>
</html>`;

async function run() {
  try {
    console.log("[1/2] Dang xac minh ket noi toi Brevo SMTP...");
    await transporter.verify();
    console.log("[OK] Ket noi thanh cong toi Brevo!\n");

    console.log("[2/2] Dang gui email test...");
    const html = wrapTemplate(`
      <h2>Brevo SMTP dang hoat dong 🎉</h2>
      <p>Day la email test tu <strong>Edunest</strong> (ban <code>Edunest/</code>).</p>
      <p>Neu ban nhan duoc email nay, nghia la cau hinh SMTP Brevo da thanh cong!</p>
      <p>Ban co the tiep tuc tich hop email xac minh, reset password, payment...</p>
    `);

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: TEST_RECIPIENT,
      subject: "[Edunest Test] Brevo SMTP hoat dong tot!",
      html,
      text: "Day la email test tu Edunest (ban Edunest/). Neu ban nhan duoc, SMTP Brevo da thanh cong!",
    });

    console.log("[OK] Email da duoc gui thanh cong!");
    console.log(`[INFO] Message ID: ${info.messageId}`);
    console.log(`[INFO] Vao Brevo Dashboard > Transactional > Logs de xem chi tiet.\n`);
    process.exit(0);
  } catch (error) {
    console.error("\n[FAIL] Loi khi gui email:");
    console.error(`  Message: ${error.message}`);
    if (error.code) console.error(`  Code:    ${error.code}`);
    if (error.response) console.error(`  Response: ${error.response}`);
    process.exit(1);
  }
}

run();
