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
      {!collapsed && (
        <div
          aria-hidden
          className="px-3 pb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground/75 uppercase"
        >
          {t("account.shell.workspace.label")}
        </div>
      )}
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
                  ? "bg-accent text-accent-foreground shadow-[inset_0_1px_0_0_var(--glass-highlight)]"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  active && "text-primary",
                )}
              />
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
