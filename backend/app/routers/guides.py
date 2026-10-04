from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Guide

router = APIRouter(prefix="/api/guides", tags=["guides"])


@router.get("")
def list_guides(db: Session = Depends(get_db)):
    rows = db.query(Guide).all()
    return [
        {
            "id": g.id,
            "title": g.title,
            "summary": g.summary,
            "tool_slug": g.tool_slug,
            "steps": g.steps,
            "related": g.related,
        }
        for g in rows
    ]


@router.get("/{guide_id}")
def get_guide(guide_id: str, db: Session = Depends(get_db)):
    g = db.query(Guide).filter(Guide.id == guide_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Guide not found")
    return {
        "id": g.id,
        "title": g.title,
        "summary": g.summary,
        "tool_slug": g.tool_slug,
        "steps": g.steps,
        "related": g.related,
    }
