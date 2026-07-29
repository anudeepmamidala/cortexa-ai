from services.rag.vector_store import get_vector_store


def get_retriever(collection_name: str = "default_workspace"):
    vector_store = get_vector_store(collection_name=collection_name)

    return vector_store.as_retriever(
        search_kwargs={
            "k": 4
        }
    )