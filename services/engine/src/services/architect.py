import json
from src.core.config import settings
from src.models.schemas import UserProfile, IncomingPayment


ARCHITECT_PROMPT = """You are the Architect — the AI brain of AFE (Autonomous Finance Engine).

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
  "reasoning": "<one sentence explaining the split decision in plain English, mentioning tax bracket and collaborator agreement>"
}}

Confidence rules:
- 0.90+ if source is clear and amounts are standard
- 0.50-0.89 if source is ambiguous or amount is unusual
- below 0.50 if source is completely unrecognised or amount is suspiciously large/small
"""


async def run_architect(
    payment: IncomingPayment,
    user: UserProfile,
) -> tuple[float, str]:
    """
    Calls LLM to get confidence score and plain-English reasoning.
    Returns (confidence: float, reasoning: str)
    """
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

    try:
        if settings.llm_provider == "anthropic":
            return await _call_anthropic(prompt)
        elif settings.llm_provider == "groq":
            return await _call_groq(prompt)
        else:
            return await _call_openai(prompt)
    except Exception as e:
        # Fallback — don't crash the whole payment flow
        print(f"Architect LLM error: {e}")
        return 0.85, (
            f"Estimated {int(user.tax_rate * 100)}% tax based on ₹{user.annual_income_estimate:,.0f} "
            f"annual income. {user.collaborator_name} on {int(user.collaborator_rate * 100)}% "
            f"per standard agreement."
        )


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


async def _call_anthropic(prompt: str) -> tuple[float, str]:
    import anthropic
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()
    data = json.loads(raw)
    return float(data["confidence"]), str(data["reasoning"])


async def _call_openai(prompt: str) -> tuple[float, str]:
    from openai import OpenAI
    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=256,
    )
    raw = response.choices[0].message.content.strip()
    data = json.loads(raw)
    return float(data["confidence"]), str(data["reasoning"])
