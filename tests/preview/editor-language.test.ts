import { describe, expect, it } from "vitest";
import { editorLanguageForName } from "@/lib/preview";

describe("editorLanguageForName", () => {
  it("maps code extensions to CodeMirror languages (case-insensitive)", () => {
    expect(editorLanguageForName("a.js")).toBe("javascript");
    expect(editorLanguageForName("a.TS")).toBe("javascript");
    expect(editorLanguageForName("a.tsx")).toBe("javascript");
    expect(editorLanguageForName("a.json")).toBe("json");
    expect(editorLanguageForName("a.md")).toBe("markdown");
    expect(editorLanguageForName("a.html")).toBe("html");
    expect(editorLanguageForName("a.css")).toBe("css");
    expect(editorLanguageForName("a.py")).toBe("python");
    expect(editorLanguageForName("a.yml")).toBe("yaml");
  });

  it("falls back to plain for text/unmapped extensions", () => {
    expect(editorLanguageForName("a.txt")).toBe("plain");
    expect(editorLanguageForName("a.sql")).toBe("plain");
    expect(editorLanguageForName("a.csv")).toBe("plain");
    expect(editorLanguageForName("README")).toBe("plain");
  });
});
