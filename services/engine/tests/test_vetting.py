import pytest
from src.models.schemas import DealVetRequest
from src.services.vetting import _estimate_market_range


def make_request(
    user_type: str,
    amount: float,
    description: str = "Test deal",
) -> DealVetRequest:
    return DealVetRequest(
        deal_description=description,
        offered_amount=amount,
        user_id="test-user",
        user_type=user_type,  # type: ignore
    )


class TestEstimateMarketRange:
    def test_creator_range_is_sensible(self):
        req = make_request("creator", 100_000)
        low, high = _estimate_market_range(req)
        assert low > 0
        assert high > low
        # creator multipliers: low=0.8, high=1.4
        assert low == pytest.approx(80_000, abs=1000)
        assert high == pytest.approx(140_000, abs=1000)

    def test_freelancer_range_is_sensible(self):
        req = make_request("freelancer", 100_000)
        low, high = _estimate_market_range(req)
        assert low > 0
        assert high > low
        # freelancer multipliers: low=0.7, high=1.5
        assert low == pytest.approx(70_000, abs=1000)
        assert high == pytest.approx(150_000, abs=1000)

    def test_consultant_range_is_sensible(self):
        req = make_request("consultant", 100_000)
        low, high = _estimate_market_range(req)
        assert low > 0
        assert high > low
        # consultant multipliers: low=0.75, high=1.6
        assert low == pytest.approx(75_000, abs=1000)
        assert high == pytest.approx(160_000, abs=1000)

    def test_low_is_always_less_than_high(self):
        for user_type in ("creator", "freelancer", "consultant"):
            for amount in (10_000, 50_000, 500_000, 2_000_000):
                req = make_request(user_type, amount)
                low, high = _estimate_market_range(req)
                assert low < high, f"low >= high for {user_type} at {amount}"

    def test_range_scales_with_amount(self):
        small = make_request("freelancer", 50_000)
        large = make_request("freelancer", 200_000)
        s_low, s_high = _estimate_market_range(small)
        l_low, l_high = _estimate_market_range(large)
        assert l_low > s_low
        assert l_high > s_high


@pytest.mark.asyncio
async def test_run_vetting_agent_score_in_range():
    """Fallback vetting (no LLM key) returns score within 0-100."""
    import os
    os.environ["ANTHROPIC_API_KEY"] = ""
    os.environ["OPENAI_API_KEY"] = ""

    from src.services.vetting import run_vetting_agent

    req = make_request("freelancer", 80_000, "Website redesign project, 4 weeks")
    result = await run_vetting_agent(req)

    assert 0 <= result.score <= 100
    assert result.verdict in ("good", "fair", "underpriced", "overscoped")
    assert result.market_low > 0
    assert result.market_high > result.market_low
    assert len(result.reasoning) > 0
    assert len(result.recommendation) > 0
