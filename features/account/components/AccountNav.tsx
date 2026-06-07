"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const SECTIONS = [
  { key: "profile", href: "/account/profile" },
  { key: "security", href: "/account/security" },
  { key: "subscription", href: "/account/subscription" },
] as const;

/** Account sub-navigation (profile / security / subscription). */
export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 border-b border-border"
      aria-label={t("account.nav.title")}
    >
      {SECTIONS.map((section) => {
        const active = pathname === section.href;
        return (
          <Link
            key={section.key}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`account.nav.${section.key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
