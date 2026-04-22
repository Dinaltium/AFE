import json
import uuid
import random
import logging
from src.core.config import settings
from src.models.schemas import GeneratedTransaction, UserProfile

logger = logging.getLogger(__name__)

TRANSACTION_GENERATOR_PROMPT = """You are a bank transaction generator for a
finance demo application called PaySim. Generate ONE realistic bank transaction
for a {user_type} named {user_name} with annual income ₹{annual_income:,.0f}.

Transaction type distribution (choose randomly):
- credit (65%): Income received
- debit (35%): Business expense paid

For CREDIT transactions match the user type:
  Creators: YouTube/Spotify payouts, brand deal transfers, merch sales
  Freelancers: Upwork/Toptal transfers, Razorpay client payments, invoices
  Consultants: Retainer payments, speaking/workshop fees, project completions

For DEBIT transactions use realistic professional expenses:
  Software: Adobe CC ₹4,200, Notion ₹1,600, Figma ₹3,800, Slack ₹2,100
  Services: Domain renewal ₹1,200, AWS hosting ₹3,500, cloud storage ₹800
  Professional: LinkedIn Premium ₹2,800, accounting software ₹1,500

Amount ranges:
  Creator credits: ₹5,000 – ₹2,00,000
  Freelancer credits: ₹15,000 – ₹3,00,000
  Consultant credits: ₹40,000 – ₹5,00,000
  Any debits: ₹500 – ₹25,000

Respond ONLY with valid JSON — no preamble, no markdown, no code fences:
{{
  "type": "<credit|debit>",
  "amount": <float, always positive>,
  "description": "<transaction description, 3-8 words>",
  "from_entity": "<sender name for credits, payee name for debits>",
  "category": "<client_payment|platform_payout|brand_deal|expense|subscription|tax>"
}}"""


async def generate_transaction(user: UserProfile) -> GeneratedTransaction:
    prompt = TRANSACTION_GENERATOR_PROMPT.format(
        user_type=user.user_type,
        user_name=user.name,
        annual_income=user.annual_income_estimate,
    )
    reference_id = f"PAYSIM-{uuid.uuid4().hex[:8].upper()}"
    for caller in [_call_groq, _call_nvidia, _call_together]:
        try:
            data = await caller(prompt)
            return GeneratedTransaction(
                type=data["type"],
                amount=float(data["amount"]),
                description=data["description"],
                reference_id=reference_id,
                from_entity=data["from_entity"],
                category=data["category"],
            )
        except Exception as exc:
            logger.warning("Transaction generator failed (%s): %s",
                           caller.__name__, exc)
    return _fallback_transaction(user)


def _fallback_transaction(user: UserProfile) -> GeneratedTransaction:
    is_credit = random.random() < 0.65
    amount = float(random.randint(5, 50) * 1000) if is_credit else float(random.randint(5, 50) * 100)
    reference_id = f"PAYSIM-{uuid.uuid4().hex[:8].upper()}"
    return GeneratedTransaction(
        type="credit" if is_credit else "debit",
        amount=amount,
        description="Payment Received" if is_credit else "Professional Services",
        reference_id=reference_id,
        from_entity="Razorpay" if is_credit else "Adobe Systems",
        category="client_payment" if is_credit else "subscription",
    )


async def _call_groq(prompt: str) -> dict:
    from groq import Groq
    client = Groq(api_key=settings.groq_api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400,
        temperature=0.8,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


async def _call_nvidia(prompt: str) -> dict:
    from openai import OpenAI
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=settings.nvidia_api_key,
    )
    response = client.chat.completions.create(
        model="nvidia/llama-3.1-nemotron-ultra-253b-v1",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400,
        temperature=0.8,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


async def _call_together(prompt: str) -> dict:
    from together import Together
    client = Together(api_key=settings.together_api_key)
    response = client.chat.completions.create(
        model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400,
        temperature=0.8,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())
