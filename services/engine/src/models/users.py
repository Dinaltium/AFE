from __future__ import annotations

import logging
from typing import Optional

from src.core.config import settings
from src.models.schemas import UserProfile

logger = logging.getLogger(__name__)

# Three demo user profiles — used when no NEON_DATABASE_URL is configured
MOCK_USERS: dict[str, UserProfile] = {
    "aarav": UserProfile(
        id="aarav",
        name="Aarav",
        user_type="creator",
        annual_income_estimate=420000,
        tax_rate=0.20,
        collaborator_rate=0.10,
        collaborator_name="Editor",
    ),
    "priya": UserProfile(
        id="priya",
        name="Priya",
        user_type="freelancer",
        annual_income_estimate=960000,
        tax_rate=0.30,
        collaborator_rate=0.15,
        collaborator_name="Developer",
    ),
    "rohan": UserProfile(
        id="rohan",
        name="Rohan",
        user_type="consultant",
        annual_income_estimate=1440000,
        tax_rate=0.25,
        collaborator_rate=0.20,
        collaborator_name="Sub-consultant",
    ),
}


async def _fetch_profile_from_neon(user_id: str) -> Optional[UserProfile]:
    """Query user_profiles + users tables in Neon PostgreSQL."""
    try:
        import asyncpg  # type: ignore
    except ImportError:
        return None

    if not settings.neon_database_url:
        return None

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
                    p.collaborator_name
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

        return UserProfile(
            id=str(row["id"]),
            name=row["name"] or "User",
            user_type=row["user_type"] or "freelancer",
            annual_income_estimate=float(row["annual_income_estimate"] or 500000),
            tax_rate=float(row["tax_rate"] or 0.20),
            collaborator_rate=float(row["collaborator_rate"] or 0.10),
            collaborator_name=row["collaborator_name"] or "Collaborator",
        )
    except Exception as exc:
        logger.warning("Neon DB lookup failed for user %s: %s", user_id, exc)
        return None


DEFAULT_PROFILE = UserProfile(
    id="__default__",
    name="User",
    user_type="freelancer",
    annual_income_estimate=500000,
    tax_rate=0.20,
    collaborator_rate=0.10,
    collaborator_name="Collaborator",
)


async def get_user_async(user_id: str) -> UserProfile:
    """Get user profile — tries Neon first, falls back to mock, then default."""
    profile = await _fetch_profile_from_neon(user_id)
    if profile is not None:
        return profile
    mock = MOCK_USERS.get(user_id)
    if mock is not None:
        return mock
    # Real user whose profile isn't in Neon yet — use defaults
    return DEFAULT_PROFILE.model_copy(update={"id": user_id})


def get_user(user_id: str) -> Optional[UserProfile]:
    """Synchronous shim — used by non-async code paths."""
    return MOCK_USERS.get(user_id)


def get_all_users() -> list[UserProfile]:
    return list(MOCK_USERS.values())
