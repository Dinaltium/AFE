from __future__ import annotations

from sqlmodel import Session, select
from src.models.schemas import AuditEvent, AuditEventRead, SplitResult, ConfidenceRoute


def log_event(
    session: Session,
    payment_id: str,
    user_id: str,
    event_type: str,
    description: str,
    amount: float | None = None,
) -> AuditEvent:
    event = AuditEvent(
        payment_id=payment_id,
        user_id=user_id,
        event_type=event_type,
        description=description,
        amount=amount,
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


def log_full_payment_flow(
    session: Session,
    payment_id: str,
    user_id: str,
    amount: float,
    source: str,
    reasoning: str,
    split: SplitResult,
    route: ConfidenceRoute,
):
    """Logs all three Glass Box entries for a complete payment flow."""

    # 1. Payment received
    log_event(
        session, payment_id, user_id,
        event_type="PaymentReceived",
        description=f"{source} · ₹{amount:,.0f}",
        amount=amount,
    )

    # 2. Architect decision
    log_event(
        session, payment_id, user_id,
        event_type="ArchitectDecision",
        description=reasoning,
    )

    # 3. Split executed (or flagged)
    if route.action == "flagged":
        log_event(
            session, payment_id, user_id,
            event_type="PaymentFlagged",
            description=route.reason,
            amount=amount,
        )
    else:
        gst_str = f" (incl. GST ₹{split.gst_amount:,.0f})" if split.gst_amount else ""
        tds_str = f" [TDS Credit: ₹{split.tds_credit:,.0f}]" if split.tds_credit else ""
        
        # Build individual collaborator segments
        collab_segments = []
        # split.collaborator_splits is a list of dicts from builder.py
        splits = split.collaborator_splits or []
        for s in splits:
            # Handle both dict and object (pydantic)
            name = s.get("name") if isinstance(s, dict) else getattr(s, "name", "Collaborator")
            c_amt = s.get("amount") if isinstance(s, dict) else getattr(s, "amount", 0)
            collab_segments.append(f"{name} ₹{c_amt:,.0f}")
        
        collab_detail = " · ".join(collab_segments) if collab_segments else f"Collaborator ₹{split.collaborator_amount:,.0f}"
        tax_pct = round(getattr(split, "tax_rate", 0) * 100)
        
        description = (
            f"Tax ₹{split.tax_amount:,.0f} ({tax_pct}%) · "
            f"{collab_detail} · "
            f"Owner ₹{split.owner_amount:,.0f} · All wallets updated."
        )

        log_event(
            session, payment_id, user_id,
            event_type="SplitExecuted",
            description=description,
            amount=amount,
        )


def get_audit_log(
    session: Session,
    user_id: str | None = None,
    limit: int = 50,
) -> list[AuditEventRead]:
    query = select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(limit)
    if user_id:
        query = query.where(AuditEvent.user_id == user_id)
    events = session.exec(query).all()
    return [
        AuditEventRead(
            id=e.id,
            payment_id=e.payment_id or "",
            user_id=e.user_id or "",
            event_type=e.event_type or "",
            description=e.description or "",
            amount=e.amount,
            timestamp=e.created_at.strftime("%H:%M:%S"),
        )
        for e in events
    ]
