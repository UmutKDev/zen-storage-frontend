"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { SessionProvider } from "@/lib/auth/client";
import { SessionSync } from "@/features/auth";
import { CookieConsentBanner } from "@/features/account";
import { Toaster, TooltipProvider } from "@/components/ui";
import { isApiError } from "@/lib/api";
import {
  registerTeamSource,
  registerSecureFolderTokenSource,
} from "@/service/token-sources";
import { useWorkspaceStore } from "@/stores";

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Retry policy per data-layer §2.9: queries retry only transient failures
      // (5xx / network) up to 2×, never 4xx (auth/validation/conflict/etc.).
      queries: {
        retry: (failureCount, error) => {
          if (
            isApiError(error) &&
            error.code !== "SERVER_ERROR" &&
            error.code !== "NETWORK"
          ) {
            return false;
          }
          return failureCount < 2;
        },
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  });
}

/**
 * Client provider tree. `SessionSync` registers the session token-source +
 * sign-out handler (it needs the Session + QueryClient contexts); team +
 * secure-folder sources are registered here (no React context needed).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  useEffect(() => {
    registerTeamSource(() => useWorkspaceStore.getState().teamId);
    registerSecureFolderTokenSource(() => null); // real getter → Phase 5
  }, []);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <SessionSync />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MotionConfig reducedMotion="user">
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
            <CookieConsentBanner />
          </MotionConfig>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
