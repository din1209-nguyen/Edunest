# Edunest UI/Agent Notes

Khi sửa frontend/UI, đọc `docs/ui-design-guide.md`, `frontend/src/app/globals.css` và các component nền tảng trong `frontend/src/components/ui` trước. Giữ tiếng Việt UTF-8 có dấu, dùng token màu hiện có, không thêm mock data nghiệp vụ và chạy build sau khi sửa UI.

---
# Edunest — Nền Tảng Học Tiếng Anh Trực Tuyến

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?style=flat-square&logo=next.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**Edunest** là nền tảng học tiếng Anh trực tuyến theo mô hình MOOC, clone từ Udemy.
Hệ thống hiện dùng 2 vai trò phân quyền chính: **Người dùng (user)** và **Quản trị viên (admin)**. Các khu vực giao diện/nghiệp vụ cũ vẫn có thể còn nhãn `teacher`/`student`, nhưng không còn là role RBAC chuẩn của hệ thống.

[Demo](#-demo) · [Tính năng](#-tính-năng) · [Kiến trúc](#-kiến-trúc) · [Cài đặt](#-cài-đặt) · [API Docs](#-api-documentation)

</div>

---

## 🚀 Demo

> **Frontend (Vercel):** `https://your-frontend.vercel.app`
> **Backend (Render):** `https://your-backend.onrender.com`
> **API Docs:** `https://your-backend.onrender.com/api-docs`

### Tài khoản test

| Vai trò | Email | Mật khẩu |
|---------|-------|-----------|
| **Admin** | admin@edunest.local | Admin123 |
| **User** | creator@edunest.local | Creator123 |
| **User** | user@edunest.local | User1234 |

---

## 🎯 Tính năng

### Học viên (Student)

- [x] Đăng ký / Đăng nhập (JWT + Refresh Token)
- [x] Đăng nhập Google OAuth *(điểm cộng)*
- [x] Khám phá khóa học, tìm kiếm với bộ lọc
- [x] Thêm khóa học vào giỏ hàng
- [x] Thanh toán qua VNPay (sandbox) và mock checkout cho môi trường dev/demo
- [x] Học bài: video, tài liệu PDF
- [x] Làm bài tập trắc nghiệm (chấm điểm tự động)
- [x] Ghi chú trong bài học
- [x] Tạo bài tập bằng AI (OpenAI API)
- [x] Nhận chứng chỉ khi hoàn thành 100%
- [x] Đánh giá khóa học
- [x] Wishlist (yêu thích)

### Giảng viên (Teacher)

- [x] Tạo / chỉnh sửa / xóa khóa học
- [x] Upload video + tài liệu (Cloudinary)
- [x] Tạo chương / bài học / bài tập
- [x] Gửi khóa học để duyệt (Admin)
- [x] Xem danh sách học viên
- [x] Dashboard thống kê
- [x] Realtime dashboard *(điểm cộng)*

### Quản trị viên (Admin)

- [x] Duyệt / từ chối / ban khóa học
- [x] Quản lý tài khoản (cấm, phân quyền)
- [x] Dashboard tổng quan

### Hệ thống

- [x] JWT + Refresh Token (2 role: user + admin)
- [x] Docker Compose (điểm cộng)
- [x] Unit tests (Jest) (điểm cộng)
- [x] Server Actions (Next.js) *(tiêu chí BE9)*
- [x] Server Actions cho enrollment, cart, lesson completion và mock checkout
- [x] Email notification (Nodemailer) *(điểm cộng)*

---

## 🏗️ Kiến trúc

```
                    ┌──────────────────────────────────────────────┐
                    │                 CLIENT (Browser)              │
                    │            Next.js 16.2 (App Router)          │
                    │     React 19 + Tailwind CSS + Zustand         │
                    └──────────────────┬───────────────────────────┘
                                       │ HTTPS
                    ┌──────────────────▼───────────────────────────┐
                    │           LOAD BALANCER (Vercel)             │
                    └──────────────────┬───────────────────────────┘
                                       │ HTTPS
┌──────────────────────────────────────▼──────────────────────────────────────────┐
│                                  NGINX / CDN                                      │
│                         (Static assets, Media caching)                           │
└─────────────────┬──────────────────────────────────────────┬──────────────────────┘
                  │                                          │
         ┌────────▼────────┐                        ┌────────▼─────────┐
         │   Vercel CDN    │                        │  Render / Railway │
         │  (Frontend)     │                        │   (Backend)      │
         └─────────────────┘                        └────────┬─────────┘
                                                              │
                                                    ┌─────────▼──────────┐
                                                    │   Express 5 (API)   │
                                                    │  Router→Controller  │
                                                    │  →Service→Model     │
                                                    └─────────┬──────────┘
                                                              │
                              ┌───────────────────────────────┼───────────────────────────────┐
                              │                               │                               │
                    ┌─────────▼──────────┐         ┌─────────▼──────────┐         ┌──────────▼─────────┐
                    │   MongoDB Atlas    │         │   Cloudinary CDN   │         │   OpenAI API      │
                    │  (Primary DB)      │         │  (Video/Images)    │         │  (AI Exercises)   │
                    └───────────────────┘         └───────────────────┘         └───────────────────┘
```

### Chiến lược Rendering (Next.js)

| Route | Chiến lược | Lý do |
|-------|-----------|-------|
| `/` (Landing) | **ISR** `revalidate=3600` | Nội dung ít thay đổi, SEO tối đa |
| `/courses` | **ISR** `revalidate=300` | Danh sách thay đổi khi có course mới |
| `/courses/[slug]` | **ISR** `revalidate=300` | Chi tiết động theo slug, cache được |
| `/search` | **SSR** `force-dynamic` | Query params động, không cache được |
| `/student/*` | **SSR** `force-dynamic` | Dữ liệu cá nhân riêng tư |
| `/teacher/*` | **SSR** `force-dynamic` | Dashboard cá nhân giáo viên |
| `/admin/*` | **SSR** `force-dynamic` | Dashboard cá nhân admin |

### Cấu trúc thư mục

```
edunest/
├── frontend/                          # Next.js App Router
│   ├── src/
│   │   ├── app/                      # App Router pages
│   │   │   ├── (public)/             # Public routes
│   │   │   ├── admin/                # Admin routes
│   │   │   ├── student/              # Student routes
│   │   │   ├── teacher/              # Teacher routes
│   │   │   ├── cart/                 # Cart
│   │   │   ├── categories/           # Categories
│   │   │   ├── search/               # Search
│   │   │   └── login|register/       # Auth pages
│   │   ├── components/               # UI components
│   │   │   ├── layout/              # Layout (Header, Footer, Hero...)
│   │   │   ├── course/              # Course cards, progress bar
│   │   │   ├── ui/                  # Shadcn UI components
│   │   │   ├── ai/                  # AI exercise generator
│   │   │   └── ...
│   │   ├── stores/                  # Zustand state management
│   │   ├── lib/                    # Utilities, API clients
│   │   │   ├── api.ts              # Axios instance
│   │   │   ├── studentApi.ts       # Student API calls
│   │   │   ├── server-actions.ts   # Next.js Server Actions
│   │   │   └── paymentApi.ts       # Payment API
│   │   └── types/                  # TypeScript types
│   ├── Dockerfile
│   └── package.json
│
├── backend/                           # Node.js / Express (ES Modules)
│   ├── src/
│   │   ├── index.js                 # Entry point
│   │   ├── config/
│   │   │   ├── index.js            # Environment config
│   │   │   └── database.js         # MongoDB connection
│   │   ├── models/                  # Mongoose schemas (13 models)
│   │   │   ├── User.js
│   │   │   ├── Course.js
│   │   │   ├── Chapter.js
│   │   │   ├── Lesson.js
│   │   │   ├── Exercise.js
│   │   │   ├── Enrollment.js
│   │   │   ├── Cart.js
│   │   │   ├── Payment.js
│   │   │   ├── Certificate.js
│   │   │   ├── Note.js
│   │   │   ├── Review.js
│   │   │   ├── WishlistItem.js
│   │   │   └── Category.js
│   │   ├── routes/                 # Express routers (17 routes)
│   │   ├── services/                # Business logic
│   │   ├── controllers/             # Route handlers
│   │   ├── middlewares/             # Auth, validation, error handling
│   │   ├── utils/                  # Validators (Zod), seed data
│   │   └── socket/                 # Socket.io (Realtime)
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml                # Docker Compose (MongoDB + Redis + services)
├── .env.example                     # Environment variables template
├── docs/                            # Documentation
└── README.md
```

### Chuẩn giao diện hiện tại

- Visual direction: hiện đại, sáng, mềm, có chiều sâu theo phong cách sản phẩm học tập cao cấp
- Màu chủ đạo: `primary` thiên indigo, `secondary` thiên teal, `accent` thiên cam ấm cho CTA
- UI surface: ưu tiên gradient nhẹ, glass nhẹ, card bo góc lớn, bóng đổ mềm thay vì khối phẳng đơn giản
- Icon: dùng có chủ đích, đồng bộ kích thước/stroke, thường đi cùng nền capsule hoặc ô bo góc
- Media: video giới thiệu và lesson video phải render được thật; thumbnail fallback vẫn phải đẹp và có overlay tử tế
- Khi agent tạo/sửa frontend, cần tái sử dụng token và component nền trong `frontend/src/app/globals.css` và `frontend/src/components/ui/*`

---

## 📋 Yêu cầu kỹ thuật

### Prerequisites

- **Node.js** 18+
- **Docker** & **Docker Compose** (để chạy MongoDB, Redis, backend, frontend)
- **MongoDB** 7 (hoặc MongoDB Atlas)
- **npm** hoặc **yarn**

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.2 (App Router), React 19, Tailwind CSS 4 |
| State | Zustand 5 |
| Form | React Hook Form + Zod |
| Backend | Node.js, Express 5 (ES Modules) |
| Database | MongoDB 7, Mongoose 9.6 |
| Auth | JWT + Refresh Token |
| Upload | Cloudinary |
| Cache | Redis |
| Payment | VNPay Sandbox |
| AI | OpenAI API (GPT-4o-mini) |
| Email | Nodemailer |
| Realtime | Socket.io |
| Container | Docker Compose |
| Testing | Jest |

---

## 🛠️ Cài đặt

### 1. Clone dự án

```bash
git clone https://github.com/yourusername/edunest.git
cd edunest
```

### 2. Cấu hình environment

```bash
# Tạo file .env duy nhất ở root từ .env.example
cp .env.example .env

# Chỉnh sửa .env với các giá trị thực
# Cần ít nhất: JWT_SECRET, JWT_REFRESH_SECRET
```

### 3. Cài đặt dependency

```bash
npm install --prefix backend
npm install --prefix frontend
```

> Backend mặc định chạy trong Docker Compose và đọc env từ root `.env`. Không tạo `backend/.env` hoặc `frontend/.env.local`.

### 4. Chạy với Docker Compose (Khuyến nghị và là mặc định để test)

```bash
# Kiểm tra cấu hình Compose đã resolve env hợp lệ
docker compose config

# Build lại toàn bộ service rồi chạy nền
docker compose up -d --build

# Xem trạng thái container

docker compose ps

# Xem log backend/frontend khi cần debug

docker compose logs backend
docker compose logs frontend

# Frontend: http://localhost:3001
# Backend API: http://localhost:5000
# MongoDB: localhost:27018
# Redis: service nội bộ Compose, không publish port ra host
```

MongoDB trong Docker Compose local khong bat authentication, nen backend ket noi bang `mongodb://mongodb:27017/edunest` va khong can user/password. Khi deploy production hoac dung MongoDB Atlas, hay dung URI co credential nhu `mongodb+srv://<username>:<password>@cluster.mongodb.net/edunest`.

### 5. Chính sách test cho agent

- Khi kiểm tra, test, hoặc tái hiện lỗi, agent nên **ưu tiên Docker Compose** thay vì chạy host trực tiếp.
- Nếu cần smoke test toàn stack, hãy khởi động bằng `docker compose up -d --build` trước.
- Chỉ dùng lệnh local ngoài Docker khi cần debug cục bộ mà Docker không đủ để xác minh vấn đề.

### 6. Chạy local (không Docker)

```bash
# Terminal 1: Backend
cd backend
npm run dev
# Server chạy tại http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev
# App chạy tại http://localhost:3000
```

### 7. Seed du lieu local/demo

```bash
docker compose exec backend npm run seed
```

Lenh seed chay trong backend container va se reset local MongoDB database truoc khi tao du lieu demo. Khong chay seed tren production.

Seed tao du lieu that trong MongoDB cho users, categories, courses, chapters, lessons, exercises, enrollments, payments, reviews, certificates, cart va wishlist. Frontend khong dung mock arrays cho du lieu nghiep vu; cac man hinh chinh doc du lieu qua API backend.

Tai khoan demo co dinh:

| Vai tro | Email | Mat khau |
|---|---|---|
| Admin | `admin@edunest.local` | `Admin123` |
| Creator | `creator@edunest.local` | `Creator123` |
| Teacher | `teacher@edunest.local` | `Teacher123` |
| User | `user@edunest.local` | `User1234` |

---

## 🔧 Environment Variables

### Root `.env`

> Dự án chỉ dùng một file env tại root: `.env`. Docker Compose dùng file này cho cả backend và frontend.

```env
# App URLs
FRONTEND_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Auth secrets
JWT_SECRET=
JWT_REFRESH_SECRET=

# Redis cache inside Docker Compose
REDIS_URL=redis://redis:6379

# Cloudinary upload
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# VNPay sandbox payment
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5000/api/payments/vnpay/return

# AI exercise generator (empty = mock fallback)
AI_API_KEY=

# Google login OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Email sending via Brevo SMTP
EMAIL_PROVIDER=smtp
SMTP_FROM="Edunest <your-verified-sender@example.com>"
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

Brevo SMTP values:
- `SMTP_FROM`: sender email đã verify trong Brevo.
- `SMTP_USER`: Brevo Dashboard → SMTP & API → SMTP login.
- `SMTP_PASS`: Brevo Dashboard → SMTP & API → SMTP key.
- Nếu thiếu `SMTP_USER` hoặc `SMTP_PASS`, backend sẽ trả lỗi provider chuẩn thay vì giả lập gửi email thành công.

---

## 📖 API Documentation

Swagger API docs có sẵn tại: **`/api-docs`**

### Authentication

| Method | Endpoint | Mô tả | Body / Params |
|--------|----------|--------|---------------|
| POST | `/api/auth/register` | Đăng ký | `{ name, email, password, role? }` |
| POST | `/api/auth/login` | Đăng nhập | `{ email, password }` |
| POST | `/api/auth/refresh` | Refresh token | `{ refreshToken }` |
| GET | `/api/auth/me` | Thông tin user | Auth header |
| PATCH | `/api/auth/profile` | Cập nhật profile | Auth header |
| POST | `/api/auth/change-password` | Đổi mật khẩu | Auth header |
| POST | `/api/auth/logout` | Đăng xuất | Auth header |

### Courses

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/courses` | Danh sách khóa học (có filter) | Không |
| GET | `/api/courses/slug/:slug` | Chi tiết khóa học theo slug | Không |
| GET | `/api/courses/:id` | Chi tiết khóa học theo ID | Không |

### Enrollments (Student)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/enrollments/my-courses` | Khóa học đã đăng ký | Student |
| POST | `/api/enrollments/:courseId/free-enroll` | Đăng ký khóa miễn phí | Student |
| GET | `/api/enrollments/:courseId/progress` | Tiến độ học tập | Student |
| POST | `/api/enrollments/:courseId/lessons/:lessonId/complete` | Đánh dấu hoàn thành | Student |

### Cart (Student)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/cart` | Lấy giỏ hàng | Student |
| POST | `/api/cart/items` | Thêm vào giỏ | Student |
| DELETE | `/api/cart/items/:courseId` | Xóa khỏi giỏ | Student |
| DELETE | `/api/cart/clear` | Xóa toàn bộ giỏ | Student |

### Payments (Student)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/api/payments/create` | Tạo payment record cho mock/manual flow | Student |
| POST | `/api/payments/vnpay/create` | Tạo thanh toán VNPay | Student |
| GET | `/api/payments/vnpay/return` | Callback từ VNPay | Không |
| POST | `/api/payments/mock-success` | Mock thanh toán thành công | Student |
| GET | `/api/payments/history` | Lịch sử thanh toán | Student |

### Notes (Student)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/lessons/:lessonId/notes` | Lấy ghi chú | Student |
| POST | `/api/lessons/:lessonId/notes` | Tạo ghi chú | Student |
| PATCH | `/api/notes/:noteId` | Cập nhật ghi chú | Student |
| DELETE | `/api/notes/:noteId` | Xóa ghi chú | Student |

### Reviews

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/courses/:courseId/reviews` | Reviews theo khóa học | Không |
| POST | `/api/reviews` | Tạo review | User |
| PATCH | `/api/reviews/:reviewId` | Cập nhật review | User |
| DELETE | `/api/reviews/:reviewId` | Xóa review | User |
| POST | `/api/reviews/:reviewId/helpful` | Vote helpful | User |

### Wishlist (Student)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/wishlist` | Lấy wishlist | Student |
| POST | `/api/wishlist` | Thêm vào wishlist | Student |
| DELETE | `/api/wishlist/:courseId` | Xóa khỏi wishlist | Student |
| POST | `/api/wishlist/toggle` | Toggle wishlist | Student |

### Certificates (Student)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/certificates/my-certificates` | Danh sách chứng chỉ | Student |
| GET | `/api/certificates/:courseId` | Chi tiết chứng chỉ | Student |
| GET | `/api/certificates/:courseId/check` | Kiểm tra đủ điều kiện | Student |

### Categories

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/categories` | Danh sách danh mục | Không |
| GET | `/api/categories/:slug` | Chi tiết danh mục | Không |

### Search

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/search` | Tìm kiếm khóa học | Không |
| GET | `/api/search/suggestions` | Gợi ý tìm kiếm | Không |
| GET | `/api/search/trending` | Khóa học trending | Không |
| GET | `/api/search/newest` | Khóa học mới nhất | Không |
| GET | `/api/search/top-rated` | Khóa học đánh giá cao | Không |
| GET | `/api/search/free` | Khóa học miễn phí | Không |

### AI (Ngữ cảnh người dùng)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| POST | `/api/ai/exercises/generate` | Tạo bài tập bằng AI | User/Admin |
| POST | `/api/ai/exercises/save` | Lưu bài tập AI | User/Admin |

### Admin

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/admin/stats` | Thống kê tổng quan | Admin |
| GET | `/api/admin/courses` | Danh sách tất cả khóa học | Admin |
| PATCH | `/api/admin/courses/:courseId/approve` | Duyệt khóa học | Admin |
| PATCH | `/api/admin/courses/:courseId/reject` | Từ chối khóa học | Admin |
| GET | `/api/admin/users` | Danh sách người dùng | Admin |

### Khu tạo khóa học của user

| Method | Endpoint | Mô tả | Auth |
|--------|----------|--------|------|
| GET | `/api/teacher/dashboard` | Dashboard quản lý khóa học | User/Admin |
| GET | `/api/teacher/courses` | Danh sách khóa học do user sở hữu | User/Admin |
| POST | `/api/teacher/courses` | Tạo khóa học | User/Admin |
| GET | `/api/teacher/courses/:id` | Chi tiết khóa học | User/Admin |
| PATCH | `/api/teacher/courses/:id` | Cập nhật khóa học | User/Admin |
| DELETE | `/api/teacher/courses/:id` | Xóa khóa học | User/Admin |
| POST | `/api/teacher/upload` | Upload file (video/PDF) | User/Admin |
| POST | `/api/teacher/courses/:courseId/chapters` | Thêm chương | User/Admin |
| POST | `/api/teacher/chapters/:chapterId/lessons` | Thêm bài học | User/Admin |
| POST | `/api/teacher/lessons/:lessonId/exercises` | Thêm bài tập | User/Admin |
| GET | `/api/teacher/courses/:courseId/students` | Danh sách học viên của khóa học | User/Admin |

---

## 🚀 Deployment

### Frontend — Vercel

```bash
cd frontend
npm i -g vercel
vercel --prod

# Hoặc kết nối GitHub repo với Vercel
# Vercel sẽ auto-deploy khi push lên main branch
```

Cần thiết lập biến môi trường trên Vercel:
- `NEXT_PUBLIC_API_URL` → URL của backend (VD: `https://your-backend.onrender.com/api`)

### Backend — Render / Railway

```bash
# Render
# 1. Tạo Web Service trên Render
# 2. Kết nối GitHub repo
# 3. Build command: npm install && npm start
# 4. Environment variables: điền các biến trong .env.example

# Railway
# 1. Tạo project trên Railway
# 2. Thêm PostgreSQL (hoặc dùng MongoDB Atlas)
# 3. Deploy từ GitHub
```

### Database — MongoDB Atlas

```bash
# 1. Tạo cluster miễn phí trên MongoDB Atlas (mongodb.com)
# 2. Tạo database user
# 3. Lấy connection string:
# mongodb+srv://<username>:<password>@cluster.mongodb.net/edunest
# 4. Điền vào MONGODB_URI trong root .env
```

Local Docker Compose intentionally does not enable MongoDB auth. Atlas/production should always use a database user and password in `MONGODB_URI`.

---

## 🔒 Bảo mật

- Mật khẩu được hash với **bcrypt** (12 rounds)
- Access Token hết hạn sau **15 phút**
- Refresh Token hết hạn sau **7 ngày**
- JWT signature sử dụng **HS256**
- CORS giới hạn origin
- **Helmet.js** cho HTTP security headers
- Input validation với **Zod**
- Rate limiting (tùy chọn)

---

## 🧪 Testing

```bash
cd backend
npm test

# Với coverage
npm run test:coverage
```

---

## 🤝 Contributing

```bash
# Tạo branch mới
git checkout -b feature/your-feature

# Commit theo semantic format
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update README"
git commit -m "refactor: improve code structure"

# Push và tạo Pull Request
git push origin feature/your-feature
```

### Branching Strategy

```
main ─────────────────────────────────────────────────► production
  │─ feat/feature-name ───────────────────────────► PR ─┘
  │─ fix/bug-fix ─────────────────────────────────► PR ─┘
  │─ hotfix/urgent-fix ───────────────────────────► PR ─┘
  │─ docs/update-docs ────────────────────────────► PR ─┘
```

---

## 📄 License

MIT License — xem file [LICENSE](LICENSE) để biết chi tiết.

---

## 👨‍💻 Authors

Edunest Development Team
