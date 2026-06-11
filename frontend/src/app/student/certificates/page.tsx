"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { certificateApi } from "@/lib/studentApi";
import { useAuthStore } from "@/stores/auth";
import { Search, Award, Download, Share2, Calendar, BookOpen, CheckCircle, ExternalLink } from "lucide-react";
import type { Certificate, Course } from "@/types";

type CertificateWithGrade = Certificate & {
  grade?: number | null;
  course: Course;
};

function hasCourse(certificate: Certificate): certificate is CertificateWithGrade {
  return typeof certificate.course !== "string" && Boolean(certificate.course);
}

export default function CertificatesPage() {
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [certificates, setCertificates] = useState<CertificateWithGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCertificates() {
      try {
        setLoading(true);
        setError("");
        const response = await certificateApi.getMyCertificates();
        if (!mounted) return;
        setCertificates((response.data ?? []).filter(hasCourse));
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load certificates", err);
        setError("Không thể tải chứng chỉ. Hãy đăng nhập và thử lại.");
        setCertificates([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCertificates();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCertificates = useMemo(
    () =>
      certificates.filter((certificate) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return (
          certificate.course.title.toLowerCase().includes(query) ||
          certificate.certificateId.toLowerCase().includes(query)
        );
      }),
    [certificates, searchQuery]
  );

  const avgGrade = useMemo(() => {
    const grades = certificates
      .map((certificate) => certificate.grade)
      .filter((grade): grade is number => typeof grade === "number");
    if (grades.length === 0) return 0;
    return Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length);
  }, [certificates]);

  const handleDownload = (certId: string) => {
    console.log("Download certificate:", certId);
  };

  const handleShare = (certId: string) => {
    console.log("Share certificate:", certId);
  };

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Chứng chỉ của tôi</h1>
          <p className="mt-2 text-muted-foreground">Chứng chỉ hoàn thành khóa học từ MongoDB</p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Tổng chứng chỉ", value: certificates.length, icon: Award, color: "bg-primary-100 text-primary-600" },
            { label: "Còn hiệu lực", value: certificates.length, icon: CheckCircle, color: "bg-success-light text-success" },
            { label: "Năm hiện tại", value: certificates.filter((certificate) => new Date(certificate.issuedAt).getFullYear() === new Date().getFullYear()).length, icon: Calendar, color: "bg-warning-light text-warning" },
            { label: "Điểm TB", value: avgGrade ? `${avgGrade}%` : "-", icon: BookOpen, color: "bg-accent-100 text-accent-600" },
          ].map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{loading ? "..." : stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Input
              placeholder="Tìm kiếm chứng chỉ..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>

        {loading || filteredCertificates.length === 0 ? (
          <Card className="p-12 text-center">
            <Award className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {loading ? "Đang tải chứng chỉ..." : "Không có chứng chỉ"}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {loading
                ? "Đang đọc dữ liệu từ MongoDB"
                : searchQuery
                  ? "Không tìm thấy chứng chỉ phù hợp"
                  : "Hoàn thành khóa học để nhận chứng chỉ"}
            </p>
            {!loading && (
              <Link href="/courses" className="mt-6 inline-block">
                <Button>Khám phá khóa học</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredCertificates.map((certificate) => (
              <Card key={certificate._id} className="overflow-hidden">
                <div className="relative bg-gradient-to-br from-primary-50 to-secondary-50 p-6">
                  <div className="rounded-lg border-2 border-primary-200 bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-foreground">CHỨNG CHỈ HOÀN THÀNH</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{certificate.course.title}</p>
                    <div className="mt-4 border-t border-dashed border-gray-200 pt-4">
                      <p className="text-sm text-muted-foreground">Học viên</p>
                      <p className="font-semibold text-foreground">{user?.name ?? "Học viên"}</p>
                    </div>
                  </div>
                  <Badge className="absolute right-4 top-4 bg-success text-white">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Còn hiệu lực
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Khóa học</p>
                      <p className="font-medium text-foreground">{certificate.course.title}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mã chứng chỉ</p>
                      <p className="font-mono text-foreground">{certificate.certificateId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ngày cấp</p>
                      <p className="font-medium text-foreground">
                        {new Date(certificate.issuedAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Điểm số</p>
                      <p className="font-bold text-primary-600">
                        {typeof certificate.grade === "number" ? `${certificate.grade}/100` : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={() => handleDownload(certificate._id)}
                      leftIcon={<Download className="h-4 w-4" />}
                    >
                      Tải về
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(certificate._id)}
                      leftIcon={<Share2 className="h-4 w-4" />}
                    >
                      Chia sẻ
                    </Button>
                    <Link href={`/courses/${certificate.course.slug}`}>
                      <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
