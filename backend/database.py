import os
import json
import uuid
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
from config import settings
from models import UserProfile, Conversation, Message, Memory, TuningRule, FeedbackItem

# Try importing Motor for MongoDB
try:
    from motor.motor_asyncio import AsyncIOMotorClient
    import pymongo.errors
    MOTOR_AVAILABLE = True
except ImportError:
    MOTOR_AVAILABLE = False

class Database:
    def __init__(self):
        self.is_mongo = False
        self.mongo_client = None
        self.db = None
        self._default_profiles_checked = False
        self.local_data_dir = os.path.join(os.path.dirname(__file__), "data")
        self.local_storage_file = os.path.join(self.local_data_dir, "storage.json")
        self._local_cache: Dict[str, Any] = {
            "users": {},
            "conversations": {},
            "messages": [],
            "memories": [],
            "tuning_rules": {},
            "feedbacks": []
        }
        self._lock = asyncio.Lock()

    async def connect(self):
        os.makedirs(self.local_data_dir, exist_ok=True)
        self._load_local_storage()

        if MOTOR_AVAILABLE and settings.MONGODB_URI:
            try:
                client = AsyncIOMotorClient(
                    settings.MONGODB_URI,
                    serverSelectionTimeoutMS=4000,
                    maxPoolSize=50,
                    minPoolSize=5,
                    retryWrites=True
                )
                # Test connection
                await client.admin.command('ping')
                self.mongo_client = client
                self.db = client[settings.DB_NAME]
                self.is_mongo = True
                print("[OK] Connected to MongoDB successfully!")
                
                # Run background setup once
                await self._ensure_default_profiles()
                asyncio.create_task(self._ensure_indexes())
                return
            except Exception as e:
                print(f"[WARN] MongoDB connection failed ({e}). Falling back to local JSON persistence.")
        else:
            print("[INFO] Using local JSON persistence mode.")
        self.is_mongo = False
        await self._ensure_default_profiles()

    async def _ensure_indexes(self):
        """Create indexes in background to make lookups instant"""
        if self.is_mongo and self.db is not None:
            try:
                await self.db.users.create_index("email", unique=True, sparse=True)
                await self.db.users.create_index("id", unique=True)
                await self.db.conversations.create_index("user_id")
                await self.db.conversations.create_index("id", unique=True)
                await self.db.messages.create_index("conversation_id")
                await self.db.memories.create_index("user_id")
            except Exception as e:
                print(f"Index creation note: {e}")

    def _load_local_storage(self):
        if os.path.exists(self.local_storage_file):
            try:
                with open(self.local_storage_file, "r", encoding="utf-8") as f:
                    self._local_cache = json.load(f)
            except Exception as e:
                print(f"Error loading local storage: {e}")

    async def _save_local_storage(self):
        async with self._lock:
            try:
                with open(self.local_storage_file, "w", encoding="utf-8") as f:
                    json.dump(self._local_cache, f, default=str, indent=2, ensure_ascii=False)
            except Exception as e:
                print(f"Error saving local storage: {e}")

    # ================= USER PROFILES & AUTH =================
    async def list_profiles(self) -> List[UserProfile]:
        if self.is_mongo:
            cursor = self.db.users.find()
            profiles = []
            async for doc in cursor:
                doc.pop("_id", None)
                profiles.append(UserProfile(**doc))
            return profiles
        else:
            return [UserProfile(**u) for u in self._local_cache["users"].values()]

    async def _ensure_default_profiles(self):
        if self._default_profiles_checked:
            return
        self._default_profiles_checked = True

        if not self.is_mongo:
            if "api" not in self._local_cache.get("users", {}):
                self._local_cache["users"]["api"] = {
                    "id": "api",
                    "email": "api@billa.ai",
                    "password": "123",
                    "name": "Api",
                    "nickname": "Api",
                    "avatar_color": "pink",
                    "language_preference": "Roman Urdu & English",
                    "bio": "Beloved elder sister. Likes honest, warm, and practical advice.",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            if "majj" not in self._local_cache.get("users", {}):
                self._local_cache["users"]["majj"] = {
                    "id": "majj",
                    "email": "majj@billa.ai",
                    "password": "123",
                    "name": "Majj",
                    "nickname": "Majj",
                    "avatar_color": "purple",
                    "language_preference": "Roman Urdu & English",
                    "bio": "Beloved sister Majj. Likes witty, honest, warm, and practical advice.",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            await self._save_local_storage()
        else:
            api_prof = await self.db.users.find_one({"id": "api"})
            if not api_prof:
                await self.db.users.insert_one({
                    "id": "api",
                    "email": "api@billa.ai",
                    "password": "123",
                    "name": "Api",
                    "nickname": "Api",
                    "avatar_color": "pink",
                    "language_preference": "Roman Urdu & English",
                    "bio": "Beloved elder sister. Likes honest, warm, and practical advice.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                })
            majj_prof = await self.db.users.find_one({"id": "majj"})
            if not majj_prof:
                await self.db.users.insert_one({
                    "id": "majj",
                    "email": "majj@billa.ai",
                    "password": "123",
                    "name": "Majj",
                    "nickname": "Majj",
                    "avatar_color": "purple",
                    "language_preference": "Roman Urdu & English",
                    "bio": "Beloved sister Majj. Likes witty, honest, warm, and practical advice.",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                })

    async def get_user_by_email(self, email: str) -> Optional[UserProfile]:
        clean_email = email.strip().lower()
        if self.is_mongo:
            doc = await self.db.users.find_one({"email": clean_email})
            if doc:
                doc.pop("_id", None)
                return UserProfile(**doc)
            return None
        else:
            for u in self._local_cache.get("users", {}).values():
                if u.get("email", "").lower() == clean_email:
                    return UserProfile(**u)
            return None

    async def register_user(self, name: str, nickname: Optional[str], email: str, password: str, avatar_color: Optional[str] = "pink") -> UserProfile:
        clean_email = email.strip().lower()
        existing = await self.get_user_by_email(clean_email)
        if existing:
            raise ValueError("Is email se pehle hi account bana hua hai! Please login karein.")
        
        user_id = f"user_{uuid.uuid4().hex[:8]}"
        new_profile = UserProfile(
            id=user_id,
            email=clean_email,
            password=password.strip(),
            name=name.strip(),
            nickname=nickname.strip() if nickname else name.strip(),
            avatar_color=avatar_color or "pink",
            language_preference="Roman Urdu & English",
            bio="Likes honest, caring, and practical advice."
        )
        return await self.save_user_profile(new_profile)

    async def authenticate_user(self, email: str, password: str) -> Optional[UserProfile]:
        clean_email = email.strip().lower()
        user = await self.get_user_by_email(clean_email)
        if not user:
            return None
        if user.password == password.strip():
            return user
        return None

    async def get_user_profile(self, user_id: str = "api") -> UserProfile:
        if self.is_mongo:
            doc = await self.db.users.find_one({"id": user_id})
            if doc:
                doc.pop("_id", None)
                return UserProfile(**doc)
        else:
            doc = self._local_cache["users"].get(user_id)
            if doc:
                return UserProfile(**doc)
        
        # Fallback profile
        default_profile = UserProfile(id=user_id, name="Api" if user_id == "api" else user_id.capitalize())
        await self.save_user_profile(default_profile)
        return default_profile

    async def save_user_profile(self, profile: UserProfile) -> UserProfile:
        data = profile.dict()
        data["updated_at"] = datetime.utcnow()
        if self.is_mongo:
            await self.db.users.update_one(
                {"id": profile.id},
                {"$set": data},
                upsert=True
            )
        else:
            if "users" not in self._local_cache:
                self._local_cache["users"] = {}
            self._local_cache["users"][profile.id] = data
            await self._save_local_storage()
        return profile

    # ================= CONVERSATIONS =================
    async def list_conversations(self, user_id: Optional[str] = None) -> List[Conversation]:
        if self.is_mongo:
            query = {"user_id": user_id} if user_id else {}
            cursor = self.db.conversations.find(query).sort("updated_at", -1)
            convs = []
            async for doc in cursor:
                doc.pop("_id", None)
                convs.append(Conversation(**doc))
            return convs
        else:
            convs = [Conversation(**c) for c in self._local_cache["conversations"].values()]
            if user_id:
                convs = [c for c in convs if getattr(c, 'user_id', 'api') == user_id]
            convs.sort(key=lambda x: x.updated_at, reverse=True)
            return convs

    async def get_conversation(self, conv_id: str) -> Optional[Conversation]:
        if self.is_mongo:
            doc = await self.db.conversations.find_one({"id": conv_id})
            if doc:
                doc.pop("_id", None)
                return Conversation(**doc)
            return None
        else:
            doc = self._local_cache["conversations"].get(conv_id)
            if doc:
                return Conversation(**doc)
            return None

    async def save_conversation(self, conv: Conversation) -> Conversation:
        data = conv.dict()
        if self.is_mongo:
            await self.db.conversations.update_one(
                {"id": conv.id},
                {"$set": data},
                upsert=True
            )
        else:
            self._local_cache["conversations"][conv.id] = data
            await self._save_local_storage()
        return conv

    async def delete_conversation(self, conv_id: str):
        if self.is_mongo:
            await self.db.conversations.delete_one({"id": conv_id})
            await self.db.messages.delete_many({"conversation_id": conv_id})
        else:
            self._local_cache["conversations"].pop(conv_id, None)
            self._local_cache["messages"] = [
                m for m in self._local_cache["messages"] 
                if m.get("conversation_id") != conv_id
            ]
            await self._save_local_storage()

    # ================= MESSAGES =================
    async def list_messages(self, conv_id: str) -> List[Message]:
        if self.is_mongo:
            cursor = self.db.messages.find({"conversation_id": conv_id}).sort("timestamp", 1)
            messages = []
            async for doc in cursor:
                doc.pop("_id", None)
                messages.append(Message(**doc))
            return messages
        else:
            messages = [
                Message(**m) for m in self._local_cache["messages"]
                if m.get("conversation_id") == conv_id
            ]
            messages.sort(key=lambda x: x.timestamp)
            return messages

    async def save_message(self, message: Message) -> Message:
        data = message.dict()
        if self.is_mongo:
            await self.db.messages.insert_one(data)
            await self.db.conversations.update_one(
                {"id": message.conversation_id},
                {"$set": {
                    "updated_at": message.timestamp,
                    "last_message_preview": message.content[:80]
                }}
            )
        else:
            self._local_cache["messages"].append(data)
            if message.conversation_id in self._local_cache["conversations"]:
                self._local_cache["conversations"][message.conversation_id]["updated_at"] = message.timestamp.isoformat()
                self._local_cache["conversations"][message.conversation_id]["last_message_preview"] = message.content[:80]
            await self._save_local_storage()
        return message

    # ================= MEMORIES =================
    async def list_memories(self, user_id: Optional[str] = None, category: Optional[str] = None) -> List[Memory]:
        if self.is_mongo:
            query = {}
            if user_id:
                query["user_id"] = user_id
            if category and category != "all":
                query["category"] = category
            cursor = self.db.memories.find(query).sort("importance", -1)
            memories = []
            async for doc in cursor:
                doc.pop("_id", None)
                memories.append(Memory(**doc))
            return memories
        else:
            memories = [Memory(**m) for m in self._local_cache["memories"]]
            if user_id:
                memories = [m for m in memories if getattr(m, 'user_id', 'api') == user_id]
            if category and category != "all":
                memories = [m for m in memories if m.category == category]
            memories.sort(key=lambda x: x.importance, reverse=True)
            return memories

    async def save_memory(self, memory: Memory) -> Memory:
        data = memory.dict()
        if self.is_mongo:
            await self.db.memories.update_one(
                {"id": memory.id},
                {"$set": data},
                upsert=True
            )
        else:
            # Check if exists to update
            for i, m in enumerate(self._local_cache["memories"]):
                if m.get("id") == memory.id:
                    self._local_cache["memories"][i] = data
                    await self._save_local_storage()
                    return memory
            self._local_cache["memories"].append(data)
            await self._save_local_storage()
        return memory

    async def delete_memory(self, memory_id: str):
        if self.is_mongo:
            await self.db.memories.delete_one({"id": memory_id})
        else:
            self._local_cache["memories"] = [
                m for m in self._local_cache["memories"]
                if m.get("id") != memory_id
            ]
            await self._save_local_storage()

    # ================= DEVELOPER TUNING RULES =================
    async def list_tuning_rules(self, active_only: bool = False) -> List[TuningRule]:
        if self.is_mongo:
            query = {"is_active": True} if active_only else {}
            cursor = self.db.tuning_rules.find(query).sort("created_at", -1)
            rules = []
            async for doc in cursor:
                doc.pop("_id", None)
                rules.append(TuningRule(**doc))
            return rules
        else:
            rules = [TuningRule(**r) for r in self._local_cache["tuning_rules"].values()]
            if active_only:
                rules = [r for r in rules if r.is_active]
            rules.sort(key=lambda x: x.created_at, reverse=True)
            return rules

    async def save_tuning_rule(self, rule: TuningRule) -> TuningRule:
        data = rule.dict()
        if self.is_mongo:
            await self.db.tuning_rules.update_one(
                {"id": rule.id},
                {"$set": data},
                upsert=True
            )
        else:
            self._local_cache["tuning_rules"][rule.id] = data
            await self._save_local_storage()
        return rule

    async def delete_tuning_rule(self, rule_id: str):
        if self.is_mongo:
            await self.db.tuning_rules.delete_one({"id": rule_id})
        else:
            self._local_cache["tuning_rules"].pop(rule_id, None)
            await self._save_local_storage()

    # ================= FEEDBACK ITEMS =================
    async def list_feedbacks(self) -> List[FeedbackItem]:
        if self.is_mongo:
            cursor = self.db.feedbacks.find().sort("created_at", -1)
            feedbacks = []
            async for doc in cursor:
                doc.pop("_id", None)
                feedbacks.append(FeedbackItem(**doc))
            return feedbacks
        else:
            feedbacks = [FeedbackItem(**f) for f in self._local_cache["feedbacks"]]
            feedbacks.sort(key=lambda x: x.created_at, reverse=True)
            return feedbacks

    async def save_feedback(self, feedback: FeedbackItem) -> FeedbackItem:
        data = feedback.dict()
        if self.is_mongo:
            await self.db.feedbacks.insert_one(data)
        else:
            self._local_cache["feedbacks"].append(data)
            await self._save_local_storage()
        return feedback

    async def delete_feedback(self, feedback_id: str):
        if self.is_mongo:
            await self.db.feedbacks.delete_one({"id": feedback_id})
        else:
            self._local_cache["feedbacks"] = [
                f for f in self._local_cache["feedbacks"]
                if f.get("id") != feedback_id
            ]
            await self._save_local_storage()

# Global Singleton Database Instance
db = Database()
