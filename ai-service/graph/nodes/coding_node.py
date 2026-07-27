from agents.coding.agent import CodingAgent
from graph.state import GraphState
from core.logging import logger

coding_agent = CodingAgent()


def coding_node(state: GraphState):
    logger.info("Coding node started")
    return coding_agent.invoke(state)