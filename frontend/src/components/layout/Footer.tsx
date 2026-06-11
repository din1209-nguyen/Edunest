"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const footerLinks = {
  platform: [
    { label: "Về chúng tôi", href: "/about" },
    { label: "Khóa học", href: "/courses" },
    { label: "Giảng viên", href: "/instructors" },
    { label: "Trở thành giảng viên", href: "/become-instructor" },
  ],
  support: [
    { label: "Trung tâm hỗ trợ", href: "/help" },
    { label: "Điều khoản sử dụng", href: "/terms" },
    { label: "Chính sách bảo mật", href: "/privacy" },
    { label: "Chính sách hoàn tiền", href: "/refund" },
  ],
  explore: [
    { label: "Lập trình Web", href: "/categories/web-development" },
    { label: "Ngôn ngữ Anh", href: "/categories/english" },
    { label: "Kỹ năng mềm", href: "/categories/soft-skills" },
    { label: "Marketing", href: "/categories/marketing" },
  ],
};

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/teacher") || pathname.startsWith("/student")) {
    return null;
  }

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary-300/70 to-transparent" />
      <div className="absolute right-0 top-0 h-40 w-1/2 bg-gradient-to-bl from-secondary-400/20 to-transparent" />

      {/* Main Footer */}
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-lg shadow-black/10">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">Edunest</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/72">
              Nền tảng học tiếng Anh trực tuyến hàng đầu Việt Nam. Học mọi lúc, mọi nơi với
              các khóa học chất lượng cao từ giảng viên uy tín.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/courses"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-primary-700 shadow-md transition-all hover:bg-primary-50"
              >
                Khám phá khóa học
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/teacher/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition-all hover:bg-white/15"
              >
                Trở thành giảng viên
              </Link>
            </div>

            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/72">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-secondary-200">
                  <Mail className="h-4 w-4" />
                </span>
                <span>contact@edunest.local</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/72">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-secondary-200">
                  <Phone className="h-4 w-4" />
                </span>
                <span>1900 1234</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/72">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-secondary-200">
                  <MapPin className="h-4 w-4" />
                </span>
                <span>Hà Nội, Việt Nam</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-all hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-md"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-all hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-md"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-all hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-md"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-all hover:-translate-y-0.5 hover:bg-white/15 hover:shadow-md"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Nền tảng
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/68 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Hỗ trợ
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/68 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Khám phá
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/68 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-white/10 bg-black/10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-white/62">
              &copy; {new Date().getFullYear()} Edunest. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex gap-6">
              <Link
                href="/terms"
                className="text-sm text-white/62 transition-colors hover:text-white"
              >
                Điều khoản
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-white/62 transition-colors hover:text-white"
              >
                Bảo mật
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-white/62 transition-colors hover:text-white"
              >
                Cookie
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
