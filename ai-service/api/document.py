from fastapi import APIRouter, File, UploadFile, HTTPException
from services.rag.ingest import ingest_pdf
from pathlib import Path
import shutil

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    file_path = UPLOAD_DIR / file.filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    chunks = ingest_pdf(str(file_path))

    return {
        "message": "Document indexed successfully.",
        "filename": file.filename,
        "chunks": chunks,
    }