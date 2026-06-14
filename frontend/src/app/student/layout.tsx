"use client";

import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  GraduationCap,
  Heart,
  HelpCircle,
  LayoutDashboard,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { DashboardLayout, type DashboardNavSection } from "@/components/layout/DashboardLayout";

const studentNavSections: DashboardNavSection[] = [
  {
    label: "Tổng quan",
    items: [{ href: "/student/dashboard", label: "Tổng quan", icon: LayoutDashboard }],
  },
  {
    label: "Học tập",
    items: [
      { href: "/student/my-courses", label: "Khóa học của tôi", icon: BookOpen },
      { href: "/student/certificates", label: "Chứng chỉ", icon: Award },
    ],
  },
  {
    label: "Cá nhân",
    items: [
      { href: "/student/cart", label: "Giỏ hàng", icon: ShoppingCart },
      { href: "/student/wishlist", label: "Yêu thích", icon: Heart },
    ],
  },
  {
    label: "Hỗ trợ",
    items: [
      { href: "/settings", label: "Cài đặt", icon: Settings },
      { href: "/help", label: "Trợ giúp", icon: HelpCircle },
    ],
  },
];

function getStudentHeaderMeta(pathname: string) {
  if (pathname.startsWith("/student/learn")) {
    return {
      title: "Tổng quan học tập",
      subtitle: "",
      badge: "Learner Space",
    };
  }

  if (pathname.startsWith("/student/my-courses")) {
    return {
      title: "Khóa học của tôi",
      subtitle: "Theo dõi tiến độ và tiếp tục các khóa học đã đăng ký.",
      badge: "Learner Space",
    };
  }

  if (pathname.startsWith("/student/certificates")) {
    return {
      title: "Chứng chỉ",
      subtitle: "Lưu trữ thành tích học tập và chứng nhận hoàn thành khóa học.",
      badge: "Learner Space",
    };
  }

  if (pathname.startsWith("/student/cart")) {
    return {
      title: "Giỏ hàng",
      subtitle: "Kiểm tra khóa học trước khi thanh toán.",
      badge: "Learner Space",
    };
  }

  if (pathname.startsWith("/student/wishlist")) {
    return {
      title: "Yêu thích",
      subtitle: "Những khóa học bạn muốn quay lại sau.",
      badge: "Learner Space",
    };
  }

  return {
    title: "Tổng quan học tập",
    subtitle: "Tiếp tục hành trình học tập với dữ liệu khóa học mới nhất.",
    badge: "Learner Space",
  };
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const headerMeta = getStudentHeaderMeta(pathname);

  return (
    <DashboardLayout
      areaLabel="Học viên"
      badge={headerMeta.badge}
      navSections={studentNavSections}
      subtitle={headerMeta.subtitle}
      title={headerMeta.title}
      accent="primary"
      action={{
        href: "/courses",
        label: "Khám phá",
        icon: GraduationCap,
      }}
    >
      {children}
    </DashboardLayout>
  );
}
