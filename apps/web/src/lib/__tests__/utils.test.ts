import { describe, it, expect } from "vitest";
import { formatINR, scoreColor, routeDisplay } from "../utils";

describe("formatINR", () => {
  it("formats a round number", () => {
    expect(formatINR(50000)).toMatch(/50,000/);
  });

  it("formats zero", () => {
    expect(formatINR(0)).toMatch(/0/);
  });

  it("formats large amount", () => {
    expect(formatINR(1200000)).toMatch(/12,00,000|1,200,000/);
  });

  it("includes currency symbol", () => {
    const result = formatINR(1000);
    expect(result).toMatch(/₹|INR/);
  });

  it("rounds decimals", () => {
    const result = formatINR(1234.56);
    // Should not show decimal places
    expect(result).not.toMatch(/\./);
  });
});

describe("scoreColor", () => {
  it("returns green for score >= 80", () => {
    expect(scoreColor(80)).toBe("text-green-700");
    expect(scoreColor(100)).toBe("text-green-700");
    expect(scoreColor(95)).toBe("text-green-700");
  });

  it("returns amber for score 60-79", () => {
    expect(scoreColor(60)).toBe("text-amber-600");
    expect(scoreColor(79)).toBe("text-amber-600");
    expect(scoreColor(70)).toBe("text-amber-600");
  });

  it("returns red for score < 60", () => {
    expect(scoreColor(59)).toBe("text-red-600");
    expect(scoreColor(0)).toBe("text-red-600");
    expect(scoreColor(30)).toBe("text-red-600");
  });

  it("handles boundary at 80", () => {
    expect(scoreColor(79)).toBe("text-amber-600");
    expect(scoreColor(80)).toBe("text-green-700");
  });

  it("handles boundary at 60", () => {
    expect(scoreColor(59)).toBe("text-red-600");
    expect(scoreColor(60)).toBe("text-amber-600");
  });
});

describe("routeDisplay", () => {
  it("auto_execute shows correct label and color", () => {
    const result = routeDisplay("auto_execute");
    expect(result.label).toBe("Auto executed");
    expect(result.color).toContain("green");
  });

  it("pending_approval shows correct label and color", () => {
    const result = routeDisplay("pending_approval");
    expect(result.label).toBe("Pending approval");
    expect(result.color).toContain("amber");
  });

  it("flagged shows correct label and color", () => {
    const result = routeDisplay("flagged");
    expect(result.label).toBe("Flagged");
    expect(result.color).toContain("red");
  });

  it("unknown action returns the action itself as label", () => {
    const result = routeDisplay("something_else");
    expect(result.label).toBe("something_else");
    expect(result.color).toContain("gray");
  });
});
