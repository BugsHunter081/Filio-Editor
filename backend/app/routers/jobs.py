import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, get_current_user_optional
from app.config import settings
from app.database import SessionLocal, get_db
from app.models import AuditLog, Job, StoredFile, User
from app.plans import effective_quota
from app.schemas import JobCreate, JobOut, UsageOut
from app.services import pdf_engine

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _process_job(job_id: uuid.UUID):
    db = SessionLocal()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return
        job.status = "processing"
        job.progress = 10
        job.message = "Preparing files"
        db.commit()

        files = db.query(StoredFile).filter(StoredFile.id.in_(job.input_file_ids or [])).all()
        paths = [f.stored_path for f in files]
        if not paths and job.tool != "html-to-pdf":
            raise ValueError("No input files")

        dest = settings.storage_dir / "outputs" / str(job.id) / "result.pdf"
        job.progress = 40
        job.message = "Running tool"
        db.commit()

        result, extra = pdf_engine.run_tool(job.tool, paths, dest, job.options or {})
        result = Path(result)
        mime = "application/pdf"
        name = result.name
        if result.suffix == ".zip":
            mime = "application/zip"
        elif result.suffix == ".docx":
            mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        elif result.suffix == ".xlsx":
            mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        elif result.suffix == ".pptx":
            mime = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        elif result.suffix == ".txt":
            mime = "text/plain"

        out = StoredFile(
            owner_id=job.owner_id,
            original_name=name,
            stored_path=str(result),
            mime=mime,
            size_bytes=result.stat().st_size if result.exists() else 0,
            page_count=0,
            kind="output",
        )
        if result.suffix == ".pdf":
            try:
                out.page_count = pdf_engine.page_count(str(result))
            except Exception:
                pass
        db.add(out)
        db.flush()
        job.output_file_id = out.id
        job.extra_outputs = [str(p) for p in extra]
        job.status = "done"
        job.progress = 100
        job.message = "Ready to download"
        job.finished_at = datetime.now(timezone.utc)
        db.add(AuditLog(user_id=job.owner_id, action="job.done", detail=f"{job.tool}:{job.id}"))
        db.commit()
    except Exception as exc:
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            job.status = "failed"
            job.error = str(exc)
            job.message = "Processing failed"
            job.finished_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()


@router.post("", response_model=JobOut)
def create_job(
    payload: JobCreate,
    background: BackgroundTasks,
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    if user:
        if user.is_active is False:
            raise HTTPException(status_code=403, detail="This account is disabled")
        start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        used = db.query(Job).filter(Job.owner_id == user.id, Job.created_at >= start).count()
        quota = effective_quota(user)
        if quota > 0 and used >= quota:
            raise HTTPException(status_code=429, detail="Daily quota reached for this plan")

    job = Job(
        owner_id=user.id if user else None,
        tool=payload.tool,
        status="queued",
        options=payload.options or {},
        input_file_ids=[str(i) for i in payload.file_ids],
        message="Queued",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    background.add_task(_process_job, job.id)
    return job


@router.get("/stats/usage", response_model=UsageOut)
def usage(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    jobs_today = db.query(Job).filter(Job.owner_id == user.id, Job.created_at >= start).count()
    storage = sum(f.size_bytes or 0 for f in db.query(StoredFile).filter(StoredFile.owner_id == user.id).all())
    return UsageOut(jobs_today=jobs_today, quota=effective_quota(user), plan=user.plan, storage_bytes=storage)


@router.get("", response_model=list[JobOut])
def list_jobs(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 30,
):
    return (
        db.query(Job)
        .filter(Job.owner_id == user.id)
        .order_by(Job.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: uuid.UUID, db: Session = Depends(get_db)):
    job = db.query(Job).options(joinedload(Job.output_file)).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
