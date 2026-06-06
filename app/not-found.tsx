import Link from "next/link";
import { t } from "@/lib/i18n";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <p className="text-sm font-medium text-brand">404</p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {t("notFound.title")}
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {t("notFound.description")}
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-e1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {t("notFound.back")}
      </Link>
    </main>
  );
}
