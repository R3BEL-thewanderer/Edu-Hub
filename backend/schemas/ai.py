from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(alias="created_at", default_factory=datetime.now)

class ChatMessageCreate(BaseModel):
    role: str
    content: str
    tokens_used: int = 0
    sources: Optional[List[str]] = []

class ChatSessionCreate(BaseModel):
    subject_id: Optional[str] = None
    title: Optional[str] = None
    provider: str = "nvidia"

class ChatSession(BaseModel):
    id: str
    user_id: str
    subject_id: Optional[str] = None
    title: Optional[str]
    provider: Optional[str]
    total_messages: int
    total_tokens: int
    created_at: datetime
    last_message_at: datetime
    messages: Optional[List[ChatMessage]] = []

class ChatRequest(BaseModel):
    material_id: Optional[str] = None
    question: str
    session_id: Optional[str] = None

class ChatSessionUpdate(BaseModel):
    title: str

class UsageTokens(BaseModel):
    daily_messages: int
    daily_tokens: int
    monthly_messages: int = 0
    monthly_tokens: int = 0
