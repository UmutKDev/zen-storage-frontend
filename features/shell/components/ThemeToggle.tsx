"use client";

import { useEffect, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";

const OPTIONS = [
  { value: "light", labelKey: "light", icon: Sun },
  { value: "dark", labelKey: "dark", icon: Moon },
  { value: "system", labelKey: "system", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot
       mount flag to avoid the server/client icon hydration mismatch. */
    setMounted(true);
  }, []);

  // Stable-size placeholder until mounted: `theme` is undefined on the server,
  // so rendering the real icon would mismatch on hydration.
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("account.shell.theme.toggle")}
        disabled
      >
        <Sun className="size-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("account.shell.theme.toggle")}
        >
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <DropdownMenuItem
              key={opt.value}
              onSelect={() => setTheme(opt.value)}
            >
              <Icon className="size-4" />
              <span>{t(`account.shell.theme.${opt.labelKey}`)}</span>
              <Check
                className={cn(
                  "ml-auto size-4",
                  theme === opt.value ? "opacity-100" : "opacity-0",
                )}
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
