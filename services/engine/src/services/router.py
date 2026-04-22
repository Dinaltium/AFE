from src.models.schemas import ConfidenceRoute


def route_by_confidence(confidence: float) -> ConfidenceRoute:
    """
    Three-tier routing based on Architect confidence.
    
    >= 0.80  → auto_execute    — High trust, split executed immediately
    >= 0.50  → pending_approval — Moderate trust, user review recommended
    <  0.50  → flagged          — Low trust, manual intervention required
    """
    if confidence >= 0.80:
        return ConfidenceRoute(
            action="auto_execute",
            confidence=confidence,
            requires_approval=False,
            reason="High confidence — AFE executed the split automatically.",
        )
    elif confidence >= 0.50:
        return ConfidenceRoute(
            action="pending_approval",
            confidence=confidence,
            requires_approval=True,
            reason="Moderate confidence — please review and verify this split.",
        )
    else:
        return ConfidenceRoute(
            action="flagged",
            confidence=confidence,
            requires_approval=True,
            reason="Low confidence — payment flagged for potential inaccuracy.",
        )
