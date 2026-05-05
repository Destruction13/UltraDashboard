import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/**
 * Loading skeleton primitive. Uses the `.shimmer-bar` utility class which
 * respects `prefers-reduced-motion`.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shimmer-bar rounded-md", className)}
      role="presentation"
      aria-hidden
      {...props}
    />
  );
}
