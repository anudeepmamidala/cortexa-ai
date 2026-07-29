from typing import Literal
from pydantic import BaseModel


class ChatRequest(BaseModel):
    thread_id: str
    message: str
    mode: Literal["single", "pipeline"] = "single"


class ChatResponse(BaseModel):
    response: str