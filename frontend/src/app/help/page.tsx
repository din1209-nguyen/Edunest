import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HelpCircle, Mail, MessageCircle } from "lucide-react";

const topics = [
  {
    title: "Tài khoản và đăng nhập",
    content: "Kiểm tra email, mật khẩu, cookie trình duyệt hoặc thử đăng nhập bằng Google nếu tài khoản được tạo bằng Google.",
  },
  {
    title: "Khóa học và thanh toán",
    content: "Sau khi thanh toán thành công, khóa học sẽ xuất hiện trong mục khóa học của tôi và email xác nhận sẽ được gửi từ hệ thống.",
  },
  {
    title: "Chứng chỉ",
    content: "Chứng chỉ được cấp khi bạn hoàn thành yêu cầu tiến độ của khóa học và có thể xem trong trang chứng chỉ.",
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-surface py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trung tâm hỗ trợ</h1>
            <p className="mt-2 text-muted-foreground">Các câu hỏi thường gặp khi sử dụng Edunest.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {topics.map((topic) => (
            <Card key={topic.title}>
              <CardHeader>
                <CardTitle className="text-lg">{topic.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-7 text-muted-foreground">{topic.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Cần hỗ trợ thêm?</h2>
              <p className="mt-1 text-muted-foreground">Liên hệ đội ngũ Edunest để được xử lý nhanh hơn.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="mailto:contact@edunest.local">
                  <Mail className="mr-2 h-4 w-4" />
                  Gửi email
                </Link>
              </Button>
              <Button asChild>
                <Link href="/settings">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Cài đặt hỗ trợ
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
