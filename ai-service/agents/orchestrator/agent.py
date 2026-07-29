from providers.factory import get_provider
from langchain_core.messages import SystemMessage

from agents.orchestrator.prompt import SYSTEM_PROMPT


class OrchestratorAgent:

    def __init__(self):
        self.llm = get_provider().get_chat_model()

    def invoke(self, messages: list):

        response = self.llm.invoke(
            [
                SystemMessage(content=SYSTEM_PROMPT),
                *messages,
            ]
        )

        return response.content.strip().lower()