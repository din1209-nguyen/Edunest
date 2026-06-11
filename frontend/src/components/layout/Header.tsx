"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore, useUserRole } from "@/stores/auth";
import { useCartStore, useToastStore, useWishlistStore } from "@/stores/wishlistStore";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { formatPrice, cn } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

const publicNavLinks = [
  { href: "/courses", label: "Khóa học" },
  { href: "/categories", label: "Danh mục" },
  { href: "/about", label: "Giới thiệu" },
];
const COURSE_THUMBNAIL_FALLBACK = "/placeholder-course.svg";

function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      if (event.target instanceof Node && el.contains(event.target)) return;
      handler();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export function Header() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartPopoverOpen, setIsCartPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasBootstrapped = useAuthStore((state) => state.hasBootstrapped);
  const logout = useAuthStore((state) => state.logout);
  const userRole = useUserRole();

  const cartItems = useCartStore((state) => state.items);
  const removeCartItem = useCartStore((state) => state.removeItem);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const wishlistItems = useWishlistStore((state) => state.items);
  const addToast = useToastStore((state) => state.addToast);

  const cartRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(cartRef, () => setIsCartPopoverOpen(false));

  useEffect(() => {
    queueMicrotask(() => setHasMounted(true));
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    router.replace("/login");
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const requireLogin = () => {
    addToast({ type: "warning", message: "Vui lòng đăng nhập để sử dụng tính năng này" });
    router.push("/login");
  };

  const previewCartItems = useMemo(() => cartItems.slice(0, 5), [cartItems]);
  const cartTotal = getTotalPrice();
  const canShowUserState = hasMounted && hasBootstrapped && isAuthenticated;
  const canShowGuestState = hasMounted && hasBootstrapped && !isAuthenticated;
  const dashboardHref = userRole === "admin" ? "/admin/dashboard" : "/student/dashboard";
  const dashboardLabel = userRole === "admin" ? "Quản trị" : "Học tập";
  const canShowTeacherDashboard = canShowUserState && (userRole === "user" || userRole === "admin");

  if (pathname.startsWith("/admin") || pathname.startsWith("/teacher") || pathname.startsWith("/student")) {
    return null;
  }

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsCartPopoverOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/70 bg-white/85 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="app-container flex h-16 items-center justify-between gap-2 lg:h-20 lg:gap-4">
        <div className="flex min-w-0 items-center gap-3 lg:gap-7">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 shadow-lg shadow-primary-500/20 transition-transform duration-200 group-hover:scale-105">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <span className="block truncate text-lg font-extrabold tracking-tight text-foreground lg:text-xl">
                Edunest
              </span>
              <span className="hidden text-xs text-muted-foreground md:block">
                Nền tảng học tiếng Anh hiện đại
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            {canShowUserState && (
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 text-sm font-semibold text-primary-700 ring-1 ring-primary-100 transition-colors hover:bg-primary-50"
              >
                <LayoutDashboard className="h-4 w-4" />
                {dashboardLabel}
              </Link>
            )}
            {canShowTeacherDashboard && (
              <Link
                href="/teacher/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2.5 text-sm font-semibold text-secondary-700 ring-1 ring-secondary-100 transition-colors hover:bg-secondary-50"
              >
                <BookOpen className="h-4 w-4" />
                Giảng viên
              </Link>
            )}
            {publicNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-surface hover:text-foreground",
                  pathname.startsWith(link.href) ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <form
          onSubmit={handleSearch}
          className="hidden min-w-0 flex-1 items-center justify-center px-2 lg:flex lg:px-6 xl:px-8"
        >
          <div className="relative w-full max-w-md xl:max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Tìm kiếm khóa học, kỹ năng, chủ đề..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 w-full rounded-full border border-white/70 bg-white/90 pl-11 pr-4 text-sm shadow-[0_12px_30px_-22px_rgba(15,23,42,0.55),0_4px_14px_-10px_rgba(55,118,232,0.35)] backdrop-blur-sm transition-colors focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10"
            />
          </div>
        </form>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSearchOpen((value) => !value)}
            aria-label="Tìm kiếm"
          >
            <Search className="h-5 w-5" />
          </Button>

          {canShowGuestState && (
            <>
              <Link
                href="/student/wishlist"
                className="relative"
                onClick={(event) => {
                  event.preventDefault();
                  requireLogin();
                }}
              >
                <Button variant="ghost" size="icon" className="relative" aria-label="Yêu thích">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>

              <Link
                href="/student/cart"
                className="relative"
                onClick={(event) => {
                  event.preventDefault();
                  requireLogin();
                }}
              >
                <Button variant="ghost" size="icon" className="relative" aria-label="Giỏ hàng">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </Link>
            </>
          )}

          {canShowUserState ? (
            <>
              <Link href="/student/wishlist" className="relative" aria-label="Yêu thích">
                <Button variant="ghost" size="icon" className="relative">
                  <Heart className="h-5 w-5" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-secondary-600 px-1 text-[10px] font-bold text-white">
                      {wishlistItems.length}
                    </span>
                  )}
                </Button>
              </Link>

              <div className="relative" ref={cartRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setIsCartPopoverOpen((value) => !value)}
                  aria-expanded={isCartPopoverOpen}
                  aria-haspopup="dialog"
                  aria-label="Giỏ hàng"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItems.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                      {cartItems.length}
                    </span>
                  )}
                </Button>

                {isCartPopoverOpen && (
                  <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] animate-scaleIn rounded-xl border border-border bg-background shadow-xl">
                    <div className="border-b border-border px-4 py-3">
                      <p className="font-semibold text-foreground">Giỏ hàng</p>
                      <p className="text-sm text-muted-foreground">{cartItems.length} khóa học</p>
                    </div>

                    <div className="max-h-80 overflow-auto p-2">
                      {cartItems.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          Giỏ hàng đang trống.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {previewCartItems.map((item) => (
                            <div key={item._id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                              <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md">
                                <Image src={item.thumbnail || COURSE_THUMBNAIL_FALLBACK} alt={item.title} fill sizes="80px" className="object-cover" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                                <p className="text-sm font-semibold text-primary-600">{formatPrice(item.price)}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-error"
                                onClick={() => {
                                  removeCartItem(item._id);
                                  addToast({ type: "info", message: "Đã xóa khỏi giỏ hàng" });
                                }}
                                aria-label="Xóa khỏi giỏ hàng"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}

                          {cartItems.length > previewCartItems.length && (
                            <p className="px-2 py-1 text-xs text-muted-foreground">
                              Và {cartItems.length - previewCartItems.length} khóa học khác...
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 border-t border-border px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tổng cộng</span>
                        <span className="font-semibold text-foreground">{formatPrice(cartTotal)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" asChild>
                          <Link href="/student/cart" onClick={() => setIsCartPopoverOpen(false)}>
                            Xem giỏ hàng
                          </Link>
                        </Button>
                        <Button className="flex-1" asChild rightIcon={<ArrowRight className="h-4 w-4" />}>
                          <Link href="/student/cart" onClick={() => setIsCartPopoverOpen(false)}>
                            Thanh toán
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-surface"
                  aria-expanded={isUserMenuOpen}
                >
                  <Avatar src={user?.avatar} name={user?.name} size="sm" />
                  <ChevronDown className={cn("hidden h-4 w-4 text-muted-foreground transition-transform sm:block", isUserMenuOpen && "rotate-180")} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 animate-scaleIn rounded-xl border border-border bg-background py-2 shadow-xl">
                    <div className="border-b border-border px-4 pb-3">
                      <p className="font-medium text-foreground">{user?.name}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary-600">
                        {userRole === "admin" ? "Quản trị viên" : "Người dùng"}
                      </p>
                    </div>

                    <div className="py-2">
                      <Link
                        href={dashboardHref}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {dashboardLabel}
                      </Link>
                      {canShowTeacherDashboard && (
                        <Link
                          href="/teacher/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                        >
                          <BookOpen className="h-4 w-4" />
                          Giảng viên
                        </Link>
                      )}
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
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button variant="default" size="sm">
                  Đăng ký
                </Button>
              </Link>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label="Mở menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isSearchOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <form onSubmit={handleSearch} className="app-container py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Tìm kiếm khóa học..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-white pl-10 pr-4 text-sm text-foreground shadow-[0_10px_24px_-18px_rgba(15,23,42,0.45)] transition-colors focus:border-primary-500 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </form>
        </div>
      )}

      {isMenuOpen && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="app-container flex flex-col gap-1 py-3">
            {canShowUserState && (
              <Link
                href={dashboardHref}
                onClick={closeMenus}
                className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700"
              >
                <LayoutDashboard className="h-4 w-4" />
                {dashboardLabel}
              </Link>
            )}
            {canShowTeacherDashboard && (
              <Link
                href="/teacher/dashboard"
                onClick={closeMenus}
                className="flex items-center gap-2 rounded-lg bg-secondary-50 px-3 py-2 text-sm font-semibold text-secondary-700"
              >
                <BookOpen className="h-4 w-4" />
                Giảng viên
              </Link>
            )}
            {publicNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenus}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            {canShowGuestState && (
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3 sm:hidden">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login" onClick={closeMenus}>
                    Đăng nhập
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register" onClick={closeMenus}>
                    Đăng ký
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
