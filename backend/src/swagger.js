import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Edunest API',
      version: '1.0.0',
      description:
        'REST API cho nền tảng học tiếng Anh trực tuyến Edunest — Clone Udemy. Hỗ trợ 2 quyền hệ thống: Người dùng (user) và Quản trị viên (admin). Các luồng học viên/giảng viên là ngữ cảnh nghiệp vụ của tài khoản user.',
      contact: {
        name: 'Edunest Team',
        email: 'support@edunest.local',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token. Nhận từ /api/auth/login hoặc /api/auth/register',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6748f1a2b3c4d5e6f7a8b9c0' },
            name: { type: 'string', example: 'Nguyễn Văn A' },
            email: { type: 'string', example: 'user@example.com' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            avatar: { type: 'string', example: 'https://res.cloudinary.com/...' },
            bio: { type: 'string', example: 'Giảng viên tiếng Anh 5 năm kinh nghiệm' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6748f1a2b3c4d5e6f7a8b9c1' },
            title: { type: 'string', example: 'Tiếng Anh giao tiếp cho người mới bắt đầu' },
            slug: { type: 'string', example: 'tieng-anh-giao-tiep-cho-nguoi-moi-bat-dau' },
            description: { type: 'string', example: 'Khóa học giúp bạn...' },
            price: { type: 'number', example: 499000 },
            discountPrice: { type: 'number', example: 299000 },
            level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], example: 'beginner' },
            category: { type: 'string', example: 'English' },
            status: { type: 'string', enum: ['draft', 'pending', 'published', 'rejected', 'locked', 'banned'] },
            totalStudents: { type: 'number', example: 1250 },
            totalLessons: { type: 'number', example: 48 },
            totalDuration: { type: 'number', example: 7200 },
            rating: { type: 'number', example: 4.7 },
            thumbnail: { type: 'string', example: 'https://res.cloudinary.com/...' },
            instructor: { $ref: '#/components/schemas/User' },
          },
        },
        Enrollment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            student: { type: 'string' },
            course: { $ref: '#/components/schemas/Course' },
            progress: { type: 'number', example: 65, description: 'Phần trăm hoàn thành (0-100)' },
            completedLessons: { type: 'array', items: { type: 'string' } },
            enrolledAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            isActive: { type: 'boolean' },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  course: { $ref: '#/components/schemas/Course' },
                  addedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            totalItems: { type: 'number', example: 3 },
            totalPrice: { type: 'number', example: 997000 },
          },
        },
        Certificate: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            certificateId: { type: 'string', example: 'CERT-1734567890-ABC123XYZ' },
            student: { type: 'string' },
            course: { $ref: '#/components/schemas/Course' },
            issuedAt: { type: 'string', format: 'date-time' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            student: { $ref: '#/components/schemas/User' },
            course: { type: 'string' },
            rating: { type: 'number', minimum: 1, maximum: 5, example: 5 },
            comment: { type: 'string', example: 'Khóa học rất bổ ích...' },
            helpfulVotes: { type: 'number', example: 42 },
            instructorReply: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Không có quyền truy cập' },
            code: { type: 'string', example: 'TOKEN_EXPIRED' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 125 },
            totalPages: { type: 'integer', example: 13 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Xác thực & quản lý tài khoản' },
      { name: 'Courses', description: 'Khóa học công khai' },
      { name: 'Cart', description: 'Giỏ hàng của người dùng' },
      { name: 'Enrollments', description: 'Đăng ký khóa học & tiến độ học tập của người dùng' },
      { name: 'Notes', description: 'Ghi chú bài học của người dùng' },
      { name: 'Exercises', description: 'Bài tập trắc nghiệm' },
      { name: 'Payments', description: 'Thanh toán VNPay của người dùng' },
      { name: 'Certificates', description: 'Chứng chỉ hoàn thành của người dùng' },
      { name: 'Reviews', description: 'Đánh giá khóa học' },
      { name: 'Wishlist', description: 'Danh sách yêu thích của người dùng' },
      { name: 'Categories', description: 'Danh mục khóa học' },
      { name: 'Search', description: 'Tìm kiếm & gợi ý' },
      { name: 'Recommendations', description: 'Gợi ý khóa học' },
      { name: 'AI', description: 'Tạo bài tập bằng AI' },
      { name: 'Admin', description: 'Quản trị hệ thống (admin)' },
      { name: 'Teacher', description: 'Không gian tạo và quản lý khóa học của tài khoản user' },
      { name: 'Health', description: 'Kiểm tra trạng thái server' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
