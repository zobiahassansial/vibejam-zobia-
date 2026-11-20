import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

from database import init_db
from routers import chat, faqs, admin, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database on startup."""
    await init_db()
    yield


app = FastAPI(
    title=os.getenv("APP_NAME", "AskSE"),
    description="AskSE Help Desk API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS setup from environment
cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
cors_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api")
app.include_router(faqs.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(stats.router, prefix="/api")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors() if hasattr(exc, "errors") else []
    for err in errors:
        loc = [str(x) for x in err.get("loc", [])]
        if "content" in loc:
            return JSONResponse(
                status_code=422,
                content={"detail": "Message must be 1 to 300 characters."}
            )
        msg = err.get("msg", "")
        if "Message must be 1 to 300 characters." in msg:
            return JSONResponse(
                status_code=422,
                content={"detail": "Message must be 1 to 300 characters."}
            )
    
    first_msg = errors[0].get("msg", "Validation error") if errors else "Validation error"
    # Clean up Pydantic value_error prefix if present
    if "Value error, " in first_msg:
        first_msg = first_msg.replace("Value error, ", "")
    return JSONResponse(
        status_code=422,
        content={"detail": first_msg, "errors": errors},
    )


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": os.getenv("APP_NAME", "AskSE")}
