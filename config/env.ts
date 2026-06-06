import { z } from "zod";

/**
 * Public (client-exposed) environment contract. Validated at module load so a
 * missing / malformed `NEXT_PUBLIC_*` var fails fast at boot instead of
 * surfacing as a confusing runtime error deep in the data layer.
 *
 * Only `NEXT_PUBLIC_*` vars belong here — they are inlined into the client
 * bundle by Next. Server-only secrets (AUTH_SECRET, …) are read where needed.
 */
const publicEnvSchema = z.object({
  // Base origin of the backend API (e.g. http://localhost:8080). The `Instance`
  // appends `/Api`. Required + non-empty; full URL-shape is validated softly so
  // a bare host doesn't hard-fail the build.
  NEXT_PUBLIC_API_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_API_URL is required")
    .refine((v) => !v.endsWith("/"), "must not end with a trailing slash"),
});

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid public environment variables:\n${issues}`);
}

export const env = parsed.data;

export type PublicEnv = typeof env;
