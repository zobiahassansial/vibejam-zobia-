from typing import Optional, List
from pydantic import BaseModel, field_validator, model_validator
from typing import Literal


# ---- Request Models ----

class MessageRequest(BaseModel):
    content: str
    urdu_script_mode: bool = False
    language_mode: Literal['auto', 'english', 'urdu'] = 'auto'
    detected_language: Literal['english', 'urdu_roman', 'urdu_script'] = 'english'
    reply_language: Literal['english', 'urdu_roman', 'urdu_script'] = 'english'

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) == 0 or len(v) > 300 or len(v) < 1:
            raise ValueError("Message must be 1 to 300 characters.")
        return v


class FAQCreate(BaseModel):
    category: Literal["Labs", "Academics", "Library", "Exams", "Fees", "Projects", "Transport", "Help"]
    question: str
    answer: str

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        if len(v) < 10:
            raise ValueError("Question must be at least 10 characters.")
        if len(v) > 150:
            raise ValueError("Question must be 150 characters or fewer.")
        return v

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, v: str) -> str:
        if len(v) < 10:
            raise ValueError("Answer must be at least 10 characters.")
        if len(v) > 400:
            raise ValueError("Answer must be 400 characters or fewer.")
        return v


class FAQUpdate(BaseModel):
    category: Optional[Literal["Labs", "Academics", "Library", "Exams", "Fees", "Projects", "Transport", "Help"]] = None
    question: Optional[str] = None
    answer: Optional[str] = None

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if len(v) < 10:
                raise ValueError("Question must be at least 10 characters.")
            if len(v) > 150:
                raise ValueError("Question must be 150 characters or fewer.")
        return v

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if len(v) < 10:
                raise ValueError("Answer must be at least 10 characters.")
            if len(v) > 400:
                raise ValueError("Answer must be 400 characters or fewer.")
        return v


class AdminAuth(BaseModel):
    pin: str


class FeedbackRequest(BaseModel):
    message_id: int
    is_helpful: bool


# ---- Response Models ----

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    timestamp: str
    faq_ids: Optional[List[str]] = None
    found: Optional[bool] = None
    type: Optional[str] = "faq"
    feedback: Optional[str] = None


class FAQResponse(BaseModel):
    id: str
    category: str
    question: str
    answer: str
    is_starter: bool
    created_at: str


# ---- Internal Models ----

class AIResponse(BaseModel):
    type: Literal["faq", "smalltalk", "not_found"] = "faq"
    found: bool
    answer: str
    faq_ids: List[str]
    language: Literal['english', 'urdu_roman', 'urdu_script'] = 'english'
