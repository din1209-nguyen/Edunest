import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="app-container flex min-h-[calc(100vh-160px)] items-center justify-center py-16">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-surface/70 p-8 text-center shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">404</p>
        <h1 className="mt-3 text-3xl font-extrabold text-foreground">Không tìm thấy trang</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Trang bạn đang mở không tồn tại hoặc đã được di chuyển.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild>
            <Link href="/">Về trang chủ</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
