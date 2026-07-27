from agents.base.base_agent import BaseAgent
from agents.planner.prompt import SYSTEM_PROMPT

class PlannerAgent(BaseAgent):

    SYSTEM_PROMPT = SYSTEM_PROMPT
    TOOLS = []