import aiosqlite
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

DATABASE_PATH = os.getenv("DATABASE_PATH", "./askse.db")

STARTER_FAQS = [
    ("FAQ-01", "Labs", "When is CS-LAB-102A open, and can I eat there?",
     "CS-LAB-102A is open from 08:00 AM to 06:00 PM, Monday to Friday. Food and drinks are not allowed inside the lab.", 1),
    ("FAQ-02", "Academics", "What is the attendance requirement?",
     "Students need at least 80% attendance in each course. A student below 80% cannot sit the final exam of that course.", 1),
    ("FAQ-03", "Library", "What are the library timings?",
     "The library is open from 08:30 AM to 08:00 PM, Monday to Thursday, and from 08:30 AM to 12:30 PM on Friday. It is closed on weekends.", 1),
    ("FAQ-04", "Exams", "What if I miss a midterm because I was ill?",
     "Apply for a retake to the Course Coordinator within 3 working days of the exam, with a medical certificate.", 1),
    ("FAQ-05", "Fees", "When is the Spring 2027 fee due?",
     "Download the fee challan from the student portal. The last date to pay without a fine is 15-Jan-2027.", 1),
    ("FAQ-06", "Projects", "How do I submit my FYP proposal?",
     "Submit the Final Year Project proposal on SLATE by 30-Nov-2026. Each FYP group has 2 or 3 members.", 1),
    ("FAQ-07", "Transport", "When do the university buses leave?",
     "University buses leave the campus at 01:30 PM and 04:30 PM, Monday to Friday. Bus cards are issued by the Transport Office in Block A.", 1),
    ("FAQ-08", "Help", "Who do I contact for anything else?",
     "Email helpdesk@se.example.edu or visit Room 210, 09:00 AM to 04:00 PM, Monday to Friday.", 1),
]


async def get_db():
    """Get a database connection."""
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    """Initialize the database, create tables and seed starter FAQs."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row

        # Create tables
        await db.execute("""
            CREATE TABLE IF NOT EXISTS faqs (
                id TEXT PRIMARY KEY,
                category TEXT NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                is_starter INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                faq_ids TEXT,
                found INTEGER,
                feedback TEXT,
                type TEXT DEFAULT 'faq',
                language TEXT DEFAULT 'en'
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message_id INTEGER NOT NULL,
                is_helpful INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
        """)

        await db.commit()

        # Schema migrations for existing SQLite databases
        cur = await db.execute("PRAGMA table_info(messages)")
        cols = [row["name"] for row in await cur.fetchall()]
        if "type" not in cols:
            await db.execute("ALTER TABLE messages ADD COLUMN type TEXT DEFAULT 'faq'")
        if "language" not in cols:
            await db.execute("ALTER TABLE messages ADD COLUMN language TEXT DEFAULT 'en'")
        await db.commit()

        # Seed starter FAQs if not present
        now = datetime.now(timezone.utc).isoformat()
        for faq_id, category, question, answer, is_starter in STARTER_FAQS:
            existing = await db.execute("SELECT id FROM faqs WHERE id = ?", (faq_id,))
            row = await existing.fetchone()
            if not row:
                await db.execute(
                    "INSERT INTO faqs (id, category, question, answer, is_starter, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                    (faq_id, category, question, answer, is_starter, now)
                )

        for faq_id, category, question, answer, _is_starter in STARTER_FAQS:
            await db.execute(
                "UPDATE faqs SET category = ?, question = ?, answer = ? WHERE id = ? AND is_starter = 1",
                (category, question, answer, faq_id),
            )

        await db.commit()
