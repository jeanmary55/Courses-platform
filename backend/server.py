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
    
    # Create payment preference
    preference_data = {
        "items": [
            {
                "title": course['title'],
                "description": course['description'],
                "quantity": 1,
                "unit_price": float(course['price']),
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
        "notification_url": f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/webhooks/mercadopago",
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
            "amount": float(course['price']),
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        
        await db.payments.insert_one(payment_doc)
        
        return {
            "preferenceId": preference["id"],
            "initPoint": preference["init_point"]
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