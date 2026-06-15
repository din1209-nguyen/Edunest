// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  bio?: string;
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PopularUser extends Pick<User, "_id" | "name" | "email" | "avatar" | "bio" | "createdAt"> {
  followersCount: number;
  learningCount: number;
  isFollowing: boolean;
}

export interface AuthResponse {
  user: User;
  auth?: {
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
    tokenType: "Bearer";
  };
}

export interface AuthSession {
  _id: string;
  deviceLabel: string;
  userAgent: string;
  ip: string;
  lastSeenAt: string;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string | null;
  isCurrent: boolean;
}

// Course Types
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "pending" | "published" | "rejected" | "locked" | "banned";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  courseCount?: number;
}

export interface Instructor {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  previewVideo?: string;
  price: number;
  estimatedPrice?: number;
  discountPrice?: number;
  pendingPrice?: number | null;
  pendingDiscountPrice?: number | null;
  pendingIsFree?: boolean | null;
  shortDescription?: string;
  level: CourseLevel;
  status: CourseStatus;
  category: Category | string;
  instructor: Instructor | User;
  totalDuration?: number;
  totalLessons?: number;
  totalStudents?: number;
  enrolledCount?: number;
  rating?: number;
  totalRatings?: number;
  reviewCount?: number;
  rejectionReason?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isPurchased?: boolean;
  reviewedAt?: string | null;
  tags?: string[];
  requirements?: string[];
  outcomes?: string[];
  benefits?: string[];
  chapters?: Chapter[];
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  _id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
  isFree?: boolean;
  contentStatus?: "approved" | "pending";
}

export interface Lesson {
  _id: string;
  title: string;
  description?: string;
  type: "video" | "document" | "pdf" | "text" | "quiz";
  videoUrl?: string;
  documentUrl?: string;
  documentType?: "pdf" | "doc" | "ppt" | "none";
  pdfUrl?: string;
  content?: string;
  duration?: number;
  order: number;
  isFree?: boolean;
  isPublished?: boolean;
  contentStatus?: "approved" | "pending";
  exercises?: Exercise[];
}

// Exercise Types
export type ExerciseType = "single-choice" | "multiple-choice" | "fill-blank" | "short-answer";
export type ExerciseSkill = "reading" | "listening" | "writing" | "grammar" | "vocabulary";

export interface ExerciseQuestion {
  questionText: string;
  options: string[];
  correctAnswers: string[];
  explanation?: string;
  points: number;
}

export interface Exercise {
  _id: string;
  lesson: string;
  course?: string;
  title: string;
  type: ExerciseType;
  skill?: ExerciseSkill;
  level?: CourseLevel;
  questions: ExerciseQuestion[];
  timeLimit?: number;
  passingScore?: number;
  isPublished?: boolean;
  isAiGenerated?: boolean;
  contentStatus?: "approved" | "pending";
}

export interface AiExerciseQuota {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
}

export interface ExerciseSubmissionQuestionResult {
  questionIndex: number;
  questionText: string;
  options: string[];
  userAnswer: string[];
  correctAnswers: string[];
  explanation?: string;
  points: number;
  earned: number;
  isCorrect: boolean;
}

export interface ExerciseSubmissionResult {
  exerciseId: string;
  title: string;
  totalQuestions: number;
  totalPoints: number;
  earnedPoints: number;
  score: number;
  passingScore?: number;
  passed: boolean;
  questions: ExerciseSubmissionQuestionResult[];
}

// Enrollment Types
export interface Enrollment {
  _id: string;
  student: User | string;
  course: Course | string;
  progress: number;
  completedLessons: string[];
  enrolledAt: string;
  completedAt?: string;
  certificateId?: string;
  isActive: boolean;
}

// Cart Types
export interface CartItem {
  _id: string;
  course: Course | string;
  addedAt: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalPrice: number;
}

// Payment Types
export interface Payment {
  _id: string;
  user: User | string;
  course: Course | string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "refunded";
  paymentMethod: string;
  transactionId?: string;
  vnpTransactionNo?: string;
  vnpResponseCode?: string;
  paidAt?: string;
  createdAt: string;
}

// Review Types
export interface Review {
  _id: string;
  course: Course | string;
  user: User | string;
  rating: number;
  comment: string;
  createdAt: string;
}

// Wishlist Types
export interface WishlistItem {
  _id: string;
  course: Course | string;
  addedAt: string;
}

// Note Types
export interface Note {
  _id: string;
  lesson: string;
  user: string;
  content: string;
  timestamp?: number;
  createdAt: string;
  updatedAt: string;
}

// Certificate Types
export interface Certificate {
  _id: string;
  student: User | string;
  course: Course | string;
  certificateId: string;
  issuedAt: string;
  certificateUrl?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Search & Filter Types
export interface CourseFilters {
  search?: string;
  category?: string;
  level?: CourseLevel;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price" | "rating" | "enrolledCount" | "totalStudents" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface SearchSuggestion {
  text: string;
  type: "course" | "instructor" | "category";
}

// Dashboard Types
export interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
}

export interface TeacherStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  monthlyRevenue: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  recentEnrollments: Enrollment[];
}

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  pendingCourses?: number;
  activeUsers?: number;
  monthlyGrowth?: number;
}

export interface CourseFormData {
  title: string;
  description: string;
  shortDescription?: string;
  thumbnail?: string;
  previewVideo?: string;
  price: number;
  discountPrice?: number;
  category: string;
  level: CourseLevel;
  language?: string;
  requirements?: string[];
  outcomes?: string[];
  isFree?: boolean;
  isFeatured?: boolean;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
