from agents.reviewer.agent import ReviewerAgent
from graph.state import GraphState
from core.logging import logger

reviewer_agent = ReviewerAgent()


def reviewer_node(state: GraphState):
    logger.info("Reviewer node started")
    return reviewer_agent.invoke(state)