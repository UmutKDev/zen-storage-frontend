/**
 * Ambient typing for environment variables. The runtime validation lives in
 * `config/env.ts` (zod); this keeps `process.env.*` typed at the usage site.
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL: string;
      NEXT_PUBLIC_SITE_URL?: string;
      AUTH_SECRET?: string;
      AUTH_URL?: string;
    }
  }
}

export {};
