from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models import Conversation, Message, CreateConversationRequest, UpdateConversationRequest
from database import db

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])

@router.get("", response_model=List[Conversation])
async def get_all_conversations(user_id: Optional[str] = Query(None)):
    return await db.list_conversations(user_id=user_id)

@router.post("", response_model=Conversation)
async def create_new_conversation(req: CreateConversationRequest):
    conv = Conversation(
        user_id=req.user_id or "api",
        title=req.title or "New chat"
    )
    return await db.save_conversation(conv)

@router.get("/{conv_id}")
async def get_conversation_details(conv_id: str):
    conv = await db.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = await db.list_messages(conv_id)
    return {
        "conversation": conv,
        "messages": messages
    }

@router.patch("/{conv_id}", response_model=Conversation)
async def update_conversation(conv_id: str, req: UpdateConversationRequest):
    conv = await db.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if req.title is not None:
        conv.title = req.title
    if req.is_pinned is not None:
        conv.is_pinned = req.is_pinned
    return await db.save_conversation(conv)

@router.delete("/{conv_id}")
async def delete_conversation(conv_id: str):
    await db.delete_conversation(conv_id)
    return {"status": "success", "message": "Conversation deleted"}
