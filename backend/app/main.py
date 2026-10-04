from sqlalchemy import inspect, text
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import admin, auth, files, guides, jobs
from app.seed import seed

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(files.router)
app.include_router(jobs.router)
app.include_router(guides.router)
app.include_router(admin.router)


def _ensure_columns():
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return
    existing = {c["name"] for c in inspector.get_columns("users")}
    statements = []
    if "role" not in existing:
        statements.append("ALTER TABLE users ADD COLUMN role VARCHAR(32) DEFAULT 'user'")
    if "is_active" not in existing:
        statements.append("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE")
    if "daily_quota" not in existing:
        statements.append("ALTER TABLE users ADD COLUMN daily_quota INTEGER")
    if statements:
        with engine.begin() as conn:
            for sql in statements:
                conn.execute(text(sql))
            conn.execute(text("UPDATE users SET role = 'admin' WHERE is_admin = TRUE AND (role IS NULL OR role = 'user')"))
            conn.execute(text("UPDATE users SET role = 'user' WHERE role IS NULL"))
            conn.execute(text("UPDATE users SET is_active = TRUE WHERE is_active IS NULL"))


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    _ensure_columns()
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"ok": True, "name": settings.app_name}


@app.get("/api/tools")
def tools():
    from app.tool_catalog import TOOLS, CATEGORIES

    return {"categories": CATEGORIES, "tools": TOOLS}
