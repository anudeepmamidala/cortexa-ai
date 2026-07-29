from langchain_chroma import Chroma
from services.rag.embeddings import get_embeddings

DB_PATH = "data/chroma"

def get_vector_store(collection_name: str = "default_workspace"):
    return Chroma(
        collection_name=collection_name,
        persist_directory=DB_PATH,
        embedding_function=get_embeddings()
    )
