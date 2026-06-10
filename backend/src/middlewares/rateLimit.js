import { getRedis } from "../services/cacheService.js";

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

function buildRateLimitKey(keyPrefix, keyPart) {
  return `${keyPrefix || "rate-limit"}:${keyPart || "anonymous"}`;
}

async function incrementRedisWindow(key, windowMs) {
  const client = getRedis();
  if (!client) {
    return null;
  }

  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const count = await client.incr(key);

  if (count === 1) {
    await client.expire(key, ttlSeconds);
    return { count, retryAfterSeconds: ttlSeconds };
  }

  const ttl = await client.ttl(key);
  return {
    count,
    retryAfterSeconds: ttl > 0 ? ttl : ttlSeconds,
  };
}

export function createRateLimit({
  windowMs,
  max,
  keyPrefix,
  message,
  resolveKey,
}) {
  if (!windowMs || !max) {
    throw new Error("windowMs và max là bắt buộc cho rate limit");
  }

  return async function rateLimitMiddleware(req, res, next) {
    const keyPart = resolveKey ? resolveKey(req) : getClientIp(req);
    const key = buildRateLimitKey(keyPrefix, keyPart);

    try {
      const result = await incrementRedisWindow(key, windowMs);

      if (!result) {
        return next();
      }

      if (result.count > max) {
        res.set("Retry-After", String(result.retryAfterSeconds));
        return res.status(429).json({
          success: false,
          message,
          code: "RATE_LIMITED",
        });
      }

      return next();
    } catch (error) {
      console.warn(`[RateLimit] Redis unavailable for ${keyPrefix || "rate-limit"}:`, error.message);
      return next();
    }
  };
}
