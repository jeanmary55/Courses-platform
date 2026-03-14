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

COURSES_DATA = [
    {
        "id": "python-basics",
        "title": "Python para Iniciantes",
        "category": "Tecnologia",
        "description": "Aprenda Python do zero ao avançado com 20 aulas práticas",
        "price": 197.00,
        "thumbnail": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800",
        "language": "pt",
        "lessons": [
            {"id": f"py-lesson-{i}", "title": f"Aula {i}: Fundamentos Python", "videoUrl": "https://www.youtube.com/embed/rfscVS0vtbw", "duration": "15:00", "order": i}
            for i in range(1, 21)
        ]
    },
    {
        "id": "excel-mastery",
        "title": "Excel Completo",
        "category": "Tecnologia",
        "description": "Domine Excel com fórmulas, tabelas dinâmicas e muito mais",
        "price": 147.00,
        "thumbnail": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
        "language": "pt",
        "lessons": [
            {"id": f"excel-lesson-{i}", "title": f"Aula {i}: Excel Avançado", "videoUrl": "https://www.youtube.com/embed/RwtRCQ_wbLo", "duration": "18:00", "order": i}
            for i in range(1, 21)
        ]
    },
    {
        "id": "sql-database",
        "title": "SQL e Bancos de Dados",
        "category": "Tecnologia",
        "description": "Aprenda SQL para gerenciar bancos de dados relacionais",
        "price": 197.00,
        "thumbnail": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800",
        "language": "pt",
        "lessons": [
            {"id": f"sql-lesson-{i}", "title": f"Aula {i}: SQL na Prática", "videoUrl": "https://www.youtube.com/embed/HXV3zeQKqGY", "duration": "20:00", "order": i}
            for i in range(1, 21)
        ]
    },
    {
        "id": "word-professional",
        "title": "Word Profissional",
        "category": "Tecnologia",
        "description": "Crie documentos profissionais com Microsoft Word",
        "price": 97.00,
        "thumbnail": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800",
        "language": "pt",
        "lessons": [
            {"id": f"word-lesson-{i}", "title": f"Aula {i}: Word Essencial", "videoUrl": "https://www.youtube.com/embed/Z3UeWfvB7Ng", "duration": "12:00", "order": i}
            for i in range(1, 21)
        ]
    },
    {
        "id": "html-css",
        "title": "HTML & CSS",
        "category": "Tecnologia",
        "description": "Crie sites incríveis com HTML5 e CSS3",
        "price": 197.00,
        "thumbnail": "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800",
        "language": "pt",
        "lessons": [
            {"id": f"html-lesson-{i}", "title": f"Aula {i}: Web Development", "videoUrl": "https://www.youtube.com/embed/UB1O30fR-EE", "duration": "25:00", "order": i}
            for i in range(1, 21)
        ]
    },
    {
        "id": "javascript-modern",
        "title": "JavaScript Moderno",
        "category": "Tecnologia",
        "description": "Programação web com JavaScript ES6+",
        "price": 247.00,
        "thumbnail": "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800",
        "language": "pt",
        "lessons": [
            {"id": f"js-lesson-{i}", "title": f"Aula {i}: JavaScript Prático", "videoUrl": "https://www.youtube.com/embed/PkZNo7MFNFg", "duration": "22:00", "order": i}
            for i in range(1, 21)
        ]
    },
    {
        "id": "french-course",
        "title": "Francês Completo",
        "category": "Idiomas",
        "description": "Aprenda francês do básico ao avançado",
        "price": 297.00,
        "thumbnail": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
        "language": "pt",
        "lessons": [
            {"id": f"fr-lesson-{i}", "title": f"Aula {i}: Francês para Brasileiros", "videoUrl": "https://www.youtube.com/embed/VmWt3dtvrwE", "duration": "20:00", "order": i}
            for i in range(1, 21)
        ]
    },
    {
        "id": "portuguese-course",
        "title": "Português Avançado",
        "category": "Idiomas",
        "description": "Gramática e redação em português",
        "price": 197.00,
        "thumbnail": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
        "language": "pt",
        "lessons": [
            {"id": f"pt-lesson-{i}", "title": f"Aula {i}: Português Profissional", "videoUrl": "https://www.youtube.com/embed/LbTxfN8d2CI", "duration": "18:00", "order": i}
            for i in range(1, 21)
        ]
    },
    {
        "id": "english-course",
        "title": "Inglês do Zero",
        "category": "Idiomas",
        "description": "Inglês para brasileiros - do básico ao fluente",
        "price": 297.00,
        "thumbnail": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
        "language": "pt",
        "lessons": [
            {"id": f"en-lesson-{i}", "title": f"Aula {i}: English Made Easy", "videoUrl": "https://www.youtube.com/embed/S_OOI6p6ZFQ", "duration": "20:00", "order": i}
            for i in range(1, 21)
        ]
    },
    {
        "id": "spanish-course",
        "title": "Espanhol Rápido",
        "category": "Idiomas",
        "description": "Aprenda espanhol de forma rápida e prática",
        "price": 247.00,
        "thumbnail": "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800",
        "language": "pt",
        "lessons": [
            {"id": f"es-lesson-{i}", "title": f"Aula {i}: Español Fácil", "videoUrl": "https://www.youtube.com/embed/oI2GEuGZFWk", "duration": "17:00", "order": i}
            for i in range(1, 21)
        ]
    }
]

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
@api_router.get("/courses", response_model=List[Course])
async def get_courses(category: Optional[str] = None):
    if category:
        return [Course(**course) for course in COURSES_DATA if course['category'] == category]
    return [Course(**course) for course in COURSES_DATA]

@api_router.get("/courses/{course_id}", response_model=Course)
async def get_course(course_id: str):
    course = next((c for c in COURSES_DATA if c['id'] == course_id), None)
    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    return Course(**course)

# Payment endpoints
@api_router.post("/payments/create-preference")
async def create_payment_preference(payment_data: PaymentCreate, user_id: str = Depends(get_current_user)):
    """Create Mercado Pago payment preference with PIX"""
    # Verify course exists
    course = next((c for c in COURSES_DATA if c['id'] == payment_data.courseId), None)
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
            "excluded_payment_types": [
                {"id": "credit_card"},
                {"id": "debit_card"},
                {"id": "ticket"}
            ],
            "installments": 1
        },
        "back_urls": {
            "success": f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/payment-success",
            "failure": f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/payment-failure",
            "pending": f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/payment-pending"
        },
        "auto_return": "approved",
        "external_reference": f"{user_id}_{payment_data.courseId}_{str(uuid.uuid4())[:8]}",
        "notification_url": f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')}/api/webhooks/mercadopago"
    }
    
    try:
        preference_response = sdk.preference().create(preference_data)
        preference = preference_response["response"]
        
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
            "initPoint": preference["init_point"],
            "sandboxInitPoint": preference.get("sandbox_init_point"),
            "qrCode": preference.get("qr_code"),
            "qrCodeBase64": preference.get("qr_code_base64")
        }
        
    except Exception as e:
        logger.error(f"Error creating Mercado Pago preference: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar pagamento: {str(e)}")

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
    my_courses = [Course(**c) for c in COURSES_DATA if c['id'] in purchased_course_ids]
    return my_courses

@api_router.get("/mercadopago/public-key")
async def get_mercadopago_public_key():
    """Return Mercado Pago public key for frontend"""
    return {"publicKey": MERCADOPAGO_PUBLIC_KEY}

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

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()