import json
import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from models import ChatRequest, ChatResponse, Message, Conversation
from database import db
from services.personality import build_system_prompt
from services.llm_service import llm_service
from services.memory_service import memory_service

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("", response_model=ChatResponse)
async def send_chat_message(req: ChatRequest, background_tasks: BackgroundTasks):
    """
    Standard JSON endpoint for sending a message and getting a full response.
    """
    # 1. Resolve or create conversation
    active_user_id = req.user_id or "api"
    conv_id = req.conversation_id
    if not conv_id:
        conv = Conversation(
            user_id=active_user_id,
            title=req.message[:30] + "..." if len(req.message) > 30 else req.message
        )
        await db.save_conversation(conv)
        conv_id = conv.id
    else:
        conv = await db.get_conversation(conv_id)
        if not conv:
            conv = Conversation(id=conv_id, user_id=active_user_id, title="New chat")
            await db.save_conversation(conv)
        else:
            active_user_id = getattr(conv, 'user_id', active_user_id)

    # 2. Save user message
    user_msg = Message(
        conversation_id=conv_id,
        user_id=active_user_id,
        sender="user",
        content=req.message
    )
    await db.save_message(user_msg)

    # 3. Load profile, relevant memories, & active developer tuning rules
    profile = await db.get_user_profile(active_user_id)
    memories = await memory_service.get_relevant_memories(query=req.message, user_id=active_user_id)
    tuning_rules = await db.list_tuning_rules(active_only=True)
    system_prompt = build_system_prompt(profile, memories, tuning_rules)

    # 4. Load past messages for context (last 12 messages)
    past_messages = await db.list_messages(conv_id)
    llm_history = []
    for m in past_messages[-12:]:
        llm_history.append({
            "role": "user" if m.sender == "user" else "assistant",
            "content": m.content
        })

    # 5. Generate AI response
    response_text = await llm_service.generate_response(
        messages=llm_history,
        system_prompt=system_prompt,
        provider=req.provider,
        model=req.model
    )

    # 6. Save assistant message
    ai_msg = Message(
        conversation_id=conv_id,
        user_id=active_user_id,
        sender="assistant",
        content=response_text
    )
    await db.save_message(ai_msg)

    # 7. Asynchronously extract memory in background
    background_tasks.add_task(
        memory_service.extract_and_save_memories,
        req.message,
        response_text,
        active_user_id
    )

    return ChatResponse(
        conversation_id=conv_id,
        message=ai_msg,
        extracted_memories=[]
    )

@router.post("/stream")
async def stream_chat_message(req: ChatRequest, background_tasks: BackgroundTasks):
    """
    Real-time Server-Sent Events (SSE) streaming endpoint.
    """
    active_user_id = req.user_id or "api"
    conv_id = req.conversation_id
    if not conv_id:
        conv = Conversation(
            user_id=active_user_id,
            title=req.message[:30] + "..." if len(req.message) > 30 else req.message
        )
        await db.save_conversation(conv)
        conv_id = conv.id
    else:
        conv = await db.get_conversation(conv_id)
        if not conv:
            conv = Conversation(id=conv_id, user_id=active_user_id, title="New chat")
            await db.save_conversation(conv)
        else:
            active_user_id = getattr(conv, 'user_id', active_user_id)

    # Save user message
    user_msg = Message(
        conversation_id=conv_id,
        user_id=active_user_id,
        sender="user",
        content=req.message
    )
    await db.save_message(user_msg)

    profile = await db.get_user_profile(active_user_id)
    memories = await memory_service.get_relevant_memories(query=req.message, user_id=active_user_id)
    tuning_rules = await db.list_tuning_rules(active_only=True)
    system_prompt = build_system_prompt(profile, memories, tuning_rules)

    past_messages = await db.list_messages(conv_id)
    llm_history = []
    for m in past_messages[-12:]:
        llm_history.append({
            "role": "user" if m.sender == "user" else "assistant",
            "content": m.content
        })

    async def event_generator():
        # First send conversation_id metadata
        yield f"data: {json.dumps({'type': 'init', 'conversation_id': conv_id})}\n\n"
        
        full_text = ""
        try:
            async for token in llm_service.stream_response(
                messages=llm_history,
                system_prompt=system_prompt,
                provider=req.provider,
                model=req.model
            ):
                full_text += token
                yield f"data: {json.dumps({'type': 'chunk', 'text': token})}\n\n"
        except Exception as e:
            error_msg = f"\n\n[Kuch masla aya: {str(e)}]"
            full_text += error_msg
            yield f"data: {json.dumps({'type': 'chunk', 'text': error_msg})}\n\n"

        # Save complete AI response
        ai_msg = Message(
            conversation_id=conv_id,
            user_id=active_user_id,
            sender="assistant",
            content=full_text
        )
        await db.save_message(ai_msg)

        # Trigger memory extraction in background strictly for active_user_id
        background_tasks.add_task(
            memory_service.extract_and_save_memories,
            req.message,
            full_text,
            active_user_id
        )

        yield f"data: {json.dumps({'type': 'done', 'message_id': ai_msg.id})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/title/{conversation_id}")
async def generate_title(conversation_id: str):
    """
    Generates a concise, natural 3-5 word title for the conversation based on initial messages.
    """
    messages = await db.list_messages(conversation_id)
    if not messages:
        return {"title": "Nayi Baat Cheet"}

    first_few = "\n".join([f"{m.sender}: {m.content}" for m in messages[:4]])
    prompt_msgs = [{
        "role": "user",
        "content": f"Based on this conversation start, provide a short, catchy 3-5 word title in Roman Urdu or English (do not use quotes):\n\n{first_few}"
    }]

    try:
        title = await llm_service.generate_response(
            messages=prompt_msgs,
            system_prompt="You are a title generator. Output ONLY a concise 3-5 word title. No punctuation or quotes.",
            temperature=0.3
        )
        title = title.strip().replace('"', '').replace("'", "")[:40]
        conv = await db.get_conversation(conversation_id)
        if conv:
            conv.title = title
            await db.save_conversation(conv)
        return {"title": title}
    except Exception:
        return {"title": "Baat Cheet"}
