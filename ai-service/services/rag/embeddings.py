from langchain_ollama import OllamaEmbeddings

from config import EMBEDDINGS_URL

def get_embeddings():
    return OllamaEmbeddings(
        model="nomic-embed-text",
        base_url=EMBEDDINGS_URL,
    )