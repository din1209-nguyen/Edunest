"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock,
  Copy,
  Eye,
  FilePlus2,
  FileQuestion,
  FileText,
  ImageIcon,
  Layers3,
  Loader2,
  Pencil,
  PlayCircle,
  Plus,
  Save,
  Send,
  Target,
  Trash2,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { TeacherFileUploadButton } from "@/components/teacher/TeacherFileUploadButton";
import { useToast } from "@/components/ui/Toast";
import {
  chapterApi,
  lessonApi,
  teacherCourseApi,
  teacherExerciseApi,
  type TeacherCourseCurriculumResponse,
  type TeacherCourseDetailResponse,
} from "@/lib/teacherApi";
import { categoryLabel, normalizeCourse } from "@/lib/courseUtils";
import type {
  Chapter,
  Course,
  CourseFormData,
  CourseLevel,
  CourseStatus,
  Exercise,
  ExerciseQuestion,
  ExerciseSkill,
  ExerciseType,
  Lesson,
} from "@/types";

const levelOptions = [
  { value: "beginner", label: "Người mới bắt đầu" },
  { value: "intermediate", label: "Trung cấp" },
  { value: "advanced", label: "Nâng cao" },
];

const languageOptions = [
  { value: "English", label: "English" },
  { value: "Vietnamese", label: "Tiếng Việt" },
  { value: "English & Vietnamese", label: "Song ngữ Anh - Việt" },
];

const exerciseTypeOptions = [
  { value: "single-choice", label: "Một đáp án" },
  { value: "multiple-choice", label: "Nhiều đáp án" },
  { value: "fill-blank", label: "Điền chỗ trống" },
  { value: "short-answer", label: "Trả lời ngắn" },
];

const lessonDocumentAccept =
  "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";

const exerciseSkillOptions = [
  { value: "grammar", label: "Ngữ pháp" },
  { value: "reading", label: "Đọc hiểu" },
  { value: "listening", label: "Nghe hiểu" },
  { value: "writing", label: "Viết" },
  { value: "vocabulary", label: "Từ vựng" },
];

const statusMeta: Record<CourseStatus, { label: string; badge: "primary-light" | "warning" | "success" | "error" | "secondary-light" }> = {
  draft: { label: "Bản nháp", badge: "secondary-light" },
  pending: { label: "Chờ duyệt", badge: "warning" },
  published: { label: "Đã xuất bản", badge: "success" },
  rejected: { label: "Bị từ chối", badge: "error" },
  locked: { label: "Bị khóa", badge: "error" },
  banned: { label: "Bị cấm", badge: "error" },
};

type EditorTab = "info" | "content" | "chapters" | "lessons" | "exercises" | "review";

const editorTabs: Array<{ id: EditorTab; label: string; description: string }> = [
  { id: "info", label: "Thông tin khóa học", description: "Metadata, media, giá và mục tiêu" },
  { id: "content", label: "Nội dung khóa học", description: "Chương, bài học và bài tập" },
];

function isEditorTab(value: string | null): value is EditorTab {
  return Boolean(value && editorTabs.some((tab) => tab.id === value));
}

type CourseEditorForm = {
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  previewVideo: string;
  price: string;
  discountPrice: string;
  category: string;
  level: CourseLevel;
  language: string;
  requirements: string;
  outcomes: string;
  isFeatured: boolean;
};

type LessonEditorForm = {
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  documentUrl: string;
  documentType: "pdf" | "doc" | "ppt" | "none";
  type: "video" | "text" | "document" | "quiz";
  isFree: boolean;
};

type ExerciseQuestionEditorForm = {
  questionText: string;
  options: string[];
  correctAnswers: string[];
  explanation: string;
  points: string;
};

type ExerciseEditorForm = {
  title: string;
  type: ExerciseType;
  skill: ExerciseSkill;
  level: CourseLevel;
  timeLimit: string;
  passingScore: string;
  isPublished: boolean;
  questions: ExerciseQuestionEditorForm[];
};

type DeleteTarget =
  | { kind: "chapter"; chapterId: string; title: string }
  | { kind: "lesson"; chapterId: string; lessonId: string; title: string }
  | { kind: "exercise"; chapterId: string; lessonId: string; exerciseId: string; title: string };

type EditorOverlay =
  | { kind: "createChapter" }
  | { kind: "chapter"; chapterId: string }
  | { kind: "lesson"; chapterId: string; lessonId: string }
  | { kind: "exercise"; chapterId: string; lessonId: string; exerciseId: string }
  | { kind: "createLesson"; chapterId: string }
  | { kind: "createExercise"; chapterId: string; lessonId: string };

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(items?: string[]) {
  return (items || []).join("\n");
}

function isValidOptionalUrl(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return true;

  try {
    const url = new URL(trimmedValue);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function createFormFromCourse(course: Course): CourseEditorForm {
  return {
    title: course.title || "",
    description: course.description || "",
    shortDescription: (course as Course & { shortDescription?: string }).shortDescription || "",
    thumbnail: course.thumbnail || "",
    previewVideo: course.previewVideo || "",
    price: String(course.estimatedPrice ?? course.price ?? 0),
    discountPrice: String(course.price ?? 0),
    category: typeof course.category === "string" ? course.category : course.category?.name || "",
    level: course.level || "beginner",
    language: (course as Course & { language?: string }).language || "English",
    requirements: joinLines(course.requirements),
    outcomes: joinLines((course as Course & { outcomes?: string[]; benefits?: string[] }).outcomes || course.benefits),
    isFeatured: Boolean(course.isFeatured),
  };
}

function createLessonForm(lesson?: Lesson): LessonEditorForm {
  return {
    title: lesson?.title || "",
    description: lesson?.description || "",
    content: lesson?.content || "",
    videoUrl: lesson?.videoUrl || "",
    documentUrl: lesson?.documentUrl || lesson?.pdfUrl || "",
    documentType: lesson?.documentType || (lesson?.pdfUrl ? "pdf" : "none"),
    type: (lesson?.type as LessonEditorForm["type"]) || "video",
    isFree: Boolean(lesson?.isFree),
  };
}

function getDocumentTypeFromUrl(url: string): LessonEditorForm["documentType"] {
  const normalizedUrl = url.toLowerCase().split("?")[0];
  if (normalizedUrl.endsWith(".pdf")) return "pdf";
  if (normalizedUrl.endsWith(".doc") || normalizedUrl.endsWith(".docx")) return "doc";
  if (normalizedUrl.endsWith(".ppt") || normalizedUrl.endsWith(".pptx")) return "ppt";
  return "pdf";
}

function createEmptyQuestion(type: ExerciseType = "single-choice"): ExerciseQuestionEditorForm {
  return {
    questionText: "",
    options: type === "fill-blank" || type === "short-answer" ? [""] : ["", ""],
    correctAnswers: [],
    explanation: "",
    points: "1",
  };
}

function normalizeQuestionsForType(
  questions: ExerciseQuestionEditorForm[],
  type: ExerciseType,
): ExerciseQuestionEditorForm[] {
  return questions.map((question) => {
    const normalizedOptions =
      type === "fill-blank" || type === "short-answer"
        ? question.options.length > 0
          ? question.options.slice(0, 1)
          : [""]
        : question.options.length >= 2
          ? question.options
          : [...question.options, ...Array.from({ length: 2 - question.options.length }, () => "")];

    const allowedAnswers = question.correctAnswers.filter((answer) => normalizedOptions.includes(answer) || type === "fill-blank" || type === "short-answer");

    return {
      ...question,
      options: normalizedOptions,
      correctAnswers:
        type === "single-choice" ? allowedAnswers.slice(0, 1) : allowedAnswers,
    };
  });
}

function createExerciseForm(exercise?: Exercise): ExerciseEditorForm {
  const type = exercise?.type || "single-choice";
  const mappedQuestions = (exercise?.questions || []).map((question) => ({
    questionText: question.questionText || "",
    options:
      type === "fill-blank" || type === "short-answer"
        ? question.options?.length
          ? question.options
          : [question.correctAnswers?.[0] || ""]
        : question.options?.length
          ? question.options
          : ["", ""],
    correctAnswers: question.correctAnswers || [],
    explanation: question.explanation || "",
    points: String(question.points ?? 1),
  }));

  return {
    title: exercise?.title || "",
    type,
    skill: exercise?.skill || "grammar",
    level: exercise?.level || "beginner",
    timeLimit: String(exercise?.timeLimit ?? 0),
    passingScore: String(exercise?.passingScore ?? 60),
    isPublished: exercise?.isPublished ?? true,
    questions: mappedQuestions.length > 0 ? mappedQuestions : [createEmptyQuestion(type)],
  };
}

function buildExercisePayload(form: ExerciseEditorForm) {
  const normalizedQuestions: ExerciseQuestion[] = normalizeQuestionsForType(form.questions, form.type).map((question) => ({
    questionText: question.questionText.trim(),
    options:
      form.type === "fill-blank" || form.type === "short-answer"
        ? question.options.map((option) => option.trim()).filter(Boolean)
        : question.options.map((option) => option.trim()).filter(Boolean),
    correctAnswers:
      form.type === "fill-blank" || form.type === "short-answer"
        ? question.correctAnswers.map((answer) => answer.trim()).filter(Boolean)
        : question.correctAnswers.map((answer) => answer.trim()).filter(Boolean),
    explanation: question.explanation.trim(),
    points: Math.max(Number(question.points) || 1, 1),
  }));

  return {
    title: form.title.trim(),
    type: form.type,
    skill: form.skill,
    level: form.level,
    timeLimit: Math.max(Number(form.timeLimit) || 0, 0),
    passingScore: Math.min(Math.max(Number(form.passingScore) || 60, 0), 100),
    isPublished: form.isPublished,
    questions: normalizedQuestions,
  };
}

function isExerciseFormValid(form: ExerciseEditorForm) {
  return getExerciseFormValidationMessage(form) === null;
}

function getExerciseFormValidationMessage(form: ExerciseEditorForm) {
  if (!form.title.trim()) return "Vui lòng nhập tiêu đề bài tập.";

  const invalidQuestionIndex = normalizeQuestionsForType(form.questions, form.type).findIndex((question) => {
    if (!question.questionText.trim()) return true;

    if (form.type === "single-choice") {
      return !(
        question.options.map((option) => option.trim()).filter(Boolean).length >= 2 &&
        question.correctAnswers.length === 1
      );
    }

    if (form.type === "multiple-choice") {
      return !(
        question.options.map((option) => option.trim()).filter(Boolean).length >= 2 &&
        question.correctAnswers.length >= 1
      );
    }

    return question.correctAnswers.map((answer) => answer.trim()).filter(Boolean).length < 1;
  });

  if (invalidQuestionIndex === -1) return null;

  const questionNumber = invalidQuestionIndex + 1;
  if (form.type === "single-choice") {
    return `Câu hỏi ${questionNumber} cần ít nhất 2 đáp án và chọn 1 đáp án đúng.`;
  }
  if (form.type === "multiple-choice") {
    return `Câu hỏi ${questionNumber} cần ít nhất 2 đáp án và chọn ít nhất 1 đáp án đúng.`;
  }
  return `Câu hỏi ${questionNumber} cần có đáp án đúng.`;
}

function getYoutubeEmbedUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    return trimmed;
  } catch {
    return "";
  }
}

function formatLessonDuration(duration?: number) {
  if (!duration || duration <= 0) return "";
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, "0")}p`;
  return `${minutes}p`;
}

function hasLessonDocument(lesson: Lesson) {
  return Boolean(lesson.documentUrl || lesson.pdfUrl || lesson.documentType === "pdf");
}

function normalizeCurriculum(chapters: Chapter[] = []): Chapter[] {
  return chapters.map((chapter, chapterIndex) => ({
    ...chapter,
    order: typeof chapter.order === "number" ? chapter.order : chapterIndex,
    lessons: (chapter.lessons || []).map((lesson, lessonIndex) => ({
      ...lesson,
      type: "video",
      order: typeof lesson.order === "number" ? lesson.order : lessonIndex,
    })),
  }));
}

function unwrapTeacherCourse(data: TeacherCourseDetailResponse | undefined): Course | null {
  if (!data) return null;
  if ("_id" in data) return data;
  return data.course ?? null;
}

function unwrapTeacherCurriculum(data: TeacherCourseCurriculumResponse | undefined): Chapter[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.chapters ?? [];
}

export default function TeacherCourseEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const setSuccessMessage = toast.success;
  const courseId = params.id;
  const requestedTab = searchParams.get("tab");
  const activeTab: EditorTab = isEditorTab(requestedTab) ? requestedTab : "info";

  const [course, setCourse] = useState<Course | null>(null);
  const [curriculum, setCurriculum] = useState<Chapter[]>([]);
  const [form, setForm] = useState<CourseEditorForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [creatingChapter, setCreatingChapter] = useState(false);
  const [chapterSavingKey, setChapterSavingKey] = useState<string | null>(null);
  const [chapterReorderingKey, setChapterReorderingKey] = useState<string | null>(null);
  const [lessonSavingKey, setLessonSavingKey] = useState<string | null>(null);
  const [lessonReorderingKey, setLessonReorderingKey] = useState<string | null>(null);
  const [lessonDeletingKey, setLessonDeletingKey] = useState<string | null>(null);
  const [chapterDeletingKey, setChapterDeletingKey] = useState<string | null>(null);
  const [exerciseSavingKey, setExerciseSavingKey] = useState<string | null>(null);
  const [exerciseDeletingKey, setExerciseDeletingKey] = useState<string | null>(null);
  const [newExerciseValidationMessages, setNewExerciseValidationMessages] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<EditorOverlay | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterDescription, setNewChapterDescription] = useState("");
  const [chapterTitles, setChapterTitles] = useState<Record<string, string>>({});
  const [chapterDescriptions, setChapterDescriptions] = useState<Record<string, string>>({});
  const [newLessonTitles, setNewLessonTitles] = useState<Record<string, string>>({});
  const [newLessonForms, setNewLessonForms] = useState<Record<string, LessonEditorForm>>({});
  const [editingLessonIds, setEditingLessonIds] = useState<Record<string, boolean>>({});
  const [lessonForms, setLessonForms] = useState<Record<string, LessonEditorForm>>({});
  const [exerciseForms, setExerciseForms] = useState<Record<string, ExerciseEditorForm>>({});
  const [newExerciseForms, setNewExerciseForms] = useState<Record<string, ExerciseEditorForm>>({});
  const [editingExerciseIds, setEditingExerciseIds] = useState<Record<string, boolean>>({});
  const [collapsedChapterIds, setCollapsedChapterIds] = useState<Record<string, boolean>>({});
  const [collapsedLessonIds, setCollapsedLessonIds] = useState<Record<string, boolean>>({});
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBootstrappingFormRef = useRef(true);

  useEffect(() => {
    let mounted = true;

    async function loadCourseAndCurriculum() {
      try {
        setLoading(true);
        setError("");
        const [courseResponse, curriculumResponse] = await Promise.all([
          teacherCourseApi.getCourse(courseId),
          teacherCourseApi.getCourseCurriculum(courseId),
        ]);
        const courseData = unwrapTeacherCourse(courseResponse.data);
        const curriculumData = unwrapTeacherCurriculum(curriculumResponse.data);

        if (!courseData) {
          throw new Error("Không tìm thấy dữ liệu khóa học");
        }

        const normalizedCourse = normalizeCourse(courseData);
        const normalizedCurriculum = normalizeCurriculum(curriculumData);

        if (!mounted) return;
        setCourse(normalizedCourse);
        setForm(createFormFromCourse(normalizedCourse));
        setIsDirty(false);
        setLastSavedAt(normalizedCourse.updatedAt || new Date().toISOString());
        isBootstrappingFormRef.current = true;
        setCurriculum(normalizedCurriculum);
        setChapterTitles(
          Object.fromEntries(normalizedCurriculum.map((chapter) => [chapter._id, chapter.title || ""])),
        );
        setChapterDescriptions(
          Object.fromEntries(normalizedCurriculum.map((chapter) => [chapter._id, chapter.description || ""])),
        );
        setLessonForms(
          Object.fromEntries(
            normalizedCurriculum.flatMap((chapter) =>
              chapter.lessons.map((lesson) => [lesson._id, createLessonForm(lesson)]),
            ),
          ),
        );
        setExerciseForms(
          Object.fromEntries(
            normalizedCurriculum.flatMap((chapter) =>
              ((chapter as Chapter & { exercises?: Exercise[] }).exercises || []).map((exercise) => [
                exercise._id,
                createExerciseForm(exercise),
              ]),
            ),
          ),
        );
      } catch (requestError) {
        if (!mounted) return;
        const axiosError = requestError as AxiosError<{ message?: string }>;
        setError(axiosError.response?.data?.message || axiosError.message || "Không thể tải khóa học");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (courseId) {
      loadCourseAndCurriculum();
    }

    return () => {
      mounted = false;
    };
  }, [courseId]);

  const refreshCurriculum = async () => {
    try {
      setLoadingCurriculum(true);
      const response = await teacherCourseApi.getCourseCurriculum(courseId);
      const normalizedCurriculum = normalizeCurriculum(unwrapTeacherCurriculum(response.data));
      setCurriculum(normalizedCurriculum);
      setChapterTitles((current) => ({
        ...current,
        ...Object.fromEntries(normalizedCurriculum.map((chapter) => [chapter._id, chapter.title || ""])),
      }));
      setChapterDescriptions((current) => ({
        ...current,
        ...Object.fromEntries(normalizedCurriculum.map((chapter) => [chapter._id, chapter.description || ""])),
      }));
      setLessonForms((current) => ({
        ...current,
        ...Object.fromEntries(
          normalizedCurriculum.flatMap((chapter) =>
            chapter.lessons.map((lesson) => [lesson._id, current[lesson._id] || createLessonForm(lesson)]),
          ),
        ),
      }));
      setExerciseForms((current) => ({
        ...current,
        ...Object.fromEntries(
          normalizedCurriculum.flatMap((chapter) =>
            ((chapter as Chapter & { exercises?: Exercise[] }).exercises || []).map((exercise) => [
              exercise._id,
              current[exercise._id] || createExerciseForm(exercise),
            ]),
          ),
        ),
      }));
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể tải lại curriculum");
    } finally {
      setLoadingCurriculum(false);
    }
  };

  const lessonExerciseMap = useMemo(() => {
    return curriculum.reduce<Record<string, Exercise[]>>((acc, chapter) => {
      const chapterExercises = ((chapter as Chapter & { exercises?: Exercise[] }).exercises || []);
      chapterExercises.forEach((exercise) => {
        const lessonId = typeof exercise.lesson === "string" ? exercise.lesson : "";
        if (!acc[lessonId]) acc[lessonId] = [];
        acc[lessonId].push(exercise);
      });
      return acc;
    }, {});
  }, [curriculum]);

  const metrics = useMemo(() => {
    const lessonCount = curriculum.reduce((sum, chapter) => sum + (chapter.lessons?.length || 0), 0);
    const freeLessonCount = curriculum.reduce(
      (sum, chapter) => sum + (chapter.lessons || []).filter((lesson) => lesson.isFree).length,
      0,
    );
    const exerciseCount = Object.values(lessonExerciseMap).reduce((sum, exercises) => sum + exercises.length, 0);

    return {
      chapterCount: curriculum.length,
      lessonCount,
      freeLessonCount,
      exerciseCount,
    };
  }, [curriculum, lessonExerciseMap]);

  const chapterExerciseCounts = useMemo(() => {
    return curriculum.reduce<Record<string, number>>((acc, chapter) => {
      acc[chapter._id] = (chapter.lessons || []).reduce(
        (sum, lesson) => sum + (lessonExerciseMap[lesson._id]?.length || 0),
        0,
      );
      return acc;
    }, {});
  }, [curriculum, lessonExerciseMap]);

  const activeChapter = useMemo(() => {
    if (!activeOverlay || activeOverlay.kind === "createChapter") return null;
    return curriculum.find((chapter) => chapter._id === activeOverlay.chapterId) ?? null;
  }, [activeOverlay, curriculum]);

  const activeLesson = useMemo(() => {
    if (!activeOverlay || activeOverlay.kind === "createChapter" || activeOverlay.kind === "chapter" || activeOverlay.kind === "createLesson") return null;
    return activeChapter?.lessons?.find((lesson) => lesson._id === activeOverlay.lessonId) ?? null;
  }, [activeChapter?.lessons, activeOverlay]);

  const activeExercise = useMemo(() => {
    if (!activeOverlay || activeOverlay.kind !== "exercise") return null;
    return (lessonExerciseMap[activeOverlay.lessonId] || []).find((exercise) => exercise._id === activeOverlay.exerciseId) ?? null;
  }, [activeOverlay, lessonExerciseMap]);

  const readiness = useMemo(() => {
    if (!form) {
      return { canSubmit: false, items: [] as { label: string; done: boolean }[] };
    }

    const items = [
      { label: "Có tiêu đề tối thiểu 5 ký tự", done: form.title.trim().length >= 5 },
      { label: "Có mô tả tối thiểu 20 ký tự", done: form.description.trim().length >= 20 },
      { label: "Có thumbnail", done: Boolean(form.thumbnail.trim()) },
      { label: "Có danh mục", done: Boolean(form.category.trim()) },
      { label: "Có ít nhất 1 chương", done: metrics.chapterCount > 0 },
      { label: "Có ít nhất 1 bài học", done: metrics.lessonCount > 0 },
    ];

    return {
      canSubmit: items.every((item) => item.done),
      items,
    };
  }, [form, metrics.chapterCount, metrics.lessonCount]);

  const coursePreviewVideo = useMemo(() => getYoutubeEmbedUrl(form?.previewVideo || ""), [form?.previewVideo]);

  useEffect(() => {
    if (!form) return;

    if (isBootstrappingFormRef.current) {
      isBootstrappingFormRef.current = false;
      return;
    }

    setIsDirty(true);
  }, [form]);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const updateForm = <K extends keyof CourseEditorForm>(key: K, value: CourseEditorForm[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleTabChange = (tab: EditorTab) => {
    router.replace(`/teacher/courses/${courseId}/edit?tab=${tab}`, { scroll: false });
  };

  const clearNewExerciseValidationMessage = (lessonId: string) => {
    setNewExerciseValidationMessages((current) => {
      if (!current[lessonId]) return current;
      const next = { ...current };
      delete next[lessonId];
      return next;
    });
  };

  const updateLessonForm = (lessonId: string, key: keyof LessonEditorForm, value: LessonEditorForm[keyof LessonEditorForm]) => {
    setLessonForms((current) => ({
      ...current,
      [lessonId]: {
        ...(current[lessonId] || createLessonForm()),
        [key]: value,
      },
    }));
  };

  const updateNewLessonForm = (chapterId: string, key: keyof LessonEditorForm, value: LessonEditorForm[keyof LessonEditorForm]) => {
    setNewLessonForms((current) => ({
      ...current,
      [chapterId]: {
        ...(current[chapterId] || createLessonForm()),
        [key]: value,
      },
    }));
  };

  const updateExerciseForm = (exerciseId: string, key: keyof ExerciseEditorForm, value: ExerciseEditorForm[keyof ExerciseEditorForm]) => {
    setExerciseForms((current) => {
      const base = current[exerciseId] || createExerciseForm();
      if (key === "type") {
        const nextType = value as ExerciseType;
        return {
          ...current,
          [exerciseId]: {
            ...base,
            type: nextType,
            questions: normalizeQuestionsForType(base.questions, nextType),
          },
        };
      }
      return {
        ...current,
        [exerciseId]: {
          ...base,
          [key]: value,
        },
      };
    });
  };

  const updateNewExerciseForm = (lessonId: string, key: keyof ExerciseEditorForm, value: ExerciseEditorForm[keyof ExerciseEditorForm]) => {
    clearNewExerciseValidationMessage(lessonId);
    setNewExerciseForms((current) => {
      const base = current[lessonId] || createExerciseForm();
      if (key === "type") {
        const nextType = value as ExerciseType;
        return {
          ...current,
          [lessonId]: {
            ...base,
            type: nextType,
            questions: normalizeQuestionsForType(base.questions, nextType),
          },
        };
      }
      return {
        ...current,
        [lessonId]: {
          ...base,
          [key]: value,
        },
      };
    });
  };

  const updateExerciseQuestion = (
    formType: "existing" | "new",
    ownerId: string,
    questionIndex: number,
    key: keyof ExerciseQuestionEditorForm,
    value: ExerciseQuestionEditorForm[keyof ExerciseQuestionEditorForm],
  ) => {
    const setter = formType === "existing" ? setExerciseForms : setNewExerciseForms;
    if (formType === "new") clearNewExerciseValidationMessage(ownerId);

    setter((current) => {
      const base = current[ownerId] || createExerciseForm();
      const questions = base.questions.map((question, index) =>
        index === questionIndex ? { ...question, [key]: value } : question,
      );
      return {
        ...current,
        [ownerId]: {
          ...base,
          questions,
        },
      };
    });
  };

  const addExerciseQuestion = (formType: "existing" | "new", ownerId: string) => {
    const setter = formType === "existing" ? setExerciseForms : setNewExerciseForms;
    if (formType === "new") clearNewExerciseValidationMessage(ownerId);
    setter((current) => {
      const base = current[ownerId] || createExerciseForm();
      return {
        ...current,
        [ownerId]: {
          ...base,
          questions: [...base.questions, createEmptyQuestion(base.type)],
        },
      };
    });
  };

  const removeExerciseQuestion = (formType: "existing" | "new", ownerId: string, questionIndex: number) => {
    const setter = formType === "existing" ? setExerciseForms : setNewExerciseForms;
    if (formType === "new") clearNewExerciseValidationMessage(ownerId);
    setter((current) => {
      const base = current[ownerId] || createExerciseForm();
      const nextQuestions = base.questions.filter((_, index) => index !== questionIndex);
      return {
        ...current,
        [ownerId]: {
          ...base,
          questions: nextQuestions.length > 0 ? nextQuestions : [createEmptyQuestion(base.type)],
        },
      };
    });
  };

  const moveExerciseQuestion = (
    formType: "existing" | "new",
    ownerId: string,
    questionIndex: number,
    direction: "up" | "down",
  ) => {
    const setter = formType === "existing" ? setExerciseForms : setNewExerciseForms;
    if (formType === "new") clearNewExerciseValidationMessage(ownerId);

    setter((current) => {
      const base = current[ownerId] || createExerciseForm();
      const targetIndex = direction === "up" ? questionIndex - 1 : questionIndex + 1;

      if (targetIndex < 0 || targetIndex >= base.questions.length) {
        return current;
      }

      const nextQuestions = [...base.questions];
      const currentQuestion = nextQuestions[questionIndex];
      nextQuestions[questionIndex] = nextQuestions[targetIndex];
      nextQuestions[targetIndex] = currentQuestion;

      return {
        ...current,
        [ownerId]: {
          ...base,
          questions: nextQuestions,
        },
      };
    });
  };

  const duplicateExerciseQuestion = (
    formType: "existing" | "new",
    ownerId: string,
    questionIndex: number,
  ) => {
    const setter = formType === "existing" ? setExerciseForms : setNewExerciseForms;
    if (formType === "new") clearNewExerciseValidationMessage(ownerId);

    setter((current) => {
      const base = current[ownerId] || createExerciseForm();
      const sourceQuestion = base.questions[questionIndex];

      if (!sourceQuestion) {
        return current;
      }

      const duplicatedQuestion = {
        ...sourceQuestion,
        options: [...sourceQuestion.options],
        correctAnswers: [...sourceQuestion.correctAnswers],
      };

      const nextQuestions = [...base.questions];
      nextQuestions.splice(questionIndex + 1, 0, duplicatedQuestion);

      return {
        ...current,
        [ownerId]: {
          ...base,
          questions: nextQuestions,
        },
      };
    });
  };

  const addQuestionOption = (formType: "existing" | "new", ownerId: string, questionIndex: number) => {
    const setter = formType === "existing" ? setExerciseForms : setNewExerciseForms;
    if (formType === "new") clearNewExerciseValidationMessage(ownerId);
    setter((current) => {
      const base = current[ownerId] || createExerciseForm();
      const questions = base.questions.map((question, index) =>
        index === questionIndex ? { ...question, options: [...question.options, ""] } : question,
      );
      return {
        ...current,
        [ownerId]: {
          ...base,
          questions,
        },
      };
    });
  };

  const moveQuestionOption = (
    formType: "existing" | "new",
    ownerId: string,
    questionIndex: number,
    optionIndex: number,
    direction: "up" | "down",
  ) => {
    const setter = formType === "existing" ? setExerciseForms : setNewExerciseForms;
    if (formType === "new") clearNewExerciseValidationMessage(ownerId);
    setter((current) => {
      const base = current[ownerId] || createExerciseForm();
      const questions = base.questions.map((question, qIndex) => {
        if (qIndex !== questionIndex) return question;

        const targetIndex = direction === "up" ? optionIndex - 1 : optionIndex + 1;
        if (targetIndex < 0 || targetIndex >= question.options.length) {
          return question;
        }

        const options = [...question.options];
        const currentOption = options[optionIndex];
        options[optionIndex] = options[targetIndex];
        options[targetIndex] = currentOption;

        return { ...question, options };
      });

      return {
        ...current,
        [ownerId]: {
          ...base,
          questions,
        },
      };
    });
  };

  const updateQuestionOption = (
    formType: "existing" | "new",
    ownerId: string,
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    const setter = formType === "existing" ? setExerciseForms : setNewExerciseForms;
    if (formType === "new") clearNewExerciseValidationMessage(ownerId);
    setter((current) => {
      const base = current[ownerId] || createExerciseForm();
      const questions = base.questions.map((question, qIndex) => {
        if (qIndex !== questionIndex) return question;
        const options = question.options.map((option, index) => (index === optionIndex ? value : option));
        const previousValue = question.options[optionIndex];
        const correctAnswers = question.correctAnswers.map((answer) => (answer === previousValue ? value : answer));
        return { ...question, options, correctAnswers };
      });
      return {
        ...current,
        [ownerId]: {
          ...base,
          questions,
        },
      };
    });
  };

  const removeQuestionOption = (
    formType: "existing" | "new",
    ownerId: string,
    questionIndex: number,
    optionIndex: number,
  ) => {
    const setter = formType === "existing" ? setExerciseForms : setNewExerciseForms;
    if (formType === "new") clearNewExerciseValidationMessage(ownerId);
    setter((current) => {
      const base = current[ownerId] || createExerciseForm();
      const questions = base.questions.map((question, qIndex) => {
        if (qIndex !== questionIndex) return question;
        const removedValue = question.options[optionIndex];
        const options = question.options.filter((_, index) => index !== optionIndex);
        const correctAnswers = question.correctAnswers.filter((answer) => answer !== removedValue);
        return {
          ...question,
          options: options.length > 0 ? options : [""],
          correctAnswers,
        };
      });
      return {
        ...current,
        [ownerId]: {
          ...base,
          questions,
        },
      };
    });
  };

  const toggleQuestionCorrectAnswer = (
    formType: "existing" | "new",
    ownerId: string,
    questionIndex: number,
    optionValue: string,
  ) => {
    const setter = formType === "existing" ? setExerciseForms : setNewExerciseForms;
    if (formType === "new") clearNewExerciseValidationMessage(ownerId);
    setter((current) => {
      const base = current[ownerId] || createExerciseForm();
      const questions = base.questions.map((question, qIndex) => {
        if (qIndex !== questionIndex) return question;
        const isSelected = question.correctAnswers.includes(optionValue);
        const correctAnswers =
          base.type === "single-choice"
            ? isSelected
              ? []
              : [optionValue]
            : isSelected
              ? question.correctAnswers.filter((answer) => answer !== optionValue)
              : [...question.correctAnswers, optionValue];
        return { ...question, correctAnswers };
      });
      return {
        ...current,
        [ownerId]: {
          ...base,
          questions,
        },
      };
    });
  };

  const updateQuestionTextAnswer = (
    formType: "existing" | "new",
    ownerId: string,
    questionIndex: number,
    value: string,
  ) => {
    const setter = formType === "existing" ? setExerciseForms : setNewExerciseForms;
    if (formType === "new") clearNewExerciseValidationMessage(ownerId);
    setter((current) => {
      const base = current[ownerId] || createExerciseForm();
      const questions = base.questions.map((question, qIndex) =>
        qIndex === questionIndex
          ? {
              ...question,
              options: [value],
              correctAnswers: value.trim() ? [value] : [],
            }
          : question,
      );
      return {
        ...current,
        [ownerId]: {
          ...base,
          questions,
        },
      };
    });
  };

  const buildPayload = (): CourseFormData | null => {
    if (!form) return null;

    const basePrice = Number(form.price || 0);
    const salePrice = Number(form.discountPrice || 0);
    const title = form.title.trim();
    const description = form.description.trim();
    const shortDescription = form.shortDescription.trim();
    const category = form.category.trim();
    const requirements = splitLines(form.requirements);
    const outcomes = splitLines(form.outcomes);

    if (title.length < 5 || title.length > 200) {
      setError("Tiêu đề phải có từ 5 đến 200 ký tự.");
      return null;
    }

    if (description.length < 20 || description.length > 2000) {
      setError("Mô tả phải có từ 20 đến 2000 ký tự.");
      return null;
    }

    if (shortDescription.length > 300) {
      setError("Mô tả ngắn không được vượt quá 300 ký tự.");
      return null;
    }

    if (!category) {
      setError("Danh mục là bắt buộc.");
      return null;
    }

    if (!isValidOptionalUrl(form.thumbnail)) {
      setError("Thumbnail phải là URL hợp lệ.");
      return null;
    }

    if (!isValidOptionalUrl(form.previewVideo)) {
      setError("Video giới thiệu phải là URL hợp lệ.");
      return null;
    }

    if (!Number.isFinite(basePrice) || basePrice < 0 || !Number.isFinite(salePrice) || salePrice < 0) {
      setError("Giá bán và giá giảm không được âm.");
      return null;
    }

    if (requirements.length > 10 || requirements.some((item) => item.length > 200)) {
      setError("Yêu cầu đầu vào tối đa 10 dòng, mỗi dòng tối đa 200 ký tự.");
      return null;
    }

    if (outcomes.length > 15 || outcomes.some((item) => item.length > 200)) {
      setError("Kết quả đầu ra tối đa 15 dòng, mỗi dòng tối đa 200 ký tự.");
      return null;
    }

    return {
      title,
      description,
      shortDescription,
      thumbnail: form.thumbnail.trim(),
      previewVideo: form.previewVideo.trim(),
      price: Number.isFinite(basePrice) ? Math.max(basePrice, 0) : 0,
      discountPrice: Number.isFinite(salePrice) ? Math.max(salePrice, 0) : 0,
      category,
      level: form.level,
      language: form.language,
      requirements,
      outcomes,
      isFree: basePrice <= 0,
      isFeatured: form.isFeatured,
    };
  };

  const handleSave = async (options?: { silent?: boolean }) => {
    const payload = buildPayload();
    if (!payload || !course) return;

    try {
      if (options?.silent) {
        setIsAutosaving(true);
      } else {
        setSaving(true);
      }
      setError("");
      const response = await teacherCourseApi.updateCourse(course._id, payload);
      const normalized = normalizeCourse(response.data as Course);
      setCourse(normalized);
      setForm(createFormFromCourse(normalized));
      setIsDirty(false);
      setLastSavedAt(new Date().toISOString());
      isBootstrappingFormRef.current = true;
      if (!options?.silent) {
        setSuccessMessage("Đã lưu bản nháp thành công.");
      }
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể lưu khóa học");
    } finally {
      setSaving(false);
      setIsAutosaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!course) return;

    try {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      setSubmittingReview(true);
      setError("");
      const response = await teacherCourseApi.publishCourse(course._id);
      const normalized = normalizeCourse(response.data as Course);
      setCourse(normalized);
      setForm(createFormFromCourse(normalized));
      setIsDirty(false);
      setLastSavedAt(new Date().toISOString());
      isBootstrappingFormRef.current = true;
      setSuccessMessage("Đã gửi khóa học để duyệt thành công.");
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể gửi duyệt khóa học");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCreateChapter = async () => {
    if (!course || !newChapterTitle.trim()) return;

    try {
      setCreatingChapter(true);
      setError("");
      const response = await chapterApi.createChapter(course._id, newChapterTitle.trim());
      const createdChapter = response.data as Chapter | undefined;
      if (createdChapter?._id && newChapterDescription.trim()) {
        await chapterApi.updateChapter(course._id, createdChapter._id, {
          description: newChapterDescription.trim(),
        });
      }
      setNewChapterTitle("");
      setNewChapterDescription("");
      setSuccessMessage("Đã thêm chương mới.");
      await refreshCurriculum();
      setActiveOverlay(null);
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể tạo chương mới");
    } finally {
      setCreatingChapter(false);
    }
  };

  const handleSaveChapter = async (chapterId: string) => {
    if (!course || !chapterTitles[chapterId]?.trim()) return;

    try {
      setChapterSavingKey(chapterId);
      setError("");
      await chapterApi.updateChapter(course._id, chapterId, {
        title: chapterTitles[chapterId].trim(),
        description: chapterDescriptions[chapterId]?.trim() || "",
      });
      setSuccessMessage("Đã cập nhật chương.");
      await refreshCurriculum();
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể cập nhật chương");
    } finally {
      setChapterSavingKey(null);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!course) return;

    try {
      setChapterDeletingKey(chapterId);
      setError("");
      await chapterApi.deleteChapter(course._id, chapterId);
      setSuccessMessage("Đã xóa chương.");
      await refreshCurriculum();
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể xóa chương");
    } finally {
      setChapterDeletingKey(null);
    }
  };

  const handleCreateLesson = async (chapterId: string) => {
    if (!course) return;
    const title = newLessonTitles[chapterId]?.trim();
    if (!title) return;

    try {
      setLessonSavingKey(`new-${chapterId}`);
      setError("");
      const response = await lessonApi.createLesson(course._id, chapterId, {
        title,
        type: "video",
        isFree: false,
      });
      const createdLessonId = response.data?._id;
      setNewLessonTitles((current) => ({ ...current, [chapterId]: "" }));
      if (createdLessonId) {
        setEditingLessonIds((current) => ({ ...current, [createdLessonId]: true }));
      }
      setSuccessMessage("Đã thêm bài học mới.");
      await refreshCurriculum();
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể tạo bài học mới");
    } finally {
      setLessonSavingKey(null);
    }
  };

  const handleCreateLessonFromOverlay = async (chapterId: string) => {
    if (!course) return;
    const lessonForm = newLessonForms[chapterId] || createLessonForm();
    if (!lessonForm.title.trim()) return;

    try {
      setLessonSavingKey(`new-${chapterId}`);
      setError("");
      await lessonApi.createLesson(course._id, chapterId, {
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim(),
        content: lessonForm.content.trim(),
        videoUrl: lessonForm.videoUrl.trim(),
        documentUrl: lessonForm.documentUrl.trim(),
        documentType: lessonForm.documentUrl.trim() ? lessonForm.documentType : "none",
        type: "video",
        isFree: lessonForm.isFree,
      });
      setNewLessonForms((current) => ({ ...current, [chapterId]: createLessonForm() }));
      setSuccessMessage("Đã thêm bài học mới.");
      await refreshCurriculum();
      setActiveOverlay({ kind: "chapter", chapterId });
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể tạo bài học mới");
    } finally {
      setLessonSavingKey(null);
    }
  };

  const handleSaveLesson = async (chapterId: string, lessonId: string) => {
    if (!course) return;
    const lessonForm = lessonForms[lessonId];
    if (!lessonForm?.title.trim()) return;

    try {
      setLessonSavingKey(lessonId);
      setError("");
      await lessonApi.updateLesson(course._id, chapterId, lessonId, {
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim(),
        content: lessonForm.content.trim(),
        videoUrl: lessonForm.videoUrl.trim(),
        documentUrl: lessonForm.documentUrl.trim(),
        documentType: lessonForm.documentUrl.trim() ? lessonForm.documentType : "none",
        type: "video",
        isFree: lessonForm.isFree,
      });
      setEditingLessonIds((current) => ({ ...current, [lessonId]: false }));
      setSuccessMessage("Đã cập nhật bài học.");
      await refreshCurriculum();
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể cập nhật bài học");
    } finally {
      setLessonSavingKey(null);
    }
  };

  const handleDeleteLesson = async (chapterId: string, lessonId: string) => {
    if (!course) return;

    try {
      setLessonDeletingKey(lessonId);
      setError("");
      await lessonApi.deleteLesson(course._id, chapterId, lessonId);
      setSuccessMessage("Đã xóa bài học.");
      await refreshCurriculum();
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể xóa bài học");
    } finally {
      setLessonDeletingKey(null);
    }
  };

  const handleDuplicateLesson = async (chapterId: string, lesson: Lesson) => {
    if (!course) return;

    const sourceForm = lessonForms[lesson._id] || createLessonForm(lesson);
    const duplicatedTitle = sourceForm.title.trim() ? `${sourceForm.title.trim()} (bản sao)` : "Bài học mới (bản sao)";

    try {
      setLessonSavingKey(`duplicate-${lesson._id}`);
      setError("");
      await lessonApi.createLesson(course._id, chapterId, {
        title: duplicatedTitle,
        description: sourceForm.description.trim(),
        content: sourceForm.content.trim(),
        videoUrl: sourceForm.videoUrl.trim(),
        documentUrl: sourceForm.documentUrl.trim(),
        documentType: sourceForm.documentUrl.trim() ? sourceForm.documentType : "none",
        type: "video",
        isFree: sourceForm.isFree,
      });
      setSuccessMessage("Đã nhân bản bài học.");
      await refreshCurriculum();
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể nhân bản bài học");
    } finally {
      setLessonSavingKey(null);
    }
  };

  const handleCreateExercise = async (chapterId: string, lessonId: string) => {
    if (!course) return;
    const exerciseForm = newExerciseForms[lessonId] || createExerciseForm();
    const validationMessage = getExerciseFormValidationMessage(exerciseForm);
    if (validationMessage) {
      setNewExerciseValidationMessages((current) => ({ ...current, [lessonId]: validationMessage }));
      return;
    }

    try {
      setExerciseSavingKey(`new-${lessonId}`);
      setError("");
      await teacherExerciseApi.createExercise(course._id, chapterId, lessonId, buildExercisePayload(exerciseForm));
      setNewExerciseForms((current) => ({ ...current, [lessonId]: createExerciseForm() }));
      clearNewExerciseValidationMessage(lessonId);
      setSuccessMessage("Đã thêm bài tập.");
      await refreshCurriculum();
      setActiveOverlay({ kind: "lesson", chapterId, lessonId });
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể tạo bài tập");
    } finally {
      setExerciseSavingKey(null);
    }
  };

  const handleSaveExercise = async (chapterId: string, lessonId: string, exerciseId: string) => {
    if (!course) return;
    const exerciseForm = exerciseForms[exerciseId];
    if (!exerciseForm || !isExerciseFormValid(exerciseForm)) return;

    try {
      setExerciseSavingKey(exerciseId);
      setError("");
      await teacherExerciseApi.updateExercise(course._id, chapterId, lessonId, exerciseId, buildExercisePayload(exerciseForm));
      setEditingExerciseIds((current) => ({ ...current, [exerciseId]: false }));
      setSuccessMessage("Đã cập nhật bài tập.");
      await refreshCurriculum();
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể cập nhật bài tập");
    } finally {
      setExerciseSavingKey(null);
    }
  };

  const handleDeleteExercise = async (chapterId: string, lessonId: string, exerciseId: string) => {
    if (!course) return;

    try {
      setExerciseDeletingKey(exerciseId);
      setError("");
      await teacherExerciseApi.deleteExercise(course._id, chapterId, lessonId, exerciseId);
      setSuccessMessage("Đã xóa bài tập.");
      await refreshCurriculum();
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể xóa bài tập");
    } finally {
      setExerciseDeletingKey(null);
    }
  };

  const handleMoveChapter = async (chapterIndex: number, direction: "up" | "down") => {
    if (!course) return;

    const targetIndex = direction === "up" ? chapterIndex - 1 : chapterIndex + 1;
    if (targetIndex < 0 || targetIndex >= curriculum.length) return;

    const reordered = [...curriculum];
    const currentChapter = reordered[chapterIndex];
    const targetChapter = reordered[targetIndex];
    reordered[chapterIndex] = targetChapter;
    reordered[targetIndex] = currentChapter;

    const normalized = reordered.map((chapter, index) => ({ ...chapter, order: index }));
    const affectedIds = [currentChapter._id, targetChapter._id];

    try {
      setChapterReorderingKey(currentChapter._id);
      setError("");
      setCurriculum(normalized);
      await Promise.all(
        normalized
          .filter((chapter) => affectedIds.includes(chapter._id))
          .map((chapter) =>
            chapterApi.updateChapter(course._id, chapter._id, {
              order: chapter.order,
            }),
          ),
      );
      setSuccessMessage("Đã cập nhật thứ tự chương.");
      await refreshCurriculum();
    } catch (requestError) {
      setCurriculum(curriculum);
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể cập nhật thứ tự chương");
    } finally {
      setChapterReorderingKey(null);
    }
  };

  const handleMoveLesson = async (chapterId: string, lessonIndex: number, direction: "up" | "down") => {
    if (!course) return;

    const chapter = curriculum.find((item) => item._id === chapterId);
    const lessons = chapter?.lessons || [];
    const targetIndex = direction === "up" ? lessonIndex - 1 : lessonIndex + 1;
    if (!chapter || targetIndex < 0 || targetIndex >= lessons.length) return;

    const reorderedLessons = [...lessons];
    const currentLesson = reorderedLessons[lessonIndex];
    const targetLesson = reorderedLessons[targetIndex];
    reorderedLessons[lessonIndex] = targetLesson;
    reorderedLessons[targetIndex] = currentLesson;

    const normalizedLessons = reorderedLessons.map((lesson, index) => ({ ...lesson, order: index }));
    const affectedIds = [currentLesson._id, targetLesson._id];

    try {
      setLessonReorderingKey(currentLesson._id);
      setError("");
      setCurriculum((current) =>
        current.map((item) =>
          item._id === chapterId ? { ...item, lessons: normalizedLessons } : item,
        ),
      );
      await Promise.all(
        normalizedLessons
          .filter((lesson) => affectedIds.includes(lesson._id))
          .map((lesson) =>
            lessonApi.updateLesson(course._id, chapterId, lesson._id, {
              order: lesson.order,
            }),
          ),
      );
      setSuccessMessage("Đã cập nhật thứ tự bài học.");
      await refreshCurriculum();
    } catch (requestError) {
      await refreshCurriculum();
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể cập nhật thứ tự bài học");
    } finally {
      setLessonReorderingKey(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    if (pendingDelete.kind === "chapter") {
      await handleDeleteChapter(pendingDelete.chapterId);
    }

    if (pendingDelete.kind === "lesson") {
      await handleDeleteLesson(pendingDelete.chapterId, pendingDelete.lessonId);
    }

    if (pendingDelete.kind === "exercise") {
      await handleDeleteExercise(pendingDelete.chapterId, pendingDelete.lessonId, pendingDelete.exerciseId);
    }

    setPendingDelete(null);
  };

  useEffect(() => {
    if (!isDirty || !form || loading || saving || isAutosaving || submittingReview) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      void handleSave({ silent: true });
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [form, isDirty, loading, saving, isAutosaving, submittingReview]);

  const deleteLoading =
    pendingDelete?.kind === "chapter"
      ? chapterDeletingKey === pendingDelete.chapterId
      : pendingDelete?.kind === "lesson"
        ? lessonDeletingKey === pendingDelete.lessonId
        : pendingDelete?.kind === "exercise"
          ? exerciseDeletingKey === pendingDelete.exerciseId
          : false;

  if (loading) {
    return (
      <div className="content-stack">
        <Card className="p-10 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-600" />
          <p className="mt-4 text-sm text-muted-foreground">Đang tải thông tin khóa học...</p>
        </Card>
      </div>
    );
  }

  if (!course || !form) {
    return (
      <div className="content-stack">
        <Card className="p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Không tìm thấy khóa học để chỉnh sửa.</p>
          <div className="mt-6">
            <Button onClick={() => router.push("/teacher/courses")}>Quay lại danh sách</Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentStatus = statusMeta[course.status] || statusMeta.draft;
  const canOpenPublicPage = course.status === "published" && Boolean(course.slug);

  return (
    <div className="content-stack">
      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title={
          pendingDelete?.kind === "chapter"
            ? "Xóa chương"
            : pendingDelete?.kind === "lesson"
              ? "Xóa bài học"
              : "Xóa bài tập"
        }
        description={
          pendingDelete
            ? `Bạn có chắc muốn xóa ${pendingDelete.title}? Hành động này không thể hoàn tác.`
            : ""
        }
        confirmText="Xóa"
        cancelText="Hủy"
        variant="destructive"
        isLoading={deleteLoading}
      />

      <Modal
        isOpen={Boolean(activeOverlay)}
        onClose={() => setActiveOverlay(null)}
        size="full"
        title={
          activeOverlay?.kind === "createChapter"
            ? "Tạo chương"
            : activeOverlay?.kind === "chapter"
              ? "Chỉnh sửa chương"
              : activeOverlay?.kind === "lesson"
                ? "Chỉnh sửa bài học"
                : activeOverlay?.kind === "createLesson"
                  ? "Tạo bài học"
                  : activeOverlay?.kind === "createExercise"
                    ? "Tạo bài tập"
                    : "Chỉnh sửa bài tập"
        }
        className="max-h-[92vh] overflow-y-auto"
      >
        {activeOverlay?.kind === "createChapter" && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input
                  label="Tên chương"
                  value={newChapterTitle}
                  onChange={(event) => setNewChapterTitle(event.target.value)}
                  placeholder="Ví dụ: Nền tảng phát âm"
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Mô tả chương"
                  value={newChapterDescription}
                  onChange={(event) => setNewChapterDescription(event.target.value)}
                  placeholder="Mô tả ngắn về nội dung của chương này"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                isLoading={creatingChapter}
                onClick={handleCreateChapter}
                disabled={!newChapterTitle.trim()}
              >
                Thêm chương
              </Button>
            </div>
          </div>
        )}

        {activeOverlay?.kind === "chapter" && activeChapter && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input
                  label="Tên chương"
                  value={chapterTitles[activeChapter._id] || ""}
                  onChange={(event) =>
                    setChapterTitles((current) => ({ ...current, [activeChapter._id]: event.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Mô tả chương"
                  value={chapterDescriptions[activeChapter._id] || ""}
                  onChange={(event) =>
                    setChapterDescriptions((current) => ({ ...current, [activeChapter._id]: event.target.value }))
                  }
                  placeholder="Mô tả ngắn về nội dung của chương này"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                leftIcon={<Save className="h-4 w-4" />}
                isLoading={chapterSavingKey === activeChapter._id}
                onClick={() => handleSaveChapter(activeChapter._id)}
              >
                Lưu chương
              </Button>
            </div>
          </div>
        )}

        {activeOverlay?.kind === "createLesson" && activeChapter && (
          <div className="space-y-5">
            <Button
              variant="ghost"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => setActiveOverlay({ kind: "chapter", chapterId: activeChapter._id })}
            >
              Quay lại chương
            </Button>

            {(() => {
              const lessonForm = newLessonForms[activeChapter._id] || createLessonForm();
              return (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Input
                      label="Tiêu đề bài học"
                      value={lessonForm.title}
                      onChange={(event) => updateNewLessonForm(activeChapter._id, "title", event.target.value)}
                    />
                  </div>
                  <Textarea
                    label="Mô tả ngắn"
                    value={lessonForm.description}
                    onChange={(event) => updateNewLessonForm(activeChapter._id, "description", event.target.value)}
                  />
                  <Textarea
                    label="Nội dung văn bản"
                    value={lessonForm.content}
                    onChange={(event) => updateNewLessonForm(activeChapter._id, "content", event.target.value)}
                  />
                  <Input
                    label="Video URL"
                    value={lessonForm.videoUrl}
                    onChange={(event) => updateNewLessonForm(activeChapter._id, "videoUrl", event.target.value)}
                  />
                  <div className="flex items-end">
                    <TeacherFileUploadButton
                      accept="video/mp4,video/mpeg,video/webm"
                      label="Upload video bài học"
                      uploadType="video"
                      onUploaded={(url) => {
                        updateNewLessonForm(activeChapter._id, "videoUrl", url);
                        updateNewLessonForm(activeChapter._id, "type", "video");
                      }}
                      onError={setError}
                    />
                  </div>
                  <Input
                    label="Tài liệu URL"
                    value={lessonForm.documentUrl}
                    onChange={(event) => updateNewLessonForm(activeChapter._id, "documentUrl", event.target.value)}
                  />
                  <div className="flex items-end">
                    <TeacherFileUploadButton
                      accept={lessonDocumentAccept}
                      label="Upload tài liệu"
                      uploadType="document"
                      onUploaded={(url) => {
                        updateNewLessonForm(activeChapter._id, "documentUrl", url);
                        updateNewLessonForm(activeChapter._id, "documentType", getDocumentTypeFromUrl(url));
                      }}
                      onError={setError}
                    />
                  </div>
                  <Select
                    label="Loại tài liệu"
                    options={[
                      { value: "none", label: "Không có" },
                      { value: "pdf", label: "PDF" },
                      { value: "doc", label: "DOC" },
                      { value: "ppt", label: "PPT" },
                    ]}
                    value={lessonForm.documentType}
                    onChange={(value) => updateNewLessonForm(activeChapter._id, "documentType", value as LessonEditorForm["documentType"])}
                  />
                  <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-border bg-surface/70 p-4 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={lessonForm.isFree}
                      onChange={(event) => updateNewLessonForm(activeChapter._id, "isFree", event.target.checked)}
                      className="h-4 w-4 rounded border-border"
                    />
                    Cho phép học thử miễn phí bài học này
                  </label>
                  <div className="md:col-span-2 flex justify-end">
                    <Button
                      leftIcon={<Save className="h-4 w-4" />}
                      isLoading={lessonSavingKey === `new-${activeChapter._id}`}
                      onClick={() => handleCreateLessonFromOverlay(activeChapter._id)}
                      disabled={!lessonForm.title.trim()}
                    >
                      Tạo bài học
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeOverlay?.kind === "lesson" && activeChapter && activeLesson && (
          <div className="space-y-5">
            <Button
              variant="ghost"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => setActiveOverlay({ kind: "chapter", chapterId: activeChapter._id })}
            >
              Quay lại chương
            </Button>

            <div className="grid gap-4 md:grid-cols-2">
              {(() => {
                const lessonForm = lessonForms[activeLesson._id] || createLessonForm(activeLesson);
                const lessonPreviewVideo = getYoutubeEmbedUrl(lessonForm.videoUrl || activeLesson.videoUrl || "");

                return (
                  <>
                    <div className="md:col-span-2">
                      <Input
                        label="Tiêu đề bài học"
                        value={lessonForm.title}
                        onChange={(event) => updateLessonForm(activeLesson._id, "title", event.target.value)}
                      />
                    </div>
                    <Textarea
                      label="Mô tả ngắn"
                      value={lessonForm.description}
                      onChange={(event) => updateLessonForm(activeLesson._id, "description", event.target.value)}
                    />
                    <Textarea
                      label="Nội dung văn bản"
                      value={lessonForm.content}
                      onChange={(event) => updateLessonForm(activeLesson._id, "content", event.target.value)}
                    />
                    <Input
                      label="Video URL"
                      value={lessonForm.videoUrl}
                      onChange={(event) => updateLessonForm(activeLesson._id, "videoUrl", event.target.value)}
                    />
                    <div className="flex items-end">
                      <TeacherFileUploadButton
                        accept="video/mp4,video/mpeg,video/webm"
                        label="Upload video bài học"
                        uploadType="video"
                        onUploaded={(url) => {
                          updateLessonForm(activeLesson._id, "videoUrl", url);
                          updateLessonForm(activeLesson._id, "type", "video");
                        }}
                        onError={setError}
                      />
                    </div>
                    <Input
                      label="Tài liệu URL"
                      value={lessonForm.documentUrl}
                      onChange={(event) => updateLessonForm(activeLesson._id, "documentUrl", event.target.value)}
                    />
                    <div className="flex items-end">
                      <TeacherFileUploadButton
                        accept={lessonDocumentAccept}
                        label="Upload tài liệu"
                        uploadType="document"
                        onUploaded={(url) => {
                          updateLessonForm(activeLesson._id, "documentUrl", url);
                          updateLessonForm(activeLesson._id, "documentType", getDocumentTypeFromUrl(url));
                        }}
                        onError={setError}
                      />
                    </div>
                    <Select
                      label="Loại tài liệu"
                      options={[
                        { value: "none", label: "Không có" },
                        { value: "pdf", label: "PDF" },
                        { value: "doc", label: "DOC" },
                        { value: "ppt", label: "PPT" },
                      ]}
                      value={lessonForm.documentType}
                      onChange={(value) => updateLessonForm(activeLesson._id, "documentType", value as LessonEditorForm["documentType"])}
                    />
                    <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-border bg-surface/70 p-4 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={lessonForm.isFree}
                        onChange={(event) => updateLessonForm(activeLesson._id, "isFree", event.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                      Cho phép học thử miễn phí bài học này
                    </label>
                    <div className="md:col-span-2 overflow-hidden rounded-xl border border-border bg-white">
                      <div className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">Preview video bài học</div>
                      <div className="aspect-video">
                        {lessonPreviewVideo ? (
                          <iframe
                            src={lessonPreviewVideo}
                            title={`Preview bài học ${activeLesson.title}`}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Video className="h-4 w-4" />
                            Chưa có video bài học hợp lệ
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
                      <Button
                        leftIcon={<Save className="h-4 w-4" />}
                        isLoading={lessonSavingKey === activeLesson._id}
                        onClick={() => handleSaveLesson(activeChapter._id, activeLesson._id)}
                      >
                        Lưu bài học
                      </Button>
                    </div>

                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeOverlay?.kind === "createExercise" && activeChapter && activeLesson && (
          <div className="space-y-5">
            <Button
              variant="ghost"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => setActiveOverlay({ kind: "lesson", chapterId: activeChapter._id, lessonId: activeLesson._id })}
            >
              Quay lại bài học
            </Button>

            {(() => {
              const exerciseForm = newExerciseForms[activeLesson._id] || createExerciseForm();
              const validationMessage = newExerciseValidationMessages[activeLesson._id];
              return (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Tiêu đề bài tập"
                      value={exerciseForm.title}
                      onChange={(event) => updateNewExerciseForm(activeLesson._id, "title", event.target.value)}
                    />
                    <Select
                      label="Loại bài tập"
                      options={exerciseTypeOptions}
                      value={exerciseForm.type}
                      onChange={(value) => updateNewExerciseForm(activeLesson._id, "type", value as ExerciseType)}
                    />
                    <Select
                      label="Kỹ năng"
                      options={exerciseSkillOptions}
                      value={exerciseForm.skill}
                      onChange={(value) => updateNewExerciseForm(activeLesson._id, "skill", value as ExerciseSkill)}
                    />
                    <Select
                      label="Trình độ"
                      options={levelOptions}
                      value={exerciseForm.level}
                      onChange={(value) => updateNewExerciseForm(activeLesson._id, "level", value as CourseLevel)}
                    />
                    <Input
                      label="Thời gian làm bài (phút)"
                      type="number"
                      min={0}
                      value={exerciseForm.timeLimit}
                      onChange={(event) => updateNewExerciseForm(activeLesson._id, "timeLimit", event.target.value)}
                    />
                    <Input
                      label="Điểm đạt (%)"
                      type="number"
                      min={0}
                      max={100}
                      value={exerciseForm.passingScore}
                      onChange={(event) => updateNewExerciseForm(activeLesson._id, "passingScore", event.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    {exerciseForm.questions.map((question, questionIndex) => (
                      <div key={`new-exercise-modal-${questionIndex}`} className="rounded-xl border border-border bg-surface/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">Câu hỏi {questionIndex + 1}</p>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Xóa câu hỏi"
                            aria-label="Xóa câu hỏi"
                            onClick={() => removeExerciseQuestion("new", activeLesson._id, questionIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <Textarea
                              label="Nội dung câu hỏi"
                              value={question.questionText}
                              onChange={(event) => updateExerciseQuestion("new", activeLesson._id, questionIndex, "questionText", event.target.value)}
                            />
                          </div>
                          <Input
                            label="Điểm"
                            type="number"
                            min={1}
                            value={question.points}
                            onChange={(event) => updateExerciseQuestion("new", activeLesson._id, questionIndex, "points", event.target.value)}
                          />
                          <Textarea
                            label="Giải thích"
                            value={question.explanation}
                            onChange={(event) => updateExerciseQuestion("new", activeLesson._id, questionIndex, "explanation", event.target.value)}
                          />
                        </div>
                        {exerciseForm.type === "fill-blank" || exerciseForm.type === "short-answer" ? (
                          <div className="mt-4">
                            <Input
                              label="Đáp án đúng"
                              value={question.correctAnswers[0] || ""}
                              onChange={(event) => updateQuestionTextAnswer("new", activeLesson._id, questionIndex, event.target.value)}
                            />
                          </div>
                        ) : (
                          <div className="mt-4 space-y-3">
                            {question.options.map((option, optionIndex) => (
                              <div key={`new-exercise-option-${questionIndex}-${optionIndex}`} className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-end">
                                <input
                                  type={exerciseForm.type === "single-choice" ? "radio" : "checkbox"}
                                  checked={question.correctAnswers.includes(option)}
                                  onChange={() => toggleQuestionCorrectAnswer("new", activeLesson._id, questionIndex, option)}
                                  className="mb-3 h-4 w-4 rounded border-border"
                                />
                                <Input
                                  label={optionIndex === 0 ? "Các đáp án" : undefined}
                                  value={option}
                                  onChange={(event) => updateQuestionOption("new", activeLesson._id, questionIndex, optionIndex, event.target.value)}
                                />
                                <Button
                                  variant="ghost"
                                  title="Xóa đáp án"
                                  aria-label="Xóa đáp án"
                                  onClick={() => removeQuestionOption("new", activeLesson._id, questionIndex, optionIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => addQuestionOption("new", activeLesson._id, questionIndex)}>
                              Thêm đáp án
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap justify-between gap-3">
                    <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => addExerciseQuestion("new", activeLesson._id)}>
                      Thêm câu hỏi
                    </Button>
                    <div className="flex flex-col items-end gap-2">
                      {validationMessage && <p className="text-sm font-medium text-error">{validationMessage}</p>}
                      <Button
                        leftIcon={<Save className="h-4 w-4" />}
                        isLoading={exerciseSavingKey === `new-${activeLesson._id}`}
                        onClick={() => handleCreateExercise(activeChapter._id, activeLesson._id)}
                      >
                        Tạo bài tập
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {activeOverlay?.kind === "exercise" && activeChapter && activeLesson && activeExercise && (
          <div className="space-y-5">
            <Button
              variant="ghost"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => setActiveOverlay({ kind: "lesson", chapterId: activeChapter._id, lessonId: activeLesson._id })}
            >
              Quay lại bài học
            </Button>

            {(() => {
              const exerciseForm = exerciseForms[activeExercise._id] || createExerciseForm(activeExercise);
              return (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Tiêu đề bài tập"
                      value={exerciseForm.title}
                      onChange={(event) => updateExerciseForm(activeExercise._id, "title", event.target.value)}
                    />
                    <Select
                      label="Loại bài tập"
                      options={exerciseTypeOptions}
                      value={exerciseForm.type}
                      onChange={(value) => updateExerciseForm(activeExercise._id, "type", value as ExerciseType)}
                    />
                    <Select
                      label="Kỹ năng"
                      options={exerciseSkillOptions}
                      value={exerciseForm.skill}
                      onChange={(value) => updateExerciseForm(activeExercise._id, "skill", value as ExerciseSkill)}
                    />
                    <Select
                      label="Trình độ"
                      options={levelOptions}
                      value={exerciseForm.level}
                      onChange={(value) => updateExerciseForm(activeExercise._id, "level", value as CourseLevel)}
                    />
                    <Input
                      label="Thời gian làm bài (phút)"
                      type="number"
                      min={0}
                      value={exerciseForm.timeLimit}
                      onChange={(event) => updateExerciseForm(activeExercise._id, "timeLimit", event.target.value)}
                    />
                    <Input
                      label="Điểm đạt (%)"
                      type="number"
                      min={0}
                      max={100}
                      value={exerciseForm.passingScore}
                      onChange={(event) => updateExerciseForm(activeExercise._id, "passingScore", event.target.value)}
                    />
                    <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-border bg-surface/70 p-4 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={exerciseForm.isPublished}
                        onChange={(event) => updateExerciseForm(activeExercise._id, "isPublished", event.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                      Giữ bài tập ở trạng thái xuất bản
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-foreground">Câu hỏi và đáp án</h3>
                      <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => addExerciseQuestion("existing", activeExercise._id)}>
                        Thêm câu hỏi
                      </Button>
                    </div>
                    {exerciseForm.questions.map((question, questionIndex) => (
                      <div key={`${activeExercise._id}-modal-question-${questionIndex}`} className="rounded-xl border border-border bg-surface/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">Câu hỏi {questionIndex + 1}</p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<ArrowUp className="h-4 w-4" />}
                              disabled={questionIndex === 0}
                              onClick={() => moveExerciseQuestion("existing", activeExercise._id, questionIndex, "up")}
                            >
                              Lên
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<ArrowDown className="h-4 w-4" />}
                              disabled={questionIndex === exerciseForm.questions.length - 1}
                              onClick={() => moveExerciseQuestion("existing", activeExercise._id, questionIndex, "down")}
                            >
                              Xuống
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Copy className="h-4 w-4" />}
                              onClick={() => duplicateExerciseQuestion("existing", activeExercise._id, questionIndex)}
                            >
                              Nhân bản
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Trash2 className="h-4 w-4" />}
                              onClick={() => removeExerciseQuestion("existing", activeExercise._id, questionIndex)}
                            >
                              Xóa
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <Textarea
                              label="Nội dung câu hỏi"
                              value={question.questionText}
                              onChange={(event) => updateExerciseQuestion("existing", activeExercise._id, questionIndex, "questionText", event.target.value)}
                            />
                          </div>
                          <Input
                            label="Điểm"
                            type="number"
                            min={1}
                            value={question.points}
                            onChange={(event) => updateExerciseQuestion("existing", activeExercise._id, questionIndex, "points", event.target.value)}
                          />
                          <Textarea
                            label="Giải thích"
                            value={question.explanation}
                            onChange={(event) => updateExerciseQuestion("existing", activeExercise._id, questionIndex, "explanation", event.target.value)}
                          />
                        </div>

                        {exerciseForm.type === "fill-blank" || exerciseForm.type === "short-answer" ? (
                          <div className="mt-4">
                            <Input
                              label="Đáp án đúng"
                              value={question.correctAnswers[0] || ""}
                              onChange={(event) => updateQuestionTextAnswer("existing", activeExercise._id, questionIndex, event.target.value)}
                            />
                          </div>
                        ) : (
                          <div className="mt-4 space-y-3">
                            {question.options.map((option, optionIndex) => {
                              const selected = question.correctAnswers.includes(option);
                              return (
                                <div key={`${activeExercise._id}-modal-question-${questionIndex}-option-${optionIndex}`} className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-end">
                                  <input
                                    type={exerciseForm.type === "single-choice" ? "radio" : "checkbox"}
                                    checked={selected}
                                    onChange={() => toggleQuestionCorrectAnswer("existing", activeExercise._id, questionIndex, option)}
                                    className="mb-3 h-4 w-4 rounded border-border"
                                  />
                                  <Input
                                    label={optionIndex === 0 ? "Các đáp án" : undefined}
                                    value={option}
                                    onChange={(event) => updateQuestionOption("existing", activeExercise._id, questionIndex, optionIndex, event.target.value)}
                                  />
                                  <Button
                                    variant="ghost"
                                    leftIcon={<Trash2 className="h-4 w-4" />}
                                    onClick={() => removeQuestionOption("existing", activeExercise._id, questionIndex, optionIndex)}
                                  >
                                    Xóa
                                  </Button>
                                </div>
                              );
                            })}
                            <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => addQuestionOption("existing", activeExercise._id, questionIndex)}>
                              Thêm đáp án
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap justify-end gap-3">
                    <Button
                      leftIcon={<Save className="h-4 w-4" />}
                      isLoading={exerciseSavingKey === activeExercise._id}
                      onClick={() => handleSaveExercise(activeChapter._id, activeLesson._id, activeExercise._id)}
                      disabled={!isExerciseFormValid(exerciseForm)}
                    >
                      Lưu bài tập
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </Modal>

      <div className="rounded-xl border border-border/80 bg-white p-3 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={currentStatus.badge}>{currentStatus.label}</Badge>
              <Badge variant={isDirty ? "warning" : "success"}>
                {isAutosaving ? "Đang tự lưu..." : isDirty ? "Có thay đổi chưa lưu" : "Đã lưu"}
              </Badge>
              {lastSavedAt && !isDirty && (
                <span>Lần lưu gần nhất: {new Date(lastSavedAt).toLocaleTimeString("vi-VN")}</span>
              )}
            </div>
            <p className="mt-2 truncate text-sm font-semibold text-foreground">{course.title}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <Link href="/teacher/courses">
              <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Danh sách khóa học
              </Button>
            </Link>
            {canOpenPublicPage && (
              <Link href={`/courses/${course.slug}`}>
                <Button variant="outline" leftIcon={<Eye className="h-4 w-4" />}>
                  Xem trang công khai
                </Button>
              </Link>
            )}
            <Button variant="default" leftIcon={<Save className="h-4 w-4" />} isLoading={saving} onClick={() => handleSave()}>
              Lưu bản nháp
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Send className="h-4 w-4" />}
              isLoading={submittingReview}
              onClick={handleSubmitReview}
              disabled={course.status === "pending" || course.status === "published" || !readiness.canSubmit}
            >
              Gửi duyệt
            </Button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
      <div className="sticky top-4 z-10 rounded-xl border border-border/80 bg-white p-2 shadow-card">
        <div className="grid gap-2 md:grid-cols-2">
          {editorTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`rounded-lg border px-3 py-2 text-left transition ${
                  isActive
                    ? "border-primary-200 bg-primary-50 text-primary-700 shadow-soft"
                    : "border-transparent text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <span className="block text-sm font-semibold">{tab.label}</span>
                <span className="mt-1 hidden text-xs leading-5 md:block">{tab.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {activeTab === "info" && (
            <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary-600" />
                Thông tin cơ bản
              </CardTitle>
              <CardDescription>Chỉnh sửa nhanh nội dung cốt lõi của khóa học.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input label="Tiêu đề khóa học" value={form.title} onChange={(event) => updateForm("title", event.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Mô tả chi tiết" value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Mô tả ngắn" value={form.shortDescription} onChange={(event) => updateForm("shortDescription", event.target.value)} />
              </div>
              <Input label="Danh mục" value={form.category} onChange={(event) => updateForm("category", event.target.value)} />
              <Select label="Trình độ" options={levelOptions} value={form.level} onChange={(value) => updateForm("level", value as CourseLevel)} />
              <Select label="Ngôn ngữ" options={languageOptions} value={form.language} onChange={(value) => updateForm("language", value)} />
              <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
                <Input label="Giá gốc" type="number" min={0} value={form.price} onChange={(event) => updateForm("price", event.target.value)} />
                <Input label="Giá bán hiện tại" type="number" min={0} value={form.discountPrice} onChange={(event) => updateForm("discountPrice", event.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-secondary-600" />
                Media và hiển thị
              </CardTitle>
              <CardDescription>Quản lý hình ảnh và video preview cho khóa học.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Input label="Thumbnail URL" value={form.thumbnail} onChange={(event) => updateForm("thumbnail", event.target.value)} />
                <TeacherFileUploadButton
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  label="Upload ảnh bìa"
                  uploadType="thumbnail"
                  onUploaded={(url) => updateForm("thumbnail", url)}
                  onError={setError}
                />
              </div>
              <div className="space-y-2">
                <Input label="Preview video URL" value={form.previewVideo} onChange={(event) => updateForm("previewVideo", event.target.value)} />
                <TeacherFileUploadButton
                  accept="video/mp4,video/mpeg,video/webm"
                  label="Upload video giới thiệu"
                  uploadType="video"
                  onUploaded={(url) => updateForm("previewVideo", url)}
                  onError={setError}
                />
              </div>
              <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-border bg-surface/70 p-4 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) => updateForm("isFeatured", event.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Đánh dấu khóa học nổi bật trong danh sách nội bộ
              </label>
              <div className="md:col-span-2 grid gap-4 lg:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-border bg-surface/70">
                  <div className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">Preview thumbnail</div>
                  <div className="relative aspect-video">
                    {form.thumbnail.trim() ? (
                      <Image src={form.thumbnail} alt={form.title || "Thumbnail khóa học"} fill sizes="720px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Chưa có thumbnail</div>
                    )}
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-border bg-surface/70">
                  <div className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">Preview video</div>
                  <div className="aspect-video">
                    {coursePreviewVideo ? (
                      <iframe
                        src={coursePreviewVideo}
                        title="Preview video khóa học"
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                        <PlayCircle className="h-4 w-4" />
                        Chưa có video preview hợp lệ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent-600" />
                Yêu cầu và kết quả đầu ra
              </CardTitle>
              <CardDescription>Mỗi dòng sẽ tương ứng một bullet hiển thị ở giao diện học viên.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Textarea label="Yêu cầu đầu vào" value={form.requirements} onChange={(event) => updateForm("requirements", event.target.value)} />
              <Textarea label="Kết quả đầu ra" value={form.outcomes} onChange={(event) => updateForm("outcomes", event.target.value)} />
            </CardContent>
          </Card>
            </>
          )}

          {activeTab === "content" && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary-600" />
                      Nội dung khóa học
                    </CardTitle>
                    <CardDescription>
                      Các chương được sắp xếp từ trên xuống. Bấm nút sửa để mở overlay chỉnh sửa chi tiết.
                    </CardDescription>
                  </div>
                  <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setActiveOverlay({ kind: "createChapter" })}>
                    Thêm chương
                  </Button>
                </CardHeader>
                <CardContent className="space-y-5">

                  {loadingCurriculum && (
                    <div className="rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm text-muted-foreground">
                      Đang tải lại nội dung khóa học...
                    </div>
                  )}

                  {curriculum.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-surface/60 p-8 text-center">
                      <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                      <p className="mt-3 font-semibold text-foreground">Chưa có chương nào</p>
                      <p className="mt-1 text-sm text-muted-foreground">Thêm chương đầu tiên để bắt đầu xây dựng nội dung khóa học.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {curriculum.map((chapter, chapterIndex) => {
                        const chapterCollapsed = Boolean(collapsedChapterIds[chapter._id]);
                        return (
                        <div
                          key={chapter._id}
                          className="w-full rounded-xl border border-primary-200 bg-white p-4 text-left shadow-soft"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="primary-light">Chương {chapterIndex + 1}</Badge>
                                <Badge variant="outline">{chapter.lessons?.length || 0} bài học</Badge>
                                <Badge variant="secondary-light">{chapterExerciseCounts[chapter._id] || 0} bài tập</Badge>
                              </div>
                              <h3 className="mt-3 truncate text-lg font-extrabold text-foreground">{chapter.title}</h3>
                              <p className="mt-1 line-clamp-2 text-sm font-medium text-muted-foreground">
                                {chapter.description || "Chưa có mô tả chương."}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                title="Di chuyển chương lên"
                                aria-label="Di chuyển chương lên"
                                isLoading={chapterReorderingKey === chapter._id}
                                disabled={chapterIndex === 0 || Boolean(chapterReorderingKey)}
                                onClick={() => handleMoveChapter(chapterIndex, "up")}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                title="Di chuyển chương xuống"
                                aria-label="Di chuyển chương xuống"
                                isLoading={chapterReorderingKey === chapter._id}
                                disabled={chapterIndex === curriculum.length - 1 || Boolean(chapterReorderingKey)}
                                onClick={() => handleMoveChapter(chapterIndex, "down")}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                title={chapterCollapsed ? "Mở chương" : "Thu gọn chương"}
                                aria-label={chapterCollapsed ? "Mở chương" : "Thu gọn chương"}
                                onClick={() =>
                                  setCollapsedChapterIds((current) => ({
                                    ...current,
                                    [chapter._id]: !current[chapter._id],
                                  }))
                                }
                              >
                                {chapterCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                title="Sửa chương"
                                aria-label="Sửa chương"
                                onClick={() => setActiveOverlay({ kind: "chapter", chapterId: chapter._id })}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Xóa chương"
                                aria-label="Xóa chương"
                                isLoading={chapterDeletingKey === chapter._id}
                                onClick={() => setPendingDelete({ kind: "chapter", chapterId: chapter._id, title: chapter.title || "chương này" })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {!chapterCollapsed && (
                          <div className="mt-4 rounded-xl border border-border bg-surface/60 p-3">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <p className="text-sm font-extrabold uppercase tracking-wide text-foreground">Danh sách bài học</p>
                              <Badge variant="outline">{chapter.lessons?.length || 0} bài học</Badge>
                            </div>
                            <div className="mb-3 flex justify-end">
                              <Button
                                variant="outline"
                                leftIcon={<FilePlus2 className="h-4 w-4" />}
                                onClick={() => setActiveOverlay({ kind: "createLesson", chapterId: chapter._id })}
                              >
                                Tạo bài học
                              </Button>
                            </div>
                            {(chapter.lessons || []).length === 0 ? (
                              <div className="rounded-lg border border-dashed border-border bg-white px-4 py-3 text-sm font-medium text-muted-foreground">
                                Chương này chưa có bài học nào.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {chapter.lessons.map((lesson, lessonIndex) => {
                                  const lessonCollapsed = Boolean(collapsedLessonIds[lesson._id]);
                                  const lessonExercises = lessonExerciseMap[lesson._id] || [];
                                  const durationLabel = formatLessonDuration(lesson.duration);
                                  const hasDocument = hasLessonDocument(lesson);

                                  return (
                                  <div
                                    key={lesson._id}
                                    className="rounded-lg border border-border bg-white px-4 py-3 transition hover:border-primary-200 hover:bg-primary-50/50"
                                  >
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                                          <Badge variant="outline">Bài {lessonIndex + 1}</Badge>
                                          <p className="min-w-0 truncate text-sm font-extrabold text-foreground">{lesson.title}</p>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                          <Badge variant="secondary-light">video</Badge>
                                          <Badge variant="primary-light">{lessonExercises.length} bài tập</Badge>
                                          {durationLabel && (
                                            <Badge variant="outline" className="gap-1">
                                              <Clock className="h-3.5 w-3.5" />
                                              {durationLabel}
                                            </Badge>
                                          )}
                                          {hasDocument && (
                                            <Badge variant="outline" className="gap-1">
                                              <FileText className="h-3.5 w-3.5" />
                                              PDF
                                            </Badge>
                                          )}
                                          {lesson.isFree && <Badge variant="success">Miễn phí</Badge>}
                                        </div>
                                        {!lessonCollapsed && (
                                          <p className="mt-2 line-clamp-1 text-xs font-medium text-muted-foreground">
                                            {lesson.description || "Chưa có mô tả bài học."}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <Button
                                          variant="outline"
                                          size="icon-sm"
                                          title="Di chuyển bài học lên"
                                          aria-label="Di chuyển bài học lên"
                                          disabled={lessonIndex === 0 || Boolean(lessonReorderingKey)}
                                          isLoading={lessonReorderingKey === lesson._id}
                                          onClick={() => handleMoveLesson(chapter._id, lessonIndex, "up")}
                                        >
                                          <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="icon-sm"
                                          title="Di chuyển bài học xuống"
                                          aria-label="Di chuyển bài học xuống"
                                          disabled={lessonIndex === (chapter.lessons?.length || 0) - 1 || Boolean(lessonReorderingKey)}
                                          isLoading={lessonReorderingKey === lesson._id}
                                          onClick={() => handleMoveLesson(chapter._id, lessonIndex, "down")}
                                        >
                                          <ArrowDown className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="icon-sm"
                                          title={lessonCollapsed ? "Mở bài học" : "Thu gọn bài học"}
                                          aria-label={lessonCollapsed ? "Mở bài học" : "Thu gọn bài học"}
                                          onClick={() =>
                                            setCollapsedLessonIds((current) => ({
                                              ...current,
                                              [lesson._id]: !current[lesson._id],
                                            }))
                                          }
                                        >
                                          {lessonCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="icon-sm"
                                          title="Sửa bài học"
                                          aria-label="Sửa bài học"
                                          onClick={() => setActiveOverlay({ kind: "lesson", chapterId: chapter._id, lessonId: lesson._id })}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="icon-sm"
                                          title="Nhân bản bài học"
                                          aria-label="Nhân bản bài học"
                                          isLoading={lessonSavingKey === `duplicate-${lesson._id}`}
                                          onClick={() => handleDuplicateLesson(chapter._id, lesson)}
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon-sm"
                                          title="Xóa bài học"
                                          aria-label="Xóa bài học"
                                          isLoading={lessonDeletingKey === lesson._id}
                                          onClick={() =>
                                            setPendingDelete({
                                              kind: "lesson",
                                              chapterId: chapter._id,
                                              lessonId: lesson._id,
                                              title: lesson.title || "bài học này",
                                            })
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>

                                    {!lessonCollapsed && (
                                      <div className="mt-4 rounded-lg border border-border bg-surface/60 p-3">
                                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-xs font-extrabold uppercase tracking-wide text-foreground">Danh sách bài tập</p>
                                            <Badge variant="outline">{lessonExercises.length} bài tập</Badge>
                                          </div>
                                          <Button
                                            variant="outline"
                                            leftIcon={<FileQuestion className="h-4 w-4" />}
                                            onClick={() => setActiveOverlay({ kind: "createExercise", chapterId: chapter._id, lessonId: lesson._id })}
                                          >
                                            Tạo bài tập
                                          </Button>
                                        </div>
                                        {newExerciseValidationMessages[lesson._id] && (
                                          <p className="mb-3 text-sm font-medium text-error">{newExerciseValidationMessages[lesson._id]}</p>
                                        )}
                                        {lessonExercises.length === 0 ? (
                                          <div className="rounded-lg border border-dashed border-border bg-white px-4 py-3 text-sm font-medium text-muted-foreground">
                                            Bài học này chưa có bài tập nào.
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            {lessonExercises.map((exercise, exerciseIndex) => (
                                              <div key={exercise._id} className="rounded-lg border border-border bg-white px-4 py-3">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                  <div className="min-w-0">
                                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                      <Badge variant="outline">Bài tập {exerciseIndex + 1}</Badge>
                                                      <p className="truncate text-sm font-extrabold text-foreground">{exercise.title || "Bài tập chưa có tiêu đề"}</p>
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                      <Badge variant="secondary-light">{exercise.type}</Badge>
                                                      <Badge variant="primary-light">{exercise.questions?.length || 0} câu hỏi</Badge>
                                                    </div>
                                                  </div>
                                                  <div className="flex flex-wrap gap-2">
                                                    <Button
                                                      variant="outline"
                                                      size="icon-sm"
                                                      title="Sửa bài tập"
                                                      aria-label="Sửa bài tập"
                                                      onClick={() =>
                                                        setActiveOverlay({
                                                          kind: "exercise",
                                                          chapterId: chapter._id,
                                                          lessonId: lesson._id,
                                                          exerciseId: exercise._id,
                                                        })
                                                      }
                                                    >
                                                      <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon-sm"
                                                      title="Xóa bài tập"
                                                      aria-label="Xóa bài tập"
                                                      isLoading={exerciseDeletingKey === exercise._id}
                                                      onClick={() =>
                                                        setPendingDelete({
                                                          kind: "exercise",
                                                          chapterId: chapter._id,
                                                          lessonId: lesson._id,
                                                          exerciseId: exercise._id,
                                                          title: exercise.title || "bài tập này",
                                                        })
                                                      }
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                                })}
                              </div>
                            )}
                          </div>
                          )}
                        </div>
                      );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {(activeTab === "chapters" || activeTab === "lessons" || activeTab === "exercises") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary-600" />
                {activeTab === "chapters"
                  ? "Quản lý chương"
                  : activeTab === "lessons"
                    ? "Quản lý bài học"
                    : "Quản lý bài tập"}
              </CardTitle>
              <CardDescription>
                {activeTab === "chapters"
                  ? "Tạo khung chương trước khi bổ sung bài học và bài tập."
                  : activeTab === "lessons"
                    ? "Chọn chương, thêm bài học và chỉnh sửa nội dung học tập."
                    : "Chọn bài học, tạo bài tập và quản lý câu hỏi/đáp án."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                  label="Tên chương mới"
                  value={newChapterTitle}
                  onChange={(event) => setNewChapterTitle(event.target.value)}
                  placeholder="Ví dụ: Nền tảng phát âm"
                />
                <div className="flex items-end">
                  <Button isLoading={creatingChapter} leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreateChapter}>
                    Thêm chương
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-border bg-surface/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Số chương</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{metrics.chapterCount}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Số bài học</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{metrics.lessonCount}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Bài học miễn phí</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{metrics.freeLessonCount}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Bài tập</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{metrics.exerciseCount}</p>
                </div>
              </div>

              {loadingCurriculum && (
                <div className="rounded-2xl border border-border bg-surface/60 px-4 py-3 text-sm text-muted-foreground">
                  Đang tải lại curriculum...
                </div>
              )}

              {curriculum.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-6 text-center text-sm text-muted-foreground">
                  Chưa có chương nào. Hãy thêm chương đầu tiên để bắt đầu xây dựng cấu trúc khóa học.
                </div>
              ) : (
                <div className="space-y-4">
                  {curriculum.map((chapter, chapterIndex) => (
                    <div key={chapter._id} className="rounded-3xl border border-border bg-white p-5 shadow-soft">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="primary-light">Chương {chapterIndex + 1}</Badge>
                            <Badge variant="outline">{chapter.lessons?.length || 0} bài học</Badge>
                          </div>
                          <Input
                            label="Tên chương"
                            value={chapterTitles[chapter._id] || ""}
                            onChange={(event) =>
                              setChapterTitles((current) => ({ ...current, [chapter._id]: event.target.value }))
                            }
                          />
                          <Textarea
                            label="Mô tả chương"
                            value={chapterDescriptions[chapter._id] || ""}
                            onChange={(event) =>
                              setChapterDescriptions((current) => ({ ...current, [chapter._id]: event.target.value }))
                            }
                            placeholder="Mô tả ngắn về nội dung của chương này"
                          />
                          {chapter.description && <p className="text-sm text-muted-foreground">{chapter.description}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            leftIcon={<ArrowUp className="h-4 w-4" />}
                            isLoading={chapterReorderingKey === chapter._id}
                            disabled={chapterIndex === 0 || Boolean(chapterReorderingKey)}
                            onClick={() => handleMoveChapter(chapterIndex, "up")}
                          >
                            Lên
                          </Button>
                          <Button
                            variant="outline"
                            leftIcon={<ArrowDown className="h-4 w-4" />}
                            isLoading={chapterReorderingKey === chapter._id}
                            disabled={chapterIndex === curriculum.length - 1 || Boolean(chapterReorderingKey)}
                            onClick={() => handleMoveChapter(chapterIndex, "down")}
                          >
                            Xuống
                          </Button>
                          <Button
                            variant="outline"
                            leftIcon={<Save className="h-4 w-4" />}
                            isLoading={chapterSavingKey === chapter._id}
                            onClick={() => handleSaveChapter(chapter._id)}
                          >
                            Lưu chương
                          </Button>
                          <Button
                            variant="ghost"
                            leftIcon={<Trash2 className="h-4 w-4" />}
                            isLoading={chapterDeletingKey === chapter._id}
                            onClick={() =>
                              setPendingDelete({ kind: "chapter", chapterId: chapter._id, title: chapter.title || "chương này" })
                            }
                          >
                            Xóa chương
                          </Button>
                        </div>
                      </div>

                      {(activeTab === "lessons" || activeTab === "exercises") && (
                      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                        <Input
                          label="Tên bài học mới"
                          value={newLessonTitles[chapter._id] || ""}
                          onChange={(event) =>
                            setNewLessonTitles((current) => ({ ...current, [chapter._id]: event.target.value }))
                          }
                          placeholder="Ví dụ: Bài 1 - Giới thiệu"
                        />
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            leftIcon={<FilePlus2 className="h-4 w-4" />}
                            isLoading={lessonSavingKey === `new-${chapter._id}`}
                            onClick={() => handleCreateLesson(chapter._id)}
                          >
                            Thêm bài học
                          </Button>
                        </div>
                      </div>
                      )}

                      {(activeTab === "lessons" || activeTab === "exercises") && (
                      <div className="mt-5 space-y-3">
                        {(chapter.lessons || []).length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-4 text-sm text-muted-foreground">
                            Chương này chưa có bài học nào.
                          </div>
                        ) : (
                          chapter.lessons.map((lesson, lessonIndex) => {
                            const isEditing = Boolean(editingLessonIds[lesson._id]);
                            const lessonForm = lessonForms[lesson._id] || createLessonForm(lesson);
                            const lessonExercises = lessonExerciseMap[lesson._id] || [];
                            const newExerciseForm = newExerciseForms[lesson._id] || createExerciseForm();
                            const newExerciseValidationMessage = newExerciseValidationMessages[lesson._id];
                            const lessonPreviewVideo = getYoutubeEmbedUrl(lessonForm.videoUrl || lesson.videoUrl || "");

                            return (
                              <div key={lesson._id} className="rounded-2xl border border-border bg-surface/70 p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant="outline">Bài {lessonIndex + 1}</Badge>
                                      <Badge variant="secondary-light">video</Badge>
                                      <Badge variant="primary-light">{lessonExercises.length} bài tập</Badge>
                                      {lesson.isFree && <Badge variant="success">Miễn phí</Badge>}
                                    </div>
                                    <h4 className="mt-2 text-base font-semibold text-foreground">{lesson.title}</h4>
                                    {lesson.description && <p className="mt-1 text-sm text-muted-foreground">{lesson.description}</p>}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      variant="outline"
                                      leftIcon={<ArrowUp className="h-4 w-4" />}
                                      isLoading={lessonReorderingKey === lesson._id}
                                      disabled={lessonIndex === 0 || Boolean(lessonReorderingKey)}
                                      onClick={() => handleMoveLesson(chapter._id, lessonIndex, "up")}
                                    >
                                      Lên
                                    </Button>
                                    <Button
                                      variant="outline"
                                      leftIcon={<ArrowDown className="h-4 w-4" />}
                                      isLoading={lessonReorderingKey === lesson._id}
                                      disabled={lessonIndex === (chapter.lessons?.length || 0) - 1 || Boolean(lessonReorderingKey)}
                                      onClick={() => handleMoveLesson(chapter._id, lessonIndex, "down")}
                                    >
                                      Xuống
                                    </Button>
                                    <Button
                                      variant="outline"
                                      leftIcon={<Copy className="h-4 w-4" />}
                                      isLoading={lessonSavingKey === `duplicate-${lesson._id}`}
                                      onClick={() => handleDuplicateLesson(chapter._id, lesson)}
                                    >
                                      Nhân bản
                                    </Button>
                                    <Button
                                      variant="outline"
                                      leftIcon={<Pencil className="h-4 w-4" />}
                                      onClick={() =>
                                        setEditingLessonIds((current) => ({ ...current, [lesson._id]: !current[lesson._id] }))
                                      }
                                    >
                                      {isEditing ? "Đóng chỉnh sửa" : "Chỉnh sửa"}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      leftIcon={<Trash2 className="h-4 w-4" />}
                                      isLoading={lessonDeletingKey === lesson._id}
                                      onClick={() =>
                                        setPendingDelete({
                                          kind: "lesson",
                                          chapterId: chapter._id,
                                          lessonId: lesson._id,
                                          title: lesson.title || "bài học này",
                                        })
                                      }
                                    >
                                      Xóa
                                    </Button>
                                  </div>
                                </div>

                                {isEditing && (
                                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                      <Input
                                        label="Tiêu đề bài học"
                                        value={lessonForm.title}
                                        onChange={(event) => updateLessonForm(lesson._id, "title", event.target.value)}
                                      />
                                    </div>
                                    <Textarea
                                      label="Mô tả ngắn"
                                      value={lessonForm.description}
                                      onChange={(event) => updateLessonForm(lesson._id, "description", event.target.value)}
                                    />
                                    <Textarea
                                      label="Nội dung văn bản"
                                      value={lessonForm.content}
                                      onChange={(event) => updateLessonForm(lesson._id, "content", event.target.value)}
                                    />
                                    <Input
                                      label="Video URL"
                                      value={lessonForm.videoUrl}
                                      onChange={(event) => updateLessonForm(lesson._id, "videoUrl", event.target.value)}
                                    />
                                    <div className="flex items-end">
                                      <TeacherFileUploadButton
                                        accept="video/mp4,video/mpeg,video/webm"
                                        label="Upload video bài học"
                                        uploadType="video"
                                        onUploaded={(url) => {
                                          updateLessonForm(lesson._id, "videoUrl", url);
                                          updateLessonForm(lesson._id, "type", "video");
                                        }}
                                        onError={setError}
                                      />
                                    </div>
                                    <Input
                                      label="Tài liệu URL"
                                      value={lessonForm.documentUrl}
                                      onChange={(event) => updateLessonForm(lesson._id, "documentUrl", event.target.value)}
                                    />
                                    <div className="flex items-end">
                                      <TeacherFileUploadButton
                                        accept={lessonDocumentAccept}
                                        label="Upload tài liệu"
                                        uploadType="document"
                                        onUploaded={(url) => {
                                          updateLessonForm(lesson._id, "documentUrl", url);
                                          updateLessonForm(lesson._id, "documentType", getDocumentTypeFromUrl(url));
                                        }}
                                        onError={setError}
                                      />
                                    </div>
                                    <Select
                                      label="Loại tài liệu"
                                      options={[
                                        { value: "none", label: "Không có" },
                                        { value: "pdf", label: "PDF" },
                                        { value: "doc", label: "DOC" },
                                        { value: "ppt", label: "PPT" },
                                      ]}
                                      value={lessonForm.documentType}
                                      onChange={(value) => updateLessonForm(lesson._id, "documentType", value as LessonEditorForm["documentType"])}
                                    />
                                    <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-border bg-white p-4 text-sm text-foreground">
                                      <input
                                        type="checkbox"
                                        checked={lessonForm.isFree}
                                        onChange={(event) => updateLessonForm(lesson._id, "isFree", event.target.checked)}
                                        className="h-4 w-4 rounded border-border"
                                      />
                                      Cho phép học thử miễn phí bài học này
                                    </label>
                                    <div className="md:col-span-2 overflow-hidden rounded-2xl border border-border bg-white">
                                      <div className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">Preview video bài học</div>
                                      <div className="aspect-video">
                                        {lessonPreviewVideo ? (
                                          <iframe
                                            src={lessonPreviewVideo}
                                            title={`Preview bài học ${lesson.title}`}
                                            className="h-full w-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                          />
                                        ) : (
                                          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                                            <Video className="h-4 w-4" />
                                            Chưa có video bài học hợp lệ
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="md:col-span-2 flex justify-end">
                                      <Button
                                        leftIcon={<Save className="h-4 w-4" />}
                                        isLoading={lessonSavingKey === lesson._id}
                                        onClick={() => handleSaveLesson(chapter._id, lesson._id)}
                                      >
                                        Lưu bài học
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {activeTab === "exercises" && (
                                <div className="mt-5 rounded-2xl border border-border bg-white p-4">
                                  <div className="flex items-center gap-2">
                                    <FileQuestion className="h-4 w-4 text-primary-600" />
                                    <h5 className="text-sm font-semibold text-foreground">Bài tập của bài học</h5>
                                  </div>

                                  <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface/60 p-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                      <Input
                                        label="Tiêu đề bài tập mới"
                                        value={newExerciseForm.title}
                                        onChange={(event) => updateNewExerciseForm(lesson._id, "title", event.target.value)}
                                        placeholder="Ví dụ: Quiz nhanh bài 1"
                                      />
                                      <Select
                                        label="Loại bài tập"
                                        options={exerciseTypeOptions}
                                        value={newExerciseForm.type}
                                        onChange={(value) => updateNewExerciseForm(lesson._id, "type", value as ExerciseType)}
                                      />
                                      <Select
                                        label="Kỹ năng"
                                        options={exerciseSkillOptions}
                                        value={newExerciseForm.skill}
                                        onChange={(value) => updateNewExerciseForm(lesson._id, "skill", value as ExerciseSkill)}
                                      />
                                      <Select
                                        label="Trình độ"
                                        options={levelOptions}
                                        value={newExerciseForm.level}
                                        onChange={(value) => updateNewExerciseForm(lesson._id, "level", value as CourseLevel)}
                                      />
                                      <Input
                                        label="Thời gian làm bài (phút)"
                                        type="number"
                                        min={0}
                                        value={newExerciseForm.timeLimit}
                                        onChange={(event) => updateNewExerciseForm(lesson._id, "timeLimit", event.target.value)}
                                      />
                                      <Input
                                        label="Điểm đạt (%)"
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={newExerciseForm.passingScore}
                                        onChange={(event) => updateNewExerciseForm(lesson._id, "passingScore", event.target.value)}
                                      />
                                      <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-border bg-white p-4 text-sm text-foreground">
                                        <input
                                          type="checkbox"
                                          checked={newExerciseForm.isPublished}
                                          onChange={(event) => updateNewExerciseForm(lesson._id, "isPublished", event.target.checked)}
                                          className="h-4 w-4 rounded border-border"
                                        />
                                        Xuất bản bài tập ngay sau khi lưu
                                      </label>
                                    </div>

                                    <div className="mt-4 space-y-4">
                                      {newExerciseForm.questions.map((question, questionIndex) => (
                                        <div key={`new-${lesson._id}-question-${questionIndex}`} className="rounded-2xl border border-border bg-white p-4">
                                          <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-semibold text-foreground">Câu hỏi {questionIndex + 1}</p>
                                            <div className="flex flex-wrap gap-2">
                                              <Button
                                                variant="outline"
                                                leftIcon={<ArrowUp className="h-4 w-4" />}
                                                disabled={questionIndex === 0}
                                                onClick={() => moveExerciseQuestion("new", lesson._id, questionIndex, "up")}
                                              >
                                                Lên
                                              </Button>
                                              <Button
                                                variant="outline"
                                                leftIcon={<ArrowDown className="h-4 w-4" />}
                                                disabled={questionIndex === newExerciseForm.questions.length - 1}
                                                onClick={() => moveExerciseQuestion("new", lesson._id, questionIndex, "down")}
                                              >
                                                Xuống
                                              </Button>
                                              <Button
                                                variant="outline"
                                                leftIcon={<Copy className="h-4 w-4" />}
                                                onClick={() => duplicateExerciseQuestion("new", lesson._id, questionIndex)}
                                              >
                                                Nhân bản
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                leftIcon={<Trash2 className="h-4 w-4" />}
                                                onClick={() => removeExerciseQuestion("new", lesson._id, questionIndex)}
                                              >
                                                Xóa câu hỏi
                                              </Button>
                                            </div>
                                          </div>

                                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                                            <div className="md:col-span-2">
                                              <Textarea
                                                label="Nội dung câu hỏi"
                                                value={question.questionText}
                                                onChange={(event) =>
                                                  updateExerciseQuestion("new", lesson._id, questionIndex, "questionText", event.target.value)
                                                }
                                              />
                                            </div>
                                            <Input
                                              label="Điểm"
                                              type="number"
                                              min={1}
                                              value={question.points}
                                              onChange={(event) =>
                                                updateExerciseQuestion("new", lesson._id, questionIndex, "points", event.target.value)
                                              }
                                            />
                                            <Textarea
                                              label="Giải thích"
                                              value={question.explanation}
                                              onChange={(event) =>
                                                updateExerciseQuestion("new", lesson._id, questionIndex, "explanation", event.target.value)
                                              }
                                            />
                                          </div>

                                          {(newExerciseForm.type === "fill-blank" || newExerciseForm.type === "short-answer") ? (
                                            <div className="mt-4">
                                              <Input
                                                label="Đáp án đúng"
                                                value={question.correctAnswers[0] || ""}
                                                onChange={(event) =>
                                                  updateQuestionTextAnswer("new", lesson._id, questionIndex, event.target.value)
                                                }
                                              />
                                            </div>
                                          ) : (
                                            <div className="mt-4 space-y-3">
                                              {question.options.map((option, optionIndex) => {
                                                const selected = question.correctAnswers.includes(option);
                                                return (
                                                  <div key={`new-${lesson._id}-question-${questionIndex}-option-${optionIndex}`} className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:items-center">
                                                    <input
                                                      type={newExerciseForm.type === "single-choice" ? "radio" : "checkbox"}
                                                      checked={selected}
                                                      onChange={() => toggleQuestionCorrectAnswer("new", lesson._id, questionIndex, option)}
                                                      className="h-4 w-4 rounded border-border"
                                                    />
                                                    <Input
                                                      label={optionIndex === 0 ? "Các đáp án" : undefined}
                                                      value={option}
                                                      onChange={(event) =>
                                                        updateQuestionOption("new", lesson._id, questionIndex, optionIndex, event.target.value)
                                                      }
                                                    />
                                                    <div className="flex items-end gap-2">
                                                      <Button
                                                        variant="outline"
                                                        leftIcon={<ArrowUp className="h-4 w-4" />}
                                                        disabled={optionIndex === 0}
                                                        onClick={() => moveQuestionOption("new", lesson._id, questionIndex, optionIndex, "up")}
                                                      >
                                                        Lên
                                                      </Button>
                                                      <Button
                                                        variant="outline"
                                                        leftIcon={<ArrowDown className="h-4 w-4" />}
                                                        disabled={optionIndex === question.options.length - 1}
                                                        onClick={() => moveQuestionOption("new", lesson._id, questionIndex, optionIndex, "down")}
                                                      >
                                                        Xuống
                                                      </Button>
                                                    </div>
                                                    <div className="flex items-end">
                                                      <Button
                                                        variant="ghost"
                                                        leftIcon={<Trash2 className="h-4 w-4" />}
                                                        onClick={() => removeQuestionOption("new", lesson._id, questionIndex, optionIndex)}
                                                      >
                                                        Xóa
                                                      </Button>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                              <Button
                                                variant="outline"
                                                leftIcon={<Plus className="h-4 w-4" />}
                                                onClick={() => addQuestionOption("new", lesson._id, questionIndex)}
                                              >
                                                Thêm đáp án
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      ))}

                                      <div className="flex flex-wrap justify-between gap-3">
                                        <Button
                                          variant="outline"
                                          leftIcon={<Plus className="h-4 w-4" />}
                                          onClick={() => addExerciseQuestion("new", lesson._id)}
                                        >
                                          Thêm câu hỏi
                                        </Button>
                                        <Button
                                          leftIcon={<Save className="h-4 w-4" />}
                                          isLoading={exerciseSavingKey === `new-${lesson._id}`}
                                          onClick={() => handleCreateExercise(chapter._id, lesson._id)}
                                        >
                                          Tạo bài tập
                                        </Button>
                                      </div>
                                      {newExerciseValidationMessage && (
                                        <p className="text-sm font-medium text-error">
                                          {newExerciseValidationMessage}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-4 space-y-3">
                                    {lessonExercises.length === 0 ? (
                                      <div className="rounded-xl border border-dashed border-border bg-surface/60 p-4 text-sm text-muted-foreground">
                                        Bài học này chưa có bài tập nào.
                                      </div>
                                    ) : (
                                      lessonExercises.map((exercise, exerciseIndex) => {
                                        const isEditingExercise = Boolean(editingExerciseIds[exercise._id]);
                                        const exerciseForm = exerciseForms[exercise._id] || createExerciseForm(exercise);

                                        return (
                                          <div key={exercise._id} className="rounded-xl border border-border bg-surface/60 p-4">
                                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                              <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                  <Badge variant="outline">Bài tập {exerciseIndex + 1}</Badge>
                                                  <Badge variant="secondary-light">{exercise.type}</Badge>
                                                  <Badge variant="primary-light">{exercise.questions?.length || 0} câu hỏi</Badge>
                                                </div>
                                                <p className="mt-2 text-sm font-semibold text-foreground">{exercise.title || "Bài tập chưa có tiêu đề"}</p>
                                              </div>
                                              <div className="flex flex-wrap gap-2">
                                                <Button
                                                  variant="outline"
                                                  leftIcon={<Pencil className="h-4 w-4" />}
                                                  onClick={() =>
                                                    setEditingExerciseIds((current) => ({
                                                      ...current,
                                                      [exercise._id]: !current[exercise._id],
                                                    }))
                                                  }
                                                >
                                                  {isEditingExercise ? "Đóng chỉnh sửa" : "Chỉnh sửa"}
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  leftIcon={<Trash2 className="h-4 w-4" />}
                                                  isLoading={exerciseDeletingKey === exercise._id}
                                                  onClick={() =>
                                                    setPendingDelete({
                                                      kind: "exercise",
                                                      chapterId: chapter._id,
                                                      lessonId: lesson._id,
                                                      exerciseId: exercise._id,
                                                      title: exercise.title || "bài tập này",
                                                    })
                                                  }
                                                >
                                                  Xóa
                                                </Button>
                                              </div>
                                            </div>

                                            {isEditingExercise && (
                                              <div className="mt-4 rounded-2xl border border-border bg-white p-4">
                                                <div className="grid gap-4 md:grid-cols-2">
                                                  <Input
                                                    label="Tiêu đề bài tập"
                                                    value={exerciseForm.title}
                                                    onChange={(event) => updateExerciseForm(exercise._id, "title", event.target.value)}
                                                  />
                                                  <Select
                                                    label="Loại bài tập"
                                                    options={exerciseTypeOptions}
                                                    value={exerciseForm.type}
                                                    onChange={(value) => updateExerciseForm(exercise._id, "type", value as ExerciseType)}
                                                  />
                                                  <Select
                                                    label="Kỹ năng"
                                                    options={exerciseSkillOptions}
                                                    value={exerciseForm.skill}
                                                    onChange={(value) => updateExerciseForm(exercise._id, "skill", value as ExerciseSkill)}
                                                  />
                                                  <Select
                                                    label="Trình độ"
                                                    options={levelOptions}
                                                    value={exerciseForm.level}
                                                    onChange={(value) => updateExerciseForm(exercise._id, "level", value as CourseLevel)}
                                                  />
                                                  <Input
                                                    label="Thời gian làm bài (phút)"
                                                    type="number"
                                                    min={0}
                                                    value={exerciseForm.timeLimit}
                                                    onChange={(event) => updateExerciseForm(exercise._id, "timeLimit", event.target.value)}
                                                  />
                                                  <Input
                                                    label="Điểm đạt (%)"
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={exerciseForm.passingScore}
                                                    onChange={(event) => updateExerciseForm(exercise._id, "passingScore", event.target.value)}
                                                  />
                                                  <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-border bg-surface/70 p-4 text-sm text-foreground">
                                                    <input
                                                      type="checkbox"
                                                      checked={exerciseForm.isPublished}
                                                      onChange={(event) => updateExerciseForm(exercise._id, "isPublished", event.target.checked)}
                                                      className="h-4 w-4 rounded border-border"
                                                    />
                                                    Giữ bài tập ở trạng thái xuất bản
                                                  </label>
                                                </div>

                                                <div className="mt-4 space-y-4">
                                                  {exerciseForm.questions.map((question, questionIndex) => (
                                                    <div key={`${exercise._id}-question-${questionIndex}`} className="rounded-2xl border border-border bg-surface/60 p-4">
                                                      <div className="flex items-center justify-between gap-3">
                                                        <p className="text-sm font-semibold text-foreground">Câu hỏi {questionIndex + 1}</p>
                                                        <div className="flex flex-wrap gap-2">
                                                          <Button
                                                            variant="outline"
                                                            leftIcon={<ArrowUp className="h-4 w-4" />}
                                                            disabled={questionIndex === 0}
                                                            onClick={() => moveExerciseQuestion("existing", exercise._id, questionIndex, "up")}
                                                          >
                                                            Lên
                                                          </Button>
                                                          <Button
                                                            variant="outline"
                                                            leftIcon={<ArrowDown className="h-4 w-4" />}
                                                            disabled={questionIndex === exerciseForm.questions.length - 1}
                                                            onClick={() => moveExerciseQuestion("existing", exercise._id, questionIndex, "down")}
                                                          >
                                                            Xuống
                                                          </Button>
                                                          <Button
                                                            variant="outline"
                                                            leftIcon={<Copy className="h-4 w-4" />}
                                                            onClick={() => duplicateExerciseQuestion("existing", exercise._id, questionIndex)}
                                                          >
                                                            Nhân bản
                                                          </Button>
                                                          <Button
                                                            variant="ghost"
                                                            leftIcon={<Trash2 className="h-4 w-4" />}
                                                            onClick={() => removeExerciseQuestion("existing", exercise._id, questionIndex)}
                                                          >
                                                            Xóa câu hỏi
                                                          </Button>
                                                        </div>
                                                      </div>

                                                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                                                        <div className="md:col-span-2">
                                                          <Textarea
                                                            label="Nội dung câu hỏi"
                                                            value={question.questionText}
                                                            onChange={(event) =>
                                                              updateExerciseQuestion("existing", exercise._id, questionIndex, "questionText", event.target.value)
                                                            }
                                                          />
                                                        </div>
                                                        <Input
                                                          label="Điểm"
                                                          type="number"
                                                          min={1}
                                                          value={question.points}
                                                          onChange={(event) =>
                                                            updateExerciseQuestion("existing", exercise._id, questionIndex, "points", event.target.value)
                                                          }
                                                        />
                                                        <Textarea
                                                          label="Giải thích"
                                                          value={question.explanation}
                                                          onChange={(event) =>
                                                            updateExerciseQuestion("existing", exercise._id, questionIndex, "explanation", event.target.value)
                                                          }
                                                        />
                                                      </div>

                                                      {(exerciseForm.type === "fill-blank" || exerciseForm.type === "short-answer") ? (
                                                        <div className="mt-4">
                                                          <Input
                                                            label="Đáp án đúng"
                                                            value={question.correctAnswers[0] || ""}
                                                            onChange={(event) =>
                                                              updateQuestionTextAnswer("existing", exercise._id, questionIndex, event.target.value)
                                                            }
                                                          />
                                                        </div>
                                                      ) : (
                                                        <div className="mt-4 space-y-3">
                                                          {question.options.map((option, optionIndex) => {
                                                            const selected = question.correctAnswers.includes(option);
                                                            return (
                                                              <div key={`${exercise._id}-question-${questionIndex}-option-${optionIndex}`} className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:items-center">
                                                                <input
                                                                  type={exerciseForm.type === "single-choice" ? "radio" : "checkbox"}
                                                                  checked={selected}
                                                                  onChange={() => toggleQuestionCorrectAnswer("existing", exercise._id, questionIndex, option)}
                                                                  className="h-4 w-4 rounded border-border"
                                                                />
                                                                <Input
                                                                  label={optionIndex === 0 ? "Các đáp án" : undefined}
                                                                  value={option}
                                                                  onChange={(event) =>
                                                                    updateQuestionOption("existing", exercise._id, questionIndex, optionIndex, event.target.value)
                                                                  }
                                                                />
                                                                <div className="flex items-end gap-2">
                                                                  <Button
                                                                    variant="outline"
                                                                    leftIcon={<ArrowUp className="h-4 w-4" />}
                                                                    disabled={optionIndex === 0}
                                                                    onClick={() => moveQuestionOption("existing", exercise._id, questionIndex, optionIndex, "up")}
                                                                  >
                                                                    Lên
                                                                  </Button>
                                                                  <Button
                                                                    variant="outline"
                                                                    leftIcon={<ArrowDown className="h-4 w-4" />}
                                                                    disabled={optionIndex === question.options.length - 1}
                                                                    onClick={() => moveQuestionOption("existing", exercise._id, questionIndex, optionIndex, "down")}
                                                                  >
                                                                    Xuống
                                                                  </Button>
                                                                </div>
                                                                <div className="flex items-end">
                                                                  <Button
                                                                    variant="ghost"
                                                                    leftIcon={<Trash2 className="h-4 w-4" />}
                                                                    onClick={() => removeQuestionOption("existing", exercise._id, questionIndex, optionIndex)}
                                                                  >
                                                                    Xóa
                                                                  </Button>
                                                                </div>
                                                              </div>
                                                            );
                                                          })}
                                                          <Button
                                                            variant="outline"
                                                            leftIcon={<Plus className="h-4 w-4" />}
                                                            onClick={() => addQuestionOption("existing", exercise._id, questionIndex)}
                                                          >
                                                            Thêm đáp án
                                                          </Button>
                                                        </div>
                                                      )}
                                                    </div>
                                                  ))}

                                                  <div className="flex flex-wrap justify-between gap-3">
                                                    <Button
                                                      variant="outline"
                                                      leftIcon={<Plus className="h-4 w-4" />}
                                                      onClick={() => addExerciseQuestion("existing", exercise._id)}
                                                    >
                                                      Thêm câu hỏi
                                                    </Button>
                                                    <Button
                                                      leftIcon={<Save className="h-4 w-4" />}
                                                      isLoading={exerciseSavingKey === exercise._id}
                                                      onClick={() => handleSaveExercise(chapter._id, lesson._id, exercise._id)}
                                                      disabled={!isExerciseFormValid(exerciseForm)}
                                                    >
                                                      Lưu bài tập
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}

        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary-600" />
                Mức độ sẵn sàng
              </CardTitle>
              <CardDescription>Checklist thật trước khi gửi duyệt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {readiness.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border bg-surface/70 px-4 py-3 text-sm shadow-soft">
                  <span className="font-bold text-foreground">{item.label}</span>
                  <Badge variant={item.done ? "success" : "warning"}>{item.done ? "Đạt" : "Thiếu"}</Badge>
                </div>
              ))}
              <div className="rounded-2xl border border-primary-100 bg-primary-50/80 p-4">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {readiness.canSubmit ? "Sẵn sàng cho bước gửi duyệt" : "Cần bổ sung thêm thông tin"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Checklist này đã đồng bộ với các điều kiện backend quan trọng nhất trước khi submit review.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-secondary-600" />
                Tổng quan khóa học
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-surface/70">
                {form.thumbnail.trim() ? (
                  <Image src={form.thumbnail} alt={form.title || "Thumbnail khóa học"} fill sizes="360px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Chưa có thumbnail
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border border-border bg-surface/70 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-foreground">Danh mục</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{categoryLabel(course.category)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface/70 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-foreground">Giá hiện tại</p>
                  <div className="mt-1 flex items-center gap-2 text-sm font-bold text-foreground">
                    <CircleDollarSign className="h-4 w-4 text-primary-600" />
                    {Number(form.discountPrice || 0) <= 0 ? "Miễn phí" : `${Number(form.discountPrice || 0).toLocaleString("vi-VN")}đ`}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-surface/70 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-foreground">Trạng thái</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{currentStatus.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
