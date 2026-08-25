from fastapi import APIRouter, HTTPException
from typing import List, Optional
from models import UserProfile, RegisterRequest, LoginRequest, AuthResponse
from database import db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    if not req.email.strip() or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Durust email address likhein.")
    if not req.password.strip() or len(req.password.strip()) < 3:
        raise HTTPException(status_code=400, detail="Password kam az kam 3 characters ka hona chahiye.")
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Apna name zaroor likhein.")

    try:
        user = await db.register_user(
            name=req.name,
            nickname=req.nickname,
            email=req.email,
            password=req.password,
            avatar_color=req.avatar_color
        )
        return AuthResponse(
            status="success",
            user=user,
            message="Account kamyabi se ban gaya hai!"
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    if not req.email.strip() or not req.password.strip():
        raise HTTPException(status_code=400, detail="Email aur password dono zaroori hain.")

    user = await db.authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email ya password galat hai! Dobara check karein.")

    return AuthResponse(
        status="success",
        user=user,
        message="Login kamyab!"
    )

@router.get("/users", response_model=List[UserProfile])
async def list_all_users():
    """
    Returns list of all users for developer inspection.
    """
    return await db.list_profiles()

@router.get("/me/{user_id}", response_model=UserProfile)
async def get_user_info(user_id: str):
    user = await db.get_user_profile(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User nahi mila.")
    return user
