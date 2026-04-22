from __future__ import annotations

import logging
from typing import Optional

from src.core.config import settings
from src.models.schemas import UserProfile

logger = logging.getLogger(__name__)


async def _fetch_profile_from_neon(user_id: str) -> Optional[UserProfile]:
    """Query user_profiles + users tables in Neon PostgreSQL."""
    try:
        import asyncpg  # type: ignore
    except ImportError:
        raise RuntimeError("asyncpg not installed - cannot query real database")

    if not settings.neon_database_url:
        raise ValueError("NEON_DATABASE_URL not configured - strictly required")

    try:
        conn = await asyncpg.connect(settings.neon_database_url)
        try:
            row = await conn.fetchrow(
                """
                SELECT
                    u.id,
                    u.name,
                    u.user_type,
                    p.annual_income_estimate,
                    p.tax_rate,
                    p.collaborator_rate,
                    p.collaborator_name,
                    p.collaborators,
                    p.gst_enabled,
                    p.gst_rate
                FROM users u
                LEFT JOIN user_profiles p ON p.user_id = u.id
                WHERE u.id = $1
                LIMIT 1
                """,
                user_id,
            )
        finally:
            await conn.close()

        if row is None:
            return None

        # Parse collaborators if they exist
        import json
        collabs_raw = row["collaborators"]
        print(f"[DEBUG] Raw collaborators from DB: {collabs_raw} (Type: {type(collabs_raw)})")
        collabs = []
        if collabs_raw:
            try:
                # asyncpg should return list for jsonb, but handle string just in case
                raw_list = collabs_raw if isinstance(collabs_raw, list) else json.loads(collabs_raw)
                
                for i, c in enumerate(raw_list):
                    print(f"[DEBUG] Processing collaborator {i}: {c}")
                    # Ensure name and rate exist
                    name = c.get("name") or c.get("label") or f"Collaborator {i+1}"
                    raw_rate = c.get("rate") or c.get("percentage") or 0
                    
                    try:
                        rate = float(raw_rate)
                        # Handle both 0.10 and 10% formats
                        if rate > 1.0:
                            rate = rate / 100.0
                    except:
                        rate = 0.0
                        
                    collabs.append({
                        "name": str(name),
                        "rate": float(rate)
                    })
                print(f"[DEBUG] Final parsed collaborators: {collabs}")
            except Exception as e:
                logger.error("Failed to parse collaborators JSON for user %s: %s", user_id, e)
                print(f"[DEBUG] ERROR parsing collaborators: {e}")

        return UserProfile(
            id=str(row["id"]),
            name=row["name"] or "User",
            user_type=row["user_type"] or "freelancer",
            annual_income_estimate=float(row["annual_income_estimate"] or 0),
            tax_rate=float(row["tax_rate"] or 0),
            collaborator_rate=float(row["collaborator_rate"] or 0),
            collaborator_name=row["collaborator_name"] or "",
            collaborators=collabs,
            gst_enabled=bool(row["gst_enabled"] or False),
            gst_rate=float(row["gst_rate"] or 0.18),
        )
    except Exception as exc:
        logger.error("Database lookup failed for user %s: %s", user_id, exc)
        raise exc


async def get_user_async(user_id: str) -> UserProfile:
    """Get user profile — strictly requires real DB record."""
    profile = await _fetch_profile_from_neon(user_id)
    if profile is None:
        raise ValueError(f"User profile with ID {user_id} not found in database.")
    return profile


def get_user(user_id: str) -> Optional[UserProfile]:
    """Synchronous shim — strictly requires real DB (not implemented for sync)."""
    raise NotImplementedError("Synchronous DB lookup not implemented - use async version")


def get_all_users() -> list[UserProfile]:
    """Strictly requires real DB (not implemented)."""
    raise NotImplementedError("Listing all users not implemented for real DB yet")
