from agents.base.base_agent import BaseAgent
from agents.coding.prompt import SYSTEM_PROMPT
from tools.registry import TOOLS


class CodingAgent(BaseAgent):

    SYSTEM_PROMPT = SYSTEM_PROMPT
    TOOLS = TOOLS