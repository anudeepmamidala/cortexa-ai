from services.rag.retriever import get_retriever


def search(query: str, collection_name: str = "default_workspace") -> str:
    retriever = get_retriever(collection_name=collection_name)

    documents = retriever.invoke(query)

    if not documents:
        return "No relevant documents found."

    results = []

    for i, doc in enumerate(documents, start=1):
        results.append(
            f"Document {i}\n"
            f"{doc.page_content}"
        )

    return "\n\n".join(results)