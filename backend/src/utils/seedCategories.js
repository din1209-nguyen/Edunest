import Category from "../models/Category.js";

const categories = [
  {
    name: "IELTS",
    slug: "ielts",
    description: "Chuẩn bị cho kỳ thi IELTS với điểm số cao",
    icon: "graduation-cap",
    order: 1,
  },
  {
    name: "TOEFL",
    slug: "toefl",
    description: "Luyện thi TOEFL iBT và PBT",
    icon: "file-text",
    order: 2,
  },
  {
    name: "Grammar",
    slug: "grammar",
    description: "Ngữ pháp tiếng Anh từ cơ bản đến nâng cao",
    icon: "book-open",
    order: 3,
  },
  {
    name: "Vocabulary",
    slug: "vocabulary",
    description: "Mở rộng vốn từ vựng tiếng Anh",
    icon: "abc",
    order: 4,
  },
  {
    name: "Speaking",
    slug: "speaking",
    description: "Kỹ năng giao tiếp và phát âm",
    icon: "mic",
    order: 5,
  },
  {
    name: "Listening",
    slug: "listening",
    description: "Luyện nghe hiểu tiếng Anh",
    icon: "headphones",
    order: 6,
  },
  {
    name: "Reading",
    slug: "reading",
    description: "Kỹ năng đọc hiểu",
    icon: "book",
    order: 7,
  },
  {
    name: "Writing",
    slug: "writing",
    description: "Kỹ năng viết tiếng Anh",
    icon: "pen-tool",
    order: 8,
  },
  {
    name: "Business English",
    slug: "business-english",
    description: "Tiếng Anh thương mại và giao tiếp công sở",
    icon: "briefcase",
    order: 9,
  },
  {
    name: "Kids English",
    slug: "kids-english",
    description: "Tiếng Anh cho trẻ em",
    icon: "smile",
    order: 10,
  },
];

export async function seedCategories() {
  try {
    // Check if categories already exist
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) {
      console.log(`Đã có ${existingCount} danh mục trong database. Bỏ qua seed.`);
      return;
    }

    // Insert categories
    const result = await Category.insertMany(categories);
    console.log(`Đã tạo ${result.length} danh mục:`);
    result.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.slug})`);
    });

    return result;
  } catch (error) {
    console.error("Lỗi khi seed categories:", error);
    throw error;
  }
}

// Run if called directly
seedCategories().catch(console.error);
