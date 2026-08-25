from fastapi import APIRouter, HTTPException
from typing import List, Optional
from models import TuningRule, FeedbackItem, CreateTuningRuleRequest, CreateFeedbackRequest
from database import db

router = APIRouter(prefix="/api/tuning", tags=["Tuning & Review"])

# ================= RULES =================
@router.get("/rules", response_model=List[TuningRule])
async def get_all_rules(active_only: bool = False):
    return await db.list_tuning_rules(active_only=active_only)

@router.post("/rules", response_model=TuningRule)
async def create_rule(req: CreateTuningRuleRequest):
    if not req.rule_text.strip():
        raise HTTPException(status_code=400, detail="Rule text cannot be empty")
    rule = TuningRule(
        rule_text=req.rule_text.strip(),
        category=req.category or "behavior"
    )
    return await db.save_tuning_rule(rule)

@router.patch("/rules/{rule_id}", response_model=TuningRule)
async def update_rule(rule_id: str, is_active: Optional[bool] = None, rule_text: Optional[str] = None):
    rules = await db.list_tuning_rules()
    target = next((r for r in rules if r.id == rule_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Rule not found")
    if is_active is not None:
        target.is_active = is_active
    if rule_text is not None:
        target.rule_text = rule_text.strip()
    return await db.save_tuning_rule(target)

@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    await db.delete_tuning_rule(rule_id)
    return {"status": "success", "message": "Rule deleted"}

# ================= FEEDBACK =================
@router.get("/feedbacks", response_model=List[FeedbackItem])
async def get_all_feedbacks():
    return await db.list_feedbacks()

@router.post("/feedbacks", response_model=FeedbackItem)
async def submit_feedback(req: CreateFeedbackRequest):
    feedback = FeedbackItem(
        message_id=req.message_id,
        conversation_id=req.conversation_id,
        rating=req.rating,
        comment=req.comment,
        suggested_reply=req.suggested_reply
    )
    return await db.save_feedback(feedback)

@router.delete("/feedbacks/{feedback_id}")
async def delete_feedback(feedback_id: str):
    await db.delete_feedback(feedback_id)
    return {"status": "success", "message": "Feedback deleted"}

# ================= STATS =================
@router.get("/stats")
async def get_tuning_stats():
    profiles = await db.list_profiles()
    conversations = await db.list_conversations()
    memories = await db.list_memories()
    rules = await db.list_tuning_rules()
    feedbacks = await db.list_feedbacks()
    
    total_messages = 0
    for conv in conversations:
        msgs = await db.list_messages(conv.id)
        total_messages += len(msgs)

    # Per-profile breakdown
    profile_stats = {}
    for p in profiles:
        p_convs = [c for c in conversations if getattr(c, 'user_id', 'api') == p.id]
        p_memories = [m for m in memories if getattr(m, 'user_id', 'api') == p.id]
        profile_stats[p.id] = {
            "name": p.name,
            "conversations": len(p_convs),
            "memories": len(p_memories)
        }

    return {
        "total_conversations": len(conversations),
        "total_messages": total_messages,
        "total_memories": len(memories),
        "active_rules": len([r for r in rules if r.is_active]),
        "total_rules": len(rules),
        "total_feedbacks": len(feedbacks),
        "profiles": profile_stats
    }

