"use client";

import { useRef, useState } from "react";
import type { ConflictDetailsResponseModel } from "@/service/models";
import { extractConflictDetails, type ConflictStrategy } from "../lib/conflict";

/**
 * Shared conflict-retry primitive. First attempt uses the backend default
 * (FAIL); a 409 opens the `ConflictPrompt` with the parsed details; picking a
 * strategy re-issues the op. Non-conflict errors are toasted centrally by the
 * Instance (rule #9), so they're swallowed here.
 */
export function useConflictMutation<TVars>(opts: {
  run: (vars: TVars, strategy?: ConflictStrategy) => Promise<void>;
  onSuccess?: () => void;
}) {
  const [conflict, setConflict] = useState<ConflictDetailsResponseModel | null>(
    null,
  );
  const [isPending, setIsPending] = useState(false);
  const varsRef = useRef<TVars | null>(null);

  const attempt = async (vars: TVars, strategy?: ConflictStrategy) => {
    setIsPending(true);
    try {
      await opts.run(vars, strategy);
      setConflict(null);
      opts.onSuccess?.();
    } catch (error) {
      const details = extractConflictDetails(error);
      if (details) {
        varsRef.current = vars;
        setConflict(details);
      }
    } finally {
      setIsPending(false);
    }
  };

  return {
    mutate: (vars: TVars) => void attempt(vars),
    isPending,
    conflict,
    resolve: (strategy: ConflictStrategy) => {
      if (strategy === "SKIP") {
        setConflict(null);
        return;
      }
      if (varsRef.current !== null) void attempt(varsRef.current, strategy);
    },
    cancelConflict: () => setConflict(null),
  };
}
