import uuid
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlmodel import Session

from src.core.database import get_session
from src.models.schemas import IncomingPayment, SplitResponse
from src.models.users import get_user_async
from src.services.architect import run_architect
from src.services.builder import run_builder
from src.services.router import route_by_confidence
from src.services.glass_box import log_full_payment_flow

router = APIRouter(prefix="/split", tags=["split"])


@router.post("/", response_model=SplitResponse)
async def process_payment(
    payment: IncomingPayment,
    session: Session = Depends(get_session),
):
    # 1. Get user profile — real DB first, falls back to mock, then defaults
    user = await get_user_async(payment.user_id)

    # 2. Architect — LLM reads context and gives confidence + reasoning
    confidence, reasoning = await run_architect(payment, user)

    # 3. Confidence Router — decides auto/pending/flagged
    route = route_by_confidence(confidence)

    # 4. Builder — deterministic split
    split = run_builder(payment, user)

    # 5. Glass Box — log everything immutably
    payment_id = str(uuid.uuid4())
    try:
        log_full_payment_flow(
            session=session,
            payment_id=payment_id,
            user_id=payment.user_id,
            amount=payment.amount,
            source=payment.source,
            reasoning=reasoning,
            split=split,
            route=route,
        )
    except Exception as exc:
        # Glass Box failure must never block a payment — log and continue
        print(f"[Glass Box] logging error: {exc}")

    return SplitResponse(
        payment_id=payment_id,
        user_id=payment.user_id,
        amount=payment.amount,
        source=payment.source,
        split=split,
        route=route,
        architect_reasoning=reasoning,
        timestamp=datetime.utcnow().strftime("%H:%M:%S"),
    )
