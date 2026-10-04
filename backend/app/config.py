from pathlib import Path
import secrets
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Folio"
    secret_key: str = secrets.token_urlsafe(48)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    database_url: str = "postgresql+psycopg2://pdfuser:pdfpass123@127.0.0.1:5432/pdfplatform"
    cors_origins: str = "*"
    bootstrap_superadmin_email: str | None = None
    bootstrap_superadmin_password: str | None = None
    bootstrap_admin_email: str | None = None
    bootstrap_admin_password: str | None = None
    storage_dir: Path = Path(__file__).resolve().parent.parent / "storage"
    max_upload_mb: int = 50
    free_daily_quota: int = 40
    plan_quotas: dict = {
        "free": 40,
        "pro": 400,
        "business": 2000,
        "unlimited": 0,
    }

    class Config:
        extra = "ignore"


settings = Settings()
settings.storage_dir.mkdir(parents=True, exist_ok=True)
(settings.storage_dir / "uploads").mkdir(exist_ok=True)
(settings.storage_dir / "outputs").mkdir(exist_ok=True)
(settings.storage_dir / "previews").mkdir(exist_ok=True)
