import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginScreen } from "@/features/auth";

export const metadata: Metadata = { title: "Sign in" };

// LoginScreen reads `useSearchParams` (the `from` redirect); Suspense satisfies
// the static-prerender CSR bailout.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  );
}
