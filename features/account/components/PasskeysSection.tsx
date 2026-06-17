"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { t } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Skeleton,
} from "@/components/ui";
import {
  passkeyNameSchema,
  type PasskeyNameValues,
} from "../lib/validation";
import { useDeletePasskey, usePasskeys, useRegisterPasskey } from "../hooks";
import { ConfirmDialog } from "./ConfirmDialog";
import { SectionError } from "./SectionError";

export function PasskeysSection() {
  const { data: passkeys, isPending, isError, refetch } = usePasskeys();
  const register = useRegisterPasskey();
  const remove = useDeletePasskey();
  const [addOpen, setAddOpen] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- WebAuthn
       feature-detect runs client-only; defaults false to match SSR. */
    setSupported(typeof window.PublicKeyCredential !== "undefined");
  }, []);

  const form = useForm<PasskeyNameValues>({
    resolver: zodResolver(passkeyNameSchema),
    defaultValues: { deviceName: "" },
  });

  const onSubmit = (values: PasskeyNameValues) => {
    register.mutate(values.deviceName, {
      onSuccess: () => {
        setAddOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>{t("account.security.passkeys.title")}</CardTitle>
          <CardDescription>
            {t("account.security.passkeys.description")}
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => setAddOpen(true)}
          disabled={!supported}
          title={
            supported ? undefined : t("account.security.passkeys.unsupported")
          }
        >
          <Plus className="size-4" />
          {t("account.security.passkeys.add")}
        </Button>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-12 w-full" />
        ) : isError ? (
          <SectionError onRetry={() => void refetch()} />
        ) : !passkeys || passkeys.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("account.security.passkeys.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {passkeys.map((passkey) => (
              <li
                key={passkey.Id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <KeyRound className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {passkey.DeviceName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {passkey.LastUsedAt
                        ? `${t("account.security.passkeys.lastUsed")}: ${formatDate(passkey.LastUsedAt)}`
                        : `${t("account.security.passkeys.added")}: ${formatDate(passkey.CreatedAt)}`}
                    </p>
                  </div>
                </div>
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${t("account.security.passkeys.delete")} ${passkey.DeviceName}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  }
                  title={t("account.security.passkeys.deleteTitle")}
                  description={t("account.security.passkeys.deleteDescription")}
                  confirmLabel={t("account.security.passkeys.delete")}
                  pending={remove.isPending}
                  onConfirm={() => remove.mutate(passkey.Id)}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) form.reset();
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("account.security.passkeys.add")}</DialogTitle>
            <DialogDescription>
              {t("account.security.passkeys.description")}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="deviceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("account.security.passkeys.deviceNameLabel")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        autoFocus
                        placeholder={t(
                          "account.security.passkeys.deviceNamePlaceholder",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={register.isPending}>
                  {t("account.security.passkeys.add")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
