from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

def generate_id() -> str:
    return str(uuid.uuid4())

class UserProfile(BaseModel):
    id: str = Field(default_factory=generate_id)
    email: Optional[str] = None
    password: Optional[str] = None  # Stored password for authentication
    name: str = "Api"
    nickname: Optional[str] = "Api"
    avatar_color: Optional[str] = "pink"  # "pink", "purple", "rose", "emerald", "amber", "cyan"
    language_preference: str = "Roman Urdu & English"
    bio: Optional[str] = "Beloved sister. Likes honest, warm, and practical advice."
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Message(BaseModel):
    id: str = Field(default_factory=generate_id)
    conversation_id: str
    user_id: Optional[str] = "api"
    sender: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None

class Conversation(BaseModel):
    id: str = Field(default_factory=generate_id)
    user_id: str = "api"
    title: str = "New chat"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_pinned: bool = False
    last_message_preview: Optional[str] = None

class Memory(BaseModel):
    id: str = Field(default_factory=generate_id)
    user_id: str = "api"
    category: str = "fact"  # "preference", "person", "hobby", "ongoing_situation", "decision", "fact"
    key: str  # e.g., "favorite_food", "friend_ayesha", "college_exam"
    content: str  # The actual remembered insight
    context: Optional[str] = None  # Extra context about when/why it was saved
    importance: int = 3  # 1 to 5
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Auth Request / Response Schemas
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    nickname: Optional[str] = None
    avatar_color: Optional[str] = "pink"

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    status: str
    user: UserProfile
    message: Optional[str] = None

# Request / Response Schemas
class ChatRequest(BaseModel):
    user_id: Optional[str] = "api"
    conversation_id: Optional[str] = None
    message: str
    provider: Optional[str] = None  # "gemini", "openai", "groq"
    model: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: str
    message: Message
    extracted_memories: List[Memory] = []

class CreateConversationRequest(BaseModel):
    user_id: Optional[str] = "api"
    title: Optional[str] = "New chat"

class UpdateConversationRequest(BaseModel):
    title: Optional[str] = None
    is_pinned: Optional[bool] = None

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    nickname: Optional[str] = None
    password: Optional[str] = None
    avatar_color: Optional[str] = None
    language_preference: Optional[str] = None
    bio: Optional[str] = None

class MemoryCreateRequest(BaseModel):
    user_id: Optional[str] = "api"
    category: str
    key: str
    content: str
    importance: Optional[int] = 3

# Tuning & Feedback Models
class TuningRule(BaseModel):
    id: str = Field(default_factory=generate_id)
    rule_text: str  # Instruction/Rule for Billa AI
    category: str = "behavior"  # "behavior", "tone", "topic", "boundary"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FeedbackItem(BaseModel):
    id: str = Field(default_factory=generate_id)
    message_id: str
    conversation_id: str
    rating: str  # "thumbs_up" or "thumbs_down"
    comment: Optional[str] = None
    suggested_reply: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CreateTuningRuleRequest(BaseModel):
    rule_text: str
    category: Optional[str] = "behavior"

class CreateFeedbackRequest(BaseModel):
    message_id: str
    conversation_id: str
    rating: str
    comment: Optional[str] = None
    suggested_reply: Optional[str] = None
