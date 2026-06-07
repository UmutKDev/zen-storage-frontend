"use client";

import { t } from "@/lib/i18n";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
} from "@/components/ui";
import { useSubscription } from "../hooks";
import { SubscriptionCard } from "../components/SubscriptionCard";

export function SubscriptionScreen() {
  const { data: subscription, isPending, isError, refetch } = useSubscription();

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-6">
          <p className="text-sm text-muted-foreground" role="alert">
            {t("common.errorGeneric")}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t("common.retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            {t("account.subscription.noPlan")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <SubscriptionCard subscription={subscription} />;
}
