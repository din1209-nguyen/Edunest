import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FileText } from "lucide-react";

const terms = [
  "Người dùng cần cung cấp thông tin tài khoản chính xác và tự chịu trách nhiệm bảo mật thông tin đăng nhập.",
  "Nội dung khóa học chỉ được sử dụng cho mục đích học tập cá nhân, không sao chép hoặc phân phối trái phép.",
  "Các giao dịch thanh toán, ghi danh và cấp chứng chỉ được xử lý theo trạng thái hệ thống và lịch sử giao dịch.",
  "Edunest có quyền tạm khóa tài khoản vi phạm quy định cộng đồng, gian lận thanh toán hoặc lạm dụng hệ thống.",
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Điều khoản sử dụng</h1>
            <p className="mt-2 text-muted-foreground">Những quy định cơ bản khi sử dụng Edunest.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Điều khoản chính</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {terms.map((term, index) => (
                <li key={term} className="flex gap-3 leading-7 text-muted-foreground">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-600">
                    {index + 1}
                  </span>
                  <span>{term}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
