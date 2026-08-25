from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models import Memory, MemoryCreateRequest
from database import db

router = APIRouter(prefix="/api/memories", tags=["Memories"])

@router.get("", response_model=List[Memory])
async def get_all_memories(user_id: Optional[str] = Query(None), category: Optional[str] = Query(None)):
    return await db.list_memories(user_id=user_id, category=category)

@router.post("", response_model=Memory)
async def create_manual_memory(req: MemoryCreateRequest):
    memory = Memory(
        user_id=req.user_id or "api",
        category=req.category,
        key=req.key,
        content=req.content,
        importance=req.importance or 3,
        context="Manually saved memory"
    )
    return await db.save_memory(memory)

@router.delete("/{memory_id}")
async def delete_memory(memory_id: str):
    await db.delete_memory(memory_id)
    return {"status": "success", "message": "Memory deleted"}
