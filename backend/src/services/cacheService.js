/**
 * Redis Cache Service — Performance optimization for Edunest
 *
 * Caching strategy:
 * - Public recommendations: TTL 5 minutes (hot data, many reads)
 * - User-specific recommendations: TTL 10 minutes (personalized)
 * - Search results: TTL 2 minutes (fresh results)
 * - Suggestions/autocomplete: TTL 10 minutes (stable data)
 * - Trending/New/Top: TTL 5 minutes (updated frequently)
 *
 * Cache invalidation:
 * - Course published/updated → invalidate trending, top, featured caches
 * - Review added → invalidate rating-related caches
 * - New enrollment → invalidate teacher stats caches
 */

import Redis from 'ioredis';

let redisClient = null;
let redisConnectionPromise = null;
let isRedisConnected = false;
let redisDisabledUntil = 0;
let lastRedisLogKey = "";
let lastRedisLogAt = 0;

const isTestEnvironment = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
const REDIS_CONNECT_COOLDOWN_MS = parseInt(process.env.REDIS_CONNECT_COOLDOWN_MS || "30000", 10);
const REDIS_MAX_RECONNECT_ATTEMPTS = parseInt(process.env.REDIS_MAX_RECONNECT_ATTEMPTS || "5", 10);
const REDIS_LOG_THROTTLE_MS = parseInt(process.env.REDIS_LOG_THROTTLE_MS || "60000", 10);

function shouldLogRedisWarning() {
  return !isTestEnvironment;
}

function shouldUseRedisTls(protocol) {
  return protocol === "rediss:" || process.env.REDIS_TLS === "true";
}

function parseRedisUrl() {
  const rawUrl = process.env.REDIS_URL?.trim();

  if (!rawUrl) {
    return {
      enabled: false,
      reason: "REDIS_URL not configured",
    };
  }

  try {
    const url = new URL(rawUrl);
    return {
      enabled: true,
      url: rawUrl,
      protocol: url.protocol.replace(":", ""),
      host: url.hostname,
      port: url.port || (shouldUseRedisTls(url.protocol) ? "6380" : "6379"),
      tls: shouldUseRedisTls(url.protocol),
    };
  } catch {
    return {
      enabled: false,
      reason: "REDIS_URL is invalid",
    };
  }
}

function getRedisRuntimeInfo() {
  const parsed = parseRedisUrl();

  if (!parsed.enabled) {
    return parsed;
  }

  return {
    enabled: true,
    protocol: parsed.protocol,
    host: parsed.host,
    port: parsed.port,
    tls: parsed.tls,
    status: redisClient?.status || "not-created",
    available: isRedisConnected,
    coolingDown: Date.now() < redisDisabledUntil,
  };
}

function markRedisUnavailable(message) {
  isRedisConnected = false;
  redisDisabledUntil = Date.now() + REDIS_CONNECT_COOLDOWN_MS;

  if (!shouldLogRedisWarning()) {
    return;
  }

  const now = Date.now();
  if (message === lastRedisLogKey && now - lastRedisLogAt < REDIS_LOG_THROTTLE_MS) {
    return;
  }

  console.warn(message);
  lastRedisLogKey = message;
  lastRedisLogAt = now;
}

// ─── Redis Client Setup ────────────────────────────────────────────────────────

// Khởi tạo Redis client với chế độ kết nối trì hoãn để không chặn luồng xử lý
function createRedisClient(redisConfig) {
  const redisOptions = {
    maxRetriesPerRequest: 1,
    retryDelayOnFailover: 100,
    lazyConnect: true,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > REDIS_MAX_RECONNECT_ATTEMPTS) {
        markRedisUnavailable("[Redis] Reconnect attempts exhausted; cache is temporarily disabled");
        return null;
      }

      return Math.min(times * 500, 5000);
    },
  };

  if (redisConfig.tls) {
    redisOptions.tls = {};
  }

  const client = new Redis(redisConfig.url, redisOptions);

  client.on('connect', () => {
    if (shouldLogRedisWarning() && lastRedisLogKey !== "connect") {
      console.log('[Redis] Socket connected; waiting for ready state');
      lastRedisLogKey = "connect";
      lastRedisLogAt = Date.now();
    }
  });

  client.on('ready', () => {
    if (shouldLogRedisWarning() && lastRedisLogKey !== "ready") {
      console.log('[Redis] Ready');
      lastRedisLogKey = "ready";
      lastRedisLogAt = Date.now();
    }

    isRedisConnected = true;
    redisDisabledUntil = 0;
  });

  client.on('error', (err) => {
    markRedisUnavailable(`[Redis] Connection unavailable: ${err.message}`);
  });

  client.on('close', () => {
    markRedisUnavailable('[Redis] Connection closed; cache is temporarily disabled');
  });

  return client;
}

/**
 * Lazy-init Redis — only connect if REDIS_URL is configured
 */
// Lấy Redis client khả dụng và bỏ qua cache nếu kết nối chưa sẵn sàng
function getRedis() {
  if (isTestEnvironment) {
    return null;
  }

  const redisConfig = parseRedisUrl();

  if (!redisConfig.enabled) {
    return null;
  }

  if (Date.now() < redisDisabledUntil) {
    return null;
  }

  if (!redisClient) {
    redisClient = createRedisClient(redisConfig);
  }

  if (isRedisConnected) {
    return redisClient;
  }

  if (redisClient.status === "end") {
    redisClient.removeAllListeners();
    redisClient = createRedisClient(redisConfig);
  }

  const canStartConnection = ["wait", "end", "close"].includes(redisClient.status);

  if (!redisConnectionPromise && canStartConnection) {
    redisConnectionPromise = redisClient.connect()
      .catch(() => {
        markRedisUnavailable('[Redis] Skipping cache because Redis is unavailable');
        return null;
      })
      .finally(() => {
        redisConnectionPromise = null;
      });
  }

  return isRedisConnected ? redisClient : null;
}

// ─── Generic Cache Helpers ──────────────────────────────────────────────────────

/**
 * Get cached data, fallback to fetchFn if miss
 */
// Đọc dữ liệu từ cache trước rồi mới fallback sang nguồn gốc khi cache miss
async function cacheGetOrSet(key, fetchFn, ttlSeconds) {
  const client = getRedis();
  if (!client) {
    return fetchFn();
  }

  try {
    const cachedValue = await client.get(key);
    if (cachedValue) {
      return JSON.parse(cachedValue);
    }
  } catch (err) {
    if (isRedisConnected && shouldLogRedisWarning()) {
      console.warn('[Redis] GET failed:', err.message);
    }
  }

  const freshData = await fetchFn();

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(freshData));
  } catch (err) {
    if (isRedisConnected && shouldLogRedisWarning()) {
      console.warn('[Redis] SET failed:', err.message);
    }
  }

  return freshData;
}

/**
 * Invalidate cache by key pattern
 */
// Xóa các key cache khớp pattern để đồng bộ dữ liệu sau khi thay đổi nghiệp vụ
async function cacheInvalidate(pattern) {
  const client = getRedis();
  if (!client) return;

  try {
    const matchingKeys = await client.keys(pattern);
    if (matchingKeys.length > 0) {
      await client.del(...matchingKeys);
      console.log(`[Redis] Invalidated ${matchingKeys.length} keys matching: ${pattern}`);
    }
  } catch (err) {
    if (isRedisConnected && shouldLogRedisWarning()) {
      console.warn('[Redis] INVALIDATE failed:', err.message);
    }
  }
}

/**
 * Invalidate multiple cache keys
 */
// Xóa nhiều nhóm cache song song để giảm độ trễ invalidation
async function cacheInvalidateMany(patterns) {
  await Promise.all(patterns.map((pattern) => cacheInvalidate(pattern)));
}

// ─── Key Generators ────────────────────────────────────────────────────────────

const KEYS = {
  // Public recommendations
  publicRecommendations: (limit) => `recommend:public:${limit}`,

  // User-specific recommendations
  userRecommendations: (userId, limit) => `recommend:user:${userId}:${limit}`,

  // Auth user context
  authUser: (userId) => `auth:user:${userId}`,

  // Search results (page + filters included in key)
  search: (q, filters, options = {}) => {
    const f = JSON.stringify(filters || {});
    const o = JSON.stringify(options || {});
    const hash = simpleHash(`${q || ""}:${f}:${o}`);
    return `search:${hash}`;
  },

  // Autocomplete suggestions
  suggestions: (q, limit = 5) => `suggestions:${q.toLowerCase().trim()}:${limit}`,

  // Pre-computed lists
  trending: (limit) => `courses:trending:${limit}`,
  newest: (limit) => `courses:newest:${limit}`,
  topRated: (limit, minRatings = 10) => `courses:toprated:${limit}:${minRatings}`,
  free: (limit) => `courses:free:${limit}`,
  featured: (limit) => `courses:featured:${limit}`,

  // Course detail (slug-based)
  course: (slugOrId) => `course:${slugOrId}`,

  // Public categories
  publicCategories: () => "categories:public",

  // Reviews
  courseReviews: (courseId, options = {}) => {
    const hash = simpleHash(JSON.stringify(options || {}));
    return `reviews:course:${courseId}:${hash}`;
  },

  // Cart
  cart: (userId) => `cart:${userId}`,

  // Enrollments
  enrolledCourses: (userId, options = {}) => {
    const hash = simpleHash(JSON.stringify(options || {}));
    return `enrollments:user:${userId}:${hash}`;
  },

  // Payments
  paymentHistory: (userId, options = {}) => {
    const hash = simpleHash(JSON.stringify(options || {}));
    return `payments:user:${userId}:${hash}`;
  },

  // Teacher stats
  teacherStats: (teacherId) => `teacher:${teacherId}:stats`,

  // Stats aggregates
  courseStats: () => `stats:courses`,
  categoryStats: () => `stats:categories`,
};

// ─── TTL Constants ───────────────────────────────────────────────────────────────

const TTL = {
  SHORT: 60,       // 1 minute — search results
  MEDIUM: 300,     // 5 minutes — trending, featured
  LONG: 600,       // 10 minutes — recommendations, suggestions
  AUTH: 300,
  COURSE_DETAIL: 600,
  CATEGORIES: 600,
  REVIEWS: 300,
  USER_CART: 180,
  USER_ENROLLMENTS: 300,
  USER_PAYMENTS: 300,
  TEACHER_DASHBOARD: 300,
};

// ─── Cache Wrappers ─────────────────────────────────────────────────────────────

/**
 * Cache public recommendations
 */
async function getPublicRecommendations(fetchFn, limit = 6) {
  const key = KEYS.publicRecommendations(limit);
  return cacheGetOrSet(key, fetchFn, TTL.LONG);
}

/**
 * Cache user-specific recommendations
 */
async function getUserRecommendations(userId, fetchFn, limit = 6) {
  const key = KEYS.userRecommendations(userId, limit);
  return cacheGetOrSet(key, fetchFn, TTL.LONG);
}

/**
 * Cache search results
 */
async function getSearchResults(q, filters, options, fetchFn) {
  // Don't cache searches with dynamic price filters
  if (q || filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    return fetchFn();
  }

  const key = KEYS.search(q, filters, options);
  return cacheGetOrSet(key, fetchFn, TTL.SHORT);
}

/**
 * Cache search suggestions
 */
async function getSearchSuggestions(q, limit, fetchFn) {
  if (!q || q.length < 2) return fetchFn();
  const key = KEYS.suggestions(q, limit);
  return cacheGetOrSet(key, fetchFn, TTL.LONG);
}

/**
 * Cache trending courses
 */
async function getTrendingCourses(fetchFn, limit = 8) {
  const key = KEYS.trending(limit);
  return cacheGetOrSet(key, fetchFn, TTL.MEDIUM);
}

/**
 * Cache newest courses
 */
async function getNewestCourses(fetchFn, limit = 8) {
  const key = KEYS.newest(limit);
  return cacheGetOrSet(key, fetchFn, TTL.MEDIUM);
}

/**
 * Cache top rated courses
 */
async function getTopRatedCourses(fetchFn, limit = 8, minRatings = 10) {
  const key = KEYS.topRated(limit, minRatings);
  return cacheGetOrSet(key, fetchFn, TTL.MEDIUM);
}

/**
 * Cache free courses
 */
async function getFreeCourses(fetchFn, limit = 8) {
  const key = KEYS.free(limit);
  return cacheGetOrSet(key, fetchFn, TTL.MEDIUM);
}

/**
 * Cache featured courses
 */
async function getFeaturedCourses(fetchFn, limit = 6) {
  const key = KEYS.featured(limit);
  return cacheGetOrSet(key, fetchFn, TTL.MEDIUM);
}

/**
 * Cache course stats
 */
async function getCourseStats(fetchFn) {
  return cacheGetOrSet(KEYS.courseStats(), fetchFn, TTL.MEDIUM);
}

async function getAuthUser(userId, fetchFn) {
  return cacheGetOrSet(KEYS.authUser(userId), fetchFn, TTL.AUTH);
}

async function getCourseDetail(slugOrId, fetchFn) {
  return cacheGetOrSet(KEYS.course(slugOrId), fetchFn, TTL.COURSE_DETAIL);
}

async function getPublicCategories(fetchFn) {
  return cacheGetOrSet(KEYS.publicCategories(), fetchFn, TTL.CATEGORIES);
}

async function getCourseReviews(courseId, options, fetchFn) {
  return cacheGetOrSet(KEYS.courseReviews(courseId, options), fetchFn, TTL.REVIEWS);
}

async function getUserCart(userId, fetchFn) {
  return cacheGetOrSet(KEYS.cart(userId), fetchFn, TTL.USER_CART);
}

async function getEnrolledCoursesCache(userId, options, fetchFn) {
  return cacheGetOrSet(KEYS.enrolledCourses(userId, options), fetchFn, TTL.USER_ENROLLMENTS);
}

async function getPaymentHistory(userId, options, fetchFn) {
  return cacheGetOrSet(KEYS.paymentHistory(userId, options), fetchFn, TTL.USER_PAYMENTS);
}

/**
 * Cache creator dashboard stats
 */
async function getTeacherStats(teacherId, fetchFn) {
  const key = KEYS.teacherStats(teacherId);
  return cacheGetOrSet(key, fetchFn, TTL.TEACHER_DASHBOARD);
}

// ─── Invalidation Triggers ─────────────────────────────────────────────────────

/**
 * Khi khóa học được tạo / cập nhật / duyệt
 */
async function invalidateOnCourseChange(courseKeys = []) {
  const normalizedCourseKeys = Array.isArray(courseKeys) ? courseKeys.filter(Boolean) : [courseKeys].filter(Boolean);

  await cacheInvalidateMany([
    'courses:trending:*',
    'courses:newest:*',
    'courses:toprated:*',
    'courses:featured:*',
    'courses:free:*',
    'recommend:public:*',
    'search:*',
    'suggestions:*',
    'stats:*',
    'categories:public',
    ...normalizedCourseKeys.map((key) => KEYS.course(key)),
  ]);
}

/**
 * Khi có review mới → invalidate rating caches
 */
async function invalidateOnReview(courseId) {
  await cacheInvalidateMany([
    'courses:toprated:*',
    'courses:featured:*',
    'recommend:public:*',
    KEYS.course(courseId),
    `reviews:course:${courseId}:*`,
  ]);
}

/**
 * Khi user mới enroll → invalidate user recommendations
 */
async function invalidateOnEnrollment(userId) {
  await cacheInvalidateMany([
    `recommend:user:${userId}:*`,
    `enrollments:user:${userId}:*`,
    `payments:user:${userId}:*`,
    KEYS.cart(userId),
  ]);
}

/**
 * Khi creator stats thay đổi
 */
async function invalidateTeacherStats(teacherId) {
  await cacheInvalidate(KEYS.teacherStats(teacherId));
}

async function invalidateAuthUser(userId) {
  await cacheInvalidate(KEYS.authUser(userId));
}

async function invalidateCourseDetail(...courseKeys) {
  const normalizedCourseKeys = courseKeys.flat().filter(Boolean);
  await Promise.all(normalizedCourseKeys.map((key) => cacheInvalidate(KEYS.course(key))));
}

async function invalidatePublicCategories() {
  await cacheInvalidate(KEYS.publicCategories());
}

async function invalidateUserCart(userId) {
  await cacheInvalidate(KEYS.cart(userId));
}

async function invalidateUserPayments(userId) {
  await cacheInvalidate(`payments:user:${userId}:*`);
}

async function invalidateUserEnrollments(userId) {
  await cacheInvalidate(`enrollments:user:${userId}:*`);
}

/**
 * Khi category thay đổi
 */
async function invalidateCategories() {
  await Promise.all([
    cacheInvalidate(KEYS.categoryStats()),
    cacheInvalidate('suggestions:*'),
    cacheInvalidate(KEYS.publicCategories()),
  ]);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Simple string hash for search cache keys
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Health check
 */
async function healthCheck() {
  const client = getRedis();
  if (!client) {
    const info = getRedisRuntimeInfo();
    return {
      status: info.enabled ? 'unavailable' : 'disabled',
      reason: info.reason || (info.coolingDown ? 'Redis is cooling down after a connection failure' : 'Redis is not connected'),
      redis: info,
    };
  }

  try {
    const pong = await client.ping();
    return { status: 'connected', ping: pong, redis: getRedisRuntimeInfo() };
  } catch (err) {
    markRedisUnavailable(`[Redis] Health check failed: ${err.message}`);
    return { status: 'error', reason: err.message, redis: getRedisRuntimeInfo() };
  }
}

export {
  getPublicRecommendations,
  getUserRecommendations,
  getSearchResults,
  getSearchSuggestions,
  getTrendingCourses,
  getNewestCourses,
  getTopRatedCourses,
  getFreeCourses,
  getFeaturedCourses,
  getCourseStats,
  getAuthUser,
  getCourseDetail,
  getPublicCategories,
  getCourseReviews,
  getUserCart,
  getEnrolledCoursesCache,
  getPaymentHistory,
  getTeacherStats,
  invalidateOnCourseChange,
  invalidateOnReview,
  invalidateOnEnrollment,
  invalidateTeacherStats,
  invalidateAuthUser,
  invalidateCourseDetail,
  invalidatePublicCategories,
  invalidateUserCart,
  invalidateUserPayments,
  invalidateUserEnrollments,
  invalidateCategories,
  cacheInvalidate,
  KEYS,
  healthCheck,
  getRedis,
  getRedisRuntimeInfo,
};
