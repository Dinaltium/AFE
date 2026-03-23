import json
from src.core.config import settings
from src.models.schemas import DealVetRequest, DealVetResponse

# Market rate benchmarks by user type (INR)
# In production replace with real dataset lookup
MARKET_RATES = {
    "creator": {
        "low_multiplier": 0.8,
        "high_multiplier": 1.4,
        "base_per_100k_followers": 15000,
    },
    "freelancer": {
        "hourly_low": 1500,
        "hourly_high": 4000,
        "project_low_multiplier": 0.7,
        "project_high_multiplier": 1.5,
    },
    "consultant": {
        "daily_low": 8000,
        "daily_high": 25000,
        "retainer_low_multiplier": 0.75,
        "retainer_high_multiplier": 1.6,
    },
}

VET_PROMPT = """You are AFE's Deal Vetting Agent. Analyse this deal for a {user_type}.

Deal details: {deal_description}
Offered amount: ₹{offered_amount:,.0f}
Estimated market range: ₹{market_low:,.0f} – ₹{market_high:,.0f}

Respond ONLY with this JSON — no preamble, no markdown:
{{
  "score": <integer 0-100>,
  "verdict": "<good|fair|underpriced|overscoped>",
  "reasoning": "<2 sentences explaining the score relative to market rate>",
  "recommendation": "<one actionable sentence — accept, negotiate, or decline>"
}}

Scoring guide:
- 80-100: Good deal, at or above market rate
- 60-79: Fair deal, slightly below but acceptable  
- 40-59: Underpriced, negotiate upward
- 0-39: Significantly underpriced or scope is too large for the amount
"""


def _estimate_market_range(request: DealVetRequest) -> tuple[float, float]:
    """Simple market rate estimation — replace with real dataset in production."""
    amount = request.offered_amount
    rates = MARKET_RATES.get(request.user_type, MARKET_RATES["freelancer"])

    if request.user_type == "creator":
        base = amount * rates["low_multiplier"]
        return round(base, -3), round(amount * rates["high_multiplier"], -3)
    elif request.user_type == "consultant":
        return round(amount * rates["retainer_low_multiplier"], -3), round(amount * rates["retainer_high_multiplier"], -3)
    else:
        return round(amount * rates["project_low_multiplier"], -3), round(amount * rates["project_high_multiplier"], -3)


async def run_vetting_agent(request: DealVetRequest) -> DealVetResponse:
    market_low, market_high = _estimate_market_range(request)

    prompt = VET_PROMPT.format(
        user_type=request.user_type,
        deal_description=request.deal_description,
        offered_amount=request.offered_amount,
        market_low=market_low,
        market_high=market_high,
    )

    try:
        if settings.llm_provider == "anthropic":
            data = await _call_anthropic(prompt)
        elif settings.llm_provider == "groq":
            data = await _call_groq(prompt)
        else:
            data = await _call_openai(prompt)

        return DealVetResponse(
            score=int(data["score"]),
            verdict=data["verdict"],
            market_low=market_low,
            market_high=market_high,
            reasoning=data["reasoning"],
            recommendation=data["recommendation"],
        )
    except Exception as e:
        print(f"Vetting agent error: {e}")
        score = 75 if request.offered_amount >= market_low else 45
        return DealVetResponse(
            score=score,
            verdict="fair" if score >= 60 else "underpriced",
            market_low=market_low,
            market_high=market_high,
            reasoning=f"Offered ₹{request.offered_amount:,.0f} against estimated market range ₹{market_low:,.0f}–₹{market_high:,.0f}.",
            recommendation="Consider negotiating if below market midpoint." if score < 60 else "Offer is within acceptable range.",
        )


async def _call_groq(prompt: str) -> dict:
    from groq import Groq
    client = Groq(api_key=settings.groq_api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=512,
        temperature=0.1,
    )
    return json.loads(response.choices[0].message.content.strip())


async def _call_anthropic(prompt: str) -> dict:
    import anthropic
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(message.content[0].text.strip())


async def _call_openai(prompt: str) -> dict:
    from openai import OpenAI
    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=512,
    )
    return json.loads(response.choices[0].message.content.strip())
