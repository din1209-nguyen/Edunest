"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  FolderTree,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { DashboardLayout, type DashboardNavSection } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/stores/auth";

const adminNavSections: DashboardNavSection[] = [
  {
    label: "Tổng quan",
    items: [{ href: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard }],
  },
  {
    label: "Quản lý",
    items: [
      { href: "/admin/users", label: "Người dùng", icon: Users },
      { href: "/admin/courses", label: "Khóa học", icon: BookOpen },
      { href: "/admin/categories", label: "Danh mục", icon: FolderTree },
    ],
  },
  {
    label: "Báo cáo",
    items: [{ href: "/admin/analytics", label: "Thống kê", icon: BarChart3 }],
  },
  {
    label: "Hỗ trợ",
    items: [
      { href: "/settings", label: "Cài đặt", icon: Settings },
      { href: "/help", label: "Trợ giúp", icon: HelpCircle },
    ],
  },
];

function getAdminHeaderMeta(pathname: string) {
  if (pathname.startsWith("/admin/users")) {
    return {
      title: "Quản lý người dùng",
      subtitle: "Theo dõi tài khoản, vai trò và trạng thái hoạt động của người dùng.",
    };
  }

  if (pathname.startsWith("/admin/courses")) {
    return {
      title: "Quản lý khóa học",
      subtitle: "Duyệt, kiểm tra và quản trị các khóa học trên hệ thống.",
    };
  }

  if (pathname.startsWith("/admin/categories")) {
    return {
      title: "Quản lý danh mục",
      subtitle: "Tổ chức danh mục học tập để nội dung dễ tìm và dễ mở rộng.",
    };
  }

  if (pathname.startsWith("/admin/analytics")) {
    return {
      title: "Thống kê hệ thống",
      subtitle: "Theo dõi các chỉ số vận hành, học viên, khóa học và doanh thu.",
    };
  }

  return {
    title: "Dashboard quản trị",
    subtitle: "Tổng quan hệ thống, người dùng, khóa học và những chỉ số cần chú ý.",
  };
}

export default function AdminLayout({
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
  const headerMeta = getAdminHeaderMeta(pathname);

  useEffect(() => {
    if (isLoading || !hasBootstrapped) return;

    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user?.role !== "admin") {
      router.replace("/login");
    }
  }, [hasBootstrapped, isAuthenticated, isLoading, pathname, router, user?.role]);

  if (isLoading || !hasBootstrapped || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-muted-foreground">
        Đang tải...
      </div>
    );
  }

  return (
    <DashboardLayout
      accent="secondary"
      areaLabel="Quản trị viên"
      badge="Admin dashboard"
      navSections={adminNavSections}
      subtitle={headerMeta.subtitle}
      title={headerMeta.title}
    >
      {children}
    </DashboardLayout>
  );
}
