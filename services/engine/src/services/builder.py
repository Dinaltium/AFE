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
    2. Collaborators get their % of the remaining amount (individually)
    3. Owner keeps the rest
    """
    amount = payment.amount
    
    # GST and TDS logic
    gst_enabled = getattr(user, "gst_enabled", False)
    gst_rate = getattr(user, "gst_rate", 0.18)
    
    gst_amount = 0.0
    tds_credit = 0.0
    if payment.gst_applicable or gst_enabled:
        # For business-to-business, we assume GST (18%) and TDS (10%)
        # Note: Professional fees usually attract 10% TDS (Sec 194J)
        gst_amount = round(amount * gst_rate, 2)
        tds_credit = round(amount * 0.10, 2)

    # Progressive tax calculation
    if user.tax_rate == 0.20:
        effective_tax_rate = calculate_tax_slab(user.annual_income_estimate)
        tax_regime = "slab"
    else:
        effective_tax_rate = user.tax_rate
        tax_regime = "manual"

    # Step 1 — tax off the top (from the base professional fee)
    tax_amount = round(amount * effective_tax_rate, 2)
    after_tax = amount - tax_amount

    # Step 2 — collaborators cut from remainder
    collaborator_splits = []
    total_collaborator_amount = 0.0
    
    # Handle the new multi-collaborator list if present, else fallback to legacy
    collaborators = user.collaborators or []
    print(f"[DEBUG] User: {user.name} | Collaborators from profile: {collaborators}")
    
    # If no collaborators in list but legacy field has a name, add it as a temporary collaborator
    if not collaborators and user.collaborator_name and user.collaborator_rate > 0:
        from src.models.schemas import Collaborator
        collaborators = [Collaborator(name=user.collaborator_name, rate=user.collaborator_rate)]
        print(f"[DEBUG] Using legacy collaborator fallback: {collaborators}")

    for collab in collaborators:
        c_amount = round(after_tax * collab.rate, 2)
        collaborator_splits.append({
            "name": collab.name,
            "amount": c_amount,
            "rate": collab.rate
        })
        total_collaborator_amount += c_amount

    total_collaborator_amount = round(total_collaborator_amount, 2)

    # Step 3 — owner keeps the rest
    owner_amount = round(amount - tax_amount - total_collaborator_amount, 2)

    # Net Receivable
    net_receivable = round(owner_amount + tds_credit, 2)
    owner_rate = round(owner_amount / amount, 4) if amount > 0 else 0.0

    return SplitResult(
        tax_amount=tax_amount,
        collaborator_amount=total_collaborator_amount,
        collaborator_splits=collaborator_splits,
        owner_amount=owner_amount,
        tax_rate=user.tax_rate,
        owner_rate=owner_rate,
        effective_tax_rate=effective_tax_rate,
        tax_regime=tax_regime,
        gst_amount=gst_amount,
        tds_credit=tds_credit,
        net_receivable=net_receivable,
    )
