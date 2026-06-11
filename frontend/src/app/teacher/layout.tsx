"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  HelpCircle,
  LayoutDashboard,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { DashboardLayout, type DashboardNavSection } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/stores/auth";

const teacherNavSections: DashboardNavSection[] = [
  {
    label: "Tổng quan",
    items: [{ href: "/teacher/dashboard", label: "Tổng quan", icon: LayoutDashboard }],
  },
  {
    label: "Quản lý",
    items: [
      {
        href: "/teacher/courses",
        label: "Quản lý khóa học",
        icon: BookOpen,
        children: [{ href: "/teacher/courses/create", label: "Tạo khóa học" }],
      },
      { href: "/teacher/students", label: "Học viên", icon: Users },
      { href: "/teacher/analytics", label: "Thống kê", icon: BarChart3 },
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

const canAccessTeacherArea = (role?: string) => role === "admin" || role === "user";

function getTeacherHeaderMeta(pathname: string, userName?: string) {
  if (pathname === "/teacher/courses") {
    return {
      badge: "Creator workspace",
      title: "Quản lý khóa học",
      subtitle: "Theo dõi các khóa học bạn đang quản lý trên hệ thống.",
      actionLabel: "Tạo khóa học",
      actionHref: "/teacher/courses/create",
      actionIcon: Plus,
    };
  }

  if (pathname === "/teacher/courses/create") {
    return {
      badge: "Creator workspace",
      title: "Tạo khóa học mới",
      subtitle: "Hoàn thiện thông tin cốt lõi để lưu bản nháp và tiếp tục bổ sung nội dung.",
      actionLabel: "Danh sách khóa học",
      actionHref: "/teacher/courses",
      actionIcon: BookOpen,
    };
  }

  if (pathname.startsWith("/teacher/courses/")) {
    return {
      badge: "Creator workspace",
      title: "Chỉnh sửa khóa học",
      subtitle: "Cập nhật thông tin, chương, bài học, bài tập và trạng thái duyệt của khóa học.",
      actionLabel: "Danh sách khóa học",
      actionHref: "/teacher/courses",
      actionIcon: BookOpen,
    };
  }

  if (pathname.startsWith("/teacher/analytics")) {
    return {
      badge: "Creator workspace",
      title: "Thống kê",
      subtitle: "Theo dõi học viên, doanh thu và hiệu suất nội dung theo từng khóa học.",
      actionLabel: "Tạo khóa học",
      actionHref: "/teacher/courses/create",
      actionIcon: Plus,
    };
  }

  return {
    badge: "Teacher workspace",
    title: `Xin chào, ${userName || "Giảng viên"}`,
    subtitle: "Theo dõi hiệu suất khóa học, học viên mới và những nội dung cần chú ý.",
    actionLabel: "Tạo khóa học",
    actionHref: "/teacher/courses/create",
    actionIcon: Plus,
  };
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasBootstrapped = useAuthStore((state) => state.hasBootstrapped);
  const headerMeta = getTeacherHeaderMeta(pathname, user?.name);

  useEffect(() => {
    if (isLoading || !hasBootstrapped) return;

    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!canAccessTeacherArea(user?.role)) {
      router.replace("/login");
    }
  }, [hasBootstrapped, isAuthenticated, isLoading, pathname, router, user?.role]);

  if (isLoading || !hasBootstrapped || !isAuthenticated || !canAccessTeacherArea(user?.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-muted-foreground">
        Đang tải...
      </div>
    );
  }

  return (
    <DashboardLayout
      action={{ href: headerMeta.actionHref, label: headerMeta.actionLabel, icon: headerMeta.actionIcon }}
      areaLabel="Giảng viên"
      badge={headerMeta.badge}
      navSections={teacherNavSections}
      subtitle={headerMeta.subtitle}
      title={headerMeta.title}
    >
      {children}
    </DashboardLayout>
  );
}
