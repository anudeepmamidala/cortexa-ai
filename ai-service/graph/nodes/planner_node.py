from agents.planner.agent import PlannerAgent
from graph.state import GraphState

from core.logging import logger

planner_agent = PlannerAgent()


def planner_node(state: GraphState):
    logger.info("Planner node started")
    return planner_agent.invoke(state)