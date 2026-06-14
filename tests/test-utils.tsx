import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  PathnameContext,
  SearchParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { Toaster, TooltipProvider } from "@/components/ui";

function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

// A no-op app-router + empty pathname/searchParams so components that read
// `useRouter`/`usePathname`/`useSearchParams` (e.g. the storage browser's search)
// mount under test without the "app router not mounted" invariant. Tests that
// need real navigation behavior mock `next/navigation` per file (which wins).
const mockRouter = {
  push: () => {},
  replace: () => {},
  prefetch: () => Promise.resolve(),
  back: () => {},
  forward: () => {},
  refresh: () => {},
} as unknown as React.ContextType<typeof AppRouterContext>;

function Providers({ children }: { children: ReactNode }) {
  const queryClient = makeTestQueryClient();
  return (
    <AppRouterContext.Provider value={mockRouter}>
      <PathnameContext.Provider value="/storage">
        <SearchParamsContext.Provider value={new URLSearchParams()}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
            >
              <MotionConfig reducedMotion="user">
                <TooltipProvider>{children}</TooltipProvider>
                <Toaster />
              </MotionConfig>
            </ThemeProvider>
          </QueryClientProvider>
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>
  );
}

/** Mount UI inside the same provider tree the app uses (Query/Theme/Motion/Toaster). */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: Providers, ...options });
}
