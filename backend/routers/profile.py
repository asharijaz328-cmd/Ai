from fastapi import APIRouter, HTTPException
from typing import List, Optional
from models import UserProfile, UpdateProfileRequest
from database import db

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])

@router.get("", response_model=List[UserProfile])
async def get_all_profiles():
    """
    Returns the list of available sister profiles.
    """
    return await db.list_profiles()

@router.get("/{user_id}", response_model=UserProfile)
async def get_profile(user_id: str):
    return await db.get_user_profile(user_id)

@router.put("/{user_id}", response_model=UserProfile)
async def update_profile(user_id: str, req: UpdateProfileRequest):
    profile = await db.get_user_profile(user_id)
    if req.name is not None:
        profile.name = req.name
    if req.nickname is not None:
        profile.nickname = req.nickname
    if req.password is not None and req.password.strip():
        profile.password = req.password.strip()
    if req.avatar_color is not None:
        profile.avatar_color = req.avatar_color
    if req.language_preference is not None:
        profile.language_preference = req.language_preference
    if req.bio is not None:
        profile.bio = req.bio
    return await db.save_user_profile(profile)
