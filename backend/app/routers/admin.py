import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.auth import hash_password, is_super_admin, require_admin, require_super_admin, user_role
from app.database import get_db
from app.models import AuditLog, Job, StoredFile, Subscription, User
from app.plans import PLANS, ROLES, SUB_STATUSES, apply_subscription, effective_quota, latest_subscription
from app.schemas import AdminUserCreate, AdminUserOut, AdminUserUpdate, SubscriptionOut

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _user_payload(db: Session, user: User) -> dict:
    sub = latest_subscription(db, user.id)
    jobs_count = db.query(func.count(Job.id)).filter(Job.owner_id == user.id).scalar() or 0
    files_count = db.query(func.count(StoredFile.id)).filter(StoredFile.owner_id == user.id).scalar() or 0
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "plan": user.plan,
        "role": user_role(user),
        "is_admin": bool(user.is_admin) or user_role(user) in ("admin", "super_admin"),
        "is_active": bool(user.is_active) if user.is_active is not None else True,
        "daily_quota": effective_quota(user),
        "created_at": user.created_at,
        "jobs_count": jobs_count,
        "files_count": files_count,
        "subscription": SubscriptionOut.model_validate(sub) if sub else None,
    }


def _audit(db: Session, actor: User, action: str, detail: str):
    db.add(AuditLog(user_id=actor.id, action=action, detail=detail))


def _get_user(db: Session, user_id: uuid.UUID) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _guard_target(actor: User, target: User):
    if user_role(target) == "super_admin" and not is_super_admin(actor):
        raise HTTPException(status_code=403, detail="Cannot modify a super admin")
    if target.id == actor.id and user_role(target) == "super_admin":
        return


@router.get("/overview")
def overview(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    plan_counts = {
        row[0]: row[1]
        for row in db.query(User.plan, func.count(User.id)).group_by(User.plan).all()
    }
    return {
        "users": db.query(User).count(),
        "jobs": db.query(Job).count(),
        "files": db.query(StoredFile).count(),
        "failed_jobs": db.query(Job).filter(Job.status == "failed").count(),
        "active_subs": db.query(Subscription).filter(Subscription.status == "active").count(),
        "plan_counts": plan_counts,
        "plans": PLANS,
        "roles": list(ROLES),
        "viewer_role": user_role(admin),
        "recent_jobs": [
            {
                "id": str(j.id),
                "tool": j.tool,
                "status": j.status,
                "created_at": j.created_at.isoformat() if j.created_at else None,
            }
            for j in db.query(Job).order_by(Job.created_at.desc()).limit(12).all()
        ],
        "users_list": [_user_payload(db, u) for u in db.query(User).order_by(User.created_at.desc()).limit(20).all()],
        "audit": [
            {
                "action": a.action,
                "detail": a.detail,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(20).all()
        ],
    }


@router.get("/users", response_model=list[AdminUserOut])
def list_users(
    q: str = "",
    plan: str = "",
    role: str = "",
    admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if q.strip():
        like = f"%{q.strip().lower()}%"
        query = query.filter(or_(func.lower(User.email).like(like), func.lower(User.name).like(like)))
    if plan:
        query = query.filter(User.plan == plan)
    if role:
        query = query.filter(User.role == role)
    rows = query.order_by(User.created_at.desc()).all()
    return [_user_payload(db, u) for u in rows]


@router.post("/users", response_model=AdminUserOut)
def create_user(
    payload: AdminUserCreate,
    admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    role = payload.role if payload.role in ROLES else "user"
    plan = payload.plan if payload.plan in PLANS else "free"
    user = User(
        email=payload.email.lower(),
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
        plan=plan,
        role=role,
        is_admin=role in ("admin", "super_admin"),
        is_active=payload.is_active,
        daily_quota=payload.daily_quota,
    )
    db.add(user)
    db.flush()
    apply_subscription(db, user, plan, status="active", daily_quota=payload.daily_quota, notes=payload.notes)
    _audit(db, admin, "admin.user.create", f"{admin.email} created {user.email} ({role}/{plan})")
    db.commit()
    db.refresh(user)
    return _user_payload(db, user)


@router.get("/users/{user_id}", response_model=AdminUserOut)
def get_user(
    user_id: uuid.UUID,
    admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    return _user_payload(db, _get_user(db, user_id))


@router.patch("/users/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: uuid.UUID,
    payload: AdminUserUpdate,
    admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    user = _get_user(db, user_id)
    _guard_target(admin, user)

    if payload.email and payload.email.lower() != user.email:
        taken = db.query(User).filter(User.email == payload.email.lower(), User.id != user.id).first()
        if taken:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = payload.email.lower()
    if payload.name:
        user.name = payload.name.strip()
    if payload.password:
        user.password_hash = hash_password(payload.password)
    if payload.role is not None:
        if payload.role not in ROLES:
            raise HTTPException(status_code=400, detail="Invalid role")
        if payload.role == "super_admin" and not is_super_admin(admin):
            raise HTTPException(status_code=403, detail="Only a super admin can grant that role")
        if user.id == admin.id and payload.role != "super_admin" and is_super_admin(admin):
            others = db.query(User).filter(User.role == "super_admin", User.id != user.id).count()
            if others == 0:
                raise HTTPException(status_code=400, detail="Keep at least one super admin")
        user.role = payload.role
        user.is_admin = payload.role in ("admin", "super_admin")
    if payload.is_active is not None:
        if user.id == admin.id and payload.is_active is False:
            raise HTTPException(status_code=400, detail="You cannot disable your own account")
        user.is_active = payload.is_active
    if payload.daily_quota is not None:
        user.daily_quota = payload.daily_quota

    if payload.plan is not None:
        if payload.plan not in PLANS:
            raise HTTPException(status_code=400, detail="Unknown plan")
        status = payload.subscription_status or "active"
        if status not in SUB_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid subscription status")
        apply_subscription(
            db,
            user,
            payload.plan,
            status=status,
            daily_quota=payload.daily_quota,
            notes=payload.notes or "",
            ends_at=payload.subscription_ends_at,
        )
    elif payload.subscription_status or payload.notes is not None or payload.subscription_ends_at is not None or payload.daily_quota is not None:
        sub = apply_subscription(
            db,
            user,
            user.plan,
            status=payload.subscription_status or "active",
            daily_quota=payload.daily_quota,
            notes=payload.notes or "",
            ends_at=payload.subscription_ends_at,
        )
        if payload.subscription_status:
            sub.status = payload.subscription_status

    changes = payload.model_dump(exclude_unset=True)
    if "password" in changes:
        changes["password"] = "***"
    _audit(db, admin, "admin.user.update", f"{admin.email} updated {user.email}: {changes}")
    db.commit()
    db.refresh(user)
    return _user_payload(db, user)


@router.post("/users/{user_id}/reset-password")
def reset_password(
    user_id: uuid.UUID,
    payload: dict,
    admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    user = _get_user(db, user_id)
    _guard_target(admin, user)
    password = str(payload.get("password") or "")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user.password_hash = hash_password(password)
    _audit(db, admin, "admin.user.reset_password", f"{admin.email} reset password for {user.email}")
    db.commit()
    return {"ok": True, "email": user.email}


@router.post("/users/{user_id}/subscription", response_model=AdminUserOut)
def set_subscription(
    user_id: uuid.UUID,
    payload: dict,
    admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    user = _get_user(db, user_id)
    _guard_target(admin, user)
    plan = payload.get("plan") or user.plan
    if plan not in PLANS:
        raise HTTPException(status_code=400, detail="Unknown plan")
    status = payload.get("status") or "active"
    if status not in SUB_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid subscription status")
    quota = payload.get("daily_quota")
    notes = payload.get("notes") or ""
    ends_at = payload.get("ends_at")
    parsed_end = None
    if ends_at:
        parsed_end = datetime.fromisoformat(str(ends_at).replace("Z", "+00:00"))
    apply_subscription(db, user, plan, status=status, daily_quota=quota, notes=notes, ends_at=parsed_end)
    _audit(db, admin, "admin.subscription.update", f"{admin.email} set {user.email} to {plan}/{status}")
    db.commit()
    db.refresh(user)
    return _user_payload(db, user)


@router.get("/plans")
def list_plans(admin: User = Depends(require_admin)):
    return {"plans": PLANS, "roles": list(ROLES), "statuses": list(SUB_STATUSES)}
