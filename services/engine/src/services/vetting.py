import json
import re
from src.core.config import settings
from src.models.schemas import DealVetRequest, DealVetResponse

# Market rate benchmarks by user type (INR)
# These are provided to the LLM to ground its estimation
MARKET_RATES = {
    "creator": {
        "benchmark": "₹15,000 per 100k followers for a single dedicated post",
        "story_low": 2000,
        "story_high": 5000,
        "reel_low": 8000,
        "reel_high": 25000,
    },
    "freelancer": {
        "hourly_low": 1500,
        "hourly_high": 4500,
        "landing_page_min": 35000,
        "logo_design_min": 10000,
    },
    "consultant": {
        "daily_low": 12000,
        "daily_high": 40000,
        "retainer_min": 50000,
    },
}

VET_PROMPT = """You are AFE's Deal Vetting Agent. Your goal is to protect {user_type} users from being underpaid.

### YOUR TASK:
1. Analyse the deal description.
2. Estimate the effort/hours required.
3. Calculate the Market Range (low to high) using the following benchmarks:
{benchmarks}

### DEAL TO VET:
Description: {deal_description}
Offered Amount: ₹{offered_amount:,.0f}

### OUTPUT REQUIREMENTS:
Respond ONLY with a raw JSON object. No preamble, no markdown blocks.
{{
  "score": <integer 0-100>,
  "verdict": "<good|fair|underpriced|overscoped>",
  "market_low": <integer estimate>,
  "market_high": <integer estimate>,
  "reasoning": "<2 sentences explaining why the offer matches or fails the market rate based on effort>",
  "recommendation": "<one actionable sentence — e.g., 'Request at least ₹X,000' or 'Accept as is'>"
}}

Scoring guide:
- 80-100: Good deal, at or above market rate
- 60-79: Fair deal, slightly below but acceptable  
- 40-59: Underpriced, negotiate upward
- 0-39: Significantly underpriced or scope is too large for the amount
"""


def _clean_json_response(content: str) -> dict:
    """Extracts JSON from an LLM response even if it includes markdown or preamble."""
    try:
        # Try finding JSON block
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(content)
    except Exception:
        # Fallback to extreme cleaning
        content = content.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(content)


async def run_vetting_agent(request: DealVetRequest) -> DealVetResponse:
    benchmarks = json.dumps(MARKET_RATES[request.user_type], indent=2)
    
    prompt = VET_PROMPT.format(
        user_type=request.user_type,
        deal_description=request.deal_description,
        offered_amount=request.offered_amount,
        benchmarks=benchmarks
    )

    for caller in [_call_groq, _call_nvidia, _call_together]:
        try:
            data = await caller(prompt)
            return DealVetResponse(
                score=int(data["score"]),
                verdict=data["verdict"],
                market_low=float(data["market_low"]),
                market_high=float(data["market_high"]),
                reasoning=data["reasoning"],
                recommendation=data["recommendation"],
            )
        except Exception as exc:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning("Vetting LLM call failed (%s): %s",
                           caller.__name__, exc)

    raise RuntimeError("Deal Vetting Agent failed across all providers")


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


async def _call_nvidia(prompt: str) -> dict:
    from openai import OpenAI
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=settings.nvidia_api_key,
    )
    response = client.chat.completions.create(
        model="nvidia/llama-3.1-nemotron-ultra-253b-v1",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=512,
        temperature=0.1,
    )
    return json.loads(response.choices[0].message.content.strip())


async def _call_together(prompt: str) -> dict:
    from together import Together
    client = Together(api_key=settings.together_api_key)
    response = client.chat.completions.create(
        model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=512,
        temperature=0.1,
    )
    return json.loads(response.choices[0].message.content.strip())

