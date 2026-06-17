import { afterEach, describe, expect, it } from "vitest";
import {
  secureFolderTokenGetter,
  useSecureFoldersStore,
} from "@/features/secure-folders";

const nowSeconds = () => Math.floor(Date.now() / 1000);

afterEach(() => useSecureFoldersStore.getState().clearAll());

describe("secureFolderTokenGetter", () => {
  it("resolves both namespaces ancestor-aware for a deep path", () => {
    const s = useSecureFoldersStore.getState();
    s.setToken("encrypted", "work", "ENC", nowSeconds() + 300);
    s.setToken("hidden", "work/secret", "HID", nowSeconds() + 300);

    expect(secureFolderTokenGetter("work/secret/file.txt")).toEqual({
      folder: "ENC",
      hidden: "HID",
    });
  });

  it("returns only the namespace that applies", () => {
    useSecureFoldersStore
      .getState()
      .setToken("encrypted", "work", "ENC", nowSeconds() + 300);
    expect(secureFolderTokenGetter("work/other")).toEqual({ folder: "ENC" });
  });

  it("returns null when nothing applies", () => {
    expect(secureFolderTokenGetter("nowhere")).toBeNull();
  });

  it("excludes expired tokens", () => {
    useSecureFoldersStore
      .getState()
      .setToken("encrypted", "work", "ENC", nowSeconds() - 1);
    expect(secureFolderTokenGetter("work/x")).toBeNull();
  });
});
