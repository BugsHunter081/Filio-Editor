from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Subscription, User

PLANS = {
    "free": {"label": "Free", "daily_quota": 40},
    "pro": {"label": "Pro", "daily_quota": 400},
    "business": {"label": "Business", "daily_quota": 2000},
    "unlimited": {"label": "Unlimited", "daily_quota": 0},
}

ROLES = ("user", "admin", "super_admin")
SUB_STATUSES = ("active", "trialing", "past_due", "canceled", "paused")


def plan_quota(plan: str) -> int:
    info = PLANS.get(plan or "free") or PLANS["free"]
    return int(info["daily_quota"])


def effective_quota(user: User) -> int:
    if user.daily_quota is not None:
        return int(user.daily_quota)
    return plan_quota(user.plan)


def latest_subscription(db: Session, user_id) -> Subscription | None:
    return (
        db.query(Subscription)
        .filter(Subscription.user_id == user_id)
        .order_by(Subscription.created_at.desc())
        .first()
    )


def apply_subscription(db: Session, user: User, plan: str, status: str = "active", daily_quota: int | None = None, notes: str = "", ends_at=None) -> Subscription:
    quota = plan_quota(plan) if daily_quota is None else daily_quota
    user.plan = plan
    user.daily_quota = quota
    sub = latest_subscription(db, user.id)
    now = datetime.now(timezone.utc)
    if sub and sub.status in ("active", "trialing", "paused", "past_due"):
        sub.plan = plan
        sub.status = status
        sub.daily_quota = quota
        sub.notes = notes or sub.notes or ""
        sub.updated_at = now
        if ends_at is not None:
            sub.ends_at = ends_at
        return sub
    sub = Subscription(
        user_id=user.id,
        plan=plan,
        status=status,
        daily_quota=quota,
        notes=notes or "",
        ends_at=ends_at,
    )
    db.add(sub)
    return sub
