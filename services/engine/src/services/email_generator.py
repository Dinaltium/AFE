import json
import random
import logging
from src.core.config import settings
from src.models.schemas import GeneratedEmail, UserProfile

logger = logging.getLogger(__name__)

EMAIL_GENERATOR_PROMPT = """You are an email generator for a finance demo app.
Generate ONE realistic email for a {user_type} named {user_name}.

Choose one of these types (weight toward financial):
- payment_confirmation (35%): A payment has been received/credited
- brand_deal (25%): A brand or company offering a collaboration
- invoice_reminder (15%): A client sending a payment reminder or invoice
- spam (15%): Generic spam — lottery, crypto, fake job, phishing
- newsletter (10%): Industry newsletter or platform announcement

SENDER EMAIL RULES — must look real but slightly off (not legitimate):
  Good: noreply.payments@razorpaymail.com, brand.india@nikecorp.net
  Good: aarav.payments@youtube-adsense.co, payments@upwork-notifications.com
  Good: soccer23@gmail.com, deals.india2024@outlook.com
  Bad (too obviously fake): money@bank.com, deals@deals.com

For payment_confirmation emails:
  Creators: YouTube AdSense, Spotify, Twitch, Nike, Boat, Mamaearth
  Freelancers: Upwork, Toptal, Razorpay, direct client names
  Consultants: Retainer notices, workshop fees, advisory payments
  Always include a specific INR amount

For brand_deal emails:
  Use real brand names but fake contact emails
  Include a specific budget offer in INR
  Mention deliverables (reels, posts, integration, etc.)

Respond ONLY with valid JSON — no preamble, no markdown, no code fences:
{{
  "from_name": "<realistic sender display name>",
  "from_email": "<sender email, looks real but slightly off>",
  "subject": "<email subject line>",
  "body": "<full email body, 3-6 sentences, professional tone>",
  "category": "<payment|deal|spam|newsletter|unknown>",
  "suggested_amount": <float INR if payment or deal, otherwise null>
}}"""


async def generate_email(user: UserProfile) -> GeneratedEmail:
    prompt = EMAIL_GENERATOR_PROMPT.format(
        user_type=user.user_type,
        user_name=user.name,
    )
    for caller in [_call_groq, _call_nvidia, _call_together]:
        try:
            data = await caller(prompt)
            return GeneratedEmail(
                from_name=data["from_name"],
                from_email=data["from_email"],
                subject=data["subject"],
                body=data["body"],
                category=data["category"],
                suggested_amount=data.get("suggested_amount"),
            )
        except Exception as exc:
            logger.warning("Email generator failed (%s): %s",
                           caller.__name__, exc)
    return _fallback_email(user)


def _fallback_email(user: UserProfile) -> GeneratedEmail:
    amount = float(random.randint(10, 100) * 1000)
    return GeneratedEmail(
        from_name="Razorpay Payments",
        from_email="noreply@razorpay-notifications.com",
        subject=f"Payment Credited — ₹{amount:,.0f}",
        body=(
            f"Hi {user.name}, a payment of ₹{amount:,.0f} has been credited "
            "to your linked account. Transaction reference: RZP-DEMO-0001. "
            "Please log in to view full transaction details. "
            "This is an automated notification from Razorpay."
        ),
        category="payment",
        suggested_amount=amount,
    )


async def _call_groq(prompt: str) -> dict:
    from groq import Groq
    client = Groq(api_key=settings.groq_api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=512,
        temperature=0.85,
    )
    raw = response.choices[0].message.content.strip()
    # Strip markdown fences if model includes them
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
        max_tokens=512,
        temperature=0.85,
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
        max_tokens=512,
        temperature=0.85,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())
