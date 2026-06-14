import { describe, expect, it } from "vitest";
import { isPreviewableName, viewerKindForName } from "@/lib/preview";

describe("viewerKindForName", () => {
  it("dispatches by extension (case-insensitive)", () => {
    expect(viewerKindForName("a.jpg")).toBe("image");
    expect(viewerKindForName("a.PNG")).toBe("image");
    expect(viewerKindForName("a.svg")).toBe("image");
    expect(viewerKindForName("a.mp4")).toBe("video");
    expect(viewerKindForName("a.mp3")).toBe("audio");
    expect(viewerKindForName("a.pdf")).toBe("pdf");
  });

  it("promotes office formats to the Microsoft embed viewer (Stage B)", () => {
    expect(viewerKindForName("a.docx")).toBe("office");
    expect(viewerKindForName("a.DOC")).toBe("office");
    expect(viewerKindForName("a.xlsx")).toBe("office");
    expect(viewerKindForName("a.pptx")).toBe("office");
    expect(viewerKindForName("a.ppt")).toBe("office");
  });

  it("promotes text/code to the editor (Stage C)", () => {
    expect(viewerKindForName("a.txt")).toBe("editor");
    expect(viewerKindForName("a.md")).toBe("editor");
    expect(viewerKindForName("a.json")).toBe("editor");
    expect(viewerKindForName("a.ts")).toBe("editor");
    expect(viewerKindForName("a.csv")).toBe("editor");
  });

  it("leaves archives/unknown unsupported", () => {
    expect(viewerKindForName("a.zip")).toBe("unsupported");
    expect(viewerKindForName("a.bin")).toBe("unsupported");
    expect(viewerKindForName("README")).toBe("unsupported");
  });
});

describe("isPreviewableName", () => {
  it("is true only for files with an inline viewer", () => {
    expect(isPreviewableName("a.jpg")).toBe(true);
    expect(isPreviewableName("a.pdf")).toBe(true);
    expect(isPreviewableName("a.docx")).toBe(true);
    expect(isPreviewableName("a.txt")).toBe(true);
    expect(isPreviewableName("a.zip")).toBe(false);
  });
});
