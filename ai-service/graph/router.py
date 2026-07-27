from graph.state import GraphState


def router(state: GraphState):

    route = state["route"]

    if route not in {
        "planner",
        "coding",
        "reviewer",
    }:
        return "coding"

    return route