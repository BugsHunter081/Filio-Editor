import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user_optional
from app.config import settings
from app.database import get_db
from app.models import StoredFile, User
from app.schemas import FileOut
from app.services import pdf_engine

router = APIRouter(prefix="/api/files", tags=["files"])

ALLOWED = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "text/html",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}


@router.post("/upload", response_model=list[FileOut])
async def upload(
    files: list[UploadFile] = File(...),
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    saved = []
    for f in files:
        raw = await f.read()
        if len(raw) > settings.max_upload_mb * 1024 * 1024:
            raise HTTPException(status_code=413, detail=f"{f.filename} exceeds {settings.max_upload_mb} MB")
        ext = Path(f.filename or "file.pdf").suffix.lower() or ".pdf"
        fid = uuid.uuid4()
        dest = settings.storage_dir / "uploads" / f"{fid}{ext}"
        dest.write_bytes(raw)
        pages = 0
        mime = f.content_type or "application/octet-stream"
        if ext == ".pdf":
            try:
                pages = pdf_engine.page_count(str(dest))
                mime = "application/pdf"
            except Exception as exc:
                dest.unlink(missing_ok=True)
                raise HTTPException(status_code=400, detail=f"Could not read PDF: {exc}") from exc
        rec = StoredFile(
            id=fid,
            owner_id=user.id if user else None,
            original_name=f.filename or dest.name,
            stored_path=str(dest),
            mime=mime,
            size_bytes=len(raw),
            page_count=pages,
            kind="upload",
        )
        db.add(rec)
        saved.append(rec)
    db.commit()
    for rec in saved:
        db.refresh(rec)
    return saved


@router.get("/{file_id}", response_model=FileOut)
def get_file(file_id: uuid.UUID, db: Session = Depends(get_db)):
    rec = db.query(StoredFile).filter(StoredFile.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")
    return rec


@router.get("/{file_id}/download")
def download(file_id: uuid.UUID, db: Session = Depends(get_db)):
    rec = db.query(StoredFile).filter(StoredFile.id == file_id).first()
    if not rec or not Path(rec.stored_path).exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(rec.stored_path, filename=rec.original_name, media_type=rec.mime)


@router.get("/{file_id}/preview")
def preview(file_id: uuid.UUID, db: Session = Depends(get_db)):
    rec = db.query(StoredFile).filter(StoredFile.id == file_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="File not found")
    dest = settings.storage_dir / "previews" / str(file_id)
    names = []
    if rec.mime == "application/pdf" or rec.original_name.lower().endswith(".pdf"):
        names = pdf_engine.render_preview(rec.stored_path, dest)
    return {"pages": names, "page_count": rec.page_count, "file": FileOut.model_validate(rec)}


@router.get("/{file_id}/preview/{page_name}")
def preview_page(file_id: uuid.UUID, page_name: str):
    path = settings.storage_dir / "previews" / str(file_id) / page_name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Preview not found")
    return FileResponse(path, media_type="image/jpeg")
