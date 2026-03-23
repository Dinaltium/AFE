import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "../ui/StatCard";

describe("StatCard", () => {
  it("renders the label", () => {
    render(<StatCard label="Total Processed" value="₹1,00,000" />);
    expect(screen.getByText("Total Processed")).toBeDefined();
  });

  it("renders the value", () => {
    render(<StatCard label="Tax Reserved" value="₹20,000" />);
    expect(screen.getByText("₹20,000")).toBeDefined();
  });

  it("applies custom valueClassName", () => {
    const { container } = render(
      <StatCard label="Score" value="85" valueClassName="text-green-700" />,
    );
    const valueEl = container.querySelector(".text-green-700");
    expect(valueEl).not.toBeNull();
    expect(valueEl?.textContent).toBe("85");
  });

  it("renders without optional className", () => {
    const { container } = render(
      <StatCard label="Take-home" value="₹72,000" />,
    );
    // Should still render both label and value
    expect(container.textContent).toContain("Take-home");
    expect(container.textContent).toContain("₹72,000");
  });
});
