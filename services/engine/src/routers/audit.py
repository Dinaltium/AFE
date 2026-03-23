from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from src.core.database import get_session
from src.models.schemas import AuditEventRead
from src.services.glass_box import get_audit_log

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/", response_model=list[AuditEventRead])
def get_logs(
    user_id: str | None = Query(default=None),
    limit: int = Query(default=50, le=200),
    session: Session = Depends(get_session),
):
    return get_audit_log(session, user_id=user_id, limit=limit)
