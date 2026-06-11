"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { courseApi, exerciseApi } from "@/lib/studentApi";
import { completeLessonAction } from "@/app/courses/[slug]/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle,
  ClipboardList,
  FileText,
  Lock,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { AiExerciseQuota, Course, Exercise, ExerciseSubmissionResult, Lesson } from "@/types";

type ExerciseAnswer = string | string[];

function lessonTypeLabel(lesson: Lesson) {
  if (lesson.type === "video" || lesson.videoUrl) return "Video";
  if (lesson.type === "pdf" || lesson.type === "document") return "Tài liệu";
  if (lesson.type === "quiz") return "Quiz";
  return "Bài học";
}

function exerciseTypeLabel(exercise: Exercise) {
  if (exercise.type === "single-choice") return "Một đáp án";
  if (exercise.type === "multiple-choice") return "Nhiều đáp án";
  if (exercise.type === "fill-blank") return "Điền từ";
  return "Trả lời ngắn";
}

function getEmbeddableVideoUrl(url?: string) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    if (parsed.hostname === "youtu.be") {
      const videoId = parsed.pathname.replace(/^\//, "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    return null;
  } catch {
    return null;
  }
}

function canEmbedDocument(url?: string) {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return (
      parsed.pathname.toLowerCase().endsWith(".pdf") ||
      (parsed.hostname.includes("cloudinary.com") &&
        parsed.pathname.includes("/image/upload/"))
    );
  } catch {
    return false;
  }
}

function isAiExercise(exercise: Exercise) {
  return Boolean(exercise.isAiGenerated || exercise._id.startsWith("ai-"));
}

function gradeAiExercise(
  exercise: Exercise,
  answers: ExerciseAnswer[],
): ExerciseSubmissionResult {
  const result: ExerciseSubmissionResult = {
    exerciseId: exercise._id,
    title: exercise.title,
    totalQuestions: exercise.questions.length,
    totalPoints: 0,
    earnedPoints: 0,
    score: 0,
    passingScore: exercise.passingScore ?? 60,
    passed: false,
    questions: [],
  };

  exercise.questions.forEach((question, index) => {
    const userAnswer = answers[index];
    const correctSet = new Set(
      question.correctAnswers.map((answer) => answer.trim().toLowerCase()),
    );
    const userSet = new Set(
      (Array.isArray(userAnswer) ? userAnswer : [userAnswer]).map((answer) =>
        (answer || "").trim().toLowerCase(),
      ),
    );
    const isCorrect =
      correctSet.size === userSet.size &&
      Array.from(correctSet).every((answer) => userSet.has(answer));
    const points = question.points || 1;

    result.totalPoints += points;
    if (isCorrect) result.earnedPoints += points;
    result.questions.push({
      questionIndex: index,
      questionText: question.questionText,
      options: question.options,
      userAnswer: Array.isArray(userAnswer) ? userAnswer : [userAnswer],
      correctAnswers: question.correctAnswers,
      explanation: question.explanation || "",
      points,
      earned: isCorrect ? points : 0,
      isCorrect,
    });
  });

  result.score =
    result.totalPoints > 0
      ? Math.round((result.earnedPoints / result.totalPoints) * 100)
      : 0;
  result.passed = result.score >= (result.passingScore ?? 60);

  return result;
}

export default function LearnCoursePage() {
  const toast = useToast();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<{ progress: number; completedLessons: string[] } | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [lessonExercises, setLessonExercises] = useState<Exercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [exerciseError, setExerciseError] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, ExerciseAnswer[]>>({});
  const [exerciseResults, setExerciseResults] = useState<Record<string, ExerciseSubmissionResult>>({});
  const [submittingExerciseId, setSubmittingExerciseId] = useState<string | null>(null);
  const [isGeneratingAIExercise, setIsGeneratingAIExercise] = useState(false);
  const [aiExerciseQuota, setAiExerciseQuota] = useState<AiExerciseQuota | null>(null);
  const [isCompletePending, startCompleteTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const courseRes = await courseApi.getCourseBySlug(slug);
        const c = courseRes.data?.course;

        if (!c) {
          throw new Error("Course not found");
        }

        const progressRes = await fetch(`/api/enrollments/${c._id}/progress`, { credentials: "include" });
        const progressPayload = await progressRes.json().catch(() => null);
        const p = progressPayload?.data?.progress;

        if (!progressRes.ok || !p) {
          throw new Error("Progress not found");
        }

        if (cancelled) return;

        setCourse(c);
        setProgress({
          progress: p.progress ?? 0,
          completedLessons: (p.completedLessons as unknown as string[]) ?? [],
        });

        const firstLesson = c.chapters?.[0]?.lessons?.[0];
        setActiveLessonId(firstLesson?._id ?? null);
      } catch {
        if (!cancelled) {
          setCourse(null);
          setProgress(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const activeLesson = useMemo(() => {
    if (!course || !activeLessonId) return null;
    for (const chapter of course.chapters ?? []) {
      for (const lesson of chapter.lessons ?? []) {
        if (lesson._id === activeLessonId) return lesson;
      }
    }
    return null;
  }, [course, activeLessonId]);

  const activeLessonEmbedUrl = useMemo(() => getEmbeddableVideoUrl(activeLesson?.videoUrl), [activeLesson?.videoUrl]);
  const activeLessonDocumentUrl = activeLesson?.documentUrl || activeLesson?.pdfUrl || "";
  const canGenerateAIExercise = Boolean(
    activeLesson &&
      (activeLesson.type === "pdf" || activeLesson.type === "document") &&
      activeLesson.documentType === "pdf" &&
      (activeLesson.documentUrl || activeLesson.pdfUrl),
  );

  const isLessonCompleted = (lessonId: string) => {
    return Boolean(progress?.completedLessons?.includes(lessonId));
  };

  const canAccessLesson = (lesson: Lesson) => {
    if (!lesson) return false;
    if (lesson.isFree) return true;
    return Boolean(progress);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadExercises() {
      if (!activeLesson || !canAccessLesson(activeLesson)) {
        setLessonExercises([]);
        setSelectedExerciseId(null);
        return;
      }

      setIsLoadingExercises(true);
      setExerciseError(null);

      try {
        const res = await exerciseApi.getExercisesByLesson(activeLesson._id);
        const exercises = res.data?.exercises ?? [];

        if (cancelled) return;

        setLessonExercises(exercises);
        setSelectedExerciseId(exercises[0]?._id ?? null);
      } catch (error) {
        if (!cancelled) {
          setLessonExercises([]);
          setSelectedExerciseId(null);
          setExerciseError(error instanceof Error ? error.message : "Không thể tải bài tập của bài học này.");
        }
      } finally {
        if (!cancelled) setIsLoadingExercises(false);
      }
    }

    loadExercises();

    return () => {
      cancelled = true;
    };
  }, [activeLesson, progress]);

  const selectedExercise = useMemo(() => {
    return lessonExercises.find((exercise) => exercise._id === selectedExerciseId) ?? null;
  }, [lessonExercises, selectedExerciseId]);

  const getExerciseAnswer = (exerciseId: string, questionIndex: number): ExerciseAnswer => {
    return exerciseAnswers[exerciseId]?.[questionIndex] ?? "";
  };

  const updateExerciseAnswer = (exerciseId: string, questionIndex: number, answer: ExerciseAnswer) => {
    setExerciseAnswers((current) => {
      const nextAnswers = [...(current[exerciseId] ?? [])];
      nextAnswers[questionIndex] = answer;
      return { ...current, [exerciseId]: nextAnswers };
    });
  };

  const toggleExerciseOption = (exerciseId: string, questionIndex: number, option: string) => {
    const currentAnswer = getExerciseAnswer(exerciseId, questionIndex);
    const currentList = Array.isArray(currentAnswer) ? currentAnswer : [];
    const nextList = currentList.includes(option)
      ? currentList.filter((item) => item !== option)
      : [...currentList, option];

    updateExerciseAnswer(exerciseId, questionIndex, nextList);
  };

  const isExerciseReadyToSubmit = (exercise: Exercise) => {
    const answers = exerciseAnswers[exercise._id] ?? [];
    return exercise.questions.every((_, index) => {
      const answer = answers[index];
      if (exercise.type === "multiple-choice") {
        return Array.isArray(answer) && answer.length > 0;
      }
      return typeof answer === "string" && answer.trim().length > 0;
    });
  };

  const handleSubmitExercise = async (exercise: Exercise) => {
    if (submittingExerciseId || !isExerciseReadyToSubmit(exercise)) return;

    setSubmittingExerciseId(exercise._id);
    try {
      const answers = exercise.questions.map((_, index) => getExerciseAnswer(exercise._id, index));
      if (isAiExercise(exercise)) {
        const result = gradeAiExercise(exercise, answers);
        setExerciseResults((current) => ({ ...current, [exercise._id]: result }));
        toast.success(result.passed ? "Bạn đã vượt qua bài tập." : "Đã nộp bài. Hãy xem lại đáp án và thử lại.");
        return;
      }

      const res = await exerciseApi.submitExercise(exercise._id, answers);
      const result = res.data?.result;

      if (!result) {
        throw new Error("Không nhận được kết quả bài tập.");
      }

      setExerciseResults((current) => ({ ...current, [exercise._id]: result }));
      toast.success(result.passed ? "Bạn đã vượt qua bài tập." : "Đã nộp bài. Hãy xem lại đáp án và thử lại.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể nộp bài tập. Vui lòng thử lại.");
    } finally {
      setSubmittingExerciseId(null);
    }
  };

  const handleResetExercise = (exerciseId: string) => {
    setExerciseAnswers((current) => ({ ...current, [exerciseId]: [] }));
    setExerciseResults((current) => {
      const next = { ...current };
      delete next[exerciseId];
      return next;
    });
  };

  const handleGenerateAIExercise = async () => {
    if (!activeLesson || !canGenerateAIExercise || isGeneratingAIExercise) return;

    setIsGeneratingAIExercise(true);
    try {
      const res = await exerciseApi.generateAIExerciseForLesson(activeLesson._id);
      const exercise = res.data?.exercise;
      const quota = res.data?.quota;

      if (!exercise) {
        throw new Error("Không nhận được bài tập AI.");
      }

      if (quota) setAiExerciseQuota(quota);
      setLessonExercises((current) => [exercise, ...current]);
      setSelectedExerciseId(exercise._id);
      setExerciseAnswers((current) => ({ ...current, [exercise._id]: [] }));
      toast.success(
        quota
          ? `Đã tạo bài tập AI. Còn ${quota.remaining}/${quota.limit} lượt hôm nay.`
          : "Đã tạo bài tập AI.",
      );
    } catch (error) {
      const apiError = error as {
        response?: {
          data?: {
            message?: string;
            data?: { quota?: AiExerciseQuota };
          };
        };
        message?: string;
      };
      const quota = apiError.response?.data?.data?.quota;
      if (quota) setAiExerciseQuota(quota);
      toast.error(
        apiError.response?.data?.message ||
          apiError.message ||
          "Không thể tạo bài tập AI. Vui lòng thử lại.",
      );
    } finally {
      setIsGeneratingAIExercise(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!course || !activeLesson || isCompletePending) return;
    if (isLessonCompleted(activeLesson._id)) return;

    startCompleteTransition(async () => {
      try {
        const res = await completeLessonAction(course._id, activeLesson._id, course.slug);
        const next = res.data?.progress;

        if (!next) {
          throw new Error("Progress update failed");
        }

        setProgress({
          progress: next.progress,
          completedLessons: next.completedLessons,
        });
        toast.success("Đã đánh dấu hoàn thành bài học");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể cập nhật tiến độ. Vui lòng thử lại.");
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">Đang tải...</CardContent>
      </Card>
    );
  }

  if (!course || !progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bạn chưa mua khóa học này</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Bạn cần thanh toán hoặc đăng ký để có thể truy cập nội dung khóa học.
          </p>
          <Button asChild leftIcon={<ArrowLeft className="h-4 w-4" />}>
            <Link href={`/courses/${slug}`}>Quay lại trang khóa học</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <div className="grid gap-6 lg:grid-cols-12">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle className="line-clamp-2">{course.title}</CardTitle>
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tiến độ</span>
              <span className="font-medium text-foreground">{progress.progress}%</span>
            </div>
            <Progress value={progress.progress} className="mt-2 h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(course.chapters ?? []).map((chapter) => (
            <div key={chapter._id} className="rounded-lg border border-border">
              <div className="border-b border-border px-3 py-2">
                <p className="font-medium text-foreground">{chapter.title}</p>
              </div>
              <div className="p-2">
                {(chapter.lessons ?? []).map((lesson) => {
                  const isActive = lesson._id === activeLessonId;
                  const completed = isLessonCompleted(lesson._id);
                  const canAccess = canAccessLesson(lesson);

                  return (
                    <button
                      key={lesson._id}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left transition-colors",
                        isActive ? "bg-primary-50 text-primary-700" : "hover:bg-surface"
                      )}
                      onClick={() => setActiveLessonId(lesson._id)}
                      disabled={!canAccess}
                    >
                      <div className="flex items-center gap-2">
                        {lesson.type === "video" || lesson.videoUrl ? (
                          <Play className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="flex-1 text-sm font-medium">{lesson.title}</span>
                        {completed ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : !canAccess ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" size="sm">
                          {lessonTypeLabel(lesson)}
                        </Badge>
                        {!canAccess && <span>Khóa</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-8">
        <CardHeader>
          <CardTitle>{activeLesson?.title ?? "Chọn bài học"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activeLesson ? (
            <p className="text-muted-foreground">Vui lòng chọn một bài học ở danh sách bên trái.</p>
          ) : !canAccessLesson(activeLesson) ? (
            <div className="rounded-lg border border-border p-6 text-center">
              <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium text-foreground">Bài học này đang bị khóa</p>
              <p className="mt-1 text-sm text-muted-foreground">Bạn cần mua khóa học để truy cập.</p>
            </div>
          ) : activeLesson.videoUrl ? (
            <div className="overflow-hidden rounded-xl border border-border">
              {activeLessonEmbedUrl ? (
                <iframe
                  src={activeLessonEmbedUrl}
                  title={activeLesson.title}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={activeLesson.videoUrl} controls className="w-full" />
              )}
            </div>
          ) : (activeLesson.type === "pdf" || activeLesson.type === "document") && (activeLesson.documentUrl || activeLesson.pdfUrl) ? (
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">
                Tài liệu này không thể xem trực tiếp trong trang.
              </p>
              <Button asChild variant="outline" className="mt-3">
                <a
                  href={activeLesson.documentUrl || activeLesson.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                >
                  Mở tài liệu
                </a>
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border p-4">
              <p className="whitespace-pre-wrap text-foreground">{activeLesson.content || "(Chưa có nội dung)"}</p>
            </div>
          )}

          {activeLesson && canAccessLesson(activeLesson) && activeLessonDocumentUrl ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/50 p-4">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <FileText className="h-5 w-5 shrink-0 text-primary-600" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">Tài liệu bài học</p>
                  <p className="truncate text-sm text-muted-foreground">{activeLessonDocumentUrl}</p>
                </div>
              </div>
              <Button
                variant="outline"
                leftIcon={<FileText className="h-4 w-4" />}
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = activeLessonDocumentUrl;
                  link.target = "_blank";
                  link.rel = "noreferrer";
                  link.download = "";
                  link.click();
                }}
              >
                Tải tài liệu
              </Button>
            </div>
          ) : null}

          {activeLesson && canAccessLesson(activeLesson) && (
            <div className="rounded-xl border border-border bg-surface/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary-600" />
                    <h2 className="font-semibold text-foreground">Bài tập của bài học</h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Làm bài tập để kiểm tra mức độ hiểu bài trước khi chuyển sang nội dung tiếp theo.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {aiExerciseQuota ? (
                    <Badge variant="outline">
                      AI: {aiExerciseQuota.remaining}/{aiExerciseQuota.limit} lượt
                    </Badge>
                  ) : null}
                  {canGenerateAIExercise ? (
                    <Button
                      variant="outline"
                      onClick={handleGenerateAIExercise}
                      isLoading={isGeneratingAIExercise}
                      disabled={isLoadingExercises || isGeneratingAIExercise}
                      leftIcon={<Sparkles className="h-4 w-4" />}
                    >
                      Tạo bằng AI
                    </Button>
                  ) : null}
                  <Badge variant="primary-light">{lessonExercises.length} bài tập</Badge>
                </div>
              </div>

              {isLoadingExercises ? (
                <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Đang tải bài tập...
                </div>
              ) : exerciseError ? (
                <div className="mt-4 rounded-lg border border-error/30 bg-error-light p-4 text-sm text-red-800">
                  {exerciseError}
                </div>
              ) : lessonExercises.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Bài học này chưa có bài tập nào.
                </div>
              ) : (
                <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="space-y-2">
                    {lessonExercises.map((exercise, index) => {
                      const result = exerciseResults[exercise._id];
                      const isSelected = exercise._id === selectedExerciseId;

                      return (
                        <button
                          key={exercise._id}
                          type="button"
                          onClick={() => setSelectedExerciseId(exercise._id)}
                          className={cn(
                            "w-full rounded-lg border px-3 py-2 text-left transition",
                            isSelected
                              ? "border-primary-300 bg-primary-50 text-primary-800"
                              : "border-border bg-background hover:border-primary-200 hover:bg-surface"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">Bài {index + 1}</span>
                            {result ? (
                              result.passed ? (
                                <CheckCircle className="h-4 w-4 text-success" />
                              ) : (
                                <XCircle className="h-4 w-4 text-error" />
                              )
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{exercise.title}</p>
                        </button>
                      );
                    })}
                  </div>

                  {selectedExercise && (
                    <div className="rounded-lg border border-border bg-background p-4">
                      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{selectedExercise.title}</h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="secondary-light">{exerciseTypeLabel(selectedExercise)}</Badge>
                            <Badge variant="outline">{selectedExercise.questions.length} câu</Badge>
                            <Badge variant="outline">Đạt {selectedExercise.passingScore ?? 60}%</Badge>
                            {selectedExercise.timeLimit ? (
                              <Badge variant="outline">{selectedExercise.timeLimit} phút</Badge>
                            ) : null}
                          </div>
                        </div>
                        {exerciseResults[selectedExercise._id] && (
                          <div className="rounded-lg bg-surface px-3 py-2 text-sm">
                            <span className="text-muted-foreground">Điểm</span>{" "}
                            <span className="font-semibold text-foreground">{exerciseResults[selectedExercise._id].score}%</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 space-y-4">
                        {selectedExercise.questions.map((question, questionIndex) => {
                          const answer = getExerciseAnswer(selectedExercise._id, questionIndex);
                          const resultQuestion = exerciseResults[selectedExercise._id]?.questions?.[questionIndex];

                          return (
                            <div key={`${selectedExercise._id}-${questionIndex}`} className="rounded-lg border border-border p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-muted-foreground">Câu {questionIndex + 1}</p>
                                  <p className="mt-1 whitespace-pre-wrap font-medium text-foreground">{question.questionText}</p>
                                </div>
                                {resultQuestion ? (
                                  resultQuestion.isCorrect ? (
                                    <CheckCircle className="h-5 w-5 shrink-0 text-success" />
                                  ) : (
                                    <XCircle className="h-5 w-5 shrink-0 text-error" />
                                  )
                                ) : null}
                              </div>

                              {selectedExercise.type === "fill-blank" || selectedExercise.type === "short-answer" ? (
                                <input
                                  value={typeof answer === "string" ? answer : ""}
                                  onChange={(event) => updateExerciseAnswer(selectedExercise._id, questionIndex, event.target.value)}
                                  disabled={Boolean(exerciseResults[selectedExercise._id])}
                                  className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                  placeholder={selectedExercise.type === "fill-blank" ? "Nhập đáp án" : "Nhập câu trả lời ngắn"}
                                />
                              ) : (
                                <div className="mt-3 space-y-2">
                                  {(question.options ?? []).map((option) => {
                                    const isMultiple = selectedExercise.type === "multiple-choice";
                                    const checked = isMultiple
                                      ? Array.isArray(answer) && answer.includes(option)
                                      : answer === option;

                                    return (
                                      <label
                                        key={option}
                                        className={cn(
                                          "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition",
                                          checked ? "border-primary-300 bg-primary-50" : "border-border bg-background hover:bg-surface",
                                          exerciseResults[selectedExercise._id] && "cursor-default"
                                        )}
                                      >
                                        <input
                                          type={isMultiple ? "checkbox" : "radio"}
                                          name={`${selectedExercise._id}-${questionIndex}`}
                                          checked={checked}
                                          disabled={Boolean(exerciseResults[selectedExercise._id])}
                                          onChange={() => {
                                            if (isMultiple) {
                                              toggleExerciseOption(selectedExercise._id, questionIndex, option);
                                            } else {
                                              updateExerciseAnswer(selectedExercise._id, questionIndex, option);
                                            }
                                          }}
                                        />
                                        <span className="text-foreground">{option}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}

                              {resultQuestion && (
                                <div className="mt-3 rounded-lg bg-surface p-3 text-sm">
                                  <p className="font-medium text-foreground">
                                    Đáp án đúng: {resultQuestion.correctAnswers.join(", ")}
                                  </p>
                                  {resultQuestion.explanation ? (
                                    <p className="mt-1 text-muted-foreground">{resultQuestion.explanation}</p>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {exerciseResults[selectedExercise._id] ? (
                          <Button
                            variant="outline"
                            onClick={() => handleResetExercise(selectedExercise._id)}
                            leftIcon={<RotateCcw className="h-4 w-4" />}
                          >
                            Làm lại
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleSubmitExercise(selectedExercise)}
                            isLoading={submittingExerciseId === selectedExercise._id}
                            disabled={!isExerciseReadyToSubmit(selectedExercise)}
                            leftIcon={<Send className="h-4 w-4" />}
                          >
                            Nộp bài
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeLesson && canAccessLesson(activeLesson) && (
            <Button
              onClick={handleMarkComplete}
              leftIcon={<CheckCircle className="h-4 w-4" />}
              disabled={isLessonCompleted(activeLesson._id)}
            >
              {isLessonCompleted(activeLesson._id) ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
    <Modal
      isOpen={false}
      onClose={() => undefined}
      title="Tài liệu bài học"
      size="full"
      className="max-w-6xl"
    >
      {activeLessonDocumentUrl ? (
        <iframe
          src={activeLessonDocumentUrl}
          title="Tài liệu bài học"
          className="h-[78vh] w-full rounded-lg border border-border"
        />
      ) : null}
    </Modal>
    </>
  );
}
