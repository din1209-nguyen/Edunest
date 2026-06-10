import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const provider = process.env.EMAIL_PROVIDER || "smtp";
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
const smtpPoolMaxConnections = parseInt(process.env.SMTP_POOL_MAX_CONNECTIONS || "5", 10);
const smtpPoolMaxMessages = parseInt(process.env.SMTP_POOL_MAX_MESSAGES || "100", 10);
const smtpConnectionTimeout = parseInt(process.env.SMTP_CONNECTION_TIMEOUT_MS || "10000", 10);
const smtpGreetingTimeout = parseInt(process.env.SMTP_GREETING_TIMEOUT_MS || "10000", 10);
const smtpSocketTimeout = parseInt(process.env.SMTP_SOCKET_TIMEOUT_MS || "20000", 10);

const gmailOauth2Ready = Boolean(
  process.env.GOOGLE_MAIL_CLIENT_ID &&
    process.env.GOOGLE_MAIL_CLIENT_SECRET &&
    process.env.GOOGLE_MAIL_REFRESH_TOKEN &&
    process.env.GOOGLE_MAIL_USER,
);

const smtpPasswordReady = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const emailConfig = {
  provider,
  from: process.env.SMTP_FROM || "Edunest <noreply@edunest.local>",
  enabled:
    provider === "gmail-oauth2"
      ? gmailOauth2Ready
      : smtpPasswordReady,
  mode:
    provider === "gmail-oauth2"
      ? gmailOauth2Ready
        ? "gmail-oauth2"
        : "disabled"
      : smtpPasswordReady
        ? "smtp"
        : "disabled",
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: smtpPort,
    secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    pool: process.env.SMTP_POOL !== "false",
    maxConnections: smtpPoolMaxConnections,
    maxMessages: smtpPoolMaxMessages,
    connectionTimeout: smtpConnectionTimeout,
    greetingTimeout: smtpGreetingTimeout,
    socketTimeout: smtpSocketTimeout,
  },
  gmailOauth2: {
    user: process.env.GOOGLE_MAIL_USER,
    clientId: process.env.GOOGLE_MAIL_CLIENT_ID,
    clientSecret: process.env.GOOGLE_MAIL_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_MAIL_REFRESH_TOKEN,
  },
};

export default emailConfig;
