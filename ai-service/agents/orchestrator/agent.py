from providers.factory import get_provider
from langchain_core.messages import SystemMessage, HumanMessage

from agents.orchestrator.prompt import SYSTEM_PROMPT


class OrchestratorAgent:

    def __init__(self):
        self.llm = get_provider().get_chat_model()

    def invoke(self, message: str):

        response = self.llm.invoke(
            [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=message),
            ]
        )

        return response.content.strip().lower()