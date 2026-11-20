# AskSE — Help Desk Web Application

A university help-desk web application with grounded local AI inference, multi-language support (English, Roman Urdu, Urdu Script), full administration, usage statistics, and prompt-injection guardrails.

Built for the university competition.

---

## 1. System Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide React
- **Backend**: Python 3.13 + FastAPI + Uvicorn + Pydantic v2
- **Database**: SQLite (persisted locally with `aiosqlite`)
- **AI Inference**: Local Ollama REST API (`http://localhost:11434`) using `llama3.2:latest` (zero paid APIs, zero external keys, 100% offline capable)

---

## 2. Prerequisites

1. **Python 3.10+** (Python 3.13 tested) with `pip`
2. **Node.js 18+** with `npm`
3. **Ollama** installed with `llama3.2:latest`:
   ```bash
   ollama pull llama3.2:latest
   ```

---

## 3. Quick Start / Running the Application

### Step 1: Start Ollama (if not already running)
```bash
ollama serve
```

### Step 2: Start the FastAPI Backend
```bash
cd backend
py -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The backend initializes the SQLite database (`askse.db`) on startup and seeds the 8 official starter FAQs.
Health check available at: `http://localhost:8000/api/health`

### Step 3: Start the React Frontend
```bash
cd frontend
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 4. Key Features & Mandatory Requirements

### M1 — Identity
- Application name: **AskSE**
- Chat screen notice: *"Answers are AI-generated from the department FAQ. Verify important information with the office."*
- Dedicated **About** page with Entry ID (`ASKSE-2026-001`), Team details, Repository link, LLM API, Model name, and AI development tools.

### M2 — FAQ Database
- 8 exact starter FAQs inserted on first launch.
- FAQs sorted in ID order with ID, Category, Question, and Answer.
- Live search across question/answer and category dropdown filter.
- Input validation: strictly 1–300 characters with live `n/300` counter.
- Rejection message for empty, whitespace, or over-limit inputs: *"Message must be 1 to 300 characters."*

### M3 — Grounded AI Answers
- Strict grounding: only facts contained in the current database FAQs are returned.
- Ollama generates structured JSON with citation IDs (`faq_ids: ["FAQ-XX"]`).
- Python backend validates that every cited FAQ ID exists in the database.
- Valid citations are rendered as badges (e.g. `[FAQ-03]`).
- Each question is answered independently (no prior conversation context bleed).
- Animated bouncing dots typing indicator while processing.

### M4 — Exact Not-Found Fallback
When no relevant FAQ exists or citations fail validation, the system displays:
> *"Sorry, I could not find this in the department FAQ. Please email helpdesk@se.example.edu or visit Room 210."*

### M5 — Language Support
- Automatically detects English vs Roman Urdu and answers in the matching language.
- Bonus Urdu Script mode translates grounded answers into Nastaliq Urdu script while preserving factual content and citations.

### M6 — Admin Dashboard (Route: /admin)
- Admin panel is accessible directly via the URL route `/admin` (removed from public navigation for security).
- Protected with a 4-digit PIN gate (PIN: `2026`) with auto-advancing input fields; incorrect attempts trigger a shake animation and display *"Incorrect PIN"*. Session-unlock only.
- Split-view dashboard:
  - Add custom FAQs across 8 categories with character validation (Question: 10–150 chars, Answer: 10–400 chars).
  - Live FAQ management with automatic ID assignment starting from `FAQ-09`.
  - Protection of starter FAQs (`FAQ-01` to `FAQ-08`) against editing and deletion.
  - Reset to Starter Data button restores original records with an optional checkbox to also clear chat statistics.
  - "Lock admin" button to immediately secure the panel.

### M7 — Prompt Injection Protection
- Multi-layer defense: system prompt isolation + regex-based guardrails detecting jailbreaks, system prompt leaks, role override attempts, and DAN modes.

### M8 — AI Failure Handling
- Strict 30-second timeout on Ollama calls.
- Fallback notice on failure: *"AI service unavailable. Check your connection or API key and try again."*
- User's typed message is preserved in the input box upon failure; previous chat history is retained.

### M9 — Persistent Chat History
- Persistent storage in SQLite with `hh:mm AM/PM` formatted timestamps.
- Clear Chat button with modal confirmation: *"Clear all messages?"*.
- Clearing chat never deletes FAQs.

---

## 5. All Six Bonus Features Implemented

1. **Statistics Dashboard**: Real-time metrics computed directly from SQLite (Total questions, Answered, Not Found, Most Cited FAQ, Helpful/Not Helpful counts).
2. **Answer Feedback**: Thumbs-up / Thumbs-down buttons on AI responses with duplicate prevention.
3. **Suggested Questions**: Clickable question chips above the chat input sampled from the FAQ database.
4. **Voice Input**: Web Speech API integration with microphone toggle and graceful permission handling.
5. **Urdu Script Mode**: Toggle switch to convert grounded responses into Urdu script without information loss.
6. **Dark Mode**: Complete dark theme persisted across page reloads via localStorage with readable contrast.

---

## 6. Environment Variables

### Backend (`backend/.env`)
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
DATABASE_PATH=./askse.db
ADMIN_PIN=2026
APP_NAME=AskSE
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
```

