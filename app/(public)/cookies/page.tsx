import type { Metadata } from "next";
import { LegalDocument } from "@/components/patterns";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return (
    <LegalDocument title={t("legal.cookies.heading")}>
      <p>{t("legal.cookies.body")}</p>
    </LegalDocument>
  );
}
