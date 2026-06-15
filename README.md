# Edunest — Nền Tảng Học Tiếng Anh Trực Tuyến

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**Edunest** là nền tảng học tiếng Anh trực tuyến theo mô hình MOOC, clone từ Udemy.
Hệ thống hiện dùng 2 vai trò phân quyền chính: **Người dùng (user)** và **Quản trị viên (admin)**. Các khu vực giao diện/nghiệp vụ cũ vẫn có thể còn nhãn `teacher`/`student`, nhưng không còn là role RBAC chuẩn của hệ thống.

> **Về kiến trúc:** Dự án được tách thành hai tiến trình độc lập — `frontend` (Next.js App Router, render UI + Server Actions) và `backend` (Express, REST API + Socket.IO). Giao tiếp qua HTTP/HTTPS và JWT, dữ liệu persistent nằm trong MongoDB, cache/queue dùng Redis. Việc tách này giúp scale từng phần riêng biệt và deploy lên Vercel/Render độc lập.

[Demo](#-demo) · [Tính năng](#-tính-năng) · [Kiến trúc](#-kiến-trúc) · [Cài đặt](#-cài-đặt) · [API Docs](#-api-documentation)

</div>

---

## 🚀 Demo

> **Frontend (Vercel):** `https://your-frontend.vercel.app`

> **Backend (Render):** `https://your-backend.onrender.com`

> **API Docs:** `https://your-backend.onrender.com/api-docs`

> **Lưu ý:** Hai URL trên là placeholder minh hoạ. Khi clone về chạy local theo mục [Cài đặt](#-cài-đặt), frontend mặc định truy cập `http://localhost:3001` và backend ở `http://localhost:5000`; tài khoản demo có sẵn trong bảng phía dưới để bạn thử đầy đủ luồng học/mua/đánh giá mà không cần đăng ký.


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
- [x] Docker Compose
- [x] Unit tests (Jest)
- [x] Server Actions (Next.js) 
- [x] Server Actions cho enrollment, cart, lesson completion và mock checkout
- [x] Email notification (Nodemailer) 

---

## 🏗️ Kiến trúc

```
                    ┌──────────────────────────────────────────────┐
                    │                 CLIENT (Browser)             │
                    │            Next.js 15 (App Router)         │
                    │     React 19 + Tailwind CSS + Zustand        │
                    └──────────────────┬───────────────────────────┘
                                       │ HTTPS
                    ┌──────────────────▼───────────────────────────┐
                    │           LOAD BALANCER (Vercel)             │
                    └──────────────────┬───────────────────────────┘
                                       │ HTTPS
┌──────────────────────────────────────▼────────────────────────────────────────────┐
│                                  NGINX / CDN                                      │
│                         (Static assets, Media caching)                            │
└─────────────────┬──────────────────────────────────────────┬──────────────────────┘
                  │                                          │
         ┌────────▼────────┐                        ┌────────▼──────────┐
         │   Vercel CDN    │                        │  Render / Railway │
         │  (Frontend)     │                        │   (Backend)       │
         └─────────────────┘                        └────────┬──────────┘
                                                              │
                                                    ┌─────────▼───────────┐
                                                    │   Express 5 (API)   │
                                                    │  Router→Controller  │
                                                    │  →Service→Model     │
                                                    └─────────┬───────────┘
                                                              │
                              ┌───────────────────────────────┼──────────────────────────────┐
                              │                               │                              │
                    ┌─────────▼──────────┐         ┌─────────▼──────────┐         ┌──────────▼────────┐
                    │   MongoDB Atlas    │         │   Cloudinary CDN   │         │   OpenAI API      │
                    │  (Primary DB)      │         │  (Video/Images)    │         │  (AI Exercises)   │
                    └────────────────────┘         └────────────────────┘         └───────────────────┘
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
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS 4 |
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

### 1. Chuẩn bị

```bash
git clone https://github.com/din1209-nguyen/Edunest.git
cd edunest
```

Yêu cầu tối thiểu:

- Node.js 20+
- Docker Desktop hoặc Docker Engine có Docker Compose
- npm

### 2. Tạo file môi trường

Dự án dùng **một file `.env` ở thư mục root** cho cả backend và frontend.

```bash
# macOS/Linux/Git Bash
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Mở `.env` và điền tối thiểu:

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

Các biến còn lại như Cloudinary, Google OAuth, SMTP, VNPay, AI có thể để trống nếu chưa dùng các tính năng tương ứng.

### 3. Chọn cách chạy

#### Cách A: Backend bằng Docker, frontend chạy local

Đây là cách phù hợp khi phát triển frontend vì Next.js chạy ở chế độ dev và tự reload khi sửa code.

```bash
# Cài dependency cho frontend
npm install --prefix frontend

# Chạy backend cùng MongoDB và Redis
docker compose up --build -d backend
docker compose ps

# Chạy frontend local
cd frontend
npm run dev
```

Với cách này:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- API Docs: `http://localhost:5000/api-docs`
- MongoDB trên host: `localhost:27018`
- Redis chỉ chạy trong network nội bộ Docker Compose

Backend chạy bằng Docker nên không cần `npm install` trong thư mục `backend` trước. Dockerfile sẽ tự cài dependency khi build image.

#### Cách B: Chạy toàn bộ bằng Docker Compose

Nếu chỉ muốn chạy app nhanh mà không cần dev frontend trực tiếp, dùng:

```bash
docker compose up -d --build
```

Với cách này không cần chạy `npm install` ngoài host. Docker sẽ tự cài dependency cho cả backend và frontend khi build image.

Sau khi container chạy xong:

- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:5000`
- API Docs: `http://localhost:5000/api-docs`
- MongoDB trên host: `localhost:27018`
- Redis chỉ chạy trong network nội bộ Docker Compose

Xem log khi cần debug:

```bash
docker compose logs backend
docker compose logs frontend
```

MongoDB local trong Docker Compose không bật authentication. Backend trong container sẽ dùng `mongodb://mongodb:27017/edunest`, còn máy host có thể truy cập MongoDB qua `mongodb://localhost:27018/edunest`.

### 4. Seed dữ liệu demo

Chạy sau khi backend Docker đã khởi động:

```bash
docker compose exec backend npm run seed
```

Lệnh seed sẽ reset database local rồi tạo dữ liệu demo gồm users, categories, courses, chapters, lessons, exercises, enrollments, payments, reviews, certificates, cart và wishlist. Không chạy seed trên production.

### 5. Chạy full local không Docker

Bạn cần có MongoDB local hoặc MongoDB Atlas. Nếu dùng MongoDB từ Docker Compose, giữ `MONGODB_URI=mongodb://localhost:27018/edunest` trong `.env`.

Trước khi chạy full local, cài dependency cho cả hai phần:

```bash
npm install --prefix backend
npm install --prefix frontend
```

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
- `NEXT_PUBLIC_API_URL=/api`
- `NEXT_PUBLIC_BACKEND_ORIGIN=https://your-backend.onrender.com`
- `NEXT_PUBLIC_SOCKET_URL=/socket.io`

Khuyến nghị dùng rewrite `/api` như trên để cookie đăng nhập được lưu theo domain frontend. Nếu bạn gọi thẳng backend bằng `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`, backend phải đặt `AUTH_COOKIE_SECURE=true` và `AUTH_COOKIE_SAME_SITE=none`.

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

Biến production quan trọng cho backend:

```env
FRONTEND_URL=https://edunest-frontend-kappa.vercel.app
BACKEND_URL=https://your-backend.onrender.com
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=lax
```

Không đặt `AUTH_COOKIE_DOMAIN` trừ khi frontend và backend dùng chung custom parent domain.

### Database — MongoDB Atlas

```bash
# 1. Tạo cluster miễn phí trên MongoDB Atlas (mongodb.com)
# 2. Tạo database user
# 3. Lấy connection string:
# mongodb+srv://<username>:<password>@cluster.mongodb.net/edunest
# 4. Điền vào MONGODB_URI trong root .env
```

Local Docker Compose intentionally does not enable MongoDB auth. Atlas/production should always use a database user and password in `MONGODB_URI`.


## 🧪 Testing

```bash
cd backend
npm test

# Với coverage
npm run test:coverage
```

---



## 📄 License

MIT License — xem file [LICENSE](LICENSE) để biết chi tiết.

---

## 👨‍💻 Authors

Edunest Development Team
