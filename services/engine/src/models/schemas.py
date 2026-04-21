from sqlmodel import SQLModel, Field
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime
import uuid


# ── User Profile ──────────────────────────────────────────────────────────────

UserType = Literal["creator", "freelancer", "consultant"]


class UserProfile(BaseModel):
    id: str
    name: str
    user_type: UserType
    annual_income_estimate: float  # in INR — used for tax bracket calc
    tax_rate: float                # e.g. 0.20 for 20%
    collaborator_rate: float       # e.g. 0.10 for 10% to editor/contractor
    collaborator_name: str         # e.g. "Editor", "Developer", "Sub-consultant"


# ── Payment ───────────────────────────────────────────────────────────────────

class IncomingPayment(BaseModel):
    amount: float                  # in INR
    source: str                    # e.g. "Nike India brand deal"
    user_id: str
    currency: str = "INR"


class SplitResult(BaseModel):
    tax_amount: float
    collaborator_amount: float
    owner_amount: float
    tax_rate: float
    collaborator_rate: float
    owner_rate: float
    effective_tax_rate: float
    tax_regime: str  # "slab" or "manual"


class ConfidenceRoute(BaseModel):
    action: Literal["auto_execute", "pending_approval", "flagged"]
    confidence: float
    requires_approval: bool
    reason: str


class SplitResponse(BaseModel):
    payment_id: str
    user_id: str
    amount: float
    source: str
    split: SplitResult
    route: ConfidenceRoute
    architect_reasoning: str
    timestamp: str


# ── Glass Box Audit Log ───────────────────────────────────────────────────────

class AuditEvent(SQLModel, table=True):
    __tablename__ = "audit_events"
    id: Optional[int] = Field(default=None, primary_key=True)
    # Use PostgreSQL UUID type so psycopg2 sends values with correct type OID.
    # UUID(as_uuid=False) accepts plain str rather than uuid.UUID objects.
    payment_id: Optional[str] = Field(
        default=None,
        sa_column=Column("payment_id", PGUUID(as_uuid=False), nullable=True),
    )
    user_id: Optional[str] = Field(
        default=None,
        sa_column=Column("user_id", PGUUID(as_uuid=False), nullable=True),
    )
    event_type: Optional[str] = None   # PaymentReceived | ArchitectDecision | SplitExecuted | PaymentFlagged
    description: Optional[str] = None
    amount: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AuditEventRead(BaseModel):
    id: int
    payment_id: str
    user_id: str
    event_type: str
    description: str
    amount: Optional[float]
    timestamp: str


# ── Deal Vetting ──────────────────────────────────────────────────────────────

class DealVetRequest(BaseModel):
    deal_description: str          # user pastes the deal details
    offered_amount: float
    user_id: str
    user_type: UserType


class DealVetResponse(BaseModel):
    score: int                     # 0-100
    verdict: Literal["good", "fair", "underpriced", "overscoped"]
    market_low: float
    market_high: float
    reasoning: str
    recommendation: str
