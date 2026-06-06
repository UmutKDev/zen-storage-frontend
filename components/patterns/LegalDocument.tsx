import Link from "next/link";
import type { ReactNode } from "react";
import { t } from "@/lib/i18n";

/** Shared shell for the public legal pages (privacy / terms / cookies / DPA). */
export function LegalDocument({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("legal.lastUpdated")}
      </p>
      <div className="mt-8 space-y-4 text-sm leading-6 text-foreground">
        {children}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        {t("legal.placeholderNote")}
      </p>
      <footer className="mt-12 border-t border-border pt-6">
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">
            {t("legal.nav.privacy")}
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            {t("legal.nav.terms")}
          </Link>
          <Link href="/cookies" className="hover:text-foreground">
            {t("legal.nav.cookies")}
          </Link>
          <Link href="/data-processing" className="hover:text-foreground">
            {t("legal.nav.dataProcessing")}
          </Link>
        </nav>
        <p className="mt-4 text-xs text-muted-foreground">{t("legal.contact")}</p>
      </footer>
    </main>
  );
}
