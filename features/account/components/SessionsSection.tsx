"use client";

import { t } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import type { SessionViewModel } from "@/service/models";
import {
  useLogoutAll,
  useLogoutOthers,
  useRevokeSession,
  useSessions,
} from "../hooks";
import { ConfirmDialog } from "./ConfirmDialog";
import { SectionError } from "./SectionError";

/** Best-effort readable device label from the untyped `DeviceInfo` object. */
function describeDevice(info: unknown): string | null {
  if (!info || typeof info !== "object") return null;
  const record = info as Record<string, unknown>;
  const parts = [
    record.browser,
    record.os,
    record.platform,
    record.name,
    record.device,
  ].filter((v): v is string => typeof v === "string" && v.length > 0);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function SessionsSection() {
  const { data: sessions, isPending, isError, refetch } = useSessions();
  const revoke = useRevokeSession();
  const logoutOthers = useLogoutOthers();
  const logoutAll = useLogoutAll();

  const sorted = sessions
    ? [...sessions].sort(
        (a, b) => Number(b.IsCurrent) - Number(a.IsCurrent),
      )
    : [];
  const hasOthers = sorted.some((s) => !s.IsCurrent);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account.security.sessions.title")}</CardTitle>
        <CardDescription>
          {t("account.security.sessions.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : isError ? (
          <SectionError onRetry={() => void refetch()} />
        ) : sorted.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("account.security.sessions.empty")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("account.security.sessions.device")}</TableHead>
                <TableHead>{t("account.security.sessions.ip")}</TableHead>
                <TableHead>
                  {t("account.security.sessions.lastActive")}
                </TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((session: SessionViewModel) => (
                <TableRow key={session.Id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {describeDevice(session.DeviceInfo) ??
                        t("account.security.sessions.device")}
                      {session.IsCurrent ? (
                        <Badge variant="secondary">
                          {t("account.security.sessions.current")}
                        </Badge>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {session.IpAddress}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(session.LastActivityAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {!session.IsCurrent ? (
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="sm">
                            {t("account.security.sessions.revoke")}
                          </Button>
                        }
                        title={t("account.security.sessions.revokeTitle")}
                        description={t(
                          "account.security.sessions.revokeDescription",
                        )}
                        confirmLabel={t("account.security.sessions.revoke")}
                        pending={revoke.isPending}
                        onConfirm={() => revoke.mutate(session.Id)}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        {hasOthers ? (
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm">
                {t("account.security.sessions.logoutOthers")}
              </Button>
            }
            title={t("account.security.sessions.logoutOthersTitle")}
            description={t("account.security.sessions.logoutOthersDescription")}
            confirmLabel={t("account.security.sessions.logoutOthers")}
            pending={logoutOthers.isPending}
            onConfirm={() => logoutOthers.mutate()}
          />
        ) : null}
        <ConfirmDialog
          trigger={
            <Button variant="outline" size="sm">
              {t("account.security.sessions.logoutAll")}
            </Button>
          }
          title={t("account.security.sessions.logoutAllTitle")}
          description={t("account.security.sessions.logoutAllDescription")}
          confirmLabel={t("account.security.sessions.logoutAll")}
          pending={logoutAll.isPending}
          onConfirm={() => logoutAll.mutate()}
        />
      </CardFooter>
    </Card>
  );
}
