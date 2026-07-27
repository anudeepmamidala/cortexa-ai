from agents.coding.agent import CodingAgent
from langchain_core.messages import HumanMessage

agent = CodingAgent()
for event in agent.stream({"messages": [HumanMessage(content="what is 2+2, just answer briefly")]}):
    print(event)