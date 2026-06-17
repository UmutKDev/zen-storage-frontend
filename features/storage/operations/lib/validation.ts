import { z } from "zod";
import { t } from "@/lib/i18n";

/** Shared name schema for create + rename (non-empty, no path separators). */
export const nameSchema = z.object({
  name: z
    .string()
    .min(1, t("storage.ops.errors.nameRequired"))
    .refine((value) => !value.includes("/"), t("storage.ops.errors.invalidName")),
});

export type NameValues = z.infer<typeof nameSchema>;
