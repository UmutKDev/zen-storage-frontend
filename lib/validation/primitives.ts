import { z } from "zod";

/**
 * Global zod primitives reused by feature-local schemas. Feature-specific
 * schemas live in `features/<f>/lib/validation/`; these are the shared atoms.
 */
export const nonEmptyString = z.string().min(1);
export const emailSchema = z.string().email();
export const uuidSchema = z.string().uuid();
export const passwordSchema = z.string().min(8);
