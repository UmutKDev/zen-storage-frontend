import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";
import { Button } from "@/components/ui";

describe("ui primitives", () => {
  it("renders a wrapped Button using semantic tokens (no raw hex)", () => {
    renderWithProviders(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    // Brand action uses the `primary` token channel…
    expect(button.className).toContain("bg-primary");
    // …and never a raw hex literal.
    expect(button.className).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
