import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiffView } from "@/features/preview/components/DiffView";
import type { DocumentDiffResponseModel } from "@/service/models";

const diff = (
  hunks: DocumentDiffResponseModel["Hunks"],
  stats: Partial<DocumentDiffResponseModel["Stats"]> = {},
): DocumentDiffResponseModel => ({
  Key: "k/doc.txt",
  SourceVersionId: "v2",
  TargetVersionId: "current",
  Hunks: hunks,
  Stats: { Additions: 0, Deletions: 0, Changes: 0, ...stats },
});

describe("DiffView", () => {
  it("renders the hunk header, colors lines by leading marker, and shows stats", () => {
    render(
      <DiffView
        diff={diff(
          [
            {
              OldStart: 1,
              OldLines: 2,
              NewStart: 1,
              NewLines: 2,
              Lines: ["+added line", "-removed line"],
            },
          ],
          { Additions: 1, Deletions: 1, Changes: 1 },
        )}
      />,
    );

    // Additions/deletions are colored via semantic tokens.
    expect(screen.getByText("+added line")).toHaveClass("text-success");
    expect(screen.getByText("-removed line")).toHaveClass("text-destructive");
    // Stats summary.
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument(); // hunk header @@ -1,2 +1,2 @@
  });

  it("shows a no-changes note when there are no hunks", () => {
    render(<DiffView diff={diff([])} />);
    expect(
      screen.getByText(/no changes from the current content/i),
    ).toBeInTheDocument();
  });
});
