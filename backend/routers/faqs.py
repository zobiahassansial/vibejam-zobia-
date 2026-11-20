from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from database import get_db
from models import FAQResponse

router = APIRouter()


@router.get("/faqs", response_model=list[FAQResponse])
async def list_faqs(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
):
    """List all FAQs with optional search and category filters."""
    db = await get_db()
    try:
        query = "SELECT id, category, question, answer, is_starter, created_at FROM faqs WHERE 1=1"
        params = []

        if category:
            query += " AND category = ?"
            params.append(category)

        if search:
            query += " AND (question LIKE ? OR answer LIKE ?)"
            like_term = f"%{search}%"
            params.append(like_term)
            params.append(like_term)

        query += " ORDER BY id ASC"

        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()

        return [
            FAQResponse(
                id=row["id"],
                category=row["category"],
                question=row["question"],
                answer=row["answer"],
                is_starter=bool(row["is_starter"]),
                created_at=row["created_at"],
            )
            for row in rows
        ]
    finally:
        await db.close()


@router.get("/faqs/{faq_id}", response_model=FAQResponse)
async def get_faq(faq_id: str):
    """Get a single FAQ by ID."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, category, question, answer, is_starter, created_at FROM faqs WHERE id = ?",
            (faq_id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"FAQ '{faq_id}' not found.")
        return FAQResponse(
            id=row["id"],
            category=row["category"],
            question=row["question"],
            answer=row["answer"],
            is_starter=bool(row["is_starter"]),
            created_at=row["created_at"],
        )
    finally:
        await db.close()
