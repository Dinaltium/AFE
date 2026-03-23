import pytest
from src.models.schemas import IncomingPayment
from src.models.users import get_user
from src.services.builder import run_builder
from src.services.router import route_by_confidence


# ── Builder Tests ─────────────────────────────────────────────────────────────

def test_builder_creator_split():
    payment = IncomingPayment(amount=50000, source="Nike brand deal", user_id="aarav")
    user = get_user("aarav")
    result = run_builder(payment, user)
    assert result.tax_amount == 10000.0
    assert result.collaborator_amount == 4000.0
    assert result.owner_amount == 36000.0
    assert round(result.tax_amount + result.collaborator_amount + result.owner_amount, 2) == 50000.0


def test_builder_freelancer_split():
    payment = IncomingPayment(amount=80000, source="Razorpay invoice", user_id="priya")
    user = get_user("priya")
    result = run_builder(payment, user)
    assert result.tax_amount == 24000.0
    assert result.collaborator_amount == 8400.0
    assert result.owner_amount == 47600.0
    assert round(result.tax_amount + result.collaborator_amount + result.owner_amount, 2) == 80000.0


def test_builder_consultant_split():
    payment = IncomingPayment(amount=120000, source="Startup retainer", user_id="rohan")
    user = get_user("rohan")
    result = run_builder(payment, user)
    assert result.tax_amount == 30000.0
    assert result.collaborator_amount == 18000.0
    assert result.owner_amount == 72000.0
    assert round(result.tax_amount + result.collaborator_amount + result.owner_amount, 2) == 120000.0


def test_builder_totals_always_sum_to_payment():
    for amount in [10000, 33333, 99999.99, 1234567.89]:
        payment = IncomingPayment(amount=amount, source="Test", user_id="aarav")
        user = get_user("aarav")
        result = run_builder(payment, user)
        total = round(result.tax_amount + result.collaborator_amount + result.owner_amount, 2)
        assert total == round(amount, 2), f"Split mismatch for {amount}: got {total}"


# ── Confidence Router Tests ───────────────────────────────────────────────────

def test_router_auto_execute():
    route = route_by_confidence(0.95)
    assert route.action == "auto_execute"
    assert route.requires_approval is False


def test_router_pending_approval():
    route = route_by_confidence(0.72)
    assert route.action == "pending_approval"
    assert route.requires_approval is True


def test_router_flagged():
    route = route_by_confidence(0.30)
    assert route.action == "flagged"
    assert route.requires_approval is True


def test_router_boundary_conditions():
    assert route_by_confidence(0.90).action == "auto_execute"
    assert route_by_confidence(0.50).action == "pending_approval"
    assert route_by_confidence(0.499).action == "flagged"
