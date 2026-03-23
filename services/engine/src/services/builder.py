from src.models.schemas import UserProfile, IncomingPayment, SplitResult


def run_builder(payment: IncomingPayment, user: UserProfile) -> SplitResult:
    """
    Deterministic split engine — pure math, no AI.
    Same input ALWAYS produces the same output.
    
    Split order:
    1. Tax is taken first (off the top)
    2. Collaborator gets their % of the remaining amount
    3. Owner keeps the rest
    """
    amount = payment.amount

    # Step 1 — tax off the top
    tax_amount = round(amount * user.tax_rate, 2)
    after_tax = amount - tax_amount

    # Step 2 — collaborator cut from remainder
    collaborator_amount = round(after_tax * user.collaborator_rate, 2)

    # Step 3 — owner keeps the rest (avoids floating point drift)
    owner_amount = round(amount - tax_amount - collaborator_amount, 2)

    # Effective rates relative to original amount (for display)
    owner_rate = round(owner_amount / amount, 4)

    return SplitResult(
        tax_amount=tax_amount,
        collaborator_amount=collaborator_amount,
        owner_amount=owner_amount,
        tax_rate=user.tax_rate,
        collaborator_rate=user.collaborator_rate,
        owner_rate=owner_rate,
    )
