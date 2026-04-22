import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from src.models.schemas import GeneratedEmail, GeneratedTransaction, EmailClassification
from src.models.users import get_user_async
from src.services.email_generator import generate_email
from src.services.email_classifier import classify_email
from src.services.transaction_generator import generate_transaction

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/connectors", tags=["connectors"])


class GenerateEmailRequest(BaseModel):
    user_id: str


class ClassifyEmailRequest(BaseModel):
    email_id: str
    from_email: str
    subject: str
    body: str


class GenerateTransactionRequest(BaseModel):
    user_id: str


@router.post("/generate-email", response_model=GeneratedEmail)
async def generate_email_endpoint(request: GenerateEmailRequest):
    user = await get_user_async(request.user_id)
    return await generate_email(user)


@router.post("/classify-email", response_model=EmailClassification)
async def classify_email_endpoint(request: ClassifyEmailRequest):
    return await classify_email(
        email_id=request.email_id,
        from_email=request.from_email,
        subject=request.subject,
        body=request.body,
    )


@router.post("/generate-transaction", response_model=GeneratedTransaction)
async def generate_transaction_endpoint(request: GenerateTransactionRequest):
    user = await get_user_async(request.user_id)
    return await generate_transaction(user)
