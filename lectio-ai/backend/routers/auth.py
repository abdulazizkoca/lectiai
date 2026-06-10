from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserRole
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, field_validator
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
import os
import hashlib
import re
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("lectio.auth")
router = APIRouter()

# JWT sozlamalari
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 soat

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ═══ Bcrypt parol hashlash ═══
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def _verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Yangi bcrypt format
        if hashed_password.startswith(("$2b$", "$2a$", "$2y$")):
            return _pwd_context.verify(plain_password, hashed_password)
        # Eski SHA-256+salt format (migration uchun)
        parts = hashed_password.split("$", 1)
        if len(parts) == 2:
            salt, stored_hash = parts
            new_hash = hashlib.sha256((salt + plain_password).encode()).hexdigest()
            return new_hash == stored_hash
        return False
    except Exception:
        return False


# Pydantic modellari
class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "student"

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', v):
            raise ValueError("Noto'g'ri email format")
        if len(v) > 254:
            raise ValueError("Email juda uzun")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Parol kamida 6 belgidan iborat bo'lishi kerak")
        if len(v) > 128:
            raise ValueError("Parol juda uzun")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Ism kamida 2 belgidan iborat bo'lishi kerak")
        if len(v) > 100:
            raise ValueError("Ism juda uzun")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("student", "professor", "admin"):
            raise ValueError("Noto'g'ri rol: student, professor yoki admin bo'lishi kerak")
        return v

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# Yordamchi funksiyalar
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """JWT token orqali joriy foydalanuvchini olish"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token noto'g'ri yoki muddati tugagan",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Foydalanuvchi akkaunti faol emas"
        )
    return user


# Endpointlar
@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Yangi foydalanuvchi ro'yxatdan o'tishi"""
    # Email tekshirish
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Bu email allaqachon ro'yxatdan o'tgan"
        )

    # Foydalanuvchi yaratish
    try:
        user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=_hash_password(user_data.password),
            role=UserRole(user_data.role)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"New user registered: {user.email} role={user.role.value}")
    except Exception as e:
        db.rollback()
        logger.exception(f"User registration failed for {user_data.email}")
        raise HTTPException(
            status_code=500,
            detail="Foydalanuvchi yaratishda xatolik yuz berdi"
        )

    # Token yaratish
    access_token = create_access_token(data={"sub": user.email})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at
        )
    )


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Kirish — email va parol"""
    user = db.query(User).filter(User.email == form_data.username.strip().lower()).first()
    if not user or not _verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Failed login attempt for: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email yoki parol noto'g'ri",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Eski SHA-256 hash → bcrypt ga ko'chirish (bir martalik migration)
    if not user.hashed_password.startswith(("$2b$", "$2a$", "$2y$")):
        try:
            user.hashed_password = _hash_password(form_data.password)
            db.commit()
        except Exception:
            db.rollback()

    logger.info(f"Successful login: user_id={user.id}")
    access_token = create_access_token(data={"sub": user.email})

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Joriy foydalanuvchi ma'lumotlari"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )
