import type { ReactNode } from "react";
import { t } from "@/lib/i18n";
import { AccountNav } from "@/features/account";

/** Account section shell: heading + sub-navigation (profile/security/subscription). */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("account.nav.title")}
        </h1>
      </header>
      <AccountNav />
      {children}
    </div>
  );
}
