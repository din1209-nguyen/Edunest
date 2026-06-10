import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

import Cart from "../models/Cart.js";
import Category from "../models/Category.js";
import Certificate from "../models/Certificate.js";
import Chapter from "../models/Chapter.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Exercise from "../models/Exercise.js";
import Lesson from "../models/Lesson.js";
import Note from "../models/Note.js";
import Payment from "../models/Payment.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import WishlistItem from "../models/WishlistItem.js";
import connectDB from "../config/database.js";

const thumbnails = [
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900&h=506&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=506&fit=crop",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&h=506&fit=crop",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=900&h=506&fit=crop",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=900&h=506&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&h=506&fit=crop",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&h=506&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&h=506&fit=crop",
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=900&h=506&fit=crop",
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=900&h=506&fit=crop",
];

const categorySeeds = [
  ["IELTS", "ielts", "IELTS preparation from foundation to band 7+.", "graduation-cap"],
  ["TOEFL", "toefl", "TOEFL iBT strategy, listening, reading and speaking.", "file-text"],
  ["Grammar", "grammar", "English grammar from basic structures to advanced usage.", "book-open"],
  ["Vocabulary", "vocabulary", "Topic-based vocabulary and academic word practice.", "abc"],
  ["Speaking", "speaking", "Pronunciation, fluency and everyday conversation.", "mic"],
  ["Listening", "listening", "Listening practice through real-life situations.", "headphones"],
  ["Reading", "reading", "Reading speed, comprehension and exam strategy.", "book"],
  ["Writing", "writing", "Essay, email and academic writing practice.", "pen-tool"],
  ["Business English", "business-english", "Meetings, presentations and workplace English.", "briefcase"],
  ["Kids English", "kids-english", "Friendly English learning paths for children.", "smile"],
];

const courseTopics = {
  IELTS: [
    "Foundation Band 5.5",
    "Intensive Band 6.5",
    "Speaking Band 7+",
    "Writing Task 2 Mastery",
    "Listening Map Lab",
    "Reading True False Not Given",
  ],
  TOEFL: [
    "TOEFL iBT Complete",
    "TOEFL Listening Lab",
    "TOEFL Reading Strategy",
    "TOEFL Speaking Templates",
    "TOEFL Writing Integrated",
    "TOEFL Vocabulary Boost",
  ],
  Grammar: [
    "Grammar Masterclass",
    "12 English Tenses",
    "Sentence Building",
    "Conditionals and Modals",
    "Passive Voice Clinic",
    "Grammar for Speaking",
  ],
  Vocabulary: [
    "Essential Vocabulary",
    "Academic Word List",
    "Vocabulary Through Stories",
    "Phrasal Verbs in Context",
    "Collocation Builder",
    "Idioms for Daily Life",
  ],
  Speaking: [
    "Daily Conversation",
    "Pronunciation Clinic",
    "Fluency Booster",
    "Presentation Skills",
    "Interview English",
    "Small Talk Confidence",
  ],
  Listening: [
    "Listening for Beginners",
    "Podcast Listening Lab",
    "Dictation Practice",
    "News Listening",
    "Accent Training",
    "Listening Note-taking",
  ],
  Reading: [
    "Reading Speed Up",
    "Skimming and Scanning",
    "Academic Reading",
    "Reading for Main Ideas",
    "Inference Practice",
    "Exam Reading Drill",
  ],
  Writing: [
    "Email Writing",
    "Essay Writing",
    "Writing for Work",
    "Paragraph Builder",
    "Story Writing",
    "Report Writing",
  ],
  "Business English": [
    "Meetings and Presentations",
    "Negotiation English",
    "Business Email",
    "Customer Support English",
    "Sales English",
    "Leadership Communication",
  ],
  "Kids English": [
    "English for Kids 1",
    "Phonics Adventure",
    "Story Time English",
    "Songs and Games",
    "Kids Vocabulary",
    "Young Learner Grammar",
  ],
};

const statuses = [
  "published",
  "published",
  "published",
  "published",
  "pending",
  "draft",
  "rejected",
  "locked",
];
const levels = ["beginner", "intermediate", "advanced"];
const reviewComments = [
  "Course content is practical and easy to follow.",
  "The lessons helped me build a better study habit.",
  "Clear structure, useful exercises and good examples.",
  "I like the pacing and the real-life practice tasks.",
  "A strong course for learners who need a guided path.",
];

function makeUser(name, email, password, role = "user", bio = "", index = 0) {
  return {
    name,
    email,
    password,
    role,
    bio,
    avatar: `https://i.pravatar.cc/160?img=${(index % 60) + 1}`,
    isActive: index % 17 !== 0,
    isEmailVerified: true,
  };
}

function buildCoursePayload(topic, category, index, instructorId) {
  const status = statuses[index % statuses.length];
  const level = levels[index % levels.length];
  const price = index % 7 === 0 ? 0 : 299000 + (index % 8) * 120000;
  const discountPrice = price > 0 && index % 3 === 0 ? Math.round(price * 0.75) : 0;
  const title = `${topic} - ${category.name}`;

  return {
    title,
    description: `${title} is a complete English learning path with short explanations, guided practice, quizzes and progress tracking. Learners study through real situations and build confidence step by step.`,
    shortDescription: `A practical ${category.name} course for structured English learning.`,
    thumbnail: thumbnails[index % thumbnails.length],
    previewVideo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    price,
    discountPrice,
    level,
    category: category.name,
    language: "English",
    requirements: [
      "Internet connection",
      "Notebook or note-taking app",
      "At least 30 minutes of focused study per day",
    ],
    outcomes: [
      "Understand the key concepts of the topic",
      "Practice with real examples and quizzes",
      "Track learning progress lesson by lesson",
    ],
    status,
    rejectionReason: status === "rejected" ? "Please add more lesson details and improve the course thumbnail." : "",
    instructor: instructorId,
    totalStudents: 0,
    totalLessons: 0,
    totalDuration: 0,
    rating: 0,
    totalRatings: 0,
    isFree: price === 0,
    isFeatured: status === "published" && index % 5 === 0,
  };
}

function buildLesson(chapter, course, lessonOrder, chapterOrder) {
  const duration = 420 + ((chapterOrder + lessonOrder) % 6) * 150;
  return {
    title: `Lesson ${chapterOrder}.${lessonOrder}: Focus practice`,
    description: "A short lesson with explanation, examples and a practical learning task.",
    content: "Study the key idea, review examples, write your own notes, then complete the practice activity before moving forward.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoDuration: duration,
    documentUrl: "",
    documentType: "none",
    order: lessonOrder,
    chapter: chapter._id,
    course: course._id,
    isFree: chapterOrder === 1 && lessonOrder <= 2,
    isPublished: true,
    type: lessonOrder % 5 === 0 ? "quiz" : "video",
  };
}

function buildExercise(lesson, course, index) {
  const fillBlank = index % 4 === 2;
  const type = fillBlank ? "fill-blank" : "single-choice";
  return {
    title: `Quick check: ${lesson.title}`,
    lesson: lesson._id,
    course: course._id,
    type,
    skill: course.category === "Vocabulary" ? "vocabulary" : course.category === "Reading" ? "reading" : "grammar",
    level: course.level,
    timeLimit: 10,
    passingScore: 60,
    isPublished: true,
    questions: fillBlank
      ? [
          {
            questionText: "Complete the sentence: She ___ English every evening.",
            options: [],
            correctAnswers: ["studies"],
            explanation: "Use the present simple form for a repeated habit.",
            points: 1,
          },
        ]
      : [
          {
            questionText: "Which answer best matches the lesson objective?",
            options: ["Practice in context", "Ignore examples", "Memorize without use", "Skip review"],
            correctAnswers: ["Practice in context"],
            explanation: "The course focuses on using English in meaningful situations.",
            points: 1,
          },
          {
            questionText: "What should learners do after watching a lesson?",
            options: ["Take notes and practice", "Close the course", "Avoid quizzes", "Delete progress"],
            correctAnswers: ["Take notes and practice"],
            explanation: "Notes and practice reinforce the new skill.",
            points: 1,
          },
        ],
  };
}

function gradeFromProgress(progress, index) {
  if (progress < 100) return null;
  return 82 + (index % 16);
}

async function seedData() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    await mongoose.connection.dropDatabase();
    console.log("Dropped local database");

    const categories = await Category.insertMany(
      categorySeeds.map(([name, slug, description, icon], index) => ({
        name,
        slug,
        description,
        icon,
        order: index + 1,
        isActive: true,
      })),
    );
    console.log(`Created ${categories.length} categories`);

    const baseUsers = [
      makeUser("Admin Edunest", "admin@edunest.local", "Admin123", "admin", "System administrator.", 1),
      makeUser("Creator User", "creator@edunest.local", "Creator123", "user", "Course creator for exam preparation.", 2),
      makeUser("Teacher Demo", "teacher@edunest.local", "Teacher123", "user", "Teacher demo account.", 3),
      makeUser("Linh Nguyen", "linh.teacher@edunest.local", "Teacher123", "user", "Speaking and pronunciation coach.", 4),
      makeUser("Minh Tran", "minh.teacher@edunest.local", "Teacher123", "user", "Business English instructor.", 5),
      makeUser("Learner Main", "user@edunest.local", "User1234", "user", "Main learner demo account.", 6),
    ];

    const learnerUsers = Array.from({ length: 24 }, (_, index) =>
      makeUser(
        `Learner ${String(index + 1).padStart(2, "0")}`,
        `learner${index + 1}@edunest.local`,
        "User1234",
        "user",
        "English learner using Edunest.",
        index + 7,
      ),
    );

    const users = await User.create([...baseUsers, ...learnerUsers]);
    const instructors = users.filter((user) =>
      ["creator@edunest.local", "teacher@edunest.local", "linh.teacher@edunest.local", "minh.teacher@edunest.local"].includes(user.email),
    );
    const learners = users.filter((user) => user.email === "user@edunest.local" || user.email.startsWith("learner"));
    console.log(`Created ${users.length} users`);

    const coursePayloads = [];
    categories.forEach((category) => {
      const topics = courseTopics[category.name] ?? [`${category.name} Complete Course`];
      topics.forEach((topic) => {
        const index = coursePayloads.length;
        const instructor = instructors[index % instructors.length];
        coursePayloads.push(buildCoursePayload(topic, category, index, instructor._id));
      });
    });

    const courses = await Course.create(coursePayloads.slice(0, 60));
    console.log(`Created ${courses.length} courses`);

    const lessonsByCourse = new Map();
    let totalChapters = 0;
    let totalLessons = 0;
    let totalExercises = 0;

    for (const [courseIndex, course] of courses.entries()) {
      const chapterCount = 3 + (courseIndex % 3);
      const courseLessons = [];
      let courseDuration = 0;

      for (let chapterOrder = 1; chapterOrder <= chapterCount; chapterOrder += 1) {
        const chapter = await Chapter.create({
          title: `Chapter ${chapterOrder}: Foundation and practice`,
          description: "A focused chapter with guided lessons and review tasks.",
          order: chapterOrder,
          course: course._id,
          isPublished: true,
        });
        totalChapters += 1;

        const lessonCount = 4 + ((courseIndex + chapterOrder) % 5);
        for (let lessonOrder = 1; lessonOrder <= lessonCount; lessonOrder += 1) {
          const lesson = await Lesson.create(buildLesson(chapter, course, lessonOrder, chapterOrder));
          courseLessons.push(lesson);
          courseDuration += lesson.videoDuration;
          totalLessons += 1;

          if (lessonOrder === lessonCount || lessonOrder % 3 === 0) {
            await Exercise.create(buildExercise(lesson, course, lessonOrder + chapterOrder));
            totalExercises += 1;
          }
        }
      }

      lessonsByCourse.set(course._id.toString(), courseLessons);
      course.totalLessons = courseLessons.length;
      course.totalDuration = courseDuration;
      await course.save();
    }

    const publishedCourses = courses.filter((course) => course.status === "published");
    const enrollments = [];
    const reviews = [];
    const payments = [];
    const certificates = [];
    const notes = [];

    for (const [courseIndex, course] of publishedCourses.entries()) {
      const courseLessons = lessonsByCourse.get(course._id.toString()) ?? [];
      const learnerCount = Math.min(learners.length, 8 + (courseIndex % 10));
      let ratingSum = 0;
      let ratingCount = 0;

      for (let i = 0; i < learnerCount; i += 1) {
        const learner = learners[(i + courseIndex) % learners.length];
        const progress = i === 0 && courseIndex % 4 === 0 ? 100 : (35 + i * 11 + courseIndex * 7) % 101;
        const completedCount = Math.floor((progress / 100) * courseLessons.length);
        const completedLessons = courseLessons.slice(0, completedCount).map((lesson) => lesson._id);
        const enrollment = {
          student: learner._id,
          course: course._id,
          progress,
          completedLessons,
          enrolledAt: new Date(Date.now() - (courseIndex + i + 3) * 86400000),
          completedAt: progress === 100 ? new Date(Date.now() - i * 86400000) : null,
          isActive: true,
          source: course.isFree ? "free" : "purchase",
        };
        enrollments.push(enrollment);

        if (!course.isFree && i < 4) {
          payments.push({
            user: learner._id,
            amount: course.discountPrice > 0 ? course.discountPrice : course.price,
            currency: "VND",
            status: "success",
            method: i % 2 === 0 ? "vnpay" : "mock",
            courses: [course._id],
            transactionId: `DH-SEED-${courseIndex + 1}-${i + 1}`,
            paymentData: { seed: true },
            paidAt: enrollment.enrolledAt,
            createdAt: enrollment.enrolledAt,
            updatedAt: enrollment.enrolledAt,
          });
        }

        if (progress === 100) {
          certificates.push({
            student: learner._id,
            course: course._id,
            certificateId: `CERT-SEED-${courseIndex + 1}-${i + 1}`,
            issuedAt: new Date(Date.now() - i * 86400000),
            grade: gradeFromProgress(progress, i + courseIndex),
          });
        }

        if (i < 6) {
          const rating = 4 + ((courseIndex + i) % 2) + (i % 3 === 0 ? 0 : -0.2);
          ratingSum += rating;
          ratingCount += 1;
          reviews.push({
            user: learner._id,
            course: course._id,
            rating: Math.min(5, Math.max(1, Math.round(rating))),
            comment: reviewComments[(courseIndex + i) % reviewComments.length],
            isVerifiedPurchase: true,
            helpful: (courseIndex + i) % 12,
          });
        }

        if (i < 3 && courseLessons[0]) {
          notes.push({
            student: learner._id,
            lesson: courseLessons[0]._id,
            course: course._id,
            content: "Remember to review this lesson before the next practice session.",
            timestamp: 120 + i * 45,
          });
        }
      }

      course.totalStudents = learnerCount;
      course.totalRatings = ratingCount;
      course.rating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : 0;
      await course.save();
    }

    await Enrollment.insertMany(enrollments);
    await Payment.insertMany(payments);
    await Review.insertMany(reviews);
    await Certificate.insertMany(certificates);
    await Note.insertMany(notes);

    const mainLearner = learners.find((user) => user.email === "user@edunest.local");
    if (mainLearner) {
      const cartCourses = publishedCourses.filter((course) => !course.isFree).slice(0, 3);
      await Cart.create({
        user: mainLearner._id,
        items: cartCourses.map((course, index) => ({
          course: course._id,
          addedAt: new Date(Date.now() - index * 3600000),
        })),
      });

      await WishlistItem.insertMany(
        publishedCourses.slice(3, 9).map((course) => ({
          user: mainLearner._id,
          course: course._id,
        })),
      );
    }

    for (const category of categories) {
      category.courseCount = await Course.countDocuments({
        category: category.name,
        status: "published",
      });
      await category.save();
    }

    console.log(`Created ${totalChapters} chapters`);
    console.log(`Created ${totalLessons} lessons`);
    console.log(`Created ${totalExercises} exercises`);
    console.log(`Created ${enrollments.length} enrollments`);
    console.log(`Created ${reviews.length} reviews`);
    console.log(`Created ${payments.length} payments`);
    console.log(`Created ${certificates.length} certificates`);
    console.log(`Created ${notes.length} notes`);
    console.log("\n=== Seed completed ===");
    console.log("Demo accounts:");
    console.log("  Admin:   admin@edunest.local / Admin123");
    console.log("  Creator: creator@edunest.local / Creator123");
    console.log("  Teacher: teacher@edunest.local / Teacher123");
    console.log("  User:    user@edunest.local / User1234");

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seedData();
