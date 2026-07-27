from agents.base.base_agent import BaseAgent
from agents.reviewer.prompt import REVIEWER_PROMPT
from tools.registry import TOOLS


class ReviewerAgent(BaseAgent):

    SYSTEM_PROMPT = REVIEWER_PROMPT
    TOOLS = TOOLS