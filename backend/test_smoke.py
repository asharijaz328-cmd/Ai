import asyncio
import sys
import os

# Set UTF-8 encoding for standard output on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(__file__))

from models import UserProfile, Memory, Message, Conversation
from services.personality import build_system_prompt
from database import db

async def run_tests():
    print("========================================")
    print("[TEST] Running Billa AI Backend Tests...")
    print("========================================")

    # 1. Test Database Init & Local Fallback
    await db.connect()
    print("[PASS] Database layer initialized.")

    # 2. Test User Profile
    profile = await db.get_user_profile()
    assert profile.name is not None
    print(f"[PASS] User Profile loaded: {profile.name} ({profile.nickname})")

    # 3. Test Memory Creation & Retrieval
    test_memory = Memory(
        category="preference",
        key="favorite_drink",
        content="Loves chai and mango shake with less sugar.",
        importance=5
    )
    await db.save_memory(test_memory)
    memories = await db.list_memories()
    assert len(memories) >= 1
    print(f"[PASS] Stored {len(memories)} long-term memory records successfully.")

    # 4. Test Personality & Prompt Engine
    prompt = build_system_prompt(profile, memories)
    assert "Billa ai" in prompt
    assert "CRITICAL PERSONALITY RULE: DO NOT BE A \"YES-MAN\"" in prompt
    assert "Loves chai" in prompt
    print("[PASS] Billa AI Dynamic System Prompt successfully generated with Non-Yes-Man rules & memory context.")

    # 5. Test Conversation CRUD
    conv = Conversation(title="Test Baat Cheet")
    await db.save_conversation(conv)
    msg = Message(
        conversation_id=conv.id,
        sender="user",
        content="Yaar main interview mein jhoth bol doon?"
    )
    await db.save_message(msg)
    history = await db.list_messages(conv.id)
    assert len(history) == 1
    print(f"[PASS] Conversation and message persistence verified ({len(history)} messages).")

    # Clean up test conversation
    await db.delete_conversation(conv.id)
    print("[PASS] Test conversation cleanup complete.")

    print("========================================")
    print("[SUCCESS] ALL SMOKE TESTS PASSED!")
    print("========================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
