import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import {
  VirtualList,
  VIRTUALIZE_THRESHOLD,
  shouldVirtualize,
} from "@/components/patterns/virtual-list";
import { renderWithProviders } from "../test-utils";

describe("shouldVirtualize", () => {
  it("is false below the threshold and true at/above it", () => {
    expect(shouldVirtualize(VIRTUALIZE_THRESHOLD - 1)).toBe(false);
    expect(shouldVirtualize(VIRTUALIZE_THRESHOLD)).toBe(true);
    expect(shouldVirtualize(0)).toBe(false);
  });
});

describe("VirtualList", () => {
  it("renders every row directly below the threshold", () => {
    const rows = ["a", "b", "c"];
    renderWithProviders(
      <VirtualList
        rows={rows}
        estimateSize={20}
        renderRow={(row) => <span>{row}</span>}
        getRowKey={(row) => row}
      />,
    );
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByText("c")).toBeInTheDocument();
  });

  it("does not render all rows when virtualized (≥ threshold)", () => {
    const rows = Array.from({ length: 200 }, (_, i) => `row-${i}`);
    renderWithProviders(
      <VirtualList
        rows={rows}
        estimateSize={20}
        renderRow={(row) => <span>{row}</span>}
        getRowKey={(row) => row}
      />,
    );
    // jsdom has no layout, so the virtualizer renders far fewer than all 200.
    expect(screen.queryAllByRole("listitem").length).toBeLessThan(200);
  });
});
