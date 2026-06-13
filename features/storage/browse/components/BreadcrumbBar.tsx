"use client";

import Link from "next/link";
import { useDroppable } from "@dnd-kit/core";
import { ChevronRight, Folder, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { toSegments } from "@/lib/utils";

/** A non-last crumb: a quiet ghost pill that also accepts drag-move drops (move
 *  the dragged set up to this ancestor). */
function CrumbDropLink({
  name,
  href,
  path,
  root,
}: {
  name: string;
  href: string;
  path: string;
  root?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `crumb:${path}`,
    data: { type: "crumb", path },
  });
  return (
    <Link
      ref={setNodeRef}
      href={href}
      className={cn("zs-crumb-link", isOver && "text-foreground ring-2 ring-ring")}
    >
      {root ? (
        <span className="zs-crumb-glyph" aria-hidden>
          <HardDrive className="size-[13px]" />
        </span>
      ) : null}
      {name}
    </Link>
  );
}

/** Folder breadcrumb derived from the URL path (no extra fetch). Ancestors are
 *  ghost pills; the current location is a raised machined chip with a brand
 *  glyph (drive at root, folder inside). */
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
      className="flex min-w-0 items-center gap-0.5 overflow-x-auto text-sm"
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const isRoot = index === 0;
        const Glyph = isRoot ? HardDrive : Folder;
        return (
          <span key={crumb.href} className="flex items-center gap-0.5">
            {index > 0 ? (
              <span className="zs-crumb-sep" aria-hidden>
                <ChevronRight className="size-[13px]" strokeWidth={2.25} />
              </span>
            ) : null}
            {isLast ? (
              <span aria-current="page" className="zs-crumb-current">
                <span className="zs-crumb-glyph" aria-hidden>
                  <Glyph className="size-[13px]" />
                </span>
                {crumb.name}
              </span>
            ) : (
              <CrumbDropLink
                name={crumb.name}
                href={crumb.href}
                path={crumb.path}
                root={isRoot}
              />
            )}
          </span>
        );
      })}
    </nav>
  );
}
