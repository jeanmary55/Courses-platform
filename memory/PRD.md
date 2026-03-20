# Shalom Learning - Product Requirements Document

## Original Problem Statement
Create a website named "Shalom Learning" to sell technology and language courses (Python, Excel, SQL, Word, HTML/CSS, Javascript, French, Portuguese, English, Spanish). The default language must be Brazilian Portuguese with translation options for English, French, Haitian Creole, and Spanish. The site should include FAQ section, user registration/login, and payment integration via Mercado Pago.

## User Personas
1. **Students**: Brazilians seeking technology and language courses
2. **Admin**: Site owner managing courses, users, and content

## Core Requirements
- E-commerce platform for courses
- Multi-language support (PT, EN, FR, ES, HT)
- JWT-based authentication
- Mercado Pago payment integration (PRODUCTION keys)
- Admin panel for content management

## Tech Stack
- **Frontend**: React, React Router, Axios, Tailwind CSS, i18next, Shadcn/UI
- **Backend**: FastAPI, MongoDB (motor), Pydantic, JWT
- **Payments**: Mercado Pago SDK

## Admin Credentials
- Email: jeanlusjeanmarysagehomme@gmail.com
- Password: Bondye509@

---

## Implementation Status

### Completed (Date: 2025-03-20)

#### Core Features
- [x] Full-stack MVP with course catalog
- [x] User authentication (Signup/Login with JWT)
- [x] Multi-language support (i18n) for UI and course data
- [x] Mercado Pago integration with PRODUCTION credentials
- [x] FAQ section

#### Admin Panel (Complete)
- [x] Admin login at `/admin-login`
- [x] Dashboard with statistics (users, revenue, sales, courses)
- [x] **Course Management (CRUD)**
  - [x] Create new course (title, description, category, price, thumbnail)
  - [x] Edit existing courses
  - [x] Delete courses
  - [x] Publish/Unpublish courses
  - [x] Update course prices
- [x] **User Management**
  - [x] View all users
  - [x] Delete users
  - [x] Grant free course access
  - [x] Revoke course access
- [x] **Lesson Management**
  - [x] Add lessons with YouTube URL
  - [x] Add optional PDF URL for lessons
  - [x] Delete lessons
  - [x] List lessons by course
- [x] **Coupon System** (NEW)
  - [x] Create coupons (percentage or fixed discount)
  - [x] Set expiration date
  - [x] Set maximum uses
  - [x] Restrict to specific user
  - [x] Restrict to specific course
  - [x] Set minimum purchase amount
  - [x] Activate/Deactivate coupons
  - [x] Delete coupons

#### Student Features
- [x] **Course Lessons Display**
  - [x] Video player for purchased courses (YouTube embed)
  - [x] PDF download button for lessons with materials
  - [x] Lesson navigation in sidebar
  - [x] "You own this course" badge
  - [x] Locked lessons for non-purchased courses

#### Checkout Features
- [x] **Coupon Application**
  - [x] Coupon input field
  - [x] Real-time validation
  - [x] Discount display
  - [x] Final price calculation
  - [x] Remove coupon option

---

## Prioritized Backlog

### P1 - Important
- [ ] Email notifications for purchase confirmations
- [ ] Student progress tracking (mark lessons as completed)

### P2 - Nice to Have
- [ ] Digital certificates upon course completion
- [ ] "Reset Password" functionality
- [ ] Admin search/filter enhancements
- [ ] CSV/PDF export for reports

---

## API Endpoints

### Public
- `GET /api/courses` - List published courses
- `GET /api/courses/{id}` - Get single course

### Auth
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/{id}` - Delete user
- `POST /api/admin/users/grant-access` - Grant free access
- `POST /api/admin/users/revoke-access` - Revoke access
- `GET /api/admin/courses` - List all courses (including unpublished)
- `POST /api/admin/courses` - Create course
- `PUT /api/admin/courses/{id}` - Update course
- `DELETE /api/admin/courses/{id}` - Delete course
- `PUT /api/admin/courses/{id}/publish` - Toggle publish status
- `GET /api/admin/lessons/{course_id}` - List lessons
- `POST /api/admin/lessons/add` - Add lesson
- `DELETE /api/admin/lessons/{id}` - Delete lesson
- `GET /api/admin/coupons` - List coupons
- `POST /api/admin/coupons` - Create coupon
- `PUT /api/admin/coupons/{id}` - Update coupon
- `DELETE /api/admin/coupons/{id}` - Delete coupon

### Coupons
- `POST /api/coupons/validate` - Validate and calculate discount

### Payments
- `POST /api/payments/create-preference` - Create Mercado Pago preference (accepts couponCode)
- `POST /api/webhooks/mercadopago` - Payment webhook
- `GET /api/my-courses` - User's purchased courses

---

## Database Schema

### users
```json
{
  "id": "uuid",
  "firstName": "string",
  "lastName": "string",
  "email": "string (unique)",
  "password_hash": "string",
  "purchasedCourses": ["course_id"],
  "createdAt": "datetime"
}
```

### courses
```json
{
  "id": "string",
  "title": "string",
  "category": "Tecnologia | Idiomas",
  "description": "string",
  "price": "float",
  "thumbnail": "url",
  "language": "pt",
  "published": "boolean",
  "createdAt": "datetime"
}
```

### lessons
```json
{
  "id": "uuid",
  "courseId": "string",
  "title": "string",
  "videoUrl": "youtube embed url",
  "pdfUrl": "url (optional)",
  "duration": "string",
  "order": "int",
  "createdAt": "datetime"
}
```

### coupons
```json
{
  "id": "uuid",
  "code": "string (unique, uppercase)",
  "discountType": "percentage | fixed",
  "discountValue": "float",
  "maxUses": "int (optional)",
  "currentUses": "int",
  "expiresAt": "datetime (optional)",
  "specificUserId": "uuid (optional)",
  "specificCourseId": "string (optional)",
  "minPurchaseAmount": "float (optional)",
  "active": "boolean",
  "createdAt": "datetime"
}
```

### payments
```json
{
  "id": "uuid",
  "userId": "uuid",
  "courseId": "string",
  "mercadopagoId": "string",
  "status": "pending | approved | rejected",
  "amount": "float",
  "originalAmount": "float (optional)",
  "discount": "float (optional)",
  "couponCode": "string (optional)",
  "createdAt": "datetime"
}
```

---

## File Structure
```
/app/
├── backend/
│   ├── .env
│   ├── requirements.txt
│   ├── server.py
│   └── tests/
│       └── test_coupon_system.py
├── frontend/
│   ├── .env
│   ├── package.json
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── hooks/
│       ├── pages/
│       │   ├── AdminPanel.js
│       │   ├── Checkout.js
│       │   ├── CourseDetail.js
│       │   ├── Home.js
│       │   ├── Login.js
│       │   ├── MyCourses.js
│       │   └── ...
│       └── utils/translations.js
├── memory/
│   └── PRD.md
├── test_reports/
│   ├── iteration_2.json
│   └── iteration_3.json
└── DOCUMENTACAO.md
```

---

## Test Credentials
- **Admin**: jeanlusjeanmarysagehomme@gmail.com / Bondye509@
- **Test User**: testcoupon@test.com / test123
- **Test Coupon**: TESTE10 (10% discount)
