from agents.orchestrator.agent import OrchestratorAgent
from graph.state import GraphState

orchestrator = OrchestratorAgent()


def orchestrator_node(state: GraphState):

    route = orchestrator.invoke(
        state["messages"]
    )

    return {
        "route": route
    }