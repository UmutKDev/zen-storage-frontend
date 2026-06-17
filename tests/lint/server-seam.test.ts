import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";

/**
 * Guards the server-only seam (CLAUDE.md rule + Phase 3D acceptance): the flat
 * ESLint config must block `@/lib/auth/server` from client surfaces and allow it
 * from route handlers. Runs the real config via the ESLint Node API so the rule
 * — not just its intent — is what's tested.
 */
const eslint = new ESLint();

async function seamErrors(filePath: string, code: string): Promise<boolean> {
  const [result] = await eslint.lintText(code, { filePath });
  return Boolean(
    result?.messages.some(
      (m) =>
        m.ruleId === "no-restricted-imports" && /server-only seam/i.test(m.message),
    ),
  );
}

const CLIENT_IMPORT =
  '"use client";\nimport { getSession } from "@/lib/auth/server";\nexport const x = getSession;\n';
const SERVER_IMPORT =
  'import { getSession } from "@/lib/auth/server";\nexport async function GET() {\n  await getSession();\n  return new Response("ok");\n}\n';

describe("server-only seam (eslint)", () => {
  it("blocks @/lib/auth/server from a client feature file", async () => {
    expect(await seamErrors("features/storage/browse/__seam.ts", CLIENT_IMPORT)).toBe(
      true,
    );
  });

  it("blocks it from a shared component", async () => {
    expect(await seamErrors("components/ui/__seam.tsx", CLIENT_IMPORT)).toBe(true);
  });

  it("allows it from a route handler", async () => {
    expect(await seamErrors("app/api/__seam/route.ts", SERVER_IMPORT)).toBe(false);
  });

  it("allows it from inside the auth lib", async () => {
    expect(await seamErrors("lib/auth/__seam.ts", SERVER_IMPORT)).toBe(false);
  });
});
