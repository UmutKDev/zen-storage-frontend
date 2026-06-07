import { notFound } from "next/navigation";
import { isEnabled } from "@/lib/flags";
import { t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

/**
 * API-keys management is post-MVP. The route is stubbed behind the `apiKeys`
 * flag (off by default → 404); the nav entry is hidden by the same flag.
 */
export default function ApiKeysPage() {
  if (!isEnabled("apiKeys")) notFound();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account.apiKeys.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {t("account.apiKeys.comingSoon")}
        </p>
      </CardContent>
    </Card>
  );
}
