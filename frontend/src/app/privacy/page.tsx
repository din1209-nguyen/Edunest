import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Shield } from "lucide-react";

const sections = [
  {
    title: "Thông tin chung",
    content:
      "Edunest thu thập những thông tin cần thiết để tạo tài khoản, xử lý khóa học, thanh toán và hỗ trợ người dùng.",
  },
  {
    title: "Cách sử dụng dữ liệu",
    content:
      "Dữ liệu được dùng để xác thực tài khoản, cá nhân hóa trải nghiệm học tập, gửi thông báo hệ thống và cải thiện chất lượng dịch vụ.",
  },
  {
    title: "Bảo mật",
    content:
      "Mật khẩu được mã hóa, token xác thực được quản lý bằng cookie HttpOnly và các dịch vụ bên thứ ba chỉ nhận dữ liệu cần thiết cho chức năng.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-surface py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Chính sách bảo mật</h1>
            <p className="mt-2 text-muted-foreground">Cập nhật cho môi trường demo và học tập.</p>
          </div>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-7 text-muted-foreground">{section.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
