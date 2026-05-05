import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Two-column detail layout.
 *
 * The canonical layout for AccountManager linked-service detail cards from
 * the spec: secrets and quick actions on the left, instructions / roadmap on
 * the right. The right column is sticky on desktop so long instruction docs
 * stay aligned with the credentials.
 *
 * Phase 3 onwards consumes this primitive directly.
 */
export function TwoColumnDetail({
  left,
  right,
  className,
  /**
   * On large screens the left column is fluid; on small screens both stack.
   */
  rightWidth = "minmax(280px, 380px)",
}: {
  left: ReactNode;
  right: ReactNode;
  className?: string;
  rightWidth?: string;
}) {
  return (
    <div
      className={cn("grid gap-4 lg:grid-cols-[minmax(0,1fr)_var(--ud-right)]", className)}
      style={{ ["--ud-right" as string]: rightWidth }}
    >
      <div className="flex min-w-0 flex-col gap-4">{left}</div>
      <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">{right}</div>
    </div>
  );
}
