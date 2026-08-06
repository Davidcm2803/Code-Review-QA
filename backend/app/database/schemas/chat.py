from datetime import datetime
from typing import Literal, Optional, List
from pydantic import BaseModel


class CreateSessionRequest(BaseModel):
    scan_id: str
    vulnerability_id: Optional[str] = None


class SendMessageRequest(BaseModel):
    question: str
    vulnerability_id: Optional[str] = None


class ChatReply(BaseModel):
    answer: str
    rag_chunks_used: List[str] = []
    messages_left: int
    tokens_used: Optional[int] = None