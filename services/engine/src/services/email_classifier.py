import json
import logging
from src.core.config import settings
from src.models.schemas import EmailClassification

logger = logging.getLogger(__name__)

EMAIL_CLASSIFIER_PROMPT = """You are AFE's email classifier. Read this email
and determine if it contains a financial payment notification, a deal or
collaboration offer, or is irrelevant.

Email:
From: {from_email}
Subject: {subject}
Body: {body}

Classification rules:
- payment: A specific INR amount is mentioned AND money was received or will be
- deal: A collaboration, sponsorship, or work offer with a specific budget
- spam: Lottery, crypto, phishing, fake jobs, unsolicited promotions
- unknown: Cannot determine, or no financial relevance

Extraction rules:
- For payment: extract amount as float INR and the payer name/platform
- For deal: extract the offered amount and write a vetting description with
  full context (deliverables, timeline, exclusivity, etc.)
- For spam/unknown: set all extracted fields to null

Respond ONLY with valid JSON — no preamble, no markdown, no code fences:
{{
  "category": "<payment|deal|spam|unknown>",
  "extracted_amount": <float INR or null>,
  "extracted_source": "<payer name or null>",
  "deal_description": "<full deal context string for vetting, or null>",
  "confidence": <float 0.0-1.0>,
  "reasoning": "<one sentence explaining your classification>",
  "recommended_action": "<split|vet|ignore>"
}}"""


async def classify_email(
    email_id: str,
    from_email: str,
    subject: str,
    body: str,
) -> EmailClassification:
    prompt = EMAIL_CLASSIFIER_PROMPT.format(
        from_email=from_email,
        subject=subject,
        body=body[:1500],
    )
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
            logger.warning("Email classifier failed (%s): %s",
                           caller.__name__, exc)
    return EmailClassification(
        email_id=email_id,
        category="unknown",
        confidence=0.4,
        reasoning="Classification failed across all providers — defaulting to ignore",
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
