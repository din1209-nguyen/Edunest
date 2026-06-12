# Git Flow History - Edunest

Tai lieu nay mo ta lich su Git Flow mo phong cho du an Edunest tu luc khoi tao den khi hoan thanh ban phat hanh dau tien. Thu muc hien tai khong co `.git`, vi vay noi dung ben duoi duoc xay dung de phan anh day du cau truc source code hien tai va quy trinh Git Flow chuan.

## Tong quan Git Flow

- `main`: nhanh on dinh cho production.
- `develop`: nhanh tich hop chinh cho qua trinh phat trien.
- `feature/*`: nhanh tinh nang tach theo module.
- `release/*`: nhanh dong goi release, chay test va sua loi nho truoc khi tag.
- `hotfix/*`: nhanh sua loi khan cap tu `main`.

## Cay nhanh

```text
main
|-- develop
|   |-- feature/project-foundation
|   |-- feature/backend-core
|   |-- feature/authentication
|   |-- feature/course-learning
|   |-- feature/payment-cart
|   |-- feature/admin-dashboard
|   |-- feature/ai-search-recommendation
|   |-- feature/frontend-ui
|   |-- feature/testing
|   |-- feature/gitflow-docs
|   `-- release/v1.0.0
`-- hotfix/v1.0.1
```

## Quy uoc commit va Pull Request

- Commit message dung Conventional Commits: `feat:`, `fix:`, `refactor:`, `style:`, `test:`, `docs:`, `chore:`, `perf:`.
- Moi `feature/*` duoc push len remote va tao Pull Request vao `develop`.
- Moi branch chi co mot thanh vien phu trach tu luc tao nhanh den khi merge; thanh vien khac chi review qua Pull Request.
- Moi thanh vien phai co hon 20 commit trong lich su Git Flow mo phong.
- `release/v1.0.0` duoc merge vao `main`, tag `v1.0.0`, sau do merge nguoc ve `develop`.
- `hotfix/v1.0.1` duoc tao tu `main`, merge vao `main`, tag `v1.0.1`, sau do merge nguoc ve `develop`.
- Folder source goc la thu muc hien tai; folder `Edunest` nam ben trong source goc va la repo Git that de push len remote.
- Truoc moi `git add`, chay hai dong `for %F in (...) do ...` de tao thu muc dich va copy dung file can commit tu source goc sang folder `Edunest`.
- Khong dung `git add .` khi dung lich su commit chuan, vi lenh nay se commit het source trong mot lan.

## Chuan bi folder Edunest bang CMD

Chay mot lan tren moi may. Mo CMD tai folder source goc, tao folder repo that `Edunest`, sau do vao folder nay de commit.

```bat
mkdir Edunest
cd Edunest
```

Khi dang dung trong folder `Edunest`, moi block commit ben duoi se copy file tu source goc bang duong dan `..\`. Vi du `..\backend\src\index.js` nghia la lay file tu folder cha va copy vao repo that.

## Pull Request history

| PR | Branch nguon | Branch dich | Trang thai | Noi dung |
| --- | --- | --- | --- | --- |
| #1 | `feature/project-foundation` | `develop` | Merged | Khoi tao monorepo, Docker va README |
| #2 | `feature/backend-core` | `develop` | Merged | Cau hinh Express, MongoDB, middleware, model nen tang |
| #3 | `feature/authentication` | `develop` | Merged | JWT, refresh token, Google OAuth, email, validation |
| #4 | `feature/course-learning` | `develop` | Merged | Course, chapter, lesson, enrollment, certificate |
| #5 | `feature/payment-cart` | `develop` | Merged | Cart, VNPay, payment, wishlist, review, note |
| #6 | `feature/admin-dashboard` | `develop` | Merged | Admin APIs, dashboard, quan ly user/course/category |
| #7 | `feature/ai-search-recommendation` | `develop` | Merged | AI exercise, search, recommendation, realtime socket |
| #8 | `feature/frontend-ui` | `develop` | Merged | UI App Router, layout, public/student/teacher/admin pages |
| #9 | `feature/testing` | `develop` | Merged | Jest tests va cau hinh kiem thu backend |
| #10 | `release/v1.0.0` | `main` | Merged | Release dau tien |
| #11 | `release/v1.0.0` | `develop` | Merged | Dong bo release ve develop |
| #12 | `hotfix/v1.0.1` | `main` | Merged | Sua loi cau hinh demo va tai lieu release |
| #13 | `hotfix/v1.0.1` | `develop` | Merged | Dong bo hotfix ve develop |
| #14 | `feature/gitflow-docs` | `develop` | Merged | Bo sung quy uoc owner branch va thong ke commit |

## Phan cong thanh vien theo branch

Moi branch duoi day chi do mot thanh vien phu trach. Thanh vien khac review qua Pull Request, nhung khong commit truc tiep vao branch do.

| Branch | Thanh vien phu trach | So commit |
| --- | --- | ---: |
| `main` / `develop` khoi tao | Thanh vien C | 1 |
| `feature/project-foundation` | Thanh vien C | 4 |
| `feature/backend-core` | Thanh vien A | 12 |
| `feature/authentication` | Thanh vien B | 12 |
| `feature/course-learning` | Thanh vien C | 10 |
| `feature/payment-cart` | Thanh vien A | 8 |
| `feature/admin-dashboard` | Thanh vien C | 0 |
| `feature/ai-search-recommendation` | Thanh vien B | 7 |
| `feature/frontend-ui` | Thanh vien C | 5 |
| `feature/testing` | Thanh vien A | 1 |
| `release/v1.0.0` | Thanh vien C | 1 |
| `hotfix/v1.0.1` | Thanh vien B | 1 |
| `feature/gitflow-docs` | Thanh vien B | 1 |

## Merge history

```bat
git merge --no-ff feature/project-foundation -m "merge: feature/project-foundation into develop"
git merge --no-ff feature/backend-core -m "merge: feature/backend-core into develop"
git merge --no-ff feature/authentication -m "merge: feature/authentication into develop"
git merge --no-ff feature/course-learning -m "merge: feature/course-learning into develop"
git merge --no-ff feature/payment-cart -m "merge: feature/payment-cart into develop"
git merge --no-ff feature/admin-dashboard -m "merge: feature/admin-dashboard into develop"
git merge --no-ff feature/ai-search-recommendation -m "merge: feature/ai-search-recommendation into develop"
git merge --no-ff feature/frontend-ui -m "merge: feature/frontend-ui into develop"
git merge --no-ff feature/testing -m "merge: feature/testing into develop"
git merge --no-ff release/v1.0.0 -m "merge: release/v1.0.0 into main"
git tag -a v1.0.0 -m "release: v1.0.0"
git merge --no-ff release/v1.0.0 -m "merge: release/v1.0.0 back into develop"
git merge --no-ff hotfix/v1.0.1 -m "merge: hotfix/v1.0.1 into main"
git tag -a v1.0.1 -m "hotfix: v1.0.1"
git merge --no-ff hotfix/v1.0.1 -m "merge: hotfix/v1.0.1 back into develop"
git merge --no-ff feature/gitflow-docs -m "merge: feature/gitflow-docs into develop"
```

## Commit 01 - Thanh vien C

Muc tieu: Tao repository va khoi tao Git Flow.

```bat
git init
git remote add origin https://github.com/example/edunest.git
git checkout -b main
for %F in ("README.md" ".gitignore") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("README.md" ".gitignore") do @copy /Y "..\%~F" "%~F"
git add README.md .gitignore
git commit -m "chore(repo): initialize repository"
git push -u origin main
git checkout -b develop
git push -u origin develop
```

File lien quan:

- `README.md`
- `.gitignore`

Ket qua:

- Hoan thanh repository ban dau va nhanh `main`, `develop`.

## Commit 02 - Thanh vien C

Muc tieu: Khoi tao cau truc monorepo frontend va backend.

```bat
git checkout develop
git pull origin develop
git checkout -b feature/project-foundation
for %F in ("frontend\package.json" "frontend\package-lock.json" "backend\package.json" "backend\package-lock.json") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("frontend\package.json" "frontend\package-lock.json" "backend\package.json" "backend\package-lock.json") do @copy /Y "..\%~F" "%~F"
git add frontend\package.json frontend\package-lock.json backend\package.json backend\package-lock.json
git commit -m "chore(repo): scaffold frontend and backend workspaces"
git push -u origin feature/project-foundation
```

File lien quan:

- `frontend/package.json`
- `frontend/package-lock.json`
- `backend/package.json`
- `backend/package-lock.json`

Ket qua:

- Tao workspace rieng cho Next.js frontend va Express backend.

## Commit 03 - Thanh vien C

Muc tieu: Them Docker va bien moi truong mau.

```bat
git checkout feature/project-foundation
for %F in ("docker-compose.yml" "frontend\Dockerfile" "backend\Dockerfile" ".env.example") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("docker-compose.yml" "frontend\Dockerfile" "backend\Dockerfile" ".env.example") do @copy /Y "..\%~F" "%~F"
git add docker-compose.yml frontend\Dockerfile backend\Dockerfile .env.example
git commit -m "chore(devops): add docker compose environment"
git push origin feature/project-foundation
```

File lien quan:

- `docker-compose.yml`
- `frontend/Dockerfile`
- `backend/Dockerfile`
- `.env.example`

Ket qua:

- Ho tro chay MongoDB, Redis, backend va frontend bang Docker Compose.

## Commit 04 - Thanh vien C

Muc tieu: Viet tai lieu tong quan du an.

```bat
git checkout feature/project-foundation
for %F in ("README.md") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("README.md") do @copy /Y "..\%~F" "%~F"
git add README.md
git commit -m "docs(readme): document edunest architecture and setup"
git push origin feature/project-foundation
```

File lien quan:

- `README.md`

Ket qua:

- Bo sung mo ta kien truc, tinh nang va huong dan cai dat du an.

## Commit 05 - Thanh vien C

Muc tieu: Merge project foundation vao develop.

```bat
git checkout develop
git pull origin develop
git merge --no-ff feature/project-foundation -m "merge: feature/project-foundation into develop"
git push origin develop
```

File lien quan:

- `README.md`
- `docker-compose.yml`
- `frontend/package.json`
- `backend/package.json`

Ket qua:

- PR #1 duoc merge, nen tang du an san sang cho phat trien tinh nang.

## Commit 06 - Thanh vien A

Muc tieu: Tao entrypoint Express va cau hinh server.

```bat
git checkout develop
git pull origin develop
git checkout -b feature/backend-core
for %F in ("backend\src\index.js" "backend\src\config\index.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\index.js" "backend\src\config\index.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\index.js backend\src\config\index.js
git commit -m "feat(api): bootstrap express application"
git push -u origin feature/backend-core
```

File lien quan:

- `backend/src/index.js`
- `backend/src/config/index.js`

Ket qua:

- Backend co entrypoint Express va doc cau hinh moi truong.

## Commit 07 - Thanh vien A

Muc tieu: Cau hinh ket noi MongoDB va email.

```bat
git checkout feature/backend-core
for %F in ("backend\src\config\database.js" "backend\src\config\email.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\config\database.js" "backend\src\config\email.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\config\database.js backend\src\config\email.js
git commit -m "feat(config): add database and email configuration"
git push origin feature/backend-core
```

File lien quan:

- `backend/src/config/database.js`
- `backend/src/config/email.js`

Ket qua:

- Backend co ket noi MongoDB va cau hinh Nodemailer.

## Commit 08 - Thanh vien A

Muc tieu: Them middleware chung cho API.

```bat
git checkout feature/backend-core
for %F in ("backend\src\middlewares\errorHandler.js" "backend\src\middlewares\notFound.js" "backend\src\middlewares\rateLimit.js" "backend\src\middlewares\validateRequest.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\middlewares\errorHandler.js" "backend\src\middlewares\notFound.js" "backend\src\middlewares\rateLimit.js" "backend\src\middlewares\validateRequest.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\middlewares\errorHandler.js backend\src\middlewares\notFound.js backend\src\middlewares\rateLimit.js backend\src\middlewares\validateRequest.js
git commit -m "feat(api): add shared request middlewares"
git push origin feature/backend-core
```

File lien quan:

- `backend/src/middlewares/errorHandler.js`
- `backend/src/middlewares/notFound.js`
- `backend/src/middlewares/rateLimit.js`
- `backend/src/middlewares/validateRequest.js`

Ket qua:

- API co xu ly loi, route 404, rate limit va validate request tap trung.

## Commit 09 - Thanh vien A

Muc tieu: Tao model nguoi dung va phien dang nhap.

```bat
git checkout feature/backend-core
for %F in ("backend\src\models\User.js" "backend\src\models\AuthSession.js" "backend\src\models\UserFollow.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\models\User.js" "backend\src\models\AuthSession.js" "backend\src\models\UserFollow.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\models\User.js backend\src\models\AuthSession.js backend\src\models\UserFollow.js
git commit -m "feat(models): add user session and follow schemas"
git push origin feature/backend-core
```

File lien quan:

- `backend/src/models/User.js`
- `backend/src/models/AuthSession.js`
- `backend/src/models/UserFollow.js`

Ket qua:

- Hoan thanh schema tai khoan, phien dang nhap va theo doi nguoi dung.

## Commit 10 - Thanh vien A

Muc tieu: Tao model khoa hoc va noi dung hoc.

```bat
git checkout feature/backend-core
for %F in ("backend\src\models\Course.js" "backend\src\models\Chapter.js" "backend\src\models\Lesson.js" "backend\src\models\Exercise.js" "backend\src\models\Category.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\models\Course.js" "backend\src\models\Chapter.js" "backend\src\models\Lesson.js" "backend\src\models\Exercise.js" "backend\src\models\Category.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\models\Course.js backend\src\models\Chapter.js backend\src\models\Lesson.js backend\src\models\Exercise.js backend\src\models\Category.js
git commit -m "feat(models): add course content schemas"
git push origin feature/backend-core
```

File lien quan:

- `backend/src/models/Course.js`
- `backend/src/models/Chapter.js`
- `backend/src/models/Lesson.js`
- `backend/src/models/Exercise.js`
- `backend/src/models/Category.js`

Ket qua:

- Co schema cho course, chapter, lesson, exercise va category.

## Commit 11 - Thanh vien A

Muc tieu: Tao model giao dich va tien trinh hoc.

```bat
git checkout feature/backend-core
for %F in ("backend\src\models\Enrollment.js" "backend\src\models\Cart.js" "backend\src\models\Payment.js" "backend\src\models\Certificate.js" "backend\src\models\Note.js" "backend\src\models\Review.js" "backend\src\models\WishlistItem.js" "backend\src\models\AiUsage.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\models\Enrollment.js" "backend\src\models\Cart.js" "backend\src\models\Payment.js" "backend\src\models\Certificate.js" "backend\src\models\Note.js" "backend\src\models\Review.js" "backend\src\models\WishlistItem.js" "backend\src\models\AiUsage.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\models\Enrollment.js backend\src\models\Cart.js backend\src\models\Payment.js backend\src\models\Certificate.js backend\src\models\Note.js backend\src\models\Review.js backend\src\models\WishlistItem.js backend\src\models\AiUsage.js
git commit -m "feat(models): add learning commerce schemas"
git push origin feature/backend-core
```

File lien quan:

- `backend/src/models/Enrollment.js`
- `backend/src/models/Cart.js`
- `backend/src/models/Payment.js`
- `backend/src/models/Certificate.js`
- `backend/src/models/Note.js`
- `backend/src/models/Review.js`
- `backend/src/models/WishlistItem.js`
- `backend/src/models/AiUsage.js`

Ket qua:

- Hoan thanh schema enrollment, cart, payment, certificate, note, review, wishlist va AI usage.

## Commit 12 - Thanh vien A

Muc tieu: Them route health va public API.

```bat
git checkout feature/backend-core
for %F in ("backend\src\routes\health.js" "backend\src\routes\public.js" "backend\src\controllers\categoryController.js" "backend\src\services\categoryService.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\routes\health.js" "backend\src\routes\public.js" "backend\src\controllers\categoryController.js" "backend\src\services\categoryService.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\routes\health.js backend\src\routes\public.js backend\src\controllers\categoryController.js backend\src\services\categoryService.js
git commit -m "feat(api): add health and public category endpoints"
git push origin feature/backend-core
```

File lien quan:

- `backend/src/routes/health.js`
- `backend/src/routes/public.js`
- `backend/src/controllers/categoryController.js`
- `backend/src/services/categoryService.js`

Ket qua:

- API co endpoint health check va du lieu category public.

## Commit 13 - Thanh vien A

Muc tieu: Them Swagger API docs.

```bat
git checkout feature/backend-core
for %F in ("backend\src\swagger.js" "backend\src\swagger-output.json") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\swagger.js" "backend\src\swagger-output.json") do @copy /Y "..\%~F" "%~F"
git add backend\src\swagger.js backend\src\swagger-output.json
git commit -m "docs(api): add swagger documentation"
git push origin feature/backend-core
```

File lien quan:

- `backend/src/swagger.js`
- `backend/src/swagger-output.json`

Ket qua:

- API co tai lieu Swagger de kiem thu va tich hop.

## Commit 14 - Thanh vien A

Muc tieu: Them seed data va script xac minh demo user.

```bat
git checkout feature/backend-core
for %F in ("backend\src\utils\seed.js" "backend\src\utils\seedCategories.js" "backend\src\utils\verifyDemoUsers.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\utils\seed.js" "backend\src\utils\seedCategories.js" "backend\src\utils\verifyDemoUsers.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\utils\seed.js backend\src\utils\seedCategories.js backend\src\utils\verifyDemoUsers.js
git commit -m "chore(seed): add demo data utilities"
git push origin feature/backend-core
```

File lien quan:

- `backend/src/utils/seed.js`
- `backend/src/utils/seedCategories.js`
- `backend/src/utils/verifyDemoUsers.js`

Ket qua:

- Ho tro tao du lieu mau va kiem tra tai khoan demo.

## Commit 15 - Thanh vien A

Muc tieu: Them cache va upload service.

```bat
git checkout feature/backend-core
for %F in ("backend\src\services\cacheService.js" "backend\src\services\uploadService.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\services\cacheService.js" "backend\src\services\uploadService.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\services\cacheService.js backend\src\services\uploadService.js
git commit -m "feat(api): add cache and upload services"
git push origin feature/backend-core
```

File lien quan:

- `backend/src/services/cacheService.js`
- `backend/src/services/uploadService.js`

Ket qua:

- Backend san sang dung Redis cache va Cloudinary upload.

## Commit 16 - Thanh vien A

Muc tieu: Hoan thien dinh tuyen backend core.

```bat
git checkout feature/backend-core
for %F in ("backend\src\index.js" "backend\src\routes\category.js" "backend\src\controllers\categoryController.js" "backend\src\services\categoryService.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\index.js" "backend\src\routes\category.js" "backend\src\controllers\categoryController.js" "backend\src\services\categoryService.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\index.js backend\src\routes\category.js backend\src\controllers\categoryController.js backend\src\services\categoryService.js
git commit -m "refactor(api): wire base routers into server"
git push origin feature/backend-core
```

File lien quan:

- `backend/src/index.js`
- `backend/src/routes/category.js`
- `backend/src/controllers/categoryController.js`
- `backend/src/services/categoryService.js`

Ket qua:

- Server mount cac route core dung cau truc route-controller-service.

## Commit 17 - Thanh vien A

Muc tieu: Merge backend core vao develop.

```bat
git checkout develop
git pull origin develop
git merge --no-ff feature/backend-core -m "merge: feature/backend-core into develop"
git push origin develop
```

File lien quan:

- `backend/src/index.js`
- `backend/src/config/*`
- `backend/src/models/*`
- `backend/src/middlewares/*`
- `backend/src/routes/health.js`

Ket qua:

- PR #2 duoc merge, backend core san sang cho module nghiep vu.

## Commit 18 - Thanh vien B

Muc tieu: Tao nhanh authentication va JWT utility.

```bat
git checkout develop
git pull origin develop
git checkout -b feature/authentication
for %F in ("backend\src\utils\jwt.js" "backend\src\middlewares\auth.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\utils\jwt.js" "backend\src\middlewares\auth.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\utils\jwt.js backend\src\middlewares\auth.js
git commit -m "feat(auth): add jwt utilities and auth middleware"
git push -u origin feature/authentication
```

File lien quan:

- `backend/src/utils/jwt.js`
- `backend/src/middlewares/auth.js`

Ket qua:

- API co co che xac thuc JWT va middleware bao ve route.

## Commit 19 - Thanh vien B

Muc tieu: Them validation cho auth.

```bat
git checkout feature/authentication
for %F in ("backend\src\utils\authValidation.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\utils\authValidation.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\utils\authValidation.js
git commit -m "feat(auth): add request validation schemas"
git push origin feature/authentication
```

File lien quan:

- `backend/src/utils/authValidation.js`

Ket qua:

- Dang ky, dang nhap, reset password duoc validate bang schema.

## Commit 20 - Thanh vien B

Muc tieu: Xay dung auth service.

```bat
git checkout feature/authentication
for %F in ("backend\src\services\authService.js" "backend\src\services\emailService.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\services\authService.js" "backend\src\services\emailService.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\services\authService.js backend\src\services\emailService.js
git commit -m "feat(auth): implement authentication service"
git push origin feature/authentication
```

File lien quan:

- `backend/src/services/authService.js`
- `backend/src/services/emailService.js`

Ket qua:

- Ho tro dang ky, dang nhap, refresh token, verify email va quen mat khau.

## Commit 21 - Thanh vien B

Muc tieu: Them auth controller va route.

```bat
git checkout feature/authentication
for %F in ("backend\src\controllers\authController.js" "backend\src\routes\auth.js" "backend\src\index.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\controllers\authController.js" "backend\src\routes\auth.js" "backend\src\index.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\controllers\authController.js backend\src\routes\auth.js backend\src\index.js
git commit -m "feat(auth): expose authentication endpoints"
git push origin feature/authentication
```

File lien quan:

- `backend/src/controllers/authController.js`
- `backend/src/routes/auth.js`
- `backend/src/index.js`

Ket qua:

- Client co the goi API auth qua router chinh.

## Commit 22 - Thanh vien B

Muc tieu: Them store va API client auth o frontend.

```bat
git checkout feature/authentication
for %F in ("frontend\src\stores\auth.ts" "frontend\src\lib\api.ts" "frontend\src\components\auth\AuthBootstrap.tsx") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("frontend\src\stores\auth.ts" "frontend\src\lib\api.ts" "frontend\src\components\auth\AuthBootstrap.tsx") do @copy /Y "..\%~F" "%~F"
git add frontend\src\stores\auth.ts frontend\src\lib\api.ts frontend\src\components\auth\AuthBootstrap.tsx
git commit -m "feat(auth): add frontend auth state and api client"
git push origin feature/authentication
```

File lien quan:

- `frontend/src/stores/auth.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/components/auth/AuthBootstrap.tsx`

Ket qua:

- Frontend co trang thai dang nhap, axios client va bootstrap session.

## Commit 23 - Thanh vien B

Muc tieu: Xay dung trang dang nhap va dang ky.

```bat
git checkout feature/authentication
for %F in ("frontend\src\app\login\page.tsx" "frontend\src\app\register\page.tsx" "frontend\src\app\verify-email\page.tsx") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("frontend\src\app\login\page.tsx" "frontend\src\app\register\page.tsx" "frontend\src\app\verify-email\page.tsx") do @copy /Y "..\%~F" "%~F"
git add frontend\src\app\login\page.tsx frontend\src\app\register\page.tsx frontend\src\app\verify-email\page.tsx
git commit -m "feat(auth): build login register and verify email pages"
git push origin feature/authentication
```

File lien quan:

- `frontend/src/app/login/page.tsx`
- `frontend/src/app/register/page.tsx`
- `frontend/src/app/verify-email/page.tsx`

Ket qua:

- Nguoi dung co UI dang nhap, dang ky va xac minh email.

## Commit 24 - Thanh vien B

Muc tieu: Them luong quen va dat lai mat khau.

```bat
git checkout feature/authentication
for %F in ("frontend\src\app\forgot-password\page.tsx" "frontend\src\app\reset-password\page.tsx" "backend\src\controllers\authController.js" "backend\src\services\authService.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("frontend\src\app\forgot-password\page.tsx" "frontend\src\app\reset-password\page.tsx" "backend\src\controllers\authController.js" "backend\src\services\authService.js") do @copy /Y "..\%~F" "%~F"
git add frontend\src\app\forgot-password\page.tsx frontend\src\app\reset-password\page.tsx backend\src\controllers\authController.js backend\src\services\authService.js
git commit -m "feat(auth): add password recovery flow"
git push origin feature/authentication
```

File lien quan:

- `frontend/src/app/forgot-password/page.tsx`
- `frontend/src/app/reset-password/page.tsx`
- `backend/src/controllers/authController.js`
- `backend/src/services/authService.js`

Ket qua:

- Hoan thien chuc nang quen mat khau va reset password.

## Commit 25 - Thanh vien B

Muc tieu: Them Google OAuth va session refresh.

```bat
git checkout feature/authentication
for %F in ("backend\src\services\authService.js" "backend\src\controllers\authController.js" "backend\src\models\AuthSession.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\services\authService.js" "backend\src\controllers\authController.js" "backend\src\models\AuthSession.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\services\authService.js backend\src\controllers\authController.js backend\src\models\AuthSession.js
git commit -m "feat(auth): support oauth and refresh sessions"
git push origin feature/authentication
```

File lien quan:

- `backend/src/services/authService.js`
- `backend/src/controllers/authController.js`
- `backend/src/models/AuthSession.js`

Ket qua:

- Auth ho tro Google OAuth va refresh token an toan hon.

## Commit 26 - Thanh vien B

Muc tieu: Sua loi phan quyen user/admin.

```bat
git checkout feature/authentication
for %F in ("backend\src\middlewares\auth.js" "backend\src\models\User.js" "README.md") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\middlewares\auth.js" "backend\src\models\User.js" "README.md") do @copy /Y "..\%~F" "%~F"
git add backend\src\middlewares\auth.js backend\src\models\User.js README.md
git commit -m "fix(auth): enforce user and admin role checks"
git push origin feature/authentication
```

File lien quan:

- `backend/src/middlewares/auth.js`
- `backend/src/models/User.js`
- `README.md`

Ket qua:

- RBAC tap trung vao hai role `user` va `admin` theo README.

## Commit 27 - Thanh vien B

Muc tieu: Them test auth.

```bat
git checkout feature/authentication
for %F in ("backend\__tests__\auth.test.js" "backend\__tests__\setup\app.js" "backend\__tests__\setup\testEnvironment.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\__tests__\auth.test.js" "backend\__tests__\setup\app.js" "backend\__tests__\setup\testEnvironment.js") do @copy /Y "..\%~F" "%~F"
git add backend\__tests__\auth.test.js backend\__tests__\setup\app.js backend\__tests__\setup\testEnvironment.js
git commit -m "test(auth): cover authentication workflows"
git push origin feature/authentication
```

File lien quan:

- `backend/__tests__/auth.test.js`
- `backend/__tests__/setup/app.js`
- `backend/__tests__/setup/testEnvironment.js`

Ket qua:

- Co test cho luong dang ky, dang nhap va bao ve endpoint.

## Commit 28 - Thanh vien B

Muc tieu: Cap nhat tai lieu auth.

```bat
git checkout feature/authentication
for %F in ("README.md" "backend\src\swagger-output.json") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("README.md" "backend\src\swagger-output.json") do @copy /Y "..\%~F" "%~F"
git add README.md backend\src\swagger-output.json
git commit -m "docs(auth): update authentication usage notes"
git push origin feature/authentication
```

File lien quan:

- `README.md`
- `backend/src/swagger-output.json`

Ket qua:

- Tai lieu mo ta day du tai khoan demo va API auth.

## Commit 29 - Thanh vien B

Muc tieu: Merge authentication vao develop.

```bat
git checkout develop
git pull origin develop
git merge --no-ff feature/authentication -m "merge: feature/authentication into develop"
git push origin develop
```

File lien quan:

- `backend/src/routes/auth.js`
- `backend/src/controllers/authController.js`
- `backend/src/services/authService.js`
- `frontend/src/app/login/page.tsx`
- `frontend/src/stores/auth.ts`

Ket qua:

- PR #3 duoc merge, xac thuc san sang cho cac module rieng tu.

## Commit 30 - Thanh vien C

Muc tieu: Tao nhanh course learning va validation khoa hoc.

```bat
git checkout develop
git pull origin develop
git checkout -b feature/course-learning
for %F in ("backend\src\utils\courseValidation.js" "backend\src\services\courseService.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\utils\courseValidation.js" "backend\src\services\courseService.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\utils\courseValidation.js backend\src\services\courseService.js
git commit -m "feat(course): add course validation and service layer"
git push -u origin feature/course-learning
```

File lien quan:

- `backend/src/utils/courseValidation.js`
- `backend/src/services/courseService.js`

Ket qua:

- Course co service layer va validation rieng.

## Commit 31 - Thanh vien C

Muc tieu: Them route va controller khoa hoc.

```bat
git checkout feature/course-learning
for %F in ("backend\src\routes\teacher.js" "backend\src\controllers\courseController.js" "backend\src\routes\public.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\routes\teacher.js" "backend\src\controllers\courseController.js" "backend\src\routes\public.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\routes\teacher.js backend\src\controllers\courseController.js backend\src\routes\public.js
git commit -m "feat(course): expose teacher and public course endpoints"
git push origin feature/course-learning
```

File lien quan:

- `backend/src/routes/teacher.js`
- `backend/src/controllers/courseController.js`
- `backend/src/routes/public.js`

Ket qua:

- API ho tro tao, sua, xem va cong khai khoa hoc.

## Commit 32 - Thanh vien C

Muc tieu: Them category API day du.

```bat
git checkout feature/course-learning
for %F in ("backend\src\routes\category.js" "backend\src\controllers\categoryController.js" "backend\src\services\categoryService.js" "frontend\src\lib\categoryApi.ts") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\routes\category.js" "backend\src\controllers\categoryController.js" "backend\src\services\categoryService.js" "frontend\src\lib\categoryApi.ts") do @copy /Y "..\%~F" "%~F"
git add backend\src\routes\category.js backend\src\controllers\categoryController.js backend\src\services\categoryService.js frontend\src\lib\categoryApi.ts
git commit -m "feat(category): implement category management"
git push origin feature/course-learning
```

File lien quan:

- `backend/src/routes/category.js`
- `backend/src/controllers/categoryController.js`
- `backend/src/services/categoryService.js`
- `frontend/src/lib/categoryApi.ts`

Ket qua:

- Category co API backend va client frontend.

## Commit 33 - Thanh vien C

Muc tieu: Them enrollment service va route.

```bat
git checkout feature/course-learning
for %F in ("backend\src\routes\enrollment.js" "backend\src\controllers\enrollmentController.js" "backend\src\services\enrollmentService.js" "backend\src\models\Enrollment.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\routes\enrollment.js" "backend\src\controllers\enrollmentController.js" "backend\src\services\enrollmentService.js" "backend\src\models\Enrollment.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\routes\enrollment.js backend\src\controllers\enrollmentController.js backend\src\services\enrollmentService.js backend\src\models\Enrollment.js
git commit -m "feat(enrollment): add course enrollment workflow"
git push origin feature/course-learning
```

File lien quan:

- `backend/src/routes/enrollment.js`
- `backend/src/controllers/enrollmentController.js`
- `backend/src/services/enrollmentService.js`
- `backend/src/models/Enrollment.js`

Ket qua:

- Hoc vien co the ghi danh va theo doi tien do hoc.

## Commit 34 - Thanh vien C

Muc tieu: Them lesson, exercise va completion flow.

```bat
git checkout feature/course-learning
for %F in ("backend\src\routes\exercise.js" "backend\src\controllers\exerciseController.js" "backend\src\services\exerciseService.js" "backend\src\models\Lesson.js" "backend\src\models\Exercise.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\routes\exercise.js" "backend\src\controllers\exerciseController.js" "backend\src\services\exerciseService.js" "backend\src\models\Lesson.js" "backend\src\models\Exercise.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\routes\exercise.js backend\src\controllers\exerciseController.js backend\src\services\exerciseService.js backend\src\models\Lesson.js backend\src\models\Exercise.js
git commit -m "feat(learning): add lessons exercises and completion"
git push origin feature/course-learning
```

File lien quan:

- `backend/src/routes/exercise.js`
- `backend/src/controllers/exerciseController.js`
- `backend/src/services/exerciseService.js`
- `backend/src/models/Lesson.js`
- `backend/src/models/Exercise.js`

Ket qua:

- Module hoc tap co lesson, bai tap va cham diem co ban.

## Commit 35 - Thanh vien C

Muc tieu: Them certificate.

```bat
git checkout feature/course-learning
for %F in ("backend\src\routes\certificate.js" "backend\src\controllers\certificateController.js" "backend\src\services\certificateService.js" "backend\src\models\Certificate.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\routes\certificate.js" "backend\src\controllers\certificateController.js" "backend\src\services\certificateService.js" "backend\src\models\Certificate.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\routes\certificate.js backend\src\controllers\certificateController.js backend\src\services\certificateService.js backend\src\models\Certificate.js
git commit -m "feat(certificate): issue completion certificates"
git push origin feature/course-learning
```

File lien quan:

- `backend/src/routes/certificate.js`
- `backend/src/controllers/certificateController.js`
- `backend/src/services/certificateService.js`
- `backend/src/models/Certificate.js`

Ket qua:

- He thong cap chung chi khi hoc vien hoan thanh khoa hoc.

## Commit 36 - Thanh vien C

Muc tieu: Them client API cho student va teacher.

```bat
git checkout feature/course-learning
for %F in ("frontend\src\lib\studentApi.ts" "frontend\src\lib\teacherApi.ts" "frontend\src\lib\courseUtils.ts" "frontend\src\types\index.ts") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("frontend\src\lib\studentApi.ts" "frontend\src\lib\teacherApi.ts" "frontend\src\lib\courseUtils.ts" "frontend\src\types\index.ts") do @copy /Y "..\%~F" "%~F"
git add frontend\src\lib\studentApi.ts frontend\src\lib\teacherApi.ts frontend\src\lib\courseUtils.ts frontend\src\types\index.ts
git commit -m "feat(course): add frontend course api clients"
git push origin feature/course-learning
```

File lien quan:

- `frontend/src/lib/studentApi.ts`
- `frontend/src/lib/teacherApi.ts`
- `frontend/src/lib/courseUtils.ts`
- `frontend/src/types/index.ts`

Ket qua:

- Frontend co helper goi API course, student va teacher.

## Commit 37 - Thanh vien C

Muc tieu: Xay dung trang danh sach va chi tiet khoa hoc.

```bat
git checkout feature/course-learning
for %F in ("frontend\src\app\courses\page.tsx" "frontend\src\app\courses\[slug]\page.tsx" "frontend\src\app\courses\[slug]\CourseDetailClient.tsx" "frontend\src\app\courses\[slug]\actions.ts" "frontend\src\components\course\CourseCard.tsx" "frontend\src\components\course\CourseList.tsx") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("frontend\src\app\courses\page.tsx" "frontend\src\app\courses\[slug]\page.tsx" "frontend\src\app\courses\[slug]\CourseDetailClient.tsx" "frontend\src\app\courses\[slug]\actions.ts" "frontend\src\components\course\CourseCard.tsx" "frontend\src\components\course\CourseList.tsx") do @copy /Y "..\%~F" "%~F"
git add frontend\src\app\courses\page.tsx frontend\src\app\courses\[slug]\page.tsx frontend\src\app\courses\[slug]\CourseDetailClient.tsx frontend\src\app\courses\[slug]\actions.ts frontend\src\components\course\CourseCard.tsx frontend\src\components\course\CourseList.tsx
git commit -m "feat(course): build course listing and detail pages"
git push origin feature/course-learning
```

File lien quan:

- `frontend/src/app/courses/page.tsx`
- `frontend/src/app/courses/[slug]/page.tsx`
- `frontend/src/app/courses/[slug]/CourseDetailClient.tsx`
- `frontend/src/app/courses/[slug]/actions.ts`
- `frontend/src/components/course/CourseCard.tsx`
- `frontend/src/components/course/CourseList.tsx`

Ket qua:

- Nguoi dung co the xem danh sach va chi tiet khoa hoc.

## Commit 38 - Thanh vien C

Muc tieu: Xay dung khu hoc tap cua student.

```bat
git checkout feature/course-learning
for %F in ("frontend\src\app\student\my-courses\page.tsx" "frontend\src\app\student\learn\[slug]\page.tsx" "frontend\src\app\student\certificates\page.tsx" "frontend\src\app\student\dashboard\page.tsx") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("frontend\src\app\student\my-courses\page.tsx" "frontend\src\app\student\learn\[slug]\page.tsx" "frontend\src\app\student\certificates\page.tsx" "frontend\src\app\student\dashboard\page.tsx") do @copy /Y "..\%~F" "%~F"
git add frontend\src\app\student\my-courses\page.tsx frontend\src\app\student\learn\[slug]\page.tsx frontend\src\app\student\certificates\page.tsx frontend\src\app\student\dashboard\page.tsx
git commit -m "feat(student): add learning dashboard and course player"
git push origin feature/course-learning
```

File lien quan:

- `frontend/src/app/student/my-courses/page.tsx`
- `frontend/src/app/student/learn/[slug]/page.tsx`
- `frontend/src/app/student/certificates/page.tsx`
- `frontend/src/app/student/dashboard/page.tsx`

Ket qua:

- Student co dashboard, my courses, course player va certificates.

## Commit 39 - Thanh vien C

Muc tieu: Merge course learning vao develop.

```bat
git checkout develop
git pull origin develop
git merge --no-ff feature/course-learning -m "merge: feature/course-learning into develop"
git push origin develop
```

File lien quan:

- `backend/src/routes/teacher.js`
- `backend/src/routes/enrollment.js`
- `backend/src/routes/exercise.js`
- `backend/src/routes/certificate.js`
- `frontend/src/app/courses/*`
- `frontend/src/app/student/*`

Ket qua:

- PR #4 duoc merge, module hoc tap hoan thanh.

## Commit 40 - Thanh vien A

Muc tieu: Tao nhanh payment cart va cart API.

```bat
git checkout develop
git pull origin develop
git checkout -b feature/payment-cart
for %F in ("backend\src\routes\cart.js" "backend\src\controllers\cartController.js" "backend\src\services\cartService.js" "backend\src\models\Cart.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\routes\cart.js" "backend\src\controllers\cartController.js" "backend\src\services\cartService.js" "backend\src\models\Cart.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\routes\cart.js backend\src\controllers\cartController.js backend\src\services\cartService.js backend\src\models\Cart.js
git commit -m "feat(cart): add cart api workflow"
git push -u origin feature/payment-cart
```

File lien quan:

- `backend/src/routes/cart.js`
- `backend/src/controllers/cartController.js`
- `backend/src/services/cartService.js`
- `backend/src/models/Cart.js`

Ket qua:

- Backend ho tro them, sua, xoa khoa hoc trong gio hang.

## Commit 41 - Thanh vien A

Muc tieu: Them payment va VNPay service.

```bat
git checkout feature/payment-cart
for %F in ("backend\src\routes\payment.js" "backend\src\controllers\paymentController.js" "backend\src\services\paymentService.js" "backend\src\services\vnpayService.js" "backend\src\models\Payment.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\routes\payment.js" "backend\src\controllers\paymentController.js" "backend\src\services\paymentService.js" "backend\src\services\vnpayService.js" "backend\src\models\Payment.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\routes\payment.js backend\src\controllers\paymentController.js backend\src\services\paymentService.js backend\src\services\vnpayService.js backend\src\models\Payment.js
git commit -m "feat(payment): integrate vnpay checkout"
git push origin feature/payment-cart
```

File lien quan:

- `backend/src/routes/payment.js`
- `backend/src/controllers/paymentController.js`
- `backend/src/services/paymentService.js`
- `backend/src/services/vnpayService.js`
- `backend/src/models/Payment.js`

Ket qua:

- He thong ho tro VNPay sandbox va luu giao dich thanh toan.

## Commit 42 - Thanh vien A

Muc tieu: Them frontend cart va checkout result.

```bat
git checkout feature/payment-cart
for %F in ("frontend\src\app\student\cart\page.tsx" "frontend\src\app\student\cart\actions.ts" "frontend\src\app\student\checkout\result\page.tsx") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("frontend\src\app\student\cart\page.tsx" "frontend\src\app\student\cart\actions.ts" "frontend\src\app\student\checkout\result\page.tsx") do @copy /Y "..\%~F" "%~F"
git add frontend\src\app\student\cart\page.tsx frontend\src\app\student\cart\actions.ts frontend\src\app\student\checkout\result\page.tsx
git commit -m "feat(cart): build cart and checkout pages"
git push origin feature/payment-cart
```

File lien quan:

- `frontend/src/app/student/cart/page.tsx`
- `frontend/src/app/student/cart/actions.ts`
- `frontend/src/app/student/checkout/result/page.tsx`

Ket qua:

- Student co UI gio hang va trang ket qua thanh toan.

## Commit 43 - Thanh vien A

Muc tieu: Them wishlist.

```bat
git checkout feature/payment-cart
for %F in ("backend\src\routes\wishlist.js" "backend\src\controllers\wishlistController.js" "backend\src\services\wishlistService.js" "backend\src\models\WishlistItem.js" "frontend\src\stores\wishlistStore.ts" "frontend\src\app\student\wishlist\page.tsx") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\routes\wishlist.js" "backend\src\controllers\wishlistController.js" "backend\src\services\wishlistService.js" "backend\src\models\WishlistItem.js" "frontend\src\stores\wishlistStore.ts" "frontend\src\app\student\wishlist\page.tsx") do @copy /Y "..\%~F" "%~F"
git add backend\src\routes\wishlist.js backend\src\controllers\wishlistController.js backend\src\services\wishlistService.js backend\src\models\WishlistItem.js frontend\src\stores\wishlistStore.ts frontend\src\app\student\wishlist\page.tsx
git commit -m "feat(wishlist): add wishlist management"
git push origin feature/payment-cart
```

File lien quan:

- `backend/src/routes/wishlist.js`
- `backend/src/controllers/wishlistController.js`
- `backend/src/services/wishlistService.js`
- `backend/src/models/WishlistItem.js`
- `frontend/src/stores/wishlistStore.ts`
- `frontend/src/app/student/wishlist/page.tsx`

Ket qua:

- Nguoi dung co the them va quan ly khoa hoc yeu thich.

## Commit 44 - Thanh vien A

Muc tieu: Them review va note.

```bat
git checkout feature/payment-cart
for %F in ("backend\src\routes\review.js" "backend\src\controllers\reviewController.js" "backend\src\services\reviewService.js" "backend\src\routes\note.js" "backend\src\controllers\noteController.js" "backend\src\services\noteService.js" "backend\src\models\Review.js" "backend\src\models\Note.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\routes\review.js" "backend\src\controllers\reviewController.js" "backend\src\services\reviewService.js" "backend\src\routes\note.js" "backend\src\controllers\noteController.js" "backend\src\services\noteService.js" "backend\src\models\Review.js" "backend\src\models\Note.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\routes\review.js backend\src\controllers\reviewController.js backend\src\services\reviewService.js backend\src\routes\note.js backend\src\controllers\noteController.js backend\src\services\noteService.js backend\src\models\Review.js backend\src\models\Note.js
git commit -m "feat(learning): add reviews and lesson notes"
git push origin feature/payment-cart
```

File lien quan:

- `backend/src/routes/review.js`
- `backend/src/controllers/reviewController.js`
- `backend/src/services/reviewService.js`
- `backend/src/routes/note.js`
- `backend/src/controllers/noteController.js`
- `backend/src/services/noteService.js`
- `backend/src/models/Review.js`
- `backend/src/models/Note.js`

Ket qua:

- Hoc vien co the danh gia khoa hoc va ghi chu trong lesson.

## Commit 45 - Thanh vien A

Muc tieu: Them user follow.

```bat
git checkout feature/payment-cart
for %F in ("backend\src\routes\userFollow.js" "backend\src\controllers\userFollowController.js" "backend\src\services\userFollowService.js" "backend\src\models\UserFollow.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\routes\userFollow.js" "backend\src\controllers\userFollowController.js" "backend\src\services\userFollowService.js" "backend\src\models\UserFollow.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\routes\userFollow.js backend\src\controllers\userFollowController.js backend\src\services\userFollowService.js backend\src\models\UserFollow.js
git commit -m "feat(social): add user follow service"
git push origin feature/payment-cart
```

File lien quan:

- `backend/src/routes/userFollow.js`
- `backend/src/controllers/userFollowController.js`
- `backend/src/services/userFollowService.js`
- `backend/src/models/UserFollow.js`

Ket qua:

- Backend ho tro theo doi nguoi tao khoa hoc.

## Commit 46 - Thanh vien A

Muc tieu: Them test payment va enrollment.

```bat
git checkout feature/payment-cart
for %F in ("backend\__tests__\payment.test.js" "backend\__tests__\enrollment.test.js" "backend\__tests__\helpers\testHelper.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\__tests__\payment.test.js" "backend\__tests__\enrollment.test.js" "backend\__tests__\helpers\testHelper.js") do @copy /Y "..\%~F" "%~F"
git add backend\__tests__\payment.test.js backend\__tests__\enrollment.test.js backend\__tests__\helpers\testHelper.js
git commit -m "test(payment): cover checkout and enrollment flows"
git push origin feature/payment-cart
```

File lien quan:

- `backend/__tests__/payment.test.js`
- `backend/__tests__/enrollment.test.js`
- `backend/__tests__/helpers/testHelper.js`

Ket qua:

- Co test cho checkout, payment va enrollment lien quan.

## Commit 47 - Thanh vien A

Muc tieu: Merge payment cart vao develop.

```bat
git checkout develop
git pull origin develop
git merge --no-ff feature/payment-cart -m "merge: feature/payment-cart into develop"
git push origin develop
```

File lien quan:

- `backend/src/routes/cart.js`
- `backend/src/routes/payment.js`
- `backend/src/routes/wishlist.js`
- `frontend/src/app/student/cart/page.tsx`
- `frontend/src/app/student/wishlist/page.tsx`

Ket qua:

- PR #5 duoc merge, module gio hang va thanh toan hoan thanh.

## Commit 48 - Thanh vien B

Muc tieu: Tao nhanh AI, search va recommendation.

```bat
git checkout develop
git pull origin develop
git checkout -b feature/ai-search-recommendation
for %F in ("backend\src\routes\ai.js" "backend\src\controllers\aiController.js" "backend\src\services\aiService.js" "backend\src\models\AiUsage.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\routes\ai.js" "backend\src\controllers\aiController.js" "backend\src\services\aiService.js" "backend\src\models\AiUsage.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\routes\ai.js backend\src\controllers\aiController.js backend\src\services\aiService.js backend\src\models\AiUsage.js
git commit -m "feat(ai): add exercise generation api"
git push -u origin feature/ai-search-recommendation
```

File lien quan:

- `backend/src/routes/ai.js`
- `backend/src/controllers/aiController.js`
- `backend/src/services/aiService.js`
- `backend/src/models/AiUsage.js`

Ket qua:

- Backend ho tro tao bai tap bang AI va theo doi muc su dung.

## Commit 49 - Thanh vien B

Muc tieu: Them search API va trang search.

```bat
git checkout feature/ai-search-recommendation
for %F in ("backend\src\routes\search.js" "backend\src\controllers\searchController.js" "backend\src\services\searchService.js" "frontend\src\app\search\page.tsx") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\routes\search.js" "backend\src\controllers\searchController.js" "backend\src\services\searchService.js" "frontend\src\app\search\page.tsx") do @copy /Y "..\%~F" "%~F"
git add backend\src\routes\search.js backend\src\controllers\searchController.js backend\src\services\searchService.js frontend\src\app\search\page.tsx
git commit -m "feat(search): add course search with filters"
git push origin feature/ai-search-recommendation
```

File lien quan:

- `backend/src/routes/search.js`
- `backend/src/controllers/searchController.js`
- `backend/src/services/searchService.js`
- `frontend/src/app/search/page.tsx`

Ket qua:

- Nguoi dung co the tim khoa hoc theo query va bo loc.

## Commit 50 - Thanh vien B

Muc tieu: Them recommendation.

```bat
git checkout feature/ai-search-recommendation
for %F in ("backend\src\routes\recommend.js" "backend\src\controllers\recommendController.js" "backend\src\services\recommendService.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\routes\recommend.js" "backend\src\controllers\recommendController.js" "backend\src\services\recommendService.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\routes\recommend.js backend\src\controllers\recommendController.js backend\src\services\recommendService.js
git commit -m "feat(recommend): add personalized course recommendations"
git push origin feature/ai-search-recommendation
```

File lien quan:

- `backend/src/routes/recommend.js`
- `backend/src/controllers/recommendController.js`
- `backend/src/services/recommendService.js`

Ket qua:

- API co goi y khoa hoc theo nguoi dung va du lieu hoc tap.

## Commit 51 - Thanh vien B

Muc tieu: Them realtime socket cho dashboard.

```bat
git checkout feature/ai-search-recommendation
for %F in ("backend\src\services\socketService.js" "frontend\src\hooks\useSocket.ts" "frontend\src\app\teacher\analytics\page.tsx") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\services\socketService.js" "frontend\src\hooks\useSocket.ts" "frontend\src\app\teacher\analytics\page.tsx") do @copy /Y "..\%~F" "%~F"
git add backend\src\services\socketService.js frontend\src\hooks\useSocket.ts frontend\src\app\teacher\analytics\page.tsx
git commit -m "feat(realtime): add dashboard socket updates"
git push origin feature/ai-search-recommendation
```

File lien quan:

- `backend/src/services/socketService.js`
- `frontend/src/hooks/useSocket.ts`
- `frontend/src/app/teacher/analytics/page.tsx`

Ket qua:

- Dashboard co nen tang realtime qua Socket.io.

## Commit 52 - Thanh vien B

Muc tieu: Them student validation va API ho so hoc vien.

```bat
git checkout feature/ai-search-recommendation
for %F in ("backend\src\utils\studentValidation.js" "backend\src\controllers\studentController.js" "backend\src\services\studentService.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\src\utils\studentValidation.js" "backend\src\controllers\studentController.js" "backend\src\services\studentService.js") do @copy /Y "..\%~F" "%~F"
git add backend\src\utils\studentValidation.js backend\src\controllers\studentController.js backend\src\services\studentService.js
git commit -m "feat(student): add profile validation and service"
git push origin feature/ai-search-recommendation
```

File lien quan:

- `backend/src/utils/studentValidation.js`
- `backend/src/controllers/studentController.js`
- `backend/src/services/studentService.js`

Ket qua:

- Backend co service va validation cho thong tin hoc vien.

## Commit 53 - Thanh vien B

Muc tieu: Them test AI va exercise.

```bat
git checkout feature/ai-search-recommendation
for %F in ("backend\__tests__\aiExercise.test.js" "backend\__tests__\exercise.test.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\__tests__\aiExercise.test.js" "backend\__tests__\exercise.test.js") do @copy /Y "..\%~F" "%~F"
git add backend\__tests__\aiExercise.test.js backend\__tests__\exercise.test.js
git commit -m "test(ai): cover ai exercise and grading flows"
git push origin feature/ai-search-recommendation
```

File lien quan:

- `backend/__tests__/aiExercise.test.js`
- `backend/__tests__/exercise.test.js`

Ket qua:

- Co test cho AI exercise va luong lam bai tap.

## Commit 54 - Thanh vien B

Muc tieu: Merge AI, search va recommendation vao develop.

```bat
git checkout develop
git pull origin develop
git merge --no-ff feature/ai-search-recommendation -m "merge: feature/ai-search-recommendation into develop"
git push origin develop
```

File lien quan:

- `backend/src/routes/ai.js`
- `backend/src/routes/search.js`
- `backend/src/routes/recommend.js`
- `backend/src/services/socketService.js`
- `frontend/src/app/search/page.tsx`

Ket qua:

- PR #7 duoc merge, AI, search, recommendation va realtime hoan thanh.

## Commit 55 - Thanh vien C

Muc tieu: Tao nhanh frontend UI va layout nen.

```bat
git checkout develop
git pull origin develop
git checkout -b feature/frontend-ui
for %F in ("frontend\src\app\layout.tsx" "frontend\src\app\globals.css" "frontend\src\components\layout\Header.tsx" "frontend\src\components\layout\Footer.tsx" "frontend\src\components\layout\Sidebar.tsx" "frontend\src\components\layout\DashboardLayout.tsx") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("frontend\src\app\layout.tsx" "frontend\src\app\globals.css" "frontend\src\components\layout\Header.tsx" "frontend\src\components\layout\Footer.tsx" "frontend\src\components\layout\Sidebar.tsx" "frontend\src\components\layout\DashboardLayout.tsx") do @copy /Y "..\%~F" "%~F"
git add frontend\src\app\layout.tsx frontend\src\app\globals.css frontend\src\components\layout\Header.tsx frontend\src\components\layout\Footer.tsx frontend\src\components\layout\Sidebar.tsx frontend\src\components\layout\DashboardLayout.tsx
git commit -m "feat(ui): add application layout shell"
git push -u origin feature/frontend-ui
```

File lien quan:

- `frontend/src/app/layout.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/components/layout/Header.tsx`
- `frontend/src/components/layout/Footer.tsx`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/components/layout/DashboardLayout.tsx`

Ket qua:

- Frontend co layout chung va cau truc dashboard.

## Commit 56 - Thanh vien C

Muc tieu: Them component UI dung chung.

```bat
git checkout feature/frontend-ui
for %F in ("frontend\src\components\ui\Button.tsx" "frontend\src\components\ui\Card.tsx" "frontend\src\components\ui\Input.tsx" "frontend\src\components\ui\Modal.tsx" "frontend\src\components\ui\Select.tsx" "frontend\src\components\ui\Toast.tsx" "frontend\src\components\ui\Badge.tsx" "frontend\src\components\ui\Avatar.tsx" "frontend\src\components\ui\Progress.tsx" "frontend\src\components\ui\Skeleton.tsx" "frontend\src\components\ui\ThemeToggle.tsx" "frontend\src\lib\utils.ts" "frontend\src\lib\url.ts") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("frontend\src\components\ui\Button.tsx" "frontend\src\components\ui\Card.tsx" "frontend\src\components\ui\Input.tsx" "frontend\src\components\ui\Modal.tsx" "frontend\src\components\ui\Select.tsx" "frontend\src\components\ui\Toast.tsx" "frontend\src\components\ui\Badge.tsx" "frontend\src\components\ui\Avatar.tsx" "frontend\src\components\ui\Progress.tsx" "frontend\src\components\ui\Skeleton.tsx" "frontend\src\components\ui\ThemeToggle.tsx" "frontend\src\lib\utils.ts" "frontend\src\lib\url.ts") do @copy /Y "..\%~F" "%~F"
git add frontend\src\components\ui\Button.tsx frontend\src\components\ui\Card.tsx frontend\src\components\ui\Input.tsx frontend\src\components\ui\Modal.tsx frontend\src\components\ui\Select.tsx frontend\src\components\ui\Toast.tsx frontend\src\components\ui\Badge.tsx frontend\src\components\ui\Avatar.tsx frontend\src\components\ui\Progress.tsx frontend\src\components\ui\Skeleton.tsx frontend\src\components\ui\ThemeToggle.tsx frontend\src\lib\utils.ts frontend\src\lib\url.ts
git commit -m "feat(ui): add reusable design system components"
git push origin feature/frontend-ui
```

File lien quan:

- `frontend/src/components/ui/Button.tsx`
- `frontend/src/components/ui/Card.tsx`
- `frontend/src/components/ui/Input.tsx`
- `frontend/src/components/ui/Modal.tsx`
- `frontend/src/components/ui/Select.tsx`
- `frontend/src/components/ui/Toast.tsx`
- `frontend/src/components/ui/Badge.tsx`
- `frontend/src/components/ui/Avatar.tsx`
- `frontend/src/components/ui/Progress.tsx`
- `frontend/src/components/ui/Skeleton.tsx`
- `frontend/src/components/ui/ThemeToggle.tsx`
- `frontend/src/lib/utils.ts`
- `frontend/src/lib/url.ts`

Ket qua:

- UI co bo component tai su dung cho toan bo ung dung.

## Commit 57 - Thanh vien C

Muc tieu: Xay dung trang public va home.

```bat
git checkout feature/frontend-ui
for %F in ("frontend\src\app\page.tsx" "frontend\src\app\about\page.tsx" "frontend\src\app\help\page.tsx" "frontend\src\app\privacy\page.tsx" "frontend\src\app\terms\page.tsx" "frontend\src\app\cookies\page.tsx" "frontend\src\app\categories\page.tsx" "frontend\src\app\categories\[slug]\page.tsx" "frontend\src\components\home\Hero.tsx" "frontend\src\components\home\Categories.tsx") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("frontend\src\app\page.tsx" "frontend\src\app\about\page.tsx" "frontend\src\app\help\page.tsx" "frontend\src\app\privacy\page.tsx" "frontend\src\app\terms\page.tsx" "frontend\src\app\cookies\page.tsx" "frontend\src\app\categories\page.tsx" "frontend\src\app\categories\[slug]\page.tsx" "frontend\src\components\home\Hero.tsx" "frontend\src\components\home\Categories.tsx") do @copy /Y "..\%~F" "%~F"
git add frontend\src\app\page.tsx frontend\src\app\about\page.tsx frontend\src\app\help\page.tsx frontend\src\app\privacy\page.tsx frontend\src\app\terms\page.tsx frontend\src\app\cookies\page.tsx frontend\src\app\categories\page.tsx frontend\src\app\categories\[slug]\page.tsx frontend\src\components\home\Hero.tsx frontend\src\components\home\Categories.tsx
git commit -m "feat(ui): build public marketing and category pages"
git push origin feature/frontend-ui
```

File lien quan:

- `frontend/src/app/page.tsx`
- `frontend/src/app/about/page.tsx`
- `frontend/src/app/help/page.tsx`
- `frontend/src/app/privacy/page.tsx`
- `frontend/src/app/terms/page.tsx`
- `frontend/src/app/cookies/page.tsx`
- `frontend/src/app/categories/page.tsx`
- `frontend/src/app/categories/[slug]/page.tsx`
- `frontend/src/components/home/Hero.tsx`
- `frontend/src/components/home/Categories.tsx`

Ket qua:

- Hoan thanh cac trang public, category va home landing.

## Commit 58 - Thanh vien C

Muc tieu: Xay dung dashboard admin va teacher.

```bat
git checkout feature/frontend-ui
for %F in ("frontend\src\app\admin\layout.tsx" "frontend\src\app\admin\dashboard\page.tsx" "frontend\src\app\admin\users\page.tsx" "frontend\src\app\admin\courses\page.tsx" "frontend\src\app\admin\categories\page.tsx" "frontend\src\components\admin\AdminCoursePreviewModal.tsx" "frontend\src\lib\adminApi.ts" "frontend\src\app\teacher\layout.tsx" "frontend\src\app\teacher\dashboard\page.tsx" "frontend\src\app\teacher\courses\page.tsx" "frontend\src\app\teacher\courses\create\page.tsx" "frontend\src\app\teacher\courses\[id]\edit\page.tsx" "frontend\src\components\teacher\TeacherFileUploadButton.tsx") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("frontend\src\app\admin\layout.tsx" "frontend\src\app\admin\dashboard\page.tsx" "frontend\src\app\admin\users\page.tsx" "frontend\src\app\admin\courses\page.tsx" "frontend\src\app\admin\categories\page.tsx" "frontend\src\components\admin\AdminCoursePreviewModal.tsx" "frontend\src\lib\adminApi.ts" "frontend\src\app\teacher\layout.tsx" "frontend\src\app\teacher\dashboard\page.tsx" "frontend\src\app\teacher\courses\page.tsx" "frontend\src\app\teacher\courses\create\page.tsx" "frontend\src\app\teacher\courses\[id]\edit\page.tsx" "frontend\src\components\teacher\TeacherFileUploadButton.tsx") do @copy /Y "..\%~F" "%~F"
git add frontend\src\app\admin\layout.tsx frontend\src\app\admin\dashboard\page.tsx frontend\src\app\admin\users\page.tsx frontend\src\app\admin\courses\page.tsx frontend\src\app\admin\categories\page.tsx frontend\src\components\admin\AdminCoursePreviewModal.tsx frontend\src\lib\adminApi.ts frontend\src\app\teacher\layout.tsx frontend\src\app\teacher\dashboard\page.tsx frontend\src\app\teacher\courses\page.tsx frontend\src\app\teacher\courses\create\page.tsx frontend\src\app\teacher\courses\[id]\edit\page.tsx frontend\src\components\teacher\TeacherFileUploadButton.tsx
git commit -m "feat(dashboard): build admin and teacher workspaces"
git push origin feature/frontend-ui
```

File lien quan:

- `frontend/src/app/admin/layout.tsx`
- `frontend/src/app/admin/dashboard/page.tsx`
- `frontend/src/app/admin/users/page.tsx`
- `frontend/src/app/admin/courses/page.tsx`
- `frontend/src/app/admin/categories/page.tsx`
- `frontend/src/components/admin/AdminCoursePreviewModal.tsx`
- `frontend/src/lib/adminApi.ts`
- `frontend/src/app/teacher/layout.tsx`
- `frontend/src/app/teacher/dashboard/page.tsx`
- `frontend/src/app/teacher/courses/page.tsx`
- `frontend/src/app/teacher/courses/create/page.tsx`
- `frontend/src/app/teacher/courses/[id]/edit/page.tsx`
- `frontend/src/components/teacher/TeacherFileUploadButton.tsx`

Ket qua:

- Admin va teacher co workspace rieng de quan ly khoa hoc, user va danh muc.

## Commit 59 - Thanh vien C

Muc tieu: Merge frontend UI vao develop.

```bat
git checkout develop
git pull origin develop
git merge --no-ff feature/frontend-ui -m "merge: feature/frontend-ui into develop"
git push origin develop
```

File lien quan:

- `frontend/src/app/*`
- `frontend/src/components/*`
- `frontend/src/lib/*`
- `frontend/src/stores/*`
- `frontend/src/types/index.ts`

Ket qua:

- PR #8 duoc merge, giao dien hoan chinh cho cac vai tro.

## Commit 60 - Thanh vien A

Muc tieu: Them test tong hop va cau hinh kiem thu backend.

```bat
git checkout develop
git pull origin develop
git checkout -b feature/testing
for %F in ("backend\jest.config.js" "backend\__tests__\jest.setup.js" "backend\__tests__\health.test.js" "backend\__tests__\course.test.js") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("backend\jest.config.js" "backend\__tests__\jest.setup.js" "backend\__tests__\health.test.js" "backend\__tests__\course.test.js") do @copy /Y "..\%~F" "%~F"
git add backend\jest.config.js backend\__tests__\jest.setup.js backend\__tests__\health.test.js backend\__tests__\course.test.js
git commit -m "test(backend): add health and course test coverage"
git push -u origin feature/testing
git checkout develop
git merge --no-ff feature/testing -m "merge: feature/testing into develop"
git push origin develop
```

File lien quan:

- `backend/jest.config.js`
- `backend/__tests__/jest.setup.js`
- `backend/__tests__/health.test.js`
- `backend/__tests__/course.test.js`

Ket qua:

- PR #9 duoc merge, du an co Jest tests va cau hinh kiem thu backend.

## Commit 61 - Thanh vien C

Muc tieu: Tao release v1.0.0.

```bat
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0
for %F in ("README.md" "backend\src\swagger-output.json" "frontend\README.md") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("README.md" "backend\src\swagger-output.json" "frontend\README.md") do @copy /Y "..\%~F" "%~F"
git add README.md backend\src\swagger-output.json frontend\README.md
git commit -m "chore(release): prepare v1.0.0"
git push -u origin release/v1.0.0
git checkout main
git pull origin main
git merge --no-ff release/v1.0.0 -m "merge: release/v1.0.0 into main"
git tag -a v1.0.0 -m "release: v1.0.0"
git push origin main --tags
git checkout develop
git merge --no-ff release/v1.0.0 -m "merge: release/v1.0.0 back into develop"
git push origin develop
```

File lien quan:

- `README.md`
- `backend/src/swagger-output.json`
- `frontend/README.md`

Ket qua:

- PR #10 va #11 duoc merge, release `v1.0.0` duoc tag va dong bo ve `develop`.

## Commit 62 - Thanh vien B

Muc tieu: Tao hotfix v1.0.1 va resolve conflict tai lieu.

```bat
git checkout main
git pull origin main
git checkout -b hotfix/v1.0.1
for %F in ("README.md" ".env.example") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("README.md" ".env.example") do @copy /Y "..\%~F" "%~F"
git add README.md .env.example
git commit -m "fix(release): correct demo environment notes"
git push -u origin hotfix/v1.0.1
git checkout main
git merge --no-ff hotfix/v1.0.1 -m "merge: hotfix/v1.0.1 into main"
git tag -a v1.0.1 -m "hotfix: v1.0.1"
git push origin main --tags
git checkout develop
git pull origin develop
git merge --no-ff hotfix/v1.0.1 -m "merge: hotfix/v1.0.1 back into develop"
git status
for %F in ("README.md") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("README.md") do @copy /Y "..\%~F" "%~F"
git add README.md
git commit -m "fix(docs): resolve hotfix documentation conflict"
git push origin develop
```

File lien quan:

- `README.md`
- `.env.example`

Ket qua:

- PR #12 va #13 duoc merge, hotfix `v1.0.1` duoc tag.
- Conflict README giua release va develop duoc resolve bang noi dung moi nhat.

## Commit 63 - Thanh vien B

Muc tieu: Bo sung quy uoc owner branch va thong ke commit.

```bat
git checkout develop
git pull origin develop
git checkout -b feature/gitflow-docs
for %F in ("GITFLOW.md") do @if not exist "%~dpF" mkdir "%~dpF"
for %F in ("GITFLOW.md") do @copy /Y "..\%~F" "%~F"
git add GITFLOW.md
git commit -m "docs(gitflow): document branch ownership rules"
git push -u origin feature/gitflow-docs
git checkout develop
git merge --no-ff feature/gitflow-docs -m "merge: feature/gitflow-docs into develop"
git push origin develop
```

File lien quan:

- `GITFLOW.md`

Ket qua:

- PR #14 duoc merge, quy uoc moi branch mot thanh vien va thong ke commit duoc cap nhat.

## Release versions

| Version | Branch | Tag | Noi dung |
| --- | --- | --- | --- |
| `v1.0.0` | `release/v1.0.0` | `v1.0.0` | Ban phat hanh dau tien gom frontend, backend, Docker va test |
| `v1.0.1` | `hotfix/v1.0.1` | `v1.0.1` | Sua ghi chu moi truong demo va dong bo tai lieu |

## Thong ke commit theo thanh vien

| Thanh vien | So commit | Pham vi chinh |
| --- | ---: | --- |
| Thanh vien A | 21 | Backend core, payment-cart, testing |
| Thanh vien B | 21 | Authentication, AI/search/recommendation, hotfix, gitflow docs |
| Thanh vien C | 21 | Repo init, project foundation, course learning, frontend UI, release |
| Tong cong | 63 | Moi thanh vien co hon 20 commit va moi branch chi co mot owner |

## Kiem tra bao phu source code

- Backend da bao phu: `backend/src/config`, `backend/src/models`, `backend/src/routes`, `backend/src/controllers`, `backend/src/services`, `backend/src/middlewares`, `backend/src/utils`, `backend/src/swagger.js`, `backend/src/swagger-output.json`.
- Frontend da bao phu: `frontend/src/app`, `frontend/src/components`, `frontend/src/lib`, `frontend/src/stores`, `frontend/src/types`, `frontend/src/hooks`.
- Testing da bao phu: `backend/__tests__`, `backend/jest.config.js`.
- DevOps da bao phu: `frontend/Dockerfile`, `backend/Dockerfile`, `docker-compose.yml`, `.env.example`.
- Docs da bao phu: `README.md`, `frontend/README.md`; khong dua cac file Markdown khac vao lich su commit.





