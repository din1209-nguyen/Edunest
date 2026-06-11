import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastContainer } from "@/components/ui/Toast";
import { AuthBootstrap } from "@/components/auth/AuthBootstrap";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Edunest - Học tiếng Anh trực tuyến",
    template: "%s | Edunest",
  },
  description: "Nền tảng học tiếng Anh trực tuyến hàng đầu Việt Nam với các khóa học chất lượng cao từ cơ bản đến nâng cao.",
  keywords: ["học tiếng Anh", "khóa học tiếng Anh online", "IELTS", "TOEIC", "giao tiếp tiếng Anh"],
  authors: [{ name: "Edunest" }],
  creator: "Edunest",
  icons: {
    icon: [
      { url: "/file.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem('edunest-theme');
                var theme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light';
                document.documentElement.classList.toggle('dark', theme === 'dark');
                document.documentElement.dataset.theme = theme;
              } catch (_) {}
            `,
          }}
        />
        <AuthBootstrap />
        <Header />
        <div className="min-h-[calc(100vh-64px)]">{children}</div>
        <Footer />
        <ToastContainer />
      </body>
    </html>
  );
}
