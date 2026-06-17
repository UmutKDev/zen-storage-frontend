import type { Metadata } from "next";
import { LegalDocument } from "@/components/patterns";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalDocument title={t("legal.privacy.heading")}>
      <p>{t("legal.privacy.body")}</p>
    </LegalDocument>
  );
}
