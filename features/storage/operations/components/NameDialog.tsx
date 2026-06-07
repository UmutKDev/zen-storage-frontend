"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "@/lib/i18n";
import {
  Button,
  Dialog,
  DialogContent,
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
} from "@/components/ui";
import type { ConflictDetailsResponseModel } from "@/service/models";
import type { ConflictStrategy } from "../lib/conflict";
import { nameSchema, type NameValues } from "../lib/validation";
import { ConflictPrompt } from "./ConflictPrompt";

/** Shared "enter a name" dialog for create folder/file + rename, with the inline
 *  conflict resolver. */
export function NameDialog({
  open,
  onOpenChange,
  title,
  label,
  submitLabel,
  defaultValue = "",
  isPending,
  conflict,
  onSubmit,
  onResolve,
  onCancelConflict,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  label: string;
  submitLabel: string;
  defaultValue?: string;
  isPending: boolean;
  conflict: ConflictDetailsResponseModel | null;
  onSubmit: (name: string) => void;
  onResolve: (strategy: ConflictStrategy) => void;
  onCancelConflict: () => void;
}) {
  const form = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: defaultValue },
  });

  useEffect(() => {
    if (open) form.reset({ name: defaultValue });
  }, [open, defaultValue, form]);

  const handleOpenChange = (next: boolean) => {
    if (!next) onCancelConflict();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {conflict ? (
          <ConflictPrompt
            details={conflict}
            onResolve={onResolve}
            onCancel={onCancelConflict}
            pending={isPending}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((v) => onSubmit(v.name))}
                className="space-y-4"
                noValidate
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input
                          autoFocus
                          placeholder={t("storage.ops.create.namePlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    {submitLabel}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
