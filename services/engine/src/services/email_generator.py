import json
import random
import logging
from src.core.config import settings
from src.models.schemas import GeneratedEmail, UserProfile

logger = logging.getLogger(__name__)

EMAIL_GENERATOR_PROMPT = """You are an email generator for AFE's financial stress-test module.
Generate ONE highly realistic email for a {user_type} named {user_name}.

Choose one of these specific types:
1. payment_confirmation (40%): A legitimate-looking payment from Razorpay, PayTM, PhonePe, or a brand.
2. brand_deal / vetting (30%): A professional collaboration offer. 
   - MUST include budget in INR, deliverables, and a timeline.
   - Example: "Hi {user_name}, I am from Nike's marketing team. We have a budget of ₹50,000 for a Reel sponsorship."
3. fake_spam (30%): Dangerous, irregular, or phishing emails.
   - EXAMPLE: "X89 your account has been credited Rs5000. of Proceed to withdraw during available times. Lots redeeming! bit.ly/4vylx65 JwelryGarmentsAcesrynMore"
   - Use irregular grammar, shortlinks, and suspicious "credit" claims.

SENDER RULES:
- For payments: noreply@razorpay.in, alerts@paytm.com, etc.
- For deals: marketing@brandname.co, collaborations@agency.net.
- For spam: Random strings like "payout-v89@outlook.com" or "user5672@gmail.com".

Respond ONLY with valid JSON:
{{
  "from_name": "<sender name>",
  "from_email": "<sender email>",
  "subject": "<subject line>",
  "body": "<full body>",
  "category": "<payment|deal|spam>",
  "suggested_amount": <float INR or null>
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
    if random.random() < 0.3:
        # Generate a fake/spam email
        amount = random.randint(1000, 5000)
        return GeneratedEmail(
            from_name="Account Alerts",
            from_email="noreply.v98@gmail.com",
            subject=f"URGENT: ₹{amount} Credited",
            body=f"X89 your account has been credited Rs{amount}. of Proceed to withdraw during available times. Lots redeeming! bit.ly/4vylx65 JwelryGarmentsAcesrynMore",
            category="spam",
            suggested_amount=float(amount)
        )
    
    gateways = [
        ("Razorpay Payments", "noreply@razorpay-notifications.com"),
        ("PayTM Wallet", "alerts@paytm-payments.in"),
        ("PhonePe Support", "notifications@phonepe-corp.com")
    ]
    name, email = random.choice(gateways)
    amount = float(random.randint(10, 100) * 1000)
    return GeneratedEmail(
        from_name=name,
        from_email=email,
        subject=f"Payment Received — ₹{amount:,.0f}",
        body=(
            f"Hi {user.name}, you have received a payment of ₹{amount:,.0f} "
            f"via {name.split()[0]}. Transaction ID: {random.randint(100000, 999999)}. "
            "The funds have been added to your balance. "
            f"Thank you for using {name.split()[0]}."
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
