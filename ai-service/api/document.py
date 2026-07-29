from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from services.rag.ingest import ingest_document
from pathlib import Path
import shutil
from typing import List

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".java", ".py", ".js", ".ts", ".md", ".txt", ".json", ".html", ".css"}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    collection_name: str = Query("default_workspace", description="ChromaDB collection namespace")
):
    suffix = Path(file.filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    file_path = UPLOAD_DIR / file.filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    chunks = ingest_document(str(file_path), collection_name=collection_name)

    return {
        "message": "Document indexed successfully.",
        "filename": file.filename,
        "collection": collection_name,
        "chunks": chunks,
    }


@router.get("/", response_model=List[dict])
def list_documents():
    documents = []
    if UPLOAD_DIR.exists():
        for item in UPLOAD_DIR.iterdir():
            if item.is_file():
                documents.append({
                    "filename": item.name,
                    "size": item.stat().st_size,
                    "extension": item.suffix.lower()
                })
    return documents