import json
import re
from typing import List, Optional
from models import Memory, UserProfile
from database import db
from services.llm_service import llm_service

EXTRACTION_SYSTEM_PROMPT = """You are a smart, selective memory extraction engine for a personal AI companion.
Your job is to analyze the conversation between the user (sister) and the AI, and extract ONLY truly important, long-term personal facts.

==================================================
CATEGORIES TO EXTRACT:
==================================================
1. "preference": Food, clothes, music, favorite items, things she loves or dislikes.
2. "person": Family members, friends (e.g. Ayesha, Sarah), teachers, colleagues and her relationship with them.
3. "hobby": Activities she enjoys (painting, coding, cooking, gaming, reading).
4. "ongoing_situation": Current challenges, upcoming exams, job interviews, ongoing health issues, emotional situations.
5. "decision": Goals she set, habits she wants to change, important advice she accepted.
6. "fact": Age, education, location, work, daily routine details.

==================================================
CRITICAL FILTERING RULES:
==================================================
- DO NOT extract casual chatter, greetings ("Hi", "Hello"), temporary jokes, or generic questions.
- DO NOT save raw conversation transcripts. Extract structured, concise insights.
- If there is NOTHING new or meaningful to remember, return an empty array: []
- ALWAYS output strict valid JSON format matching this schema:
[
  {
    "category": "preference" | "person" | "hobby" | "ongoing_situation" | "decision" | "fact",
    "key": "short_unique_key_in_english",
    "content": "Clear summary in Roman Urdu or English",
    "importance": 1 to 5
  }
]
"""

class MemoryService:
    async def get_relevant_memories(self, query: Optional[str] = None, user_id: str = "api", limit: int = 15) -> List[Memory]:
        """
        Retrieves active long-term memories for a specific sister (user_id) from the database.
        """
        memories = await db.list_memories(user_id=user_id)
        if not query:
            return memories[:limit]

        # Simple semantic-like keyword filtering
        query_words = set(re.findall(r'\w+', query.lower()))
        scored_memories = []

        for m in memories:
            score = m.importance
            m_text = f"{m.key} {m.content} {m.category}".lower()
            matches = sum(1 for w in query_words if len(w) > 3 and w in m_text)
            score += matches * 2
            scored_memories.append((score, m))

        scored_memories.sort(key=lambda x: x[0], reverse=True)
        return [m for score, m in scored_memories[:limit]]

    async def extract_and_save_memories(self, user_message: str, assistant_response: str, user_id: str = "api") -> List[Memory]:
        """
        Analyzes a conversation turn and extracts meaningful memories strictly for user_id.
        """
        # Skip very short messages to save compute and avoid noise
        if len(user_message.strip()) < 10:
            return []

        prompt_messages = [
            {
                "role": "user",
                "content": f"User said: \"{user_message}\"\nAI replied: \"{assistant_response}\"\n\nExtract any new long-term facts about the user into JSON according to your instructions."
            }
        ]

        try:
            raw_result = await llm_service.generate_response(
                messages=prompt_messages,
                system_prompt=EXTRACTION_SYSTEM_PROMPT,
                temperature=0.2
            )

            # Clean JSON markdown blocks if present
            cleaned = raw_result.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```json\s*|^```\s*|```$", "", cleaned, flags=re.MULTILINE).strip()

            items = json.loads(cleaned)
            saved_memories = []

            if isinstance(items, list):
                for item in items:
                    if "category" in item and "key" in item and "content" in item:
                        memory = Memory(
                            user_id=user_id,
                            category=item.get("category", "fact"),
                            key=item.get("key", "fact"),
                            content=item.get("content", ""),
                            importance=min(max(int(item.get("importance", 3)), 1), 5),
                            context=f"Extracted from: '{user_message[:60]}...'"
                        )
                        saved = await db.save_memory(memory)
                        saved_memories.append(saved)

            return saved_memories
        except Exception as e:
            # Memory extraction is non-blocking and safe
            print(f"Memory extraction skipped/failed: {e}")
            return []

memory_service = MemoryService()
