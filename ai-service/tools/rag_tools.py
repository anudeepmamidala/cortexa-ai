from langchain_core.tools import tool
from services.rag.search import search

@tool
def search_documents(query:str)->str:
    """
    Search for relevant documents based on provided query"""

    return search(query)