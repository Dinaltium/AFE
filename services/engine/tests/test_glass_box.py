import pytest
from sqlmodel import Session, SQLModel, create_engine, select

from src.models.schemas import AuditEvent
from src.services.glass_box import log_event, get_audit_log


@pytest.fixture(name="session")
def session_fixture():
    """In-memory SQLite session for each test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


class TestLogEvent:
    def test_log_event_creates_record(self, session: Session):
        event = log_event(
            session=session,
            payment_id="pay-001",
            user_id="user-001",
            event_type="PaymentReceived",
            description="Nike brand deal ₹50,000",
            amount=50000.0,
        )

        assert event.id is not None
        assert event.payment_id == "pay-001"
        assert event.user_id == "user-001"
        assert event.event_type == "PaymentReceived"
        assert event.amount == 50000.0

    def test_log_event_persists_to_db(self, session: Session):
        log_event(
            session=session,
            payment_id="pay-002",
            user_id="user-002",
            event_type="SplitExecuted",
            description="Split completed",
        )

        rows = session.exec(
            select(AuditEvent).where(AuditEvent.payment_id == "pay-002")
        ).all()
        assert len(rows) == 1
        assert rows[0].event_type == "SplitExecuted"

    def test_log_event_without_amount(self, session: Session):
        event = log_event(
            session=session,
            payment_id="pay-003",
            user_id="user-003",
            event_type="ArchitectDecision",
            description="Confidence 0.92 — auto execute",
        )
        assert event.amount is None

    def test_multiple_events_for_payment(self, session: Session):
        for event_type in ("PaymentReceived", "ArchitectDecision", "SplitExecuted"):
            log_event(
                session=session,
                payment_id="pay-004",
                user_id="user-004",
                event_type=event_type,
                description=f"{event_type} event",
                amount=10000.0 if event_type == "PaymentReceived" else None,
            )

        rows = session.exec(
            select(AuditEvent).where(AuditEvent.payment_id == "pay-004")
        ).all()
        assert len(rows) == 3


class TestGetAuditLog:
    def test_returns_events_in_descending_order(self, session: Session):
        import time

        for i in range(3):
            log_event(
                session=session,
                payment_id=f"pay-desc-{i}",
                user_id="user-order",
                event_type="PaymentReceived",
                description=f"Payment {i}",
                amount=float(i * 1000),
            )
            time.sleep(0.01)  # Ensure ordering in SQLite

        results = get_audit_log(session, user_id="user-order")
        assert len(results) == 3
        # Most recent should be first
        assert results[0].payment_id == "pay-desc-2"
        assert results[-1].payment_id == "pay-desc-0"

    def test_filters_by_user_id(self, session: Session):
        for uid in ("alice", "bob", "alice"):
            log_event(
                session=session,
                payment_id=f"pay-{uid}",
                user_id=uid,
                event_type="PaymentReceived",
                description="Test",
            )

        alice_events = get_audit_log(session, user_id="alice")
        bob_events = get_audit_log(session, user_id="bob")

        assert len(alice_events) == 2
        assert len(bob_events) == 1
        assert all(e.user_id == "alice" for e in alice_events)

    def test_respects_limit(self, session: Session):
        for i in range(10):
            log_event(
                session=session,
                payment_id=f"pay-lim-{i}",
                user_id="user-lim",
                event_type="PaymentReceived",
                description=f"Payment {i}",
            )

        results = get_audit_log(session, user_id="user-lim", limit=5)
        assert len(results) == 5

    def test_returns_all_users_when_no_filter(self, session: Session):
        for uid in ("x", "y", "z"):
            log_event(
                session=session,
                payment_id=f"pay-{uid}",
                user_id=uid,
                event_type="SplitExecuted",
                description="Test",
            )

        results = get_audit_log(session)
        assert len(results) == 3

    def test_timestamp_is_formatted_string(self, session: Session):
        log_event(
            session=session,
            payment_id="pay-ts",
            user_id="user-ts",
            event_type="PaymentReceived",
            description="Test",
        )
        results = get_audit_log(session, user_id="user-ts")
        assert len(results) == 1
        # timestamp should be in HH:MM:SS format
        ts = results[0].timestamp
        assert len(ts) == 8
        assert ts[2] == ":"
        assert ts[5] == ":"
