import json
import logging
from src.core.config import settings
from src.models.schemas import EmailClassification

logger = logging.getLogger(__name__)

EMAIL_CLASSIFIER_PROMPT = """You are AFE's elite email classifier. Your primary directive is to protect the user's financial income flow.
You have been called because a deterministic check could not identify the email.

Email:
From: {from_email}
Subject: {subject}
Body: {body}

STRICT CLASSIFICATION RULES:
1. PAYMENT: Only use if this is clearly a financial credit notification with a verifiable INR amount.
2. DEAL: Use for collaboration, sponsorship, or brand deal offers. MUST set recommended_action to 'vet'.
3. SPAM (DEFAULT FOR UNTRUSTED): If the email is irregular, has a suspicious format, uses shortlinks (bit.ly, t.co), or comes from an untrusted personal address with no context, mark as SPAM.
4. UNKNOWN: Use only for generic communication with no financial relevance.

Respond ONLY with valid JSON:
{{
  "category": "<payment|deal|spam|unknown>",
  "extracted_amount": <float INR or null>,
  "extracted_source": "<payer name or null>",
  "deal_description": "<full deal context or null>",
  "confidence": <float 0.0-1.0>,
  "reasoning": "<one sentence explanation>",
  "recommended_action": "<split|vet|ignore>"
}}"""


async def classify_email(
    email_id: str,
    from_email: str,
    subject: str,
    body: str,
) -> EmailClassification:
    """
    Deterministic Email Classification Engine (v3)
    1. Trusted Gateways (Razorpay, PayTM, etc.) -> SPLIT (100% confidence)
    2. Vetting/Deal Keywords -> VET (100% confidence)
    3. Irregular/Untrusted/Obvious Spam -> SPAM (100% confidence)
    4. Anything else -> AI fallback (Skeptical)
    """
    logger.info(f"Classifying email: FROM={from_email} | SUBJECT={subject}")
    
    from_lower = from_email.lower()
    subj_lower = subject.lower()
    body_lower = body.lower()
    full_text = f"{subj_lower} {body_lower}"

    # 1. Trusted Payment Gateways (Razorpay, PayTM, PhonePe, GPay, etc.)
    TRUSTED_GATEWAYS = ["razorpay", "rzp", "paytm", "phonepe", "gpay", "googlepay", "stripe", "paypal"]
    is_trusted = any(k in from_lower or k in subj_lower for k in TRUSTED_GATEWAYS)
    
    if is_trusted:
        import re
        amount = 0.0
        match = re.search(r"(?:₹|Rs\.?|INR)\s?([\d,]+(?:\.\d+)?)", full_text, re.IGNORECASE)
        if match:
            amount = float(match.group(1).replace(",", ""))
        
        logger.info(f"TRUSTED GATEWAY DETECTED: {from_email} | Amount: {amount}")
        return EmailClassification(
            email_id=email_id,
            category="payment",
            extracted_amount=amount,
            extracted_source="Trusted Gateway",
            confidence=1.0,
            reasoning=f"Deterministic match: {from_email} is a trusted payment provider. Auto-accepting for split.",
            recommended_action="split",
        )

    # 2. Vetting / Brand Deals
    VETTING_KEYWORDS = ["collaboration", "brand deal", "partnership", "sponsorship", "offer", "budget", "campaign"]
    is_vetting = any(k in subj_lower or k in body_lower for k in VETTING_KEYWORDS)
    
    if is_vetting:
        logger.info(f"VETTING REQUEST DETECTED: {subject}")
        return EmailClassification(
            email_id=email_id,
            category="deal",
            deal_description=f"Subject: {subject}\n\nBody: {body[:500]}...",
            confidence=1.0,
            reasoning="Deterministic match: Vetting/Deal keywords found. Routing to Vetting page.",
            recommended_action="vet",
        )

    # 3. Irregular / Bad Format / Obvious Spam
    # Example: "credited Rs5000... bit.ly/..." or no real sender name
    is_obvious_spam = "bit.ly" in full_text or "t.co" in full_text or "account has been credited" in full_text
    is_suspicious = "@" not in from_email or len(from_email) < 5
    
    if is_obvious_spam or is_suspicious:
        logger.info(f"SPAM/IRREGULAR DETECTED: {from_email} | {subject}")
        return EmailClassification(
            email_id=email_id,
            category="spam",
            confidence=1.0,
            reasoning="Deterministic match: Irregular format or untrusted source detected. Sending to spam.",
            recommended_action="ignore",
        )

    # 4. Fallback to AI for non-obvious cases
    # --------------------------------------------

    prompt = EMAIL_CLASSIFIER_PROMPT.format(
        from_email=from_email,
        subject=subject,
        body=body[:1500],
    )
    
    last_error = None
    for caller in [_call_groq, _call_nvidia, _call_together]:
        try:
            data = await caller(prompt)
            return EmailClassification(
                email_id=email_id,
                category=data["category"],
                extracted_amount=data.get("extracted_amount"),
                extracted_source=data.get("extracted_source"),
                deal_description=data.get("deal_description"),
                confidence=float(data["confidence"]),
                reasoning=data["reasoning"],
                recommended_action=data["recommended_action"],
            )
        except Exception as exc:
            last_error = exc
            logger.warning("Email classifier failed (%s): %s", caller.__name__, exc)
    
    # NO FALLBACK: If all providers fail, we return a high-confidence 'unknown' 
    # but with a reasoning that explicitly tells the user the API is broken.
    return EmailClassification(
        email_id=email_id,
        category="unknown",
        confidence=0.0,
        reasoning=f"SYSTEM ERROR: All AI providers (Groq/Nvidia/Together) failed. Error: {str(last_error)}",
        recommended_action="ignore",
    )


async def _call_groq(prompt: str) -> dict:
    from groq import Groq
    client = Groq(api_key=settings.groq_api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400,
        temperature=0.1,
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
        temperature=0.1,
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
        temperature=0.1,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())
