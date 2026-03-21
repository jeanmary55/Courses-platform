from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import base64
import random
import string
import mercadopago

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging early
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'shalom-learning-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Mercado Pago Configuration
MERCADOPAGO_ACCESS_TOKEN = os.environ['MERCADOPAGO_ACCESS_TOKEN']
MERCADOPAGO_PUBLIC_KEY = os.environ['MERCADOPAGO_PUBLIC_KEY']
sdk = mercadopago.SDK(MERCADOPAGO_ACCESS_TOKEN)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ==================== Models ====================

class UserSignup(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    firstName: str
    lastName: str
    email: str
    purchasedCourses: List[str] = []
    createdAt: str

class Lesson(BaseModel):
    id: str
    title: str
    videoUrl: str
    duration: str
    order: int

class Course(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    category: str
    description: str
    price: float
    lessons: List[Lesson]
    thumbnail: str
    language: str

class PaymentCreate(BaseModel):
    courseId: str
    couponCode: Optional[str] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    userId: str
    courseId: str
    mercadopagoId: str
    status: str
    amount: float
    createdAt: str

# ==================== Helper Functions ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    return decode_token(token)

def generate_access_code(course_id: str) -> str:
    """Generate unique access code for a course purchase"""
    prefix = "SHL"
    course_code = course_id.upper().replace("-", "")[:6]
    random_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{course_code}-{random_code}"

# ==================== Course Data ====================

# Default courses to seed database if empty
DEFAULT_COURSES = [
    {
        "id": "python-basics",
        "title": "Python para Iniciantes",
        "category": "Tecnologia",
        "description": "Aprenda Python do zero ao avançado com 20 aulas práticas",
        "price": 197.00,
        "thumbnail": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800",
        "language": "pt",
        "published": True,
        "lessons": []
    },
    {
        "id": "excel-mastery",
        "title": "Excel Completo",
        "category": "Tecnologia",
        "description": "Domine Excel com fórmulas, tabelas dinâmicas e muito mais",
        "price": 147.00,
        "thumbnail": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
        "language": "pt",
        "published": True,
        "lessons": []
    },
    {
        "id": "sql-database",
        "title": "SQL e Bancos de Dados",
        "category": "Tecnologia",
        "description": "Aprenda SQL para gerenciar bancos de dados relacionais",
        "price": 197.00,
        "thumbnail": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800",
        "language": "pt",
        "published": True,
        "lessons": []
    },
    {
        "id": "word-professional",
        "title": "Word Profissional",
        "category": "Tecnologia",
        "description": "Crie documentos profissionais com Microsoft Word",
        "price": 97.00,
        "thumbnail": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800",
        "language": "pt",
        "published": True,
        "lessons": []
    },
    {
        "id": "html-css",
        "title": "HTML & CSS",
        "category": "Tecnologia",
        "description": "Crie sites incríveis com HTML5 e CSS3",
        "price": 197.00,
        "thumbnail": "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800",
        "language": "pt",
        "published": True,
        "lessons": []
    },
    {
        "id": "javascript-modern",
        "title": "JavaScript Moderno",
        "category": "Tecnologia",
        "description": "Programação web com JavaScript ES6+",
        "price": 247.00,
        "thumbnail": "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800",
        "language": "pt",
        "published": True,
        "lessons": []
    },
    {
        "id": "french-course",
        "title": "Francês Completo",
        "category": "Idiomas",
        "description": "Aprenda francês do básico ao avançado",
        "price": 297.00,
        "thumbnail": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
        "language": "pt",
        "published": True,
        "lessons": []
    },
    {
        "id": "portuguese-course",
        "title": "Português Avançado",
        "category": "Idiomas",
        "description": "Gramática e redação em português",
        "price": 197.00,
        "thumbnail": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
        "language": "pt",
        "published": True,
        "lessons": []
    },
    {
        "id": "english-course",
        "title": "Inglês do Zero",
        "category": "Idiomas",
        "description": "Inglês para brasileiros - do básico ao fluente",
        "price": 297.00,
        "thumbnail": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
        "language": "pt",
        "published": True,
        "lessons": []
    },
    {
        "id": "spanish-course",
        "title": "Espanhol Rápido",
        "category": "Idiomas",
        "description": "Aprenda espanhol de forma rápida e prática",
        "price": 247.00,
        "thumbnail": "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800",
        "language": "pt",
        "published": True,
        "lessons": []
    }
]

async def seed_courses():
    """Seed default courses to database if empty"""
    count = await db.courses.count_documents({})
    if count == 0:
        for course in DEFAULT_COURSES:
            course["createdAt"] = datetime.now(timezone.utc).isoformat()
            await db.courses.insert_one(course)
        logger.info(f"Seeded {len(DEFAULT_COURSES)} default courses")

async def get_courses_from_db():
    """Get all courses from database"""
    courses = await db.courses.find({}, {"_id": 0}).to_list(1000)
    return courses

async def get_course_by_id(course_id: str):
    """Get a single course by ID"""
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    return course

# ==================== Routes ====================

@api_router.get("/")
async def root():
    return {"message": "Shalom Learning API"}

# Auth endpoints
@api_router.post("/auth/signup")
async def signup(user_data: UserSignup):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Create new user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "firstName": user_data.firstName,
        "lastName": user_data.lastName,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "purchasedCourses": [],
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "firstName": user_data.firstName,
            "lastName": user_data.lastName,
            "email": user_data.email,
            "purchasedCourses": []
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    
    token = create_token(user['id'])
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "firstName": user['firstName'],
            "lastName": user['lastName'],
            "email": user['email'],
            "purchasedCourses": user.get('purchasedCourses', [])
        }
    }

@api_router.get("/auth/me")
async def get_me(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

# Course endpoints
@api_router.get("/courses")
async def get_courses(category: Optional[str] = None, include_unpublished: bool = False):
    """Get all courses - only published courses for regular users"""
    await seed_courses()  # Ensure courses are seeded
    
    query = {}
    if category:
        query["category"] = category
    if not include_unpublished:
        query["published"] = True
    
    courses = await db.courses.find(query, {"_id": 0}).to_list(1000)
    
    # Add lessons for each course
    for course in courses:
        lessons = await db.lessons.find({"courseId": course["id"]}, {"_id": 0}).sort("order", 1).to_list(1000)
        course["lessons"] = lessons
    
    return courses

@api_router.get("/courses/{course_id}")
async def get_course(course_id: str):
    """Get a single course by ID"""
    course = await get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    
    # Add lessons
    lessons = await db.lessons.find({"courseId": course_id}, {"_id": 0}).sort("order", 1).to_list(1000)
    course["lessons"] = lessons
    
    return course

# Payment endpoints
@api_router.post("/payments/create-preference")
async def create_payment_preference(payment_data: PaymentCreate, user_id: str = Depends(get_current_user)):
    """Create Mercado Pago payment preference - All payment methods, no account required"""
    # Verify course exists
    course = await get_course_by_id(payment_data.courseId)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    
    # Get user info
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Calculate price (with coupon if provided)
    original_price = float(course['price'])
    final_price = original_price
    discount = 0
    coupon_code = None
    
    if payment_data.couponCode:
        coupon_code = payment_data.couponCode.upper().strip()
        coupon = await db.coupons.find_one({"code": coupon_code}, {"_id": 0})
        
        if coupon and coupon.get("active", True):
            # Validate coupon
            is_valid = True
            
            # Check expiration
            if coupon.get("expiresAt"):
                expires = datetime.fromisoformat(coupon["expiresAt"].replace("Z", "+00:00"))
                if datetime.now(timezone.utc) > expires:
                    is_valid = False
            
            # Check max uses
            if coupon.get("maxUses") is not None and coupon.get("currentUses", 0) >= coupon["maxUses"]:
                is_valid = False
            
            # Check specific user
            if coupon.get("specificUserId") and coupon["specificUserId"] != user_id:
                is_valid = False
            
            # Check specific course
            if coupon.get("specificCourseId") and coupon["specificCourseId"] != payment_data.courseId:
                is_valid = False
            
            # Check min purchase amount
            if coupon.get("minPurchaseAmount") and original_price < coupon["minPurchaseAmount"]:
                is_valid = False
            
            if is_valid:
                # Calculate discount
                if coupon["discountType"] == "percentage":
                    discount = original_price * (coupon["discountValue"] / 100)
                else:  # fixed
                    discount = min(coupon["discountValue"], original_price)
                
                final_price = max(0.01, original_price - discount)  # Mercado Pago min is 0.01
                
                # Increment coupon usage
                await db.coupons.update_one(
                    {"code": coupon_code},
                    {"$inc": {"currentUses": 1}}
                )
    
    # Create payment preference
    preference_data = {
        "items": [
            {
                "title": course['title'],
                "description": f"{course['description']}" + (f" (Cupom: {coupon_code})" if coupon_code and discount > 0 else ""),
                "quantity": 1,
                "unit_price": round(final_price, 2),
                "currency_id": "BRL"
            }
        ],
        "payer": {
            "name": f"{user['firstName']} {user['lastName']}",
            "email": user['email']
        },
        "payment_methods": {
            "excluded_payment_methods": [],
            "excluded_payment_types": [],
            "installments": 12
        },
        "back_urls": {
            "success": f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/payment-success",
            "failure": f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/payment-failure",
            "pending": f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/payment-pending"
        },
        "auto_return": "approved",
        "external_reference": f"{user_id}_{payment_data.courseId}_{str(uuid.uuid4())[:8]}",
        "notification_url": f"{os.environ.get('BACKEND_URL', 'http://localhost:8001')}/api/webhooks/mercadopago",
        "statement_descriptor": "Shalom Learning",
        "binary_mode": False
    }
    
    try:
        preference_response = sdk.preference().create(preference_data)
        preference = preference_response["response"]
        
        # Log success
        logger.info(f"Preference created successfully: {preference['id']}")
        
        # Save payment record
        payment_id = str(uuid.uuid4())
        payment_doc = {
            "id": payment_id,
            "userId": user_id,
            "courseId": payment_data.courseId,
            "mercadopagoId": preference["id"],
            "status": "pending",
            "amount": round(final_price, 2),
            "originalAmount": original_price,
            "discount": round(discount, 2),
            "couponCode": coupon_code if discount > 0 else None,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        
        await db.payments.insert_one(payment_doc)
        
        return {
            "preferenceId": preference["id"],
            "initPoint": preference["init_point"],
            "originalPrice": original_price,
            "discount": round(discount, 2),
            "finalPrice": round(final_price, 2),
            "couponApplied": coupon_code if discount > 0 else None
        }
        
    except Exception as e:
        error_detail = str(e)
        logger.error(f"Error creating Mercado Pago preference: {error_detail}")
        
        # Check if it's an API error
        if hasattr(e, 'args') and len(e.args) > 0:
            error_info = e.args[0]
            logger.error(f"Detailed error: {error_info}")
        
        # Return user-friendly error
        raise HTTPException(
            status_code=500, 
            detail=f"Erro ao criar pagamento. Verifique suas credenciais do Mercado Pago. Detalhes: {error_detail}"
        )

@api_router.post("/webhooks/mercadopago")
async def mercadopago_webhook(request: Request):
    """Handle Mercado Pago payment notifications"""
    try:
        body = await request.json()
        logger.info(f"Webhook received: {body}")
        
        # Get payment info from Mercado Pago
        if body.get("type") == "payment":
            payment_id = body["data"]["id"]
            
            payment_info = sdk.payment().get(payment_id)
            payment_data = payment_info["response"]
            
            logger.info(f"Payment status: {payment_data['status']}")
            
            # If payment is approved, grant access to course
            if payment_data["status"] == "approved":
                external_reference = payment_data.get("external_reference", "")
                parts = external_reference.split("_")
                
                if len(parts) >= 2:
                    user_id = parts[0]
                    course_id = parts[1]
                    
                    # Update payment status
                    await db.payments.update_one(
                        {"mercadopagoId": payment_data.get("preference_id", "")},
                        {"$set": {"status": "approved"}}
                    )
                    
                    # Add course to user's purchased courses
                    await db.users.update_one(
                        {"id": user_id},
                        {"$addToSet": {"purchasedCourses": course_id}}
                    )
                    
                    logger.info(f"Course {course_id} granted to user {user_id}")
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

@api_router.get("/my-courses")
async def get_my_courses(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    purchased_course_ids = user.get('purchasedCourses', [])
    
    # Get courses from database
    courses = await db.courses.find({"id": {"$in": purchased_course_ids}}, {"_id": 0}).to_list(1000)
    
    # Add lessons for each course
    for course in courses:
        lessons = await db.lessons.find({"courseId": course["id"]}, {"_id": 0}).sort("order", 1).to_list(1000)
        course["lessons"] = lessons
    
    return courses

@api_router.get("/mercadopago/public-key")
async def get_mercadopago_public_key():
    """Return Mercado Pago public key for frontend"""
    return {"publicKey": MERCADOPAGO_PUBLIC_KEY}

@api_router.get("/mercadopago/test-credentials")
async def test_mercadopago_credentials():
    """Test Mercado Pago credentials"""
    try:
        # Try to get payment methods to test credentials
        sdk.payment_methods().list_all()
        return {
            "status": "success",
            "message": "Credenciais válidas",
            "hasAccessToken": bool(MERCADOPAGO_ACCESS_TOKEN),
            "hasPublicKey": bool(MERCADOPAGO_PUBLIC_KEY),
            "tokenLength": len(MERCADOPAGO_ACCESS_TOKEN) if MERCADOPAGO_ACCESS_TOKEN else 0
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erro ao testar credenciais: {str(e)}",
            "hasAccessToken": bool(MERCADOPAGO_ACCESS_TOKEN),
            "hasPublicKey": bool(MERCADOPAGO_PUBLIC_KEY)
        }

@api_router.get("/payments/status/{payment_id}")
async def check_payment_status(payment_id: str, user_id: str = Depends(get_current_user)):
    """Check payment status"""
    payment = await db.payments.find_one({"id": payment_id, "userId": user_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    return {
        "status": payment["status"],
        "courseId": payment["courseId"]
    }

# Admin endpoints
ADMIN_EMAIL = "jeanlusjeanmarysagehomme@gmail.com"
ADMIN_PASSWORD_HASH = hash_password("Bondye509@")

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class LessonUpload(BaseModel):
    courseId: str
    title: str
    videoUrl: str  # YouTube URL
    pdfUrl: Optional[str] = None  # PDF URL (Google Drive, Dropbox, etc)
    order: int
    duration: str = "15:00"

@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    """Admin login"""
    if credentials.email != ADMIN_EMAIL:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    if not verify_password(credentials.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Create admin token
    token = create_token("admin_user")
    return {
        "token": token,
        "email": ADMIN_EMAIL
    }

async def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify admin token"""
    token = credentials.credentials
    user_id = decode_token(token)
    if user_id != "admin_user":
        raise HTTPException(status_code=403, detail="Acesso negado")
    return user_id

@api_router.get("/admin/users")
async def get_all_users(admin: str = Depends(verify_admin)):
    """Get all registered users with password hash (admin only)"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.get("/admin/payments")
async def get_all_payments(admin: str = Depends(verify_admin)):
    """Get all payments (admin only)"""
    payments = await db.payments.find({}, {"_id": 0}).to_list(1000)
    
    # Enrich with user and course info
    enriched_payments = []
    for payment in payments:
        user = await db.users.find_one({"id": payment["userId"]}, {"_id": 0, "password_hash": 0})
        course = await get_course_by_id(payment["courseId"])
        
        enriched_payments.append({
            **payment,
            "user": user,
            "course": {
                "id": course["id"],
                "title": course["title"],
                "price": course["price"]
            } if course else None
        })
    
    return enriched_payments

@api_router.get("/admin/stats")
async def get_admin_stats(admin: str = Depends(verify_admin)):
    """Get dashboard statistics (admin only)"""
    total_users = await db.users.count_documents({})
    total_payments = await db.payments.count_documents({})
    approved_payments = await db.payments.count_documents({"status": "approved"})
    pending_payments = await db.payments.count_documents({"status": {"$in": ["pending", "in_process"]}})
    
    # Calculate total revenue
    payments = await db.payments.find({"status": "approved"}, {"_id": 0, "amount": 1}).to_list(1000)
    total_revenue = sum(p.get("amount", 0) for p in payments)
    
    return {
        "totalUsers": total_users,
        "totalPayments": total_payments,
        "approvedPayments": approved_payments,
        "pendingPayments": pending_payments,
        "totalRevenue": total_revenue
    }

@api_router.post("/admin/lessons/add")
async def add_lesson(lesson_data: LessonUpload, admin: str = Depends(verify_admin)):
    """Add a new lesson to a course"""
    lesson_id = str(uuid.uuid4())
    
    # Convert YouTube watch URL to embed URL if needed
    video_url = lesson_data.videoUrl
    if "youtube.com/watch?v=" in video_url:
        video_id = video_url.split("watch?v=")[1].split("&")[0]
        video_url = f"https://www.youtube.com/embed/{video_id}"
    elif "youtu.be/" in video_url:
        video_id = video_url.split("youtu.be/")[1].split("?")[0]
        video_url = f"https://www.youtube.com/embed/{video_id}"
    
    lesson_doc = {
        "id": lesson_id,
        "courseId": lesson_data.courseId,
        "title": lesson_data.title,
        "videoUrl": video_url,
        "pdfUrl": lesson_data.pdfUrl,
        "duration": lesson_data.duration,
        "order": lesson_data.order,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.lessons.insert_one(lesson_doc)
    return {"success": True, "lessonId": lesson_id, "message": "Aula adicionada com sucesso"}

@api_router.get("/admin/lessons/{course_id}")
async def get_course_lessons(course_id: str, admin: str = Depends(verify_admin)):
    """Get all custom lessons for a course"""
    lessons = await db.lessons.find({"courseId": course_id}, {"_id": 0}).sort("order", 1).to_list(1000)
    return lessons

@api_router.delete("/admin/lessons/{lesson_id}")
async def delete_lesson(lesson_id: str, admin: str = Depends(verify_admin)):
    """Delete a lesson"""
    result = await db.lessons.delete_one({"id": lesson_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Aula não encontrada")
    return {"success": True, "message": "Aula deletada com sucesso"}

@api_router.put("/admin/lessons/{lesson_id}")
async def update_lesson(lesson_id: str, lesson_data: LessonUpload, admin: str = Depends(verify_admin)):
    """Update a lesson"""
    # Convert YouTube URL
    video_url = lesson_data.videoUrl
    if "youtube.com/watch?v=" in video_url:
        video_id = video_url.split("watch?v=")[1].split("&")[0]
        video_url = f"https://www.youtube.com/embed/{video_id}"
    elif "youtu.be/" in video_url:
        video_id = video_url.split("youtu.be/")[1].split("?")[0]
        video_url = f"https://www.youtube.com/embed/{video_id}"
    
    update_data = {
        "title": lesson_data.title,
        "videoUrl": video_url,
        "pdfUrl": lesson_data.pdfUrl,
        "duration": lesson_data.duration,
        "order": lesson_data.order,
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.lessons.update_one({"id": lesson_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Aula não encontrada")
    return {"success": True, "message": "Aula atualizada com sucesso"}

# ==================== Admin Course Management ====================

class CourseCreate(BaseModel):
    title: str
    category: str
    description: str
    price: float
    thumbnail: Optional[str] = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"
    language: str = "pt"
    published: bool = True

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    thumbnail: Optional[str] = None
    language: Optional[str] = None
    published: Optional[bool] = None

@api_router.get("/admin/courses")
async def get_all_courses_admin(admin: str = Depends(verify_admin)):
    """Get all courses including unpublished (admin only)"""
    await seed_courses()
    courses = await db.courses.find({}, {"_id": 0}).to_list(1000)
    
    # Add lessons count for each course
    for course in courses:
        lessons_count = await db.lessons.count_documents({"courseId": course["id"]})
        course["lessonsCount"] = lessons_count
    
    return courses

@api_router.post("/admin/courses")
async def create_course(course_data: CourseCreate, admin: str = Depends(verify_admin)):
    """Create a new course (admin only)"""
    # Generate course ID from title
    course_id = course_data.title.lower().replace(" ", "-").replace("ç", "c").replace("ã", "a").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
    course_id = ''.join(c for c in course_id if c.isalnum() or c == '-')
    
    # Check if course ID already exists
    existing = await db.courses.find_one({"id": course_id})
    if existing:
        course_id = f"{course_id}-{str(uuid.uuid4())[:8]}"
    
    course_doc = {
        "id": course_id,
        "title": course_data.title,
        "category": course_data.category,
        "description": course_data.description,
        "price": course_data.price,
        "thumbnail": course_data.thumbnail,
        "language": course_data.language,
        "published": course_data.published,
        "lessons": [],
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.courses.insert_one(course_doc)
    return {"success": True, "courseId": course_id, "message": "Curso criado com sucesso"}

@api_router.put("/admin/courses/{course_id}")
async def update_course(course_id: str, course_data: CourseUpdate, admin: str = Depends(verify_admin)):
    """Update a course (admin only)"""
    # Build update dict only with provided fields
    update_data = {}
    if course_data.title is not None:
        update_data["title"] = course_data.title
    if course_data.category is not None:
        update_data["category"] = course_data.category
    if course_data.description is not None:
        update_data["description"] = course_data.description
    if course_data.price is not None:
        update_data["price"] = course_data.price
    if course_data.thumbnail is not None:
        update_data["thumbnail"] = course_data.thumbnail
    if course_data.language is not None:
        update_data["language"] = course_data.language
    if course_data.published is not None:
        update_data["published"] = course_data.published
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.courses.update_one({"id": course_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    
    return {"success": True, "message": "Curso atualizado com sucesso"}

@api_router.delete("/admin/courses/{course_id}")
async def delete_course(course_id: str, admin: str = Depends(verify_admin)):
    """Delete a course (admin only)"""
    # Delete course
    result = await db.courses.delete_one({"id": course_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    
    # Delete all lessons associated with the course
    await db.lessons.delete_many({"courseId": course_id})
    
    return {"success": True, "message": "Curso e aulas deletados com sucesso"}

@api_router.put("/admin/courses/{course_id}/publish")
async def toggle_course_publish(course_id: str, admin: str = Depends(verify_admin)):
    """Toggle course publish status (admin only)"""
    course = await get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    
    new_status = not course.get("published", True)
    await db.courses.update_one({"id": course_id}, {"$set": {"published": new_status}})
    
    status_text = "publicado" if new_status else "despublicado"
    return {"success": True, "published": new_status, "message": f"Curso {status_text} com sucesso"}

@api_router.put("/admin/courses/{course_id}/price")
async def update_course_price(course_id: str, price: float, admin: str = Depends(verify_admin)):
    """Update course price (admin only)"""
    result = await db.courses.update_one({"id": course_id}, {"$set": {"price": price}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    
    return {"success": True, "message": f"Preço atualizado para R$ {price:.2f}"}

# ==================== Admin User Management ====================

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, admin: str = Depends(verify_admin)):
    """Delete a user (admin only)"""
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Also delete user's payments
    await db.payments.delete_many({"userId": user_id})
    
    return {"success": True, "message": "Usuário deletado com sucesso"}

class GrantAccessRequest(BaseModel):
    userId: str
    courseId: str

@api_router.post("/admin/users/grant-access")
async def grant_free_access(data: GrantAccessRequest, admin: str = Depends(verify_admin)):
    """Grant free access to a course for a user (admin only)"""
    # Verify user exists
    user = await db.users.find_one({"id": data.userId})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verify course exists
    course = await get_course_by_id(data.courseId)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    
    # Check if user already has the course
    if data.courseId in user.get("purchasedCourses", []):
        raise HTTPException(status_code=400, detail="Usuário já possui acesso a este curso")
    
    # Grant access
    await db.users.update_one(
        {"id": data.userId},
        {"$addToSet": {"purchasedCourses": data.courseId}}
    )
    
    # Create a record of the free grant
    payment_doc = {
        "id": str(uuid.uuid4()),
        "userId": data.userId,
        "courseId": data.courseId,
        "mercadopagoId": "FREE_ACCESS",
        "status": "approved",
        "amount": 0.00,
        "note": "Acesso gratuito concedido pelo administrador",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment_doc)
    
    return {"success": True, "message": f"Acesso gratuito ao curso '{course['title']}' concedido com sucesso"}

@api_router.post("/admin/users/revoke-access")
async def revoke_course_access(data: GrantAccessRequest, admin: str = Depends(verify_admin)):
    """Revoke access to a course from a user (admin only)"""
    # Verify user exists
    user = await db.users.find_one({"id": data.userId})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Remove course from user's purchased courses
    await db.users.update_one(
        {"id": data.userId},
        {"$pull": {"purchasedCourses": data.courseId}}
    )
    
    return {"success": True, "message": "Acesso ao curso revogado com sucesso"}

# ==================== Coupon System ====================

class CouponCreate(BaseModel):
    code: str
    discountType: str  # 'percentage' or 'fixed'
    discountValue: float  # percentage (0-100) or fixed amount in BRL
    maxUses: Optional[int] = None  # None = unlimited
    expiresAt: Optional[str] = None  # ISO date string
    specificUserId: Optional[str] = None  # If set, only this user can use it
    specificCourseId: Optional[str] = None  # If set, only for this course
    minPurchaseAmount: Optional[float] = None
    active: bool = True

class CouponUpdate(BaseModel):
    discountType: Optional[str] = None
    discountValue: Optional[float] = None
    maxUses: Optional[int] = None
    expiresAt: Optional[str] = None
    specificUserId: Optional[str] = None
    specificCourseId: Optional[str] = None
    minPurchaseAmount: Optional[float] = None
    active: Optional[bool] = None

class ApplyCoupon(BaseModel):
    code: str
    courseId: str

@api_router.get("/admin/coupons")
async def get_all_coupons(admin: str = Depends(verify_admin)):
    """Get all coupons (admin only)"""
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(1000)
    return coupons

@api_router.post("/admin/coupons")
async def create_coupon(coupon_data: CouponCreate, admin: str = Depends(verify_admin)):
    """Create a new coupon (admin only)"""
    # Normalize code to uppercase
    code = coupon_data.code.upper().strip()
    
    # Check if code already exists
    existing = await db.coupons.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=400, detail="Código de cupom já existe")
    
    # Validate discount
    if coupon_data.discountType == 'percentage' and (coupon_data.discountValue < 0 or coupon_data.discountValue > 100):
        raise HTTPException(status_code=400, detail="Desconto percentual deve ser entre 0 e 100")
    
    if coupon_data.discountType == 'fixed' and coupon_data.discountValue < 0:
        raise HTTPException(status_code=400, detail="Desconto fixo deve ser positivo")
    
    coupon_id = str(uuid.uuid4())
    coupon_doc = {
        "id": coupon_id,
        "code": code,
        "discountType": coupon_data.discountType,
        "discountValue": coupon_data.discountValue,
        "maxUses": coupon_data.maxUses,
        "currentUses": 0,
        "expiresAt": coupon_data.expiresAt,
        "specificUserId": coupon_data.specificUserId,
        "specificCourseId": coupon_data.specificCourseId,
        "minPurchaseAmount": coupon_data.minPurchaseAmount,
        "active": coupon_data.active,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.coupons.insert_one(coupon_doc)
    return {"success": True, "couponId": coupon_id, "code": code, "message": "Cupom criado com sucesso"}

@api_router.put("/admin/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, coupon_data: CouponUpdate, admin: str = Depends(verify_admin)):
    """Update a coupon (admin only)"""
    update_data = {}
    
    if coupon_data.discountType is not None:
        update_data["discountType"] = coupon_data.discountType
    if coupon_data.discountValue is not None:
        update_data["discountValue"] = coupon_data.discountValue
    if coupon_data.maxUses is not None:
        update_data["maxUses"] = coupon_data.maxUses
    if coupon_data.expiresAt is not None:
        update_data["expiresAt"] = coupon_data.expiresAt
    if coupon_data.specificUserId is not None:
        update_data["specificUserId"] = coupon_data.specificUserId
    if coupon_data.specificCourseId is not None:
        update_data["specificCourseId"] = coupon_data.specificCourseId
    if coupon_data.minPurchaseAmount is not None:
        update_data["minPurchaseAmount"] = coupon_data.minPurchaseAmount
    if coupon_data.active is not None:
        update_data["active"] = coupon_data.active
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.coupons.update_one({"id": coupon_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cupom não encontrado")
    
    return {"success": True, "message": "Cupom atualizado com sucesso"}

@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, admin: str = Depends(verify_admin)):
    """Delete a coupon (admin only)"""
    result = await db.coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cupom não encontrado")
    
    return {"success": True, "message": "Cupom deletado com sucesso"}

@api_router.post("/coupons/validate")
async def validate_coupon(data: ApplyCoupon, user_id: str = Depends(get_current_user)):
    """Validate and calculate discount for a coupon"""
    code = data.code.upper().strip()
    
    # Find coupon
    coupon = await db.coupons.find_one({"code": code}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupom não encontrado")
    
    # Check if active
    if not coupon.get("active", True):
        raise HTTPException(status_code=400, detail="Este cupom está inativo")
    
    # Check expiration
    if coupon.get("expiresAt"):
        expires = datetime.fromisoformat(coupon["expiresAt"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="Este cupom expirou")
    
    # Check max uses
    if coupon.get("maxUses") is not None:
        if coupon.get("currentUses", 0) >= coupon["maxUses"]:
            raise HTTPException(status_code=400, detail="Este cupom atingiu o limite de usos")
    
    # Check specific user
    if coupon.get("specificUserId") and coupon["specificUserId"] != user_id:
        raise HTTPException(status_code=400, detail="Este cupom não está disponível para você")
    
    # Check specific course
    if coupon.get("specificCourseId") and coupon["specificCourseId"] != data.courseId:
        raise HTTPException(status_code=400, detail="Este cupom não é válido para este curso")
    
    # Get course price
    course = await get_course_by_id(data.courseId)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    
    original_price = course["price"]
    
    # Check minimum purchase amount
    if coupon.get("minPurchaseAmount") and original_price < coupon["minPurchaseAmount"]:
        raise HTTPException(status_code=400, detail=f"Valor mínimo de compra: R$ {coupon['minPurchaseAmount']:.2f}")
    
    # Calculate discount
    if coupon["discountType"] == "percentage":
        discount = original_price * (coupon["discountValue"] / 100)
    else:  # fixed
        discount = min(coupon["discountValue"], original_price)  # Discount can't exceed price
    
    final_price = max(0, original_price - discount)
    
    return {
        "valid": True,
        "code": code,
        "discountType": coupon["discountType"],
        "discountValue": coupon["discountValue"],
        "originalPrice": original_price,
        "discount": round(discount, 2),
        "finalPrice": round(final_price, 2),
        "message": f"Cupom aplicado! Desconto de R$ {discount:.2f}"
    }

# ==================== Questions/Doubts System ====================

class QuestionCreate(BaseModel):
    courseId: str
    question: str

class AnswerCreate(BaseModel):
    answer: str

@api_router.get("/courses/{course_id}/questions")
async def get_course_questions(course_id: str):
    """Get all questions for a course (visible to everyone)"""
    questions = await db.questions.find(
        {"courseId": course_id},
        {"_id": 0}
    ).sort("createdAt", -1).to_list(1000)
    
    # Enrich with user info
    for question in questions:
        user = await db.users.find_one({"id": question["userId"]}, {"_id": 0, "password_hash": 0})
        if user:
            question["userName"] = f"{user.get('firstName', '')} {user.get('lastName', '')}"
    
    return questions

@api_router.post("/courses/{course_id}/questions")
async def create_question(course_id: str, data: QuestionCreate, user_id: str = Depends(get_current_user)):
    """Create a new question for a course"""
    # Verify course exists
    course = await get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    
    # Verify user has purchased the course
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user or course_id not in user.get("purchasedCourses", []):
        raise HTTPException(status_code=403, detail="Você precisa ter comprado o curso para fazer perguntas")
    
    question_id = str(uuid.uuid4())
    question_doc = {
        "id": question_id,
        "courseId": course_id,
        "userId": user_id,
        "question": data.question,
        "answer": None,
        "answeredBy": None,
        "answeredAt": None,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.questions.insert_one(question_doc)
    
    return {"success": True, "questionId": question_id, "message": "Pergunta enviada com sucesso"}

@api_router.put("/admin/questions/{question_id}/answer")
async def answer_question(question_id: str, data: AnswerCreate, admin: str = Depends(verify_admin)):
    """Answer a question (admin only)"""
    result = await db.questions.update_one(
        {"id": question_id},
        {"$set": {
            "answer": data.answer,
            "answeredBy": "Admin",
            "answeredAt": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada")
    
    return {"success": True, "message": "Resposta enviada com sucesso"}

@api_router.delete("/admin/questions/{question_id}")
async def delete_question(question_id: str, admin: str = Depends(verify_admin)):
    """Delete a question (admin only)"""
    result = await db.questions.delete_one({"id": question_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada")
    
    return {"success": True, "message": "Pergunta deletada com sucesso"}

@api_router.get("/admin/questions")
async def get_all_questions(admin: str = Depends(verify_admin)):
    """Get all questions from all courses (admin only)"""
    questions = await db.questions.find({}, {"_id": 0}).sort("createdAt", -1).to_list(1000)
    
    # Enrich with user and course info
    for question in questions:
        user = await db.users.find_one({"id": question["userId"]}, {"_id": 0, "password_hash": 0})
        if user:
            question["userName"] = f"{user.get('firstName', '')} {user.get('lastName', '')}"
            question["userEmail"] = user.get("email", "")
        
        course = await get_course_by_id(question["courseId"])
        if course:
            question["courseTitle"] = course.get("title", "")
    
    return questions

class EmailQuestionRequest(BaseModel):
    questionId: str
    message: str

@api_router.post("/admin/questions/send-email")
async def send_question_email(data: EmailQuestionRequest, admin: str = Depends(verify_admin)):
    """Send an email response to a question (admin only) - placeholder for email integration"""
    question = await db.questions.find_one({"id": data.questionId}, {"_id": 0})
    if not question:
        raise HTTPException(status_code=404, detail="Pergunta não encontrada")
    
    user = await db.users.find_one({"id": question["userId"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Here you would integrate with an email service
    # For now, we just log and return success
    logger.info(f"Email would be sent to {user.get('email')} with message: {data.message}")
    
    return {
        "success": True, 
        "message": f"Email enviado para {user.get('email')}",
        "note": "Integração de email precisa ser configurada"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()