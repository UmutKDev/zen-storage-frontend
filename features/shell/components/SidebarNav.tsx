"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { isEnabled } from "@/lib/flags";
import { navItems } from "../lib/nav";

/** Primary nav, shared by the desktop sidebar and the mobile drawer. */
export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label={t("account.nav.title")}>
      {navItems
        .filter((item) => !item.flag || isEnabled(item.flag))
        .map((item) => {
          const base = `/${item.href.split("/")[1]}`;
          const active = pathname === base || pathname.startsWith(`${base}/`);
          const label = t(`account.shell.nav.${item.key}`);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {collapsed ? (
                <span className="sr-only">{label}</span>
              ) : (
                <span>{label}</span>
              )}
            </Link>
          );
        })}
    </nav>
  );
}
