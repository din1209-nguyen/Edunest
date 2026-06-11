import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Cookie } from "lucide-react";

const cookies = [
  {
    title: "Cookie đăng nhập",
    content:
      "Backend sử dụng cookie HttpOnly để lưu access token và refresh token, giúp phiên đăng nhập an toàn hơn.",
  },
  {
    title: "Cookie OAuth",
    content:
      "Khi đăng nhập Google, hệ thống tạo cookie tạm thời để bảo vệ state và điều hướng sau khi xác thực.",
  },
  {
    title: "Dữ liệu trình duyệt",
    content:
      "Frontend có thể lưu một phần trạng thái giao diện và thông tin người dùng trong local storage để cải thiện trải nghiệm.",
  },
];

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-surface py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Cookie className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Chính sách cookie</h1>
            <p className="mt-2 text-muted-foreground">Cách Edunest sử dụng cookie và dữ liệu trình duyệt.</p>
          </div>
        </div>

        <div className="space-y-4">
          {cookies.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-7 text-muted-foreground">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
