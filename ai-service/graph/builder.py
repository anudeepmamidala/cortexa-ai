from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, END, StateGraph

from graph.router import router
from graph.state import GraphState

from graph.nodes.orchestrator_node import orchestrator_node
from graph.nodes.planner_node import planner_node
from graph.nodes.coding_node import coding_node
from graph.nodes.reviewer_node import reviewer_node


builder = StateGraph(GraphState)

builder.add_node("orchestrator", orchestrator_node)
builder.add_node("planner", planner_node)
builder.add_node("coding", coding_node)
builder.add_node("reviewer", reviewer_node)

builder.add_edge(START, "orchestrator")

builder.add_conditional_edges(
    "orchestrator",
    router,
)

builder.add_edge("planner", END)
builder.add_edge("coding", END)
builder.add_edge("reviewer", END)

memory = MemorySaver()

graph = builder.compile(
    checkpointer=memory
)