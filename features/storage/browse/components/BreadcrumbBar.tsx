"use client";

import Link from "next/link";
import { useDroppable } from "@dnd-kit/core";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { toSegments } from "@/lib/utils";

/** A non-last crumb: a link that also accepts drag-move drops (move the
 *  dragged set up to this ancestor). */
function CrumbDropLink({
  name,
  href,
  path,
}: {
  name: string;
  href: string;
  path: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `crumb:${path}`,
    data: { type: "crumb", path },
  });
  return (
    <Link
      ref={setNodeRef}
      href={href}
      className={cn(
        "rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        isOver && "text-foreground ring-2 ring-ring",
      )}
    >
      {name}
    </Link>
  );
}

/** Folder breadcrumb derived from the URL path (no extra fetch). */
export function BreadcrumbBar({ path }: { path: string }) {
  const segments = toSegments(path);
  const crumbs = [
    { name: t("storage.breadcrumb.home"), href: "/storage", path: "" },
    ...segments.map((segment, index) => ({
      name: segment,
      href: `/storage/${segments
        .slice(0, index + 1)
        .map(encodeURIComponent)
        .join("/")}`,
      path: segments.slice(0, index + 1).join("/"),
    })),
  ];

  return (
    <nav
      aria-label={t("storage.breadcrumb.label")}
      className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm"
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            {index > 0 ? (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            ) : null}
            {isLast ? (
              <span aria-current="page" className="font-medium text-foreground">
                {crumb.name}
              </span>
            ) : (
              <CrumbDropLink
                name={crumb.name}
                href={crumb.href}
                path={crumb.path}
              />
            )}
          </span>
        );
      })}
    </nav>
  );
}
