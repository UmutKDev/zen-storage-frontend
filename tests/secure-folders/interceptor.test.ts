import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { secureFolderRequestInterceptor } from "@/service/interceptors/secure-folder";
import { registerSecureFolderTokenSource } from "@/service/token-sources";

function mockConfig(
  over: Partial<{ url: string; params: unknown; data: unknown }>,
) {
  const set = vi.fn();
  // Minimal InternalAxiosRequestConfig — the interceptor only reads url/params/
  // data and calls headers.set().
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = { url: "", headers: { set }, ...over } as any;
  return { config, set };
}

const received: string[] = [];

beforeEach(() => {
  received.length = 0;
  registerSecureFolderTokenSource((path) => {
    received.push(path);
    return path.startsWith("work") ? { folder: "ENC" } : null;
  });
});
afterEach(() => registerSecureFolderTokenSource(() => null));

describe("secureFolderRequestInterceptor", () => {
  it("extracts Path from a GET query string → folder header", () => {
    const { config, set } = mockConfig({
      url: "/Api/Cloud/List/Directories?Path=work%2Fsecret&Delimiter=true",
    });
    secureFolderRequestInterceptor(config);
    expect(received).toContain("work/secret");
    expect(set).toHaveBeenCalledWith("X-Folder-Session", "ENC");
  });

  it("extracts Key from a GET query string", () => {
    const { config } = mockConfig({ url: "/Api/Cloud/Download?Key=work%2Ffile.txt" });
    secureFolderRequestInterceptor(config);
    expect(received).toContain("work/file.txt");
  });

  it("extracts Path from a JSON-stringified POST body (the real runtime shape)", () => {
    // The generated client serializes the body to a string before interceptors run.
    const { config, set } = mockConfig({
      url: "/Api/Cloud/Directory/Unlock",
      data: JSON.stringify({ Path: "work" }),
    });
    secureFolderRequestInterceptor(config);
    expect(received).toContain("work");
    expect(set).toHaveBeenCalledWith("X-Folder-Session", "ENC");
  });

  it("extracts Path from a still-object POST body (bypassed serialization)", () => {
    const { config } = mockConfig({
      url: "/Api/Cloud/Directory/Unlock",
      data: { Path: "work" },
    });
    secureFolderRequestInterceptor(config);
    expect(received).toContain("work");
  });

  it("extracts Key from a multipart FormData body (UploadPart into an encrypted folder)", () => {
    // `UploadPart` is the one Cloud mutation that sends its Key via
    // multipart/form-data, so `config.data` is a FormData instance (not a JSON
    // string / plain object) — the token must still resolve, or uploads into an
    // unlocked encrypted folder 403.
    const data = new FormData();
    data.append("Key", "work/file.txt");
    data.append("UploadId", "u1");
    data.append("PartNumber", "1");
    const { config, set } = mockConfig({
      url: "/Api/Cloud/Upload/UploadPart",
      data,
    });
    secureFolderRequestInterceptor(config);
    expect(received).toContain("work/file.txt");
    expect(set).toHaveBeenCalledWith("X-Folder-Session", "ENC");
  });

  it("extracts Path from a nested request-model wrapper (stringified)", () => {
    const { config } = mockConfig({
      url: "/Api/Cloud/Directory/Lock",
      data: JSON.stringify({ directoryLockRequestModel: { Path: "work" } }),
    });
    secureFolderRequestInterceptor(config);
    expect(received).toContain("work");
  });

  it("tolerates a non-JSON string body without throwing", () => {
    const { config, set } = mockConfig({
      url: "/Api/Cloud/Something",
      data: "--multipart-binary--",
    });
    expect(() => secureFolderRequestInterceptor(config)).not.toThrow();
    expect(set).not.toHaveBeenCalled();
  });

  it("treats a present-but-empty Path query as the root folder", () => {
    // The root listing sends `?Path=`; the extractor must resolve the root path
    // ("") — not skip it — so a root-scoped hidden token reaches the listing.
    const { config } = mockConfig({
      url: "/Api/Cloud/List/Directories?Path=&Delimiter=true",
    });
    secureFolderRequestInterceptor(config);
    expect(received).toContain("");
  });

  it("skips non-/Cloud requests entirely", () => {
    const { config, set } = mockConfig({ url: "/Api/User/Me" });
    secureFolderRequestInterceptor(config);
    expect(received).toEqual([]);
    expect(set).not.toHaveBeenCalled();
  });

  it("skips /Cloud requests with no path (e.g. usage)", () => {
    const { config, set } = mockConfig({ url: "/Api/Cloud/Usage" });
    secureFolderRequestInterceptor(config);
    expect(received).toEqual([]);
    expect(set).not.toHaveBeenCalled();
  });

  it("attaches no header when the source returns null", () => {
    const { config, set } = mockConfig({
      url: "/Api/Cloud/List/Directories?Path=elsewhere",
    });
    secureFolderRequestInterceptor(config);
    expect(received).toContain("elsewhere");
    expect(set).not.toHaveBeenCalled();
  });
});
