from src.models.schemas import ConfidenceRoute


def route_by_confidence(confidence: float) -> ConfidenceRoute:
    """
    Three-tier routing based on Architect confidence.
    Inspired by enterprise biometric review systems.

    >= 0.90  → auto_execute    — Builder runs immediately
    >= 0.50  → pending_approval — user sees approval card before execution  
    <  0.50  → flagged          — payment held, user must manually intervene
    """
    if confidence >= 0.90:
        return ConfidenceRoute(
            action="auto_execute",
            confidence=confidence,
            requires_approval=False,
            reason="High confidence — split executed automatically.",
        )
    elif confidence >= 0.50:
        return ConfidenceRoute(
            action="pending_approval",
            confidence=confidence,
            requires_approval=True,
            reason="Moderate confidence — please review and approve the split.",
        )
    else:
        return ConfidenceRoute(
            action="flagged",
            confidence=confidence,
            requires_approval=True,
            reason="Low confidence — payment flagged. Please verify the source and amount.",
        )
