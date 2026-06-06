"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { t } from "@/lib/i18n";
import { CONSENT_VERSION, useConsentStore } from "../stores/consent.store";

/**
 * Cookie/consent banner (KVKK + GDPR). Floating chrome → glass-overlay. Appears
 * until a decision is made, and re-prompts on a policy-version bump. The decision
 * persists via the consent store (localStorage). Analytics SDKs must gate on
 * `consent.analytics` before loading (none exist yet).
 *
 * (12-month time-based re-prompt is a follow-up: it needs a non-render time
 * check; version-bump re-prompt covers policy changes today.)
 */
export function CookieConsentBanner() {
  // `useConsentStore.persist` is touched only in an effect (client-only) — never
  // during render, which would crash SSR prerender (`.persist` is undefined
  // server-side). Default false on the server; reconcile on mount.
  const [hydrated, setHydrated] = useState(false);
  const decidedAt = useConsentStore((s) => s.decidedAt);
  const version = useConsentStore((s) => s.version);
  const setConsent = useConsentStore((s) => s.setConsent);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync to the persist hydration flag
    setHydrated(useConsentStore.persist.hasHydrated());
    return useConsentStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const needsDecision = !decidedAt || version !== CONSENT_VERSION;
  if (!hydrated || !needsDecision) return null;

  const acceptAll = () => {
    setConsent("functional", true);
    setConsent("analytics", true);
  };
  const rejectOptional = () => {
    setConsent("functional", false);
    setConsent("analytics", false);
  };

  return (
    <div
      role="dialog"
      aria-label={t("legal.banner.title")}
      className="glass-overlay fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-lg p-4 sm:p-5"
    >
      <p className="text-sm font-medium text-foreground">
        {t("legal.banner.title")}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("legal.banner.description")}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={acceptAll}>
          {t("legal.banner.acceptAll")}
        </Button>
        <Button size="sm" variant="outline" onClick={rejectOptional}>
          {t("legal.banner.rejectOptional")}
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/cookies">{t("legal.banner.managePreferences")}</Link>
        </Button>
      </div>
    </div>
  );
}
