# Shalom Learning - Product Requirements Document

## Original Problem Statement
Create a website named "Shalom Learning" to sell technology and language courses (Python, Excel, SQL, Word, HTML/CSS, Javascript, French, Portuguese, English, Spanish). The default language must be Brazilian Portuguese with translation options for English, French, Haitian Creole, and Spanish.

## User Personas
1. **Students**: People worldwide seeking technology and language courses
2. **Admin (Jean Mary Jeanlus)**: Software Engineer managing courses, users, and content

## Tech Stack
- **Frontend**: React, React Router, Axios, Tailwind CSS, i18next, Shadcn/UI
- **Backend**: FastAPI, MongoDB (motor), Pydantic, JWT
- **Payments**: Mercado Pago SDK (PRODUCTION)

## Admin Credentials
- Email: jeanlusjeanmarysagehomme@gmail.com
- Password: Bondye509@

---

## Implementation Status - COMPLETE

### Core Features (Complete)
- [x] Full-stack e-commerce platform
- [x] User authentication (Signup/Login with JWT)
- [x] Multi-language support (PT, EN, FR, ES, HT)
- [x] Mercado Pago payment integration (PRODUCTION)
- [x] FAQ section
- [x] **White-label** - No Emergent branding

### About Page (NEW - Complete)
- [x] Jean Mary Jeanlus presentation
- [x] Skills display (Python, SQL, JavaScript, React, etc.)
- [x] Languages spoken (French, Haitian Creole, English, Portuguese)
- [x] Mastercard employment info
- [x] Full translation in all 5 languages

### Admin Panel (Complete)
- [x] Dashboard with statistics
- [x] **Course Management (CRUD)**
- [x] **User Management** (delete, grant/revoke access)
- [x] **Lesson Management** (YouTube + PDF)
- [x] **Coupon System** (percentage/fixed, expiration, restrictions)
- [x] **Questions Management** (NEW)
  - [x] View all student questions
  - [x] Answer questions
  - [x] Delete questions
  - [x] Send email responses

### Student Features (Complete)
- [x] Course catalog with filtering
- [x] Course purchase via Mercado Pago
- [x] Video lessons with YouTube player
- [x] PDF material downloads
- [x] **Questions System** (NEW)
  - [x] Separate "Duvidas" tab in course page
  - [x] Submit questions
  - [x] View all questions and answers
  - [x] See pending/answered status

### Checkout Features (Complete)
- [x] Coupon application with real-time validation
- [x] Discount display
- [x] Multiple payment methods (PIX, Card, Boleto)

---

## Prioritized Backlog

### P1 - Important
- [ ] Email notifications for purchase confirmations (requires email service integration)
- [ ] Student progress tracking (mark lessons as completed)

### P2 - Nice to Have
- [ ] Digital certificates upon course completion
- [ ] "Reset Password" functionality
- [ ] Affiliate/referral system
- [ ] Student reviews/ratings

---

## API Endpoints Summary

### Public
- `GET /api/courses` - List published courses
- `GET /api/courses/{id}` - Get single course
- `GET /api/courses/{id}/questions` - Get course questions

### Auth
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user

### Admin
- Course CRUD: `GET/POST/PUT/DELETE /api/admin/courses`
- User Management: `GET/DELETE /api/admin/users`, `POST grant-access/revoke-access`
- Lessons: `GET/POST/DELETE /api/admin/lessons`
- Coupons: `GET/POST/PUT/DELETE /api/admin/coupons`
- Questions: `GET /api/admin/questions`, `PUT answer`, `DELETE`, `POST send-email`

### Student
- `POST /api/courses/{id}/questions` - Submit question
- `POST /api/coupons/validate` - Validate coupon
- `POST /api/payments/create-preference` - Create payment
- `GET /api/my-courses` - Purchased courses

---

## Database Collections
- `users` - User accounts
- `courses` - Course catalog (dynamic, from MongoDB)
- `lessons` - Course lessons
- `payments` - Payment records
- `coupons` - Discount coupons
- `questions` - Student questions/answers

---

## Test Credentials
- **Admin**: jeanlusjeanmarysagehomme@gmail.com / Bondye509@
- **Test User**: testcoupon@test.com / test123 (has Python course)
- **Test Coupon**: TESTE10 (10% discount)

---

## Files Structure
```
/app/
├── backend/
│   ├── server.py (1250+ lines - all API logic)
│   ├── .env (Mercado Pago PROD keys)
│   └── tests/
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── About.js (NEW)
│       │   ├── AdminPanel.js (1500+ lines)
│       │   ├── CourseDetail.js (with Questions tab)
│       │   ├── Checkout.js (with coupons)
│       │   └── ...
│       └── utils/translations.js (all 5 languages)
├── memory/PRD.md
└── test_reports/
    └── iteration_4.json (100% pass rate)
```

---

## Latest Updates (2025-03-21)
1. Added "Sobre Mim" page with Jean Mary Jeanlus presentation
2. Translated About page to all 5 languages
3. Removed "para brasileiros" from hero text
4. Implemented Questions/Doubts system for courses
5. Made site fully white-label (removed Emergent branding)
6. Title changed to "Shalom Learning"
