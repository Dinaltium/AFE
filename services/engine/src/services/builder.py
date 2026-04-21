from src.models.schemas import UserProfile, IncomingPayment, SplitResult


def calculate_tax_slab(annual_income: float) -> float:
    """
    Returns the marginal tax rate based on India's FY2024-25 new tax regime slabs.
    """
    if annual_income > 15_00_000:
        return 0.30
    if annual_income > 12_00_000:
        return 0.20
    if annual_income > 10_00_000:
        return 0.15
    if annual_income > 7_00_000:
        return 0.10
    if annual_income > 3_00_000:
        return 0.05
    return 0.0


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

    # Progressive tax calculation
    # Only use slab calculation when user.tax_rate is the default 0.20
    if user.tax_rate == 0.20:
        effective_tax_rate = calculate_tax_slab(user.annual_income_estimate)
        tax_regime = "slab"
    else:
        effective_tax_rate = user.tax_rate
        tax_regime = "manual"

    # Step 1 — tax off the top
    tax_amount = round(amount * effective_tax_rate, 2)
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
        effective_tax_rate=effective_tax_rate,
        tax_regime=tax_regime,
    )
