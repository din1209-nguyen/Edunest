"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/stores/auth";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ShoppingCart,
  Heart,
  GraduationCap,
  BarChart3,
  Settings,
  FileText,
  FolderTree,
  Bell,
  HelpCircle,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

type UserArea = "learning" | "teaching" | "admin";

const studentNavItems: NavItem[] = [
  { href: "/student/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/student/my-courses", label: "Khóa học của tôi", icon: BookOpen },
  { href: "/student/cart", label: "Giỏ hàng", icon: ShoppingCart },
  { href: "/student/wishlist", label: "Yêu thích", icon: Heart },
  { href: "/student/certificates", label: "Chứng chỉ", icon: GraduationCap },
  { href: "/student/learning", label: "Đang học", icon: FileText },
];

const teacherNavItems: NavItem[] = [
  { href: "/teacher/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/teacher/courses", label: "Quản lý khóa học", icon: BookOpen },
  { href: "/teacher/students", label: "Học viên", icon: Users },
  { href: "/teacher/analytics", label: "Thống kê", icon: BarChart3 },
  { href: "/teacher/announcements", label: "Thông báo", icon: Bell },
];

const adminNavItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/courses", label: "Khóa học", icon: BookOpen },
  { href: "/admin/categories", label: "Danh mục", icon: FolderTree },
  { href: "/admin/analytics", label: "Thống kê", icon: BarChart3 },
  { href: "/admin/reports", label: "Báo cáo", icon: FileText },
];

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ className, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const userRole = useUserRole();

  const getNavItems = () => {
    if (userRole === "admin") {
      return adminNavItems;
    }

    const currentArea: UserArea = pathname.startsWith("/teacher/")
      ? "teaching"
      : pathname.startsWith("/admin/")
        ? "admin"
        : "learning";

    return currentArea === "teaching" ? teacherNavItems : studentNavItems;
  };

  const navItems = getNavItems();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-primary-600">Edunest</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-primary-600" : ""
                )}
              />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-xs font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-4 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Cài đặt</span>}
        </Link>
        <Link
          href="/help"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <HelpCircle className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Trợ giúp</span>}
        </Link>
      </div>
    </aside>
  );
}

// Collapsible Sidebar with Toggle
interface CollapsibleSidebarProps {
  defaultCollapsed?: boolean;
}

export function CollapsibleSidebar({ defaultCollapsed = false }: CollapsibleSidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <Sidebar
      collapsed={collapsed}
      onToggle={() => setCollapsed(!collapsed)}
      className="fixed left-0 top-0 z-40"
    />
  );
}
