import { z } from "zod";

const questionSchema = z.object({
  questionText: z.string().min(1, "Câu hỏi không được trống"),
  options: z.array(z.string().min(1, "Tùy chọn không được trống")).default([]),
  correctAnswers: z
    .array(z.string().min(1))
    .min(1, "Phải có ít nhất 1 đáp án đúng"),
  explanation: z.string().optional().default(""),
  points: z.number().int().min(1).default(1),
});

export const createCourseSchema = z.object({
  title: z
    .string()
    .min(5, "Tiêu đề phải có ít nhất 5 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự")
    .trim(),
  description: z
    .string()
    .min(20, "Mô tả phải có ít nhất 20 ký tự")
    .max(2000, "Mô tả không được vượt quá 2000 ký tự")
    .trim(),
  shortDescription: z
    .string()
    .max(300, "Mô tả ngắn không được vượt quá 300 ký tự")
    .optional(),
  thumbnail: z
    .string()
    .url("Thumbnail phải là URL hợp lệ")
    .optional()
    .or(z.literal("")),
  previewVideo: z
    .string()
    .url("Video phải là URL hợp lệ")
    .optional()
    .or(z.literal("")),
  price: z.number().min(0, "Giá không được âm").default(0),
  discountPrice: z.number().min(0).optional().default(0),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  category: z.string().min(1, "Danh mục là bắt buộc").trim(),
  language: z.string().default("English"),
  requirements: z.array(z.string().max(200)).max(10).optional().default([]),
  outcomes: z.array(z.string().max(200)).max(15).optional().default([]),
  isFree: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
});

export const updateCourseSchema = z.object({
  title: z
    .string()
    .min(5, "Tiêu đề phải có ít nhất 5 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự")
    .trim()
    .optional(),
  description: z
    .string()
    .min(20, "Mô tả phải có ít nhất 20 ký tự")
    .max(2000, "Mô tả không được vượt quá 2000 ký tự")
    .trim()
    .optional(),
  shortDescription: z
    .string()
    .max(300, "Mô tả ngắn không được vượt quá 300 ký tự")
    .optional()
    .or(z.literal("")),
  thumbnail: z
    .string()
    .url("Thumbnail phải là URL hợp lệ")
    .optional()
    .or(z.literal("")),
  previewVideo: z
    .string()
    .url("Video phải là URL hợp lệ")
    .optional()
    .or(z.literal("")),
  price: z.number().min(0, "Giá không được âm").optional(),
  discountPrice: z.number().min(0).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  category: z.string().min(1, "Danh mục là bắt buộc").trim().optional(),
  language: z.string().optional(),
  requirements: z.array(z.string().max(200)).max(10).optional(),
  outcomes: z.array(z.string().max(200)).max(15).optional(),
  isFree: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const createChapterSchema = z.object({
  title: z
    .string()
    .min(2, "Tiêu đề chương phải có ít nhất 2 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự")
    .trim(),
  description: z
    .string()
    .max(500, "Mô tả không được vượt quá 500 ký tự")
    .optional()
    .or(z.literal("")),
  order: z.number().int().min(0).optional().default(0),
  isPublished: z.boolean().optional().default(true),
});

export const updateChapterSchema = z.object({
  title: z
    .string()
    .min(2, "Tiêu đề chương phải có ít nhất 2 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự")
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, "Mô tả không được vượt quá 500 ký tự")
    .optional()
    .or(z.literal("")),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const createLessonSchema = z.object({
  title: z
    .string()
    .min(2, "Tiêu đề bài học phải có ít nhất 2 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự")
    .trim(),
  description: z
    .string()
    .max(1000, "Mô tả không được vượt quá 1000 ký tự")
    .optional()
    .or(z.literal("")),
  content: z.string().optional().default(""),
  videoUrl: z
    .string()
    .url("Video URL phải là URL hợp lệ")
    .optional()
    .or(z.literal("")),
  videoDuration: z.number().int().min(0).optional().default(0),
  documentUrl: z
    .string()
    .url("Document URL phải là URL hợp lệ")
    .optional()
    .or(z.literal("")),
  documentType: z
    .enum(["pdf", "doc", "ppt", "none"])
    .optional()
    .default("none"),
  order: z.number().int().min(0).optional().default(0),
  isFree: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),
  type: z
    .enum(["video", "document", "text", "quiz"])
    .optional()
    .default("video"),
});

export const updateLessonSchema = z.object({
  title: z
    .string()
    .min(2, "Tiêu đề bài học phải có ít nhất 2 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự")
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, "Mô tả không được vượt quá 1000 ký tự")
    .optional()
    .or(z.literal("")),
  content: z.string().optional(),
  videoUrl: z
    .string()
    .url("Video URL phải là URL hợp lệ")
    .optional()
    .or(z.literal("")),
  videoDuration: z.number().int().min(0).optional(),
  documentUrl: z
    .string()
    .url("Document URL phải là URL hợp lệ")
    .optional()
    .or(z.literal("")),
  documentType: z.enum(["pdf", "doc", "ppt", "none"]).optional(),
  order: z.number().int().min(0).optional(),
  isFree: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  type: z.enum(["video", "document", "text", "quiz"]).optional(),
});

export const createExerciseSchema = z.object({
  title: z
    .string()
    .min(2, "Tiêu đề bài tập phải có ít nhất 2 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự")
    .trim(),
  type: z
    .enum(["single-choice", "multiple-choice", "fill-blank", "short-answer"])
    .default("single-choice"),
  skill: z
    .enum(["reading", "listening", "writing", "grammar", "vocabulary"])
    .default("grammar"),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  questions: z.array(questionSchema).min(1, "Phải có ít nhất 1 câu hỏi"),
  timeLimit: z.number().int().min(0).optional().default(0),
  passingScore: z.number().int().min(0).max(100).optional().default(60),
  isPublished: z.boolean().optional().default(true),
});

export const updateExerciseSchema = z.object({
  title: z
    .string()
    .min(2, "Tiêu đề bài tập phải có ít nhất 2 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự")
    .trim()
    .optional(),
  type: z
    .enum(["single-choice", "multiple-choice", "fill-blank", "short-answer"])
    .optional(),
  skill: z
    .enum(["reading", "listening", "writing", "grammar", "vocabulary"])
    .optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  questions: z
    .array(questionSchema)
    .min(1, "Phải có ít nhất 1 câu hỏi")
    .optional(),
  timeLimit: z.number().int().min(0).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  isPublished: z.boolean().optional(),
});

export const submitReviewSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  status: z
    .enum(["draft", "pending", "published", "rejected", "locked", "banned"])
    .optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "title", "price", "totalStudents"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
