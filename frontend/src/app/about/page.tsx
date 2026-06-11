"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Target,
  Heart,
  Globe,
  Shield,
  Clock,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";
import Link from "next/link";

const stats = [
  { icon: Users, value: "50,000+", label: "Học viên" },
  { icon: BookOpen, value: "500+", label: "Khóa học" },
  { icon: GraduationCap, value: "10,000+", label: "Chứng chỉ" },
  { icon: Award, value: "4.8/5", label: "Đánh giá" },
];

const values = [
  {
    icon: Target,
    title: "Chất lượng là ưu tiên hàng đầu",
    description: "Mọi khóa học đều được biên soạn bởi đội ngũ chuyên gia có kinh nghiệm và kiểm duyệt kỹ lưỡng trước khi ra mắt.",
  },
  {
    icon: Heart,
    title: "Học viên là trung tâm",
    description: "Chúng tôi lắng nghe và không ngừng cải thiện dựa trên phản hồi của học viên để mang đến trải nghiệm tốt nhất.",
  },
  {
    icon: Globe,
    title: "Học mọi lúc, mọi nơi",
    description: "Nền tảng của chúng tôi hoạt động trên mọi thiết bị, giúp bạn học tiếng Anh một cách thuận tiện nhất.",
  },
  {
    icon: Shield,
    title: "Cam kết hoàn tiền",
    description: "Nếu bạn không hài lòng trong vòng 30 ngày, chúng tôi sẵn sàng hoàn tiền 100%.",
  },
];

const team = [
  {
    name: "TS. Nguyễn Văn Minh",
    role: "Founder & CEO",
    avatar: "NVM",
    bio: "15 năm kinh nghiệm giảng dạy tiếng Anh, chuyên gia IELTS hàng đầu Việt Nam.",
  },
  {
    name: "ThS. Trần Thị Lan",
    role: "Head of Content",
    avatar: "TTL",
    bio: "Chuyên gia thiết kế chương trình giảng dạy với 10 năm kinh nghiệm.",
  },
  {
    name: "CN. Lê Hoàng Nam",
    role: "Head of Technology",
    avatar: "LHN",
    bio: "Chuyên gia công nghệ giáo dục, xây dựng nền tảng học tập hiện đại.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary-200/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
              Về <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Edunest</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Nền tảng học tiếng Anh trực tuyến hàng đầu Việt Nam, giúp hàng triệu người
              tự tin giao tiếp tiếng Anh và đạt được mục tiêu học tập của mình.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-lg">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <p className="mt-4 text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Câu chuyện của chúng tôi
              </h2>
              <p className="mt-4 text-muted-foreground">
                Edunest được thành lập vào năm 2020 với sứ mệnh đơn giản hóa việc học tiếng Anh
                cho người Việt. Chúng tôi tin rằng ai cũng có thể học tiếng Anh giỏi nếu có phương pháp
                và công cụ phù hợp.
              </p>
              <p className="mt-4 text-muted-foreground">
                Từ một dự án nhỏ với vài khóa học miễn phí, đến nay Edunest đã phát triển thành
                nền tảng với hơn 500 khóa học chất lượng cao, phục vụ hơn 50,000 học viên trên khắp
                cả nước.
              </p>
              <p className="mt-4 text-muted-foreground">
                Chúng tôi không ngừng nỗ lực để mang đến những trải nghiệm học tập tốt nhất,
                kết hợp công nghệ hiện đại với phương pháp giảng dạy đã được chứng minh hiệu quả.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary-100 to-secondary-100 p-8">
                <div className="flex h-full items-center justify-center rounded-2xl bg-white shadow-xl">
                  <GraduationCap className="h-32 w-32 text-primary-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Giá trị cốt lõi
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Những nguyên tắc hướng dẫn mọi quyết định của chúng tôi
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {values.map((value) => (
              <Card key={value.title} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100">
                    <value.icon className="h-7 w-7 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{value.title}</h3>
                    <p className="mt-2 text-muted-foreground">{value.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Đội ngũ của chúng tôi
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Những người đam mê giáo dục đứng sau Edunest
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {team.map((member) => (
              <Card key={member.name} className="overflow-hidden text-center">
                <CardContent className="p-6">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-2xl font-bold text-white">
                    {member.avatar}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{member.name}</h3>
                  <p className="text-sm text-primary-600">{member.role}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gradient-to-br from-primary-600 to-secondary-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold sm:text-4xl">Liên hệ với chúng tôi</h2>
            <p className="mt-4 text-lg text-white/80">
              Bạn có câu hỏi hoặc muốn hợp tác? Hãy liên hệ ngay!
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center text-white">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
                <Mail className="h-7 w-7" />
              </div>
              <p className="mt-4 font-medium">Email</p>
              <p className="text-white/80">contact@edunest.local</p>
            </div>
            <div className="text-center text-white">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
                <Phone className="h-7 w-7" />
              </div>
              <p className="mt-4 font-medium">Điện thoại</p>
              <p className="text-white/80">1900 1234</p>
            </div>
            <div className="text-center text-white">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
                <MapPin className="h-7 w-7" />
              </div>
              <p className="mt-4 font-medium">Địa chỉ</p>
              <p className="text-white/80">Hà Nội, Việt Nam</p>
            </div>
          </div>

          <div className="mt-12 flex justify-center gap-4">
            <a href="#" className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 transition-colors hover:bg-white/30">
              <Facebook className="h-6 w-6" />
            </a>
            <a href="#" className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 transition-colors hover:bg-white/30">
              <Twitter className="h-6 w-6" />
            </a>
            <a href="#" className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 transition-colors hover:bg-white/30">
              <Instagram className="h-6 w-6" />
            </a>
            <a href="#" className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 transition-colors hover:bg-white/30">
              <Youtube className="h-6 w-6" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Sẵn sàng bắt đầu hành trình của bạn?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Đăng ký ngay hôm nay và nhận ưu đãi giảm giá 20% cho khóa học đầu tiên của bạn!
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="xl">Đăng ký miễn phí</Button>
            </Link>
            <Link href="/courses">
              <Button variant="outline" size="xl">Khám phá khóa học</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
