"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { SessionProvider, signOut } from "@/lib/auth/client";
import { Toaster, TooltipProvider } from "@/components/ui";
import {
  registerSessionSource,
  registerTeamSource,
  registerSecureFolderTokenSource,
  registerSignOut,
} from "@/service/token-sources";
import { useWorkspaceStore } from "@/stores";

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Retry policy per data-layer §2.9 (queries: 2 on 5xx/network).
      queries: { retry: 2, staleTime: 30_000, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  });
}

/**
 * Client provider tree + the single place token-sources are registered, so the
 * `Instance`'s interceptors read live session/team/secure-folder state without
 * `service/` ever importing features (inverted-deps seam).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  useEffect(() => {
    registerSessionSource(() => null); // real session token → Phase 1
    registerTeamSource(() => useWorkspaceStore.getState().teamId);
    registerSecureFolderTokenSource(() => null); // real getter → Phase 5
    registerSignOut(() => signOut());
  }, []);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MotionConfig reducedMotion="user">
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </MotionConfig>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
