from fastapi import APIRouter
from src.models.schemas import DealVetRequest, DealVetResponse
from src.services.vetting import run_vetting_agent

router = APIRouter(prefix="/vet", tags=["vetting"])


@router.post("/", response_model=DealVetResponse)
async def vet_deal(request: DealVetRequest):
    return await run_vetting_agent(request)
