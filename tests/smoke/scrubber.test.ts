import { describe, expect, it } from "vitest";
import { scrub } from "@/lib/observability";

describe("PII scrubber", () => {
  it("redacts every sensitive key category", () => {
    const out = scrub({
      Email: "a@b.com",
      Path: "/users/secret/file.txt",
      Filename: "passport.pdf",
      Name: "Jane Doe",
      Authorization: "Bearer xyz",
      Cookie: "session=1",
      "X-Session-Id": "sess_123",
      "X-Folder-Session": "fld_123",
      SessionToken: "tok_123",
      ApiKey: "key_123",
      visible: "keep-me",
    }) as Record<string, string>;

    for (const key of [
      "Email",
      "Path",
      "Filename",
      "Name",
      "Authorization",
      "Cookie",
      "X-Session-Id",
      "X-Folder-Session",
      "SessionToken",
      "ApiKey",
    ]) {
      expect(out[key], key).toBe("[redacted]");
    }
    expect(out.visible).toBe("keep-me");
  });

  it("redacts email + JWT values embedded in strings", () => {
    const email = scrub({ msg: "contact john@doe.io now" }) as { msg: string };
    expect(email.msg).not.toContain("john@doe.io");

    const jwt = scrub({
      note: "auth eyJhbGciOiJIUzI1NiJ9.payloadpart.signaturepart done",
    }) as { note: string };
    expect(jwt.note).not.toContain("eyJ");
  });

  it("strips presigned/S3 query strings from URLs", () => {
    const out = scrub({
      url: "https://bucket.s3.amazonaws.com/key?X-Amz-Signature=secret&exp=1",
    }) as { url: string };
    expect(out.url).toBe("https://bucket.s3.amazonaws.com/key");
    expect(out.url).not.toContain("Signature");
  });

  it("handles nested objects, arrays, and cycles", () => {
    const cyclic: Record<string, unknown> = { Email: "x@y.z" };
    cyclic.self = cyclic;
    const out = scrub({ list: [{ Email: "a@b.c" }], nested: cyclic }) as {
      list: Array<{ Email: string }>;
      nested: { Email: string };
    };
    expect(out.list[0].Email).toBe("[redacted]");
    expect(out.nested.Email).toBe("[redacted]");
  });
});
