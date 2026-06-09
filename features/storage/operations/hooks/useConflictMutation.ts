"use client";

import { useRef, useState } from "react";
import type { ConflictDetailsResponseModel } from "@/service/models";
import { extractConflictDetails, type ConflictStrategy } from "../lib/conflict";
import { surfacePassthroughError } from "../lib/feedback";

/**
 * Shared conflict-retry primitive. First attempt uses the backend default
 * (FAIL); a 409 opens the `ConflictPrompt` with the parsed details; picking a
 * strategy re-issues the op. Generic errors are toasted centrally by the
 * Instance (rule #9); 403 passes through, so it's surfaced here (Phase 5
 * replaces that with the unlock prompt).
 */
export function useConflictMutation<TVars>(opts: {
  run: (vars: TVars, strategy?: ConflictStrategy) => Promise<void>;
  onSuccess?: (vars: TVars) => void;
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
      opts.onSuccess?.(vars);
    } catch (error) {
      const details = extractConflictDetails(error);
      if (details) {
        varsRef.current = vars;
        setConflict(details);
      } else {
        surfacePassthroughError(error);
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
      // SKIP with every item conflicting (incl. the single-item case) is a
      // pure cancel. On a PARTIAL batch conflict it must hit the server: the
      // backend applies the strategy to the conflicted items only, so a
      // SKIP retry still moves the non-conflicting rest.
      if (
        strategy === "SKIP" &&
        (!conflict || conflict.ConflictCount >= conflict.TotalItems)
      ) {
        setConflict(null);
        return;
      }
      if (varsRef.current !== null) void attempt(varsRef.current, strategy);
    },
    cancelConflict: () => setConflict(null),
  };
}
