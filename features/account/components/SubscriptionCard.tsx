"use client";

import { t } from "@/lib/i18n";
import { formatBytes, formatDate } from "@/lib/utils";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import type { UserSubscriptionResponseModel } from "@/service/models";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function SubscriptionCard({
  subscription,
}: {
  subscription: UserSubscriptionResponseModel;
}) {
  const plan = subscription.Subscription;
  const storage =
    plan && plan.StorageLimitBytes > 0
      ? formatBytes(plan.StorageLimitBytes)
      : t("account.subscription.unlimited");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>
              {plan?.Name ?? t("account.subscription.currentPlan")}
            </CardTitle>
            {plan?.Description ? (
              <CardDescription>{plan.Description}</CardDescription>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2">
            {subscription.IsTrial ? (
              <Badge variant="warning">{t("account.subscription.trial")}</Badge>
            ) : null}
            {plan?.Status ? <Badge variant="secondary">{plan.Status}</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        <Row label={t("account.subscription.storage")} value={storage} />
        {plan?.MaxObjectCount ? (
          <Row
            label={t("account.subscription.objects")}
            value={plan.MaxObjectCount.toLocaleString()}
          />
        ) : null}
        {plan?.BillingCycle ? (
          <Row
            label={t("account.subscription.billingCycle")}
            value={plan.BillingCycle}
          />
        ) : null}
        {subscription.EndAt ? (
          <Row
            label={t("account.subscription.renews")}
            value={formatDate(subscription.EndAt)}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
