from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import json

from database import get_db
from models import DeleteMessagesRequest, MessageRequest, ChatMessageResponse
from constants import AI_FAILURE_MESSAGE, VALIDATION_MESSAGE
from services.ai_service import get_ai_response
from services.language_service import detect_language

router = APIRouter()


def format_timestamp_display(iso_str: str) -> str:
    """Convert ISO timestamp to hh:mm AM/PM display format."""
    try:
        dt = datetime.fromisoformat(iso_str)
        return dt.strftime("%I:%M %p")
    except Exception:
        return iso_str


@router.post("/chat", response_model=ChatMessageResponse)
async def send_message(request: MessageRequest):
    """Send a message and get AI response."""
    content = request.content.strip()
    if not content or len(request.content) > 300:
        raise HTTPException(status_code=422, detail=VALIDATION_MESSAGE)

    lang = request.detected_language or detect_language(content)
    now_iso = datetime.now(timezone.utc).isoformat()

    db = await get_db()
    try:
        # Save user message
        cursor = await db.execute(
            "INSERT INTO messages (role, content, timestamp, faq_ids, found, feedback, type, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ("user", content, now_iso, None, None, None, "user", lang)
        )
        await db.commit()
        user_msg_id = cursor.lastrowid

        try:
            ai_result = await get_ai_response(content, request.detected_language, request.reply_language)
        except HTTPException:
            await db.execute("DELETE FROM messages WHERE id = ?", (user_msg_id,))
            await db.commit()
            raise
        except Exception:
            await db.execute("DELETE FROM messages WHERE id = ?", (user_msg_id,))
            await db.commit()
            raise HTTPException(status_code=503, detail=AI_FAILURE_MESSAGE)

        # Save AI response
        faq_ids_json = json.dumps(ai_result.faq_ids) if ai_result.faq_ids else None
        ai_now_iso = datetime.now(timezone.utc).isoformat()
        ai_cursor = await db.execute(
            "INSERT INTO messages (role, content, timestamp, faq_ids, found, feedback, type, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ("assistant", ai_result.answer, ai_now_iso, faq_ids_json, 1 if ai_result.found else 0, None, ai_result.type, lang)
        )
        await db.commit()
        ai_msg_id = ai_cursor.lastrowid

        return ChatMessageResponse(
            id=ai_msg_id,
            role="assistant",
            content=ai_result.answer,
            timestamp=format_timestamp_display(ai_now_iso),
            faq_ids=ai_result.faq_ids,
            found=ai_result.found,
            type=ai_result.type,
            feedback=None,
        )
    finally:
        await db.close()


@router.get("/chat/history", response_model=list[ChatMessageResponse])
async def get_chat_history():
    """Return all messages in order with persistent timestamps."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, role, content, timestamp, faq_ids, found, feedback, type FROM messages ORDER BY id ASC"
        )
        rows = await cursor.fetchall()
        result = []
        for row in rows:
            faq_ids = None
            if row["faq_ids"]:
                try:
                    faq_ids = json.loads(row["faq_ids"])
                except Exception:
                    faq_ids = []
            result.append(ChatMessageResponse(
                id=row["id"],
                role=row["role"],
                content=row["content"],
                timestamp=format_timestamp_display(row["timestamp"]),
                faq_ids=faq_ids,
                found=bool(row["found"]) if row["found"] is not None else None,
                type=row["type"] if "type" in row.keys() and row["type"] else ("user" if row["role"] == "user" else "faq"),
                feedback=row["feedback"] if "feedback" in row.keys() else None,
            ))
        return result
    finally:
        await db.close()


@router.delete("/chat/messages")
async def delete_chat_messages(payload: DeleteMessagesRequest):
    """Delete specific persisted messages (stats follow DB contents)."""
    if not payload.ids:
        return {"message": "No messages deleted."}
    db = await get_db()
    try:
        placeholders = ",".join("?" for _ in payload.ids)
        await db.execute(f"DELETE FROM feedback WHERE message_id IN ({placeholders})", payload.ids)
        await db.execute(f"DELETE FROM messages WHERE id IN ({placeholders})", payload.ids)
        await db.commit()
        return {"message": f"Deleted {len(payload.ids)} messages."}
    finally:
        await db.close()


@router.delete("/chat/history")
async def clear_chat_history():
    """Clear all chat messages and feedback (never deletes FAQs)."""
    db = await get_db()
    try:
        await db.execute("DELETE FROM messages")
        await db.execute("DELETE FROM feedback")
        await db.commit()
        return {"message": "Chat history cleared."}
    finally:
        await db.close()
