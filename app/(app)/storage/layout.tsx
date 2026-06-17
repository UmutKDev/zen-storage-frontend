import type { ReactNode } from "react";

/**
 * Storage segment layout with a parallel `@modal` slot for the deep-linkable
 * preview modal (Phase 4). Coexists with the `[[...path]]` catch-all (children).
 * This is the 0.8a spike: verifying Next 16.2 accepts parallel + intercepting +
 * optional-catch-all in one segment.
 */
export default function StorageLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
