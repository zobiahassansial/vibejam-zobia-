from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import os
import re

from typing import Optional
from pydantic import BaseModel
from database import get_db, STARTER_FAQS
from models import AdminAuth, FAQCreate, FAQUpdate, FAQResponse
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

STARTER_IDS = {faq[0] for faq in STARTER_FAQS}  # FAQ-01 .. FAQ-08


class ResetOptions(BaseModel):
    clear_stats: bool = True


def _is_starter(faq_id: str) -> bool:
    return faq_id in STARTER_IDS


def _next_faq_id(existing_ids: list[str]) -> str:
    """Generate next FAQ-XX ID starting from FAQ-09."""
    custom_ids = []
    for fid in existing_ids:
        m = re.match(r"FAQ-(\d+)", fid)
        if m:
            custom_ids.append(int(m.group(1)))
    next_num = max(custom_ids, default=8) + 1
    return f"FAQ-{next_num:02d}"


@router.post("/admin/verify")
async def verify_admin(payload: AdminAuth):
    """Verify admin PIN."""
    admin_pin = os.getenv("ADMIN_PIN", "")
    valid = payload.pin == admin_pin
    return {"valid": valid}


@router.post("/admin/faqs", response_model=FAQResponse)
async def create_faq(payload: FAQCreate):
    """Add a new FAQ (auto-assign ID starting FAQ-09)."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM faqs ORDER BY id ASC")
        rows = await cursor.fetchall()
        existing_ids = [row["id"] for row in rows]
        new_id = _next_faq_id(existing_ids)
        now = datetime.now(timezone.utc).isoformat()

        await db.execute(
            "INSERT INTO faqs (id, category, question, answer, is_starter, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (new_id, payload.category, payload.question, payload.answer, 0, now)
        )
        await db.commit()

        return FAQResponse(
            id=new_id,
            category=payload.category,
            question=payload.question,
            answer=payload.answer,
            is_starter=False,
            created_at=now,
        )
    finally:
        await db.close()


@router.put("/admin/faqs/{faq_id}", response_model=FAQResponse)
async def update_faq(faq_id: str, payload: FAQUpdate):
    """Edit a FAQ. Starter FAQs (FAQ-01 to FAQ-08) cannot be edited."""
    if _is_starter(faq_id):
        raise HTTPException(status_code=403, detail="Starter FAQs cannot be edited.")

    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, category, question, answer, is_starter, created_at FROM faqs WHERE id = ?",
            (faq_id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"FAQ '{faq_id}' not found.")

        new_category = payload.category if payload.category is not None else row["category"]
        new_question = payload.question if payload.question is not None else row["question"]
        new_answer = payload.answer if payload.answer is not None else row["answer"]

        await db.execute(
            "UPDATE faqs SET category = ?, question = ?, answer = ? WHERE id = ?",
            (new_category, new_question, new_answer, faq_id)
        )
        await db.commit()

        return FAQResponse(
            id=faq_id,
            category=new_category,
            question=new_question,
            answer=new_answer,
            is_starter=bool(row["is_starter"]),
            created_at=row["created_at"],
        )
    finally:
        await db.close()


@router.delete("/admin/faqs/{faq_id}")
async def delete_faq(faq_id: str):
    """Delete a FAQ. Starter FAQs (FAQ-01 to FAQ-08) cannot be deleted."""
    if _is_starter(faq_id):
        raise HTTPException(status_code=403, detail="Starter FAQs cannot be deleted.")

    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM faqs WHERE id = ?", (faq_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"FAQ '{faq_id}' not found.")

        await db.execute("DELETE FROM faqs WHERE id = ?", (faq_id,))
        await db.commit()

        return {"message": f"FAQ '{faq_id}' deleted successfully."}
    finally:
        await db.close()


@router.post("/admin/reset")
async def reset_to_starter(payload: Optional[ResetOptions] = None):
    """Reset to starter data: restore 8 starter FAQs, optionally clear messages/stats."""
    clear_stats = payload.clear_stats if payload is not None else True
    from database import STARTER_FAQS
    db = await get_db()
    try:
        await db.execute("DELETE FROM faqs")
        if clear_stats:
            await db.execute("DELETE FROM messages")
            await db.execute("DELETE FROM feedback")
        now = datetime.now(timezone.utc).isoformat()
        for faq_id, category, question, answer, is_starter in STARTER_FAQS:
            await db.execute(
                "INSERT INTO faqs (id, category, question, answer, is_starter, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (faq_id, category, question, answer, is_starter, now)
            )
        await db.commit()
        return {"message": "Reset complete. Starter FAQs restored."}
    finally:
        await db.close()
