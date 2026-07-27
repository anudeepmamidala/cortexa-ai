from abc import ABC
import logging

from langchain_core.messages import (
    SystemMessage,
    ToolMessage,
)

from graph.state import GraphState
from providers.factory import get_provider
from tools.registry import TOOL_MAP

logger = logging.getLogger(__name__)


class BaseAgent(ABC):

    SYSTEM_PROMPT = ""
    TOOLS = []

    def __init__(self):
        if not self.SYSTEM_PROMPT:
            raise ValueError(
                f"{self.__class__.__name__} must define SYSTEM_PROMPT."
            )

        self.llm = (
            get_provider()
            .get_chat_model()
            .bind_tools(self.TOOLS)
        )

    def _build_messages(self, state: GraphState):
        return [
            SystemMessage(content=self.SYSTEM_PROMPT),
            *state["messages"],
        ]

    def _execute_tools(self, response, messages):

        messages.append(response)

        for tool_call in response.tool_calls:

            logger.info("=" * 60)
            logger.info(f"Tool Called : {tool_call['name']}")
            logger.info(f"Arguments   : {tool_call['args']}")
            logger.info("=" * 60)

            tool = TOOL_MAP[tool_call["name"]]

            try:
                result = tool.invoke(tool_call["args"])

                logger.info("Tool executed successfully")

                if isinstance(result, str):
                    logger.info(result[:500])
                else:
                    logger.info(result)

            except Exception as e:
                result = str(e)
                logger.exception("Tool execution failed")

            messages.append(
                ToolMessage(
                    content=result,
                    tool_call_id=tool_call["id"],
                )
            )

    def invoke(self, state: GraphState):

        logger.info(f"{self.__class__.__name__} invoked")

        messages = self._build_messages(state)

        response = self.llm.invoke(messages)

        while response.tool_calls:
            self._execute_tools(response, messages)
            response = self.llm.invoke(messages)

        logger.info(f"{self.__class__.__name__} completed")

        return {
            "messages": [response]
        }

    def stream(self, state: GraphState):
        """
        Generator version of invoke(). Yields dicts describing what's
        happening so the API layer can turn them into SSE events:
          {"type": "tool_start", "name": ..., "args": ...}
          {"type": "tool_end", "name": ...}
          {"type": "token", "content": ...}
          {"type": "done", "message": <final AIMessage>}
        """
        logger.info(f"{self.__class__.__name__} invoked (streaming)")

        messages = self._build_messages(state)

        while True:
            full_response = None

            for chunk in self.llm.stream(messages):
                full_response = chunk if full_response is None else full_response + chunk

                if chunk.content:
                    yield {"type": "token", "content": chunk.content}

            if full_response.tool_calls:
                for tool_call in full_response.tool_calls:
                    yield {
                        "type": "tool_start",
                        "name": tool_call["name"],
                        "args": tool_call["args"],
                    }

                self._execute_tools(full_response, messages)

                for tool_call in full_response.tool_calls:
                    yield {"type": "tool_end", "name": tool_call["name"]}

                # loop again — next LLM call is either another tool call
                # or the real final streamed answer
                continue

            logger.info(f"{self.__class__.__name__} completed (streaming)")
            yield {"type": "done", "message": full_response}
            return