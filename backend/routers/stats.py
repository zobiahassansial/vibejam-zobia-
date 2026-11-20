from fastapi import APIRouter, HTTPException, Query, Response
from datetime import datetime, timezone, timedelta
import json
import csv
import io

from database import get_db
from models import FeedbackRequest

router = APIRouter()


def format_time_label(iso_str: str) -> str:
    try:
        dt = datetime.fromisoformat(iso_str)
        return dt.strftime("%I:%M %p")
    except Exception:
        return iso_str


@router.get("/stats")
async def get_stats(range_filter: str = Query("all", alias="range")):
    """Return comprehensive usage statistics filtered by date range (today, 7d, all)."""
    db = await get_db()
    try:
        now = datetime.now(timezone.utc)
        time_limit = None
        if range_filter == "today":
            time_limit = (now - timedelta(days=1)).isoformat()
        elif range_filter == "7d":
            time_limit = (now - timedelta(days=7)).isoformat()

        # Load FAQs for category/question lookup
        faq_cur = await db.execute("SELECT id, category, question FROM faqs")
        faq_lookup = {r["id"]: {"category": r["category"], "question": r["question"]} for r in await faq_cur.fetchall()}

        # Build base queries
        where_time = " AND timestamp >= ?" if time_limit else ""
        time_params = [time_limit] if time_limit else []

        # Total user questions
        q_user = f"SELECT id, content, timestamp, language FROM messages WHERE role = 'user'{where_time} ORDER BY id ASC"
        cur = await db.execute(q_user, time_params)
        user_rows = await cur.fetchall()
        total_questions = len(user_rows)

        # Assistant messages
        q_asst = f"SELECT id, content, timestamp, faq_ids, found, feedback, type, language FROM messages WHERE role = 'assistant'{where_time} ORDER BY id ASC"
        cur = await db.execute(q_asst, time_params)
        asst_rows = await cur.fetchall()

        # Metrics breakdown
        answered = 0
        not_found = 0
        chit_chat = 0
        faq_citation_counts: dict[str, int] = {}
        category_counts: dict[str, int] = {}
        timeline_buckets: dict[str, dict] = {}

        for row in asst_rows:
            m_type = row["type"] if "type" in row.keys() and row["type"] else "faq"
            found = bool(row["found"]) if row["found"] is not None else False

            if m_type == "smalltalk":
                chit_chat += 1
            elif found:
                answered += 1
            else:
                not_found += 1

            # Count citations
            if row["faq_ids"]:
                try:
                    c_ids = json.loads(row["faq_ids"])
                    for cid in c_ids:
                        faq_citation_counts[cid] = faq_citation_counts.get(cid, 0) + 1
                        cat = faq_lookup.get(cid, {}).get("category", "General")
                        category_counts[cat] = category_counts.get(cat, 0) + 1
                except Exception:
                    pass

            # Timeline aggregation (group by hour if today, else by day)
            t_str = row["timestamp"]
            try:
                dt = datetime.fromisoformat(t_str)
                bucket_key = dt.strftime("%I %p") if range_filter == "today" else dt.strftime("%b %d")
            except Exception:
                bucket_key = "Recent"

            if bucket_key not in timeline_buckets:
                timeline_buckets[bucket_key] = {"time": bucket_key, "total": 0, "answered": 0, "not_found": 0}
            timeline_buckets[bucket_key]["total"] += 1
            if found and m_type == "faq":
                timeline_buckets[bucket_key]["answered"] += 1
            elif not found:
                timeline_buckets[bucket_key]["not_found"] += 1

        # Feedback stats
        fb_query = "SELECT is_helpful, created_at FROM feedback" + (" WHERE created_at >= ?" if time_limit else "")
        cur = await db.execute(fb_query, time_params)
        fb_rows = await cur.fetchall()
        helpful_count = sum(1 for r in fb_rows if r["is_helpful"] == 1)
        not_helpful_count = sum(1 for r in fb_rows if r["is_helpful"] == 0)

        # Rates
        academic_queries = answered + not_found
        answer_rate = round((answered / academic_queries * 100), 1) if academic_queries > 0 else 0.0
        total_feedback = helpful_count + not_helpful_count
        satisfaction_rate = round((helpful_count / total_feedback * 100), 1) if total_feedback > 0 else 0.0

        # Most cited FAQ highlight
        most_cited_faq_id = max(faq_citation_counts, key=faq_citation_counts.get) if faq_citation_counts else None
        most_cited_info = None
        if most_cited_faq_id:
            most_cited_info = {
                "id": most_cited_faq_id,
                "question": faq_lookup.get(most_cited_faq_id, {}).get("question", "FAQ"),
                "category": faq_lookup.get(most_cited_faq_id, {}).get("category", "General"),
                "citations": faq_citation_counts[most_cited_faq_id],
            }

        # Citations list for chart
        citations_chart = []
        for fid, count in sorted(faq_citation_counts.items(), key=lambda x: x[1], reverse=True)[:8]:
            short_q = faq_lookup.get(fid, {}).get("question", fid)
            if len(short_q) > 35:
                short_q = short_q[:32] + "..."
            citations_chart.append({
                "id": fid,
                "label": f"{fid}: {short_q}",
                "citations": count,
                "is_top": (fid == most_cited_faq_id),
            })

        # Category breakdown for radar/bar
        categories_chart = [
            {"category": cat, "count": count}
            for cat, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
        ]

        # Recent questions table (pair user and assistant)
        recent_cur = await db.execute(
            """
            SELECT u.id as q_id, u.content as question, u.timestamp as time, u.language as lang,
                   a.found, a.type, a.faq_ids
            FROM messages u
            LEFT JOIN messages a ON a.id = (
                SELECT MIN(id) FROM messages WHERE role = 'assistant' AND id > u.id
            )
            WHERE u.role = 'user'
            ORDER BY u.id DESC
            LIMIT 8
            """
        )
        recent_rows = await recent_cur.fetchall()
        recent_questions = []
        for r in recent_rows:
            c_list = []
            if r["faq_ids"]:
                try:
                    c_list = json.loads(r["faq_ids"])
                except Exception:
                    pass
            recent_questions.append({
                "id": r["q_id"],
                "time": format_time_label(r["time"]),
                "question": r["question"],
                "lang": r["lang"] or "en",
                "type": r["type"] or ("faq" if r["found"] else "not_found"),
                "found": bool(r["found"]) if r["found"] is not None else False,
                "citations": c_list,
            })

        return {
            "total_questions": total_questions,
            "answered": answered,
            "not_found": not_found,
            "chit_chat": chit_chat,
            "answer_rate": answer_rate,
            "helpful_count": helpful_count,
            "not_helpful_count": not_helpful_count,
            "satisfaction_rate": satisfaction_rate,
            "most_cited_faq": most_cited_info,
            "citations_chart": citations_chart,
            "categories_chart": categories_chart,
            "timeline": list(timeline_buckets.values()),
            "recent_questions": recent_questions,
        }
    finally:
        await db.close()


@router.post("/stats/reset")
async def reset_stats():
    """Reset statistics by clearing user interactions."""
    db = await get_db()
    try:
        await db.execute("DELETE FROM messages")
        await db.execute("DELETE FROM feedback")
        await db.commit()
        return {"message": "All statistics and message logs reset successfully."}
    finally:
        await db.close()


@router.get("/stats/export")
async def export_stats_csv():
    """Export recent interactions and statistics as a CSV file."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT u.id, u.timestamp, u.content as question, u.language,
                   a.type, a.found, a.content as answer, a.faq_ids, a.feedback
            FROM messages u
            LEFT JOIN messages a ON a.id = (
                SELECT MIN(id) FROM messages WHERE role = 'assistant' AND id > u.id
            )
            WHERE u.role = 'user'
            ORDER BY u.id DESC
            """
        )
        rows = await cursor.fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Timestamp", "Question", "Language", "Type", "Found", "Answer", "Citations", "Feedback"])

        for r in rows:
            writer.writerow([
                r["id"],
                r["timestamp"],
                r["question"],
                r["language"],
                r["type"],
                "Yes" if r["found"] else "No",
                r["answer"] or "",
                r["faq_ids"] or "",
                r["feedback"] or "none",
            ])

        csv_data = output.getvalue()
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=askse_stats.csv"}
        )
    finally:
        await db.close()


@router.post("/feedback")
async def submit_feedback(payload: FeedbackRequest):
    """Submit feedback for an AI response. Prevents duplicate feedback."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id, role FROM messages WHERE id = ?", (payload.message_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Message not found.")
        if row["role"] != "assistant":
            raise HTTPException(status_code=400, detail="Feedback can only be given on assistant messages.")

        cursor = await db.execute("SELECT id FROM feedback WHERE message_id = ?", (payload.message_id,))
        existing = await cursor.fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Feedback already submitted for this message.")

        now = datetime.now(timezone.utc).isoformat()
        await db.execute(
            "INSERT INTO feedback (message_id, is_helpful, created_at) VALUES (?, ?, ?)",
            (payload.message_id, 1 if payload.is_helpful else 0, now)
        )
        fb_str = "helpful" if payload.is_helpful else "not_helpful"
        await db.execute("UPDATE messages SET feedback = ? WHERE id = ?", (fb_str, payload.message_id))
        await db.commit()

        return {"message": "Feedback recorded. Thank you!"}
    finally:
        await db.close()
