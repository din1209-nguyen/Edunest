"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type ComponentType, type MouseEvent, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

type DashboardIcon = ComponentType<{ className?: string }>;

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: DashboardIcon;
  children?: Array<{ href: string; label: string }>;
}

export interface DashboardNavSection {
  label: string;
  items: DashboardNavItem[];
}

interface DashboardAction {
  href: string;
  label: string;
  icon?: DashboardIcon;
}

interface DashboardLayoutProps {
  action?: DashboardAction;
  accent?: "primary" | "secondary";
  areaLabel: string;
  badge?: string;
  children: ReactNode;
  navSections: DashboardNavSection[];
  subtitle?: string;
  title: string;
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function normalizePath(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export function DashboardLayout({
  action,
  accent = "primary",
  areaLabel,
  badge,
  children,
  navSections,
  subtitle,
  title,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activeSectionLabel = useMemo(() => {
    for (const section of navSections) {
      for (const item of section.items) {
        if (isActivePath(pathname, item.href)) return item.label;
      }
    }
    return areaLabel;
  }, [areaLabel, navSections, pathname]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.replace("/login");
  };

  const handleSidebarLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (normalizePath(pathname) === normalizePath(href)) {
      event.preventDefault();
      setIsMobileOpen(false);
      return;
    }

    setIsMobileOpen(false);
  };

  const activeClasses =
    accent === "secondary"
      ? "bg-secondary-50 text-secondary-700"
      : "bg-primary-50 text-primary-700";
  const activeBar = accent === "secondary" ? "bg-secondary-500" : "bg-primary-500";
  const iconActive = accent === "secondary" ? "text-secondary-600" : "text-primary-600";
  const ActionIcon = action?.icon;

  const renderSidebar = () => (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-r border-border/80 bg-white shadow-[0_2px_18px_rgba(67,89,113,0.10)] transition-[width] duration-500 ease-in-out",
        isCollapsed ? "lg:w-[82px]" : "lg:w-[260px]",
        "w-[260px]"
      )}
    >
      <div className={cn("relative flex h-[72px] shrink-0 items-center px-5", isCollapsed ? "lg:justify-center lg:px-3" : "justify-between")}>
        <Link href="/" className={cn("flex min-w-0 items-center gap-3", isCollapsed && "lg:justify-center")}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-sm font-bold text-white shadow-md shadow-primary-500/20">
            E
          </span>
          <span
            className={cn(
              "truncate text-xl font-extrabold tracking-tight text-foreground transition-[opacity,width] duration-300 ease-in-out",
              isCollapsed ? "lg:w-0 lg:opacity-0" : "w-32 opacity-100"
            )}
          >
            Edunest
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          className="absolute -right-3 top-6 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white bg-primary-600 text-white shadow-md shadow-primary-900/15 transition-colors hover:bg-primary-700 lg:flex"
          aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface lg:hidden"
          aria-label="Đóng menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto pb-5">
        {navSections.map((section) => (
          <div key={section.label} className="mt-3 first:mt-1">
            <div
              className={cn(
                "relative mx-6 mb-2 mt-5 overflow-hidden text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-[height,opacity,margin] duration-200 ease-out",
                "duration-300 ease-in-out",
                isCollapsed ? "lg:mx-0 lg:mb-0 lg:mt-2 lg:h-0 lg:opacity-0" : "h-4 opacity-100"
              )}
            >
                <span className="absolute -left-6 top-1/2 h-px w-5 bg-border" />
                {section.label}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(pathname, item.href);
                const hasActiveChild = item.children?.some((child) => isActivePath(pathname, child.href));
                const itemIsActive = isActive || hasActiveChild;

                return (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      onClick={(event) => handleSidebarLinkClick(event, item.href)}
                      className={cn(
                        "relative mx-3 flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-[background-color,color,padding] duration-200 ease-out",
                        "lg:transition-[background-color,color,padding,width,margin] lg:duration-300 lg:ease-in-out",
                        itemIsActive ? activeClasses : "text-muted-foreground hover:bg-primary-50/70 hover:text-primary-700",
                        isCollapsed && "lg:mx-auto lg:w-11 lg:justify-center lg:gap-0 lg:px-0"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 shrink-0", itemIsActive ? iconActive : "text-muted-foreground")} />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate transition-[opacity,width] duration-300 ease-in-out",
                          isCollapsed ? "lg:w-0 lg:flex-none lg:opacity-0" : "opacity-100"
                        )}
                      >
                        {item.label}
                      </span>
                      {item.children?.length ? (
                        <ChevronRight className={cn("h-4 w-4 transition-opacity duration-300", itemIsActive && iconActive, isCollapsed && "lg:opacity-0")} />
                      ) : null}
                      {itemIsActive && !isCollapsed && (
                        <span className={cn("absolute -right-3 top-2 h-7 w-1 rounded-l-lg", activeBar)} />
                      )}
                    </Link>

                    {!isCollapsed && item.children?.length && itemIsActive ? (
                      <div className="mb-2 mt-1 space-y-1">
                        {item.children.map((child) => {
                          const childActive = isActivePath(pathname, child.href);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={(event) => handleSidebarLinkClick(event, child.href)}
                              className={cn(
                                "relative flex h-9 items-center pl-[58px] pr-4 text-sm transition-colors",
                                childActive ? "font-medium text-primary-700" : "text-muted-foreground hover:text-primary-700"
                              )}
                            >
                              <span
                                className={cn(
                                  "absolute left-[34px] h-1.5 w-1.5 rounded-full",
                                  childActive ? "bg-primary-500 shadow-[0_0_0_3px_rgba(55,118,232,0.16)]" : "bg-slate-300"
                                )}
                              />
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-foreground dark:bg-[#0b1220]">
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Đóng nền menu"
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {renderSidebar()}
      </div>

      <div className={cn("min-h-screen lg:pl-0", "lg:ml-0")}>
        <div
          className={cn(
            "lg:fixed lg:inset-y-0 lg:left-0 lg:z-30",
            isCollapsed ? "lg:w-[82px]" : "lg:w-[260px]"
          )}
        >
          <div className="hidden h-full lg:block">{renderSidebar()}</div>
        </div>

        <main
          className={cn(
            "min-h-screen p-4 transition-[padding] duration-500 ease-in-out sm:p-5 lg:p-6",
            isCollapsed ? "lg:pl-[106px]" : "lg:pl-[284px]"
          )}
        >
          <header className="mb-5 min-h-[132px] rounded-xl border border-border/70 bg-white px-5 py-5 shadow-[0_2px_14px_rgba(67,89,113,0.12)] dark:bg-[#111827] dark:shadow-[0_18px_44px_-30px_rgba(0,0,0,0.75)] lg:px-6 lg:py-6">
            <div className="flex min-h-[92px] flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
              <div className="flex min-w-0 flex-1 items-stretch gap-3">
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-lg text-muted-foreground hover:bg-surface lg:hidden"
                  onClick={() => setIsMobileOpen(true)}
                  aria-label="Mở menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="flex min-h-[92px] min-w-0 flex-1 flex-col justify-between pb-0.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Link href="/" className="hover:text-foreground">
                      Trang chủ
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span>{areaLabel}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="truncate text-foreground">{activeSectionLabel}</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {badge && (
                        <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-700">
                          {badge}
                        </span>
                      )}
                      <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground md:text-2xl">{title}</h1>
                    </div>
                    {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:self-start">
                <form onSubmit={handleSearch} className="relative min-w-0 sm:w-80 xl:w-96">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Tìm kiếm..."
                    className="h-10 w-full rounded-lg border border-border bg-surface/70 pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:focus:bg-[#172033]"
                  />
                </form>

                <div className="flex items-center justify-end gap-2">
                  {action && (
                    <Button asChild size="sm" className="gap-2">
                      <Link href={action.href}>
                        {ActionIcon && <ActionIcon className="h-4 w-4" />}
                        {action.label}
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" aria-label="Thông báo">
                    <Bell className="h-5 w-5" />
                  </Button>
                  <ThemeToggle />
                  <Link href="/settings" aria-label="Cài đặt">
                    <Button variant="ghost" size="icon">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                  <div className="relative">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-surface"
                      onClick={() => setIsUserMenuOpen((value) => !value)}
                    >
                      <Avatar src={user?.avatar} name={user?.name} size="sm" />
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isUserMenuOpen && "rotate-180")} />
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-border bg-white py-2 shadow-xl">
                        <div className="border-b border-border px-4 pb-3">
                          <p className="truncate font-medium text-foreground">{user?.name}</p>
                          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                        <Link
                          href="/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                        >
                          <Settings className="h-4 w-4" />
                          Cài đặt
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-error transition-colors hover:bg-error-light"
                        >
                          <LogOut className="h-4 w-4" />
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="content-stack">{children}</div>
        </main>
      </div>
    </div>
  );
}
