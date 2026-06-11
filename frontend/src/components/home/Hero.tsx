"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, Play, Users, BookOpen, Award, Star, CheckCircle, Zap, Globe, Headphones } from "lucide-react";

const stats = [
  { icon: Users, value: "50,000+", label: "Học viên" },
  { icon: BookOpen, value: "500+", label: "Khóa học" },
  { icon: Award, value: "10,000+", label: "Chứng chỉ" },
  { icon: Star, value: "4.8/5", label: "Đánh giá" },
];

const features = [
  {
    icon: Globe,
    title: "Học mọi lúc, mọi nơi",
    description: "Truy cập khóa học trên mọi thiết bị: máy tính, tablet, điện thoại.",
  },
  {
    icon: Play,
    title: "Học qua video chất lượng cao",
    description: "Nội dung bài giảng được ghi hình chuyên nghiệp với hình ảnh sắc nét.",
  },
  {
    icon: Award,
    title: "Chứng chỉ có giá trị",
    description: "Nhận chứng chỉ hoàn thành khóa học được công nhận.",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    description: "Đội ngũ hỗ trợ luôn sẵn sàng giải đáp thắc mắc của bạn.",
  },
];

const testimonials = [
  {
    name: "Nguyễn Thị Lan",
    role: "Học viên IELTS 7.5",
    avatar: "NTL",
    content: "Khóa học IELTS của Edunest giúp mình đạt được điểm số mong muốn chỉ trong 3 tháng. Giáo viên rất nhiệt tình và nội dung bài giảng rất dễ hiểu.",
    rating: 5,
  },
  {
    name: "Trần Minh Tuấn",
    role: "Học viên Tiếng Anh giao tiếp",
    avatar: "TMT",
    content: "Sau khi hoàn thành khóa học giao tiếp, mình tự tin giao tiếp tiếng Anh trong công việc. Phương pháp học rất thực tế và hiệu quả.",
    rating: 5,
  },
  {
    name: "Lê Hoàng Nam",
    role: "Học viên TOEIC 900+",
    avatar: "LHN",
    content: "Điểm TOEIC của mình tăng từ 550 lên 920 sau khóa học. Các bài tập luyện nghe và đọc rất sát với đề thi thật.",
    rating: 5,
  },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="app-container relative py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-10 xl:gap-14">
          {/* Left - Content */}
          <div className="animate-fadeIn">
            <Badge variant="primary-light" className="mb-5 w-fit px-3 py-1.5">
              <Zap className="mr-1 h-3 w-3" />
              Nền tảng học tiếng Anh hàng đầu Việt Nam
            </Badge>

            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              <span className="text-foreground">Học tiếng Anh </span>
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                hiệu quả
              </span>
              <br />
              <span className="text-foreground">mỗi ngày</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg md:text-xl">
              Edunest cung cấp các khóa học tiếng Anh chất lượng cao từ cơ bản đến nâng cao,
              giúp bạn tự tin giao tiếp và đạt được mục tiêu học tập của mình.
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/courses">
                <Button size="lg" className="w-full gap-2 shadow-lg shadow-primary-500/20 sm:w-auto">
                  Khám phá khóa học
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Tìm hiểu thêm
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="animate-fadeIn rounded-2xl border border-white/70 bg-white/75 p-4 text-center shadow-card backdrop-blur-sm"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100">
                    <stat.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="mt-2 text-xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Image */}
          <div className="relative animate-fadeIn" style={{ animationDelay: "200ms" }}>
            <div className="relative mx-auto aspect-[0.95] w-full max-w-md sm:max-w-lg">
              {/* Main image */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 p-1 shadow-[0_32px_80px_-28px_rgba(79,70,229,0.45)]">
                <div className="relative h-full w-full overflow-hidden rounded-[calc(2rem-4px)] bg-background">
                  <Image
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=800&fit=crop"
                    alt="Học viên đang học tiếng Anh"
                    fill
                    sizes="(max-width: 1024px) 90vw, 512px"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute left-2 top-4 rounded-2xl border border-white/70 bg-white/88 p-3 shadow-card backdrop-blur-sm sm:-left-6 sm:top-1/4 sm:p-4 animate-slideIn">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-light">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Bài học hoàn thành</p>
                    <p className="text-lg font-bold text-success">+1</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 right-2 rounded-2xl border border-white/70 bg-white/88 p-3 shadow-card backdrop-blur-sm sm:-right-4 sm:bottom-1/4 sm:p-4 animate-slideIn">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                    <Award className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Chứng chỉ mới</p>
                    <p className="text-lg font-bold text-primary-600">IELTS 7.5</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 rounded-[2rem] border border-white/70 bg-white/65 p-5 shadow-card backdrop-blur-sm sm:grid-cols-3 sm:p-6 lg:mt-12">
          {[
            {
              title: "Lộ trình học rõ ràng",
              description: "Bám sát mục tiêu giao tiếp, chứng chỉ và công việc với tiến độ theo từng chặng",
            },
            {
              title: "Video, quiz, chứng chỉ",
              description: "Một hành trình học trọn vẹn từ bài giảng, luyện tập, đến xác nhận hoàn thành",
            },
            {
              title: "Thanh toán sandbox + mock",
              description: "Sẵn sàng cho demo, local development và môi trường tích hợp provider thực tế",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/70 bg-white/75 p-4">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section className="bg-surface py-12 sm:py-16">
      <div className="app-container">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Tại sao chọn Edunest?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Chúng tôi mang đến trải nghiệm học tập tốt nhất cho bạn
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-5">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="animate-fadeIn rounded-lg border border-border bg-background p-5 text-center transition-all hover:shadow-md"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-100 to-secondary-100">
                <feature.icon className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="bg-background py-12 sm:py-16">
      <div className="app-container">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Học viên nói gì về chúng tôi
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Những câu chuyện thành công từ học viên của Edunest
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="animate-fadeIn rounded-lg border border-border bg-surface p-5 transition-all hover:shadow-md"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-warning text-warning"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="mt-4 text-muted-foreground">&ldquo;{testimonial.content}&rdquo;</p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 font-semibold text-white">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="bg-gradient-to-br from-primary-600 to-secondary-600 py-12 sm:py-16">
      <div className="app-container max-w-4xl text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Sẵn sàng bắt đầu hành trình học tiếng Anh?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-white/85">
          Đăng ký ngay hôm nay và nhận ưu đãi giảm giá 20% cho khóa học đầu tiên của bạn!
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/register">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 bg-white text-primary-700 hover:bg-white/90"
            >
              Đăng ký miễn phí
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/courses">
            <Button
              size="lg"
              variant="outline"
              className="border-white bg-white text-primary-700 shadow-md hover:bg-primary-50 hover:text-primary-800"
            >
              Xem khóa học
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
