import json
import logging

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage

from graph.builder import graph, pipeline_graph
from graph.nodes.orchestrator_node import orchestrator
from graph.nodes.planner_node import planner_agent
from graph.nodes.coding_node import coding_agent
from graph.nodes.reviewer_node import reviewer_agent
from schemas.chat import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

AGENTS = {
    "planner": planner_agent,
    "coding": coding_agent,
    "reviewer": reviewer_agent,
}


def sse_event(event_type: str, data: dict) -> str:
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest):

    state = {
        "messages": [
            HumanMessage(content=request.message)
        ]
    }

    config = {
        "configurable": {
            "thread_id": request.thread_id
        }
    }

    if request.mode == "pipeline":
        result = pipeline_graph.invoke(state, config=config)

        plan_msg, code_msg, review_msg = result["messages"][-3:]

        response_text = (
            f"## Plan\n{plan_msg.content}\n\n"
            f"## Implementation\n{code_msg.content}\n\n"
            f"## Review\n{review_msg.content}"
        )

        return {"response": response_text}

    result = graph.invoke(state, config=config)

    return {
        "response": result["messages"][-1].content
    }


@router.post("/stream")
def chat_stream(request: ChatRequest):

    config = {"configurable": {"thread_id": request.thread_id}}

    existing_state = graph.get_state(config)
    prior_messages = existing_state.values.get("messages", []) if existing_state.values else []

    human_message = HumanMessage(content=request.message)
    full_history = prior_messages + [human_message]

    # Sanitize history to prevent LLM API 400 errors from malformed tool_call states
    clean_history = []
    for msg in full_history:
        if isinstance(msg, HumanMessage):
            content_str = str(msg.content) if msg.content else ""
            if content_str.strip():
                clean_history.append(HumanMessage(content=content_str))
        elif isinstance(msg, AIMessage):
            content_str = str(msg.content) if msg.content else ""
            if content_str.strip():
                clean_history.append(AIMessage(content=content_str))

    if not clean_history or clean_history[-1].content != request.message:
        clean_history.append(human_message)

    route_input = clean_history[-3:] if len(clean_history) >= 3 else clean_history
    route = orchestrator.invoke(route_input)
    if route not in AGENTS:
        route = "coding"

    agent = AGENTS[route]

    def event_generator():
        yield sse_event("agent", {"name": route})

        accumulated_tokens = []
        final_message = None

        try:
            for event in agent.stream({"messages": clean_history}):
                if event["type"] == "token":
                    if event["content"]:
                        accumulated_tokens.append(event["content"])
                        yield sse_event("token", {"content": event["content"]})
                elif event["type"] == "tool_start":
                    yield sse_event("tool_start", {"name": event["name"], "args": event["args"]})
                elif event["type"] == "tool_end":
                    yield sse_event("tool_end", {"name": event["name"]})
                elif event["type"] == "done":
                    final_message = event["message"]

            response_text = "".join(accumulated_tokens)
            if not response_text and final_message and final_message.content:
                response_text = str(final_message.content)
            if not response_text:
                response_text = "Task executed successfully."

            ai_msg = AIMessage(content=response_text)

            graph.update_state(
                config,
                {
                    "messages": [human_message, ai_msg],
                    "route": route,
                },
            )

            yield sse_event("done", {"response": response_text})

        except Exception as e:
            logger.error(f"Error in chat stream event_generator: {e}", exc_info=True)
            err_msg = f"AI Error: {str(e)}"
            yield sse_event("token", {"content": err_msg})
            yield sse_event("done", {"response": err_msg})

    return StreamingResponse(event_generator(), media_type="text/event-stream")