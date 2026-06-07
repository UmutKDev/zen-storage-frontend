"use client";

import { t } from "@/lib/i18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { ChangePasswordForm } from "../components/ChangePasswordForm";
import { TwoFactorSection } from "../components/TwoFactorSection";
import { PasskeysSection } from "../components/PasskeysSection";
import { SessionsSection } from "../components/SessionsSection";

export function SecurityScreen() {
  return (
    <Tabs defaultValue="password" className="gap-6">
      <TabsList>
        <TabsTrigger value="password">
          {t("account.security.tabs.password")}
        </TabsTrigger>
        <TabsTrigger value="twoFactor">
          {t("account.security.tabs.twoFactor")}
        </TabsTrigger>
        <TabsTrigger value="passkeys">
          {t("account.security.tabs.passkeys")}
        </TabsTrigger>
        <TabsTrigger value="sessions">
          {t("account.security.tabs.sessions")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="password">
        <ChangePasswordForm />
      </TabsContent>
      <TabsContent value="twoFactor">
        <TwoFactorSection />
      </TabsContent>
      <TabsContent value="passkeys">
        <PasskeysSection />
      </TabsContent>
      <TabsContent value="sessions">
        <SessionsSection />
      </TabsContent>
    </Tabs>
  );
}
