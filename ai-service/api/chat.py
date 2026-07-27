from fastapi import APIRouter
from langchain_core.messages import HumanMessage

from graph.builder import graph
from schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest):

    state = {
        "messages": [
            HumanMessage(content=request.message)
        ]
    }

    result = graph.invoke(
        state,
        config={
            "configurable": {
                "thread_id": request.thread_id
            }
        },
    )

    return {
        "response": result["messages"][-1].content
    }