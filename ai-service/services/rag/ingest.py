from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from services.rag.vector_store import get_vector_store


def ingest_document(file_path: str, collection_name: str = "default_workspace") -> int:
    path = Path(file_path)

    if path.suffix.lower() == ".pdf":
        loader = PyPDFLoader(file_path)
    else:
        loader = TextLoader(file_path, encoding="utf-8")

    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )

    chunks = splitter.split_documents(documents)

    vector_store = get_vector_store(collection_name=collection_name)
    vector_store.add_documents(chunks)

    return len(chunks)