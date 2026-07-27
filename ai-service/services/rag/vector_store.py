from langchain_chroma import Chroma
from services.rag.embeddings import get_embeddings

DB_PATH="data/chroma"

def get_vector_store():
    return Chroma(
        persist_directory=DB_PATH,
        embedding_function=get_embeddings()
    )
