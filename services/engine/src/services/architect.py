import json
import logging
from src.core.config import settings
from src.models.schemas import UserProfile, IncomingPayment

logger = logging.getLogger(__name__)

ARCHITECT_PROMPT = """You are the Architect — the AI brain of AFE
(Autonomous Finance Engine).

Your job is to analyse an incoming payment for a gig economy worker and:
1. Determine confidence in the split decision (0.0 to 1.0)
2. Write a plain-English reasoning for the split
3. Output structured JSON only

User profile:
- Name: {name}
- Type: {user_type}
- Annual income estimate: ₹{annual_income:,.0f}
- Tax rate: {tax_rate_pct}%
- Collaborator: {collaborator_name} at {collaborator_rate_pct}%

Incoming payment:
- Amount: ₹{amount:,.0f}
- Source: {source}

Respond ONLY with this JSON — no preamble, no markdown:
{{
  "confidence": <float 0.0-1.0>,
  "reasoning": "<one sentence explaining the split decision>"
}}

Confidence rules:
- 0.90+ if source is clear and amounts are standard
- 0.50-0.89 if source is ambiguous or amount is unusual
- below 0.50 if source is completely unrecognised or suspicious
"""


async def run_architect(
    payment: IncomingPayment,
    user: UserProfile,
) -> tuple[float, str]:
    # --- DETERMINISTIC FAST-PATH FOR RAZORPAY ---
    source_lower = payment.source.lower()
    if "razorpay" in source_lower or "rzp" in source_lower:
        return 1.0, "Razorpay Fast-Path: Payment source verified as trusted payment gateway."
    # --------------------------------------------

    prompt = ARCHITECT_PROMPT.format(
        name=user.name,
        user_type=user.user_type,
        annual_income=user.annual_income_estimate,
        tax_rate_pct=int(user.tax_rate * 100),
        collaborator_name=user.collaborator_name,
        collaborator_rate_pct=int(user.collaborator_rate * 100),
        amount=payment.amount,
        source=payment.source,
    )
    last_error = None
    for caller in [_call_groq, _call_nvidia, _call_together]:
        try:
            return await caller(prompt)
        except Exception as exc:
            last_error = exc
            logger.warning("Architect LLM call failed (%s): %s",
                           caller.__name__, exc)
    # All providers failed — use explicit error instead of mock fallback
    return 0.0, f"SYSTEM ERROR: Architect AI providers (Groq/Nvidia/Together) failed. Error: {str(last_error)}"


async def _call_groq(prompt: str) -> tuple[float, str]:
    from groq import Groq
    client = Groq(api_key=settings.groq_api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=256,
        temperature=0.1,
    )
    raw = response.choices[0].message.content.strip()
    data = json.loads(raw)
    return float(data["confidence"]), str(data["reasoning"])


async def _call_nvidia(prompt: str) -> tuple[float, str]:
    from openai import OpenAI
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=settings.nvidia_api_key,
    )
    response = client.chat.completions.create(
        model="nvidia/llama-3.1-nemotron-ultra-253b-v1",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=256,
        temperature=0.1,
    )
    raw = response.choices[0].message.content.strip()
    data = json.loads(raw)
    return float(data["confidence"]), str(data["reasoning"])


async def _call_together(prompt: str) -> tuple[float, str]:
    from together import Together
    client = Together(api_key=settings.together_api_key)
    response = client.chat.completions.create(
        model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=256,
        temperature=0.1,
    )
    raw = response.choices[0].message.content.strip()
    data = json.loads(raw)
    return float(data["confidence"]), str(data["reasoning"])
